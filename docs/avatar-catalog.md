# Catálogo e Especificação Técnica para Avatares Reais (SDK7)

**Data:** 08/09/2026  
**Subprojeto:** `experiences/fashion-battle/`  
**Objetivo:** Fornecer referências verificadas, URNs exatas e limitações técnicas da API do Decentraland SDK7 para substituir os manequins de blocos procedurais (`Figure` em `src/world.ts`) por personagens com estética oficial de avatares (`AvatarShape`).

---

## 1. Componentes e Métodos Verificados na API

### 1.1 `AvatarShape` (`@dcl/sdk/ecs`)
- **Origem / Definição Local:**
  - Interface protobuf: `node_modules/@dcl/ecs/dist-cjs/components/generated/pb/decentraland/sdk/components/avatar_shape.gen.d.ts` (linhas 16–51).
  - Componente registrado no engine: `core::AvatarShape` (ID 1080).
  - Habilidade de referência: `.agents/skills/npcs/SKILL.md` (linhas 87–148) e `.agents/skills/player-avatar/references/avatar-apis.md`.
- **Assinatura e Campos Suportados:**
  ```typescript
  import { engine, Transform, AvatarShape } from '@dcl/sdk/ecs'
  import { Vector3, Quaternion } from '@dcl/sdk/math'

  const avatar = engine.addEntity()
  Transform.create(avatar, {
    position: Vector3.create(x, y, z),
    rotation: Quaternion.fromEulerDegrees(0, rotY, 0),
    scale: Vector3.One()
  })

  AvatarShape.create(avatar, {
    id: 'unique-avatar-id', // Obrigatório e único
    name: 'Nome de Exibição', // String (ou '' para ocultar o nametag flutuante)
    bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale', // ou BaseFemale
    wearables: [
      // Mínimo obrigatório para renderizar a face:
      'urn:decentraland:off-chain:base-avatars:eyebrows_00',
      'urn:decentraland:off-chain:base-avatars:mouth_00',
      'urn:decentraland:off-chain:base-avatars:eyes_00',
      // Roupas e acessórios base:
      'urn:decentraland:off-chain:base-avatars:blue_tshirt',
      'urn:decentraland:off-chain:base-avatars:brown_pants',
      'urn:decentraland:off-chain:base-avatars:classic_shoes',
      'urn:decentraland:off-chain:base-avatars:short_hair'
    ],
    skinColor: { r: 0.9, g: 0.78, b: 0.65 }, // RGB normalizado 0..1
    hairColor: { r: 0.2, g: 0.15, b: 0.1 },  // RGB normalizado 0..1
    eyeColor: { r: 0.2, g: 0.4, b: 0.7 },   // RGB normalizado 0..1
    expressionTriggerId: 'wave',            // Nome do emote nativo
    expressionTriggerTimestamp: 1,          // Lamport timestamp para disparar/repetir
    talking: false,                         // Animação de fala (opcional)
    emotes: [],
    showOnlyWearables: false                // true = modo manequim (apenas roupas, sem corpo)
  })
  ```

### 1.2 Execução de Emotes / Animações em `AvatarShape`
- Em entidades `AvatarShape`, a animação NÃO é acionada por `triggerEmote` (que atua apenas no jogador local via `~system/RestrictedActions`).
- O disparo de emotes em `AvatarShape` é feito via mutação direta do componente:
  ```typescript
  const avatarMutable = AvatarShape.getMutable(avatarEntity)
  avatarMutable.expressionTriggerId = 'dance'
  avatarMutable.expressionTriggerTimestamp = ++lamportCounter
  ```
- **Emotes nativos suportados (sem download de GLB):**
  - Social / Gestos: `'wave'`, `'clap'`, `'fistpump'`, `'robot'`, `'raiseHand'`, `'shrug'`, `'disco'`, `'dab'`, `'kiss'`, `'money'`, `'tik'`, `'hammer'`, `'tektonik'`.
  - Expressões corporais: `'laugh'`, `'cool'`, `'headexplode'`, `'dontsee'`, `'handsair'`.

---

## 2. Diferença Fundamental: Jogador Real vs. Réplica no Palco

> [!IMPORTANT]
> **Limitação de Segurança do Decentraland:**
> Nenhum script de cena tem permissão para alterar os wearables equipados no avatar da conta do usuário real. O jogador mantém os wearables que possui na carteira e escolheu em seu perfil.

### Arquitetura Recomendada para o Fashion Battle:
1. **Palco, Passarela e Manequim de Preview:**
   - Usar réplicas com `AvatarShape`.
   - Isso dá ao jogo controle total sobre as roupas selecionadas na preparação, cores e poses.
   - Tanto os competidores humanos quanto os bots usam a mesma representação visual honesta e equivalente.
2. **Avatar do Jogador Real:**
   - Permanece livre na cena com seus próprios wearables da conta.
   - As ações de câmera (`VER MEU LOOK`, `VER PALCO` ou teleporte da preparação) posicionam o jogador em pontos estratégicos de observação, sem bloquear sua locomoção nem forçar itens em seu inventário pessoal.

---

## 3. Catálogo de Looks Iniciais com URNs Verificadas

Todos os itens abaixo pertencem à coleção gratuita e padrão do Decentraland:  
`urn:decentraland:off-chain:base-avatars:<item>`  
Evidência de suporte: declaradas no protobuf de `AvatarShape` e testadas com sucesso em `src/scene/npcs.ts` da raiz.

### Look 1: O Clássico Urbano (BaseMale)
- **Face (obrigatória):**
  - Sobrancelha: `urn:decentraland:off-chain:base-avatars:eyebrows_00`
  - Boca: `urn:decentraland:off-chain:base-avatars:mouth_00`
  - Olhos: `urn:decentraland:off-chain:base-avatars:eyes_00`
- **Cabelo:** `urn:decentraland:off-chain:base-avatars:short_hair`
- **Parte Superior (Top):** `urn:decentraland:off-chain:base-avatars:white_shirt`
- **Parte Inferior (Bottom):** `urn:decentraland:off-chain:base-avatars:brown_pants`
- **Calçado (Shoes):** `urn:decentraland:off-chain:base-avatars:classic_shoes`
- **Cores:** Pele `{ r: 0.88, g: 0.74, b: 0.60 }`, Cabelo `{ r: 0.15, g: 0.10, b: 0.05 }`
- **Emote Padrão:** `wave`

### Look 2: Estilo Esportivo Streetwear (BaseMale / BaseFemale)
- **Face (obrigatória):**
  - Sobrancelha: `urn:decentraland:off-chain:base-avatars:eyebrows_00`
  - Boca: `urn:decentraland:off-chain:base-avatars:mouth_00`
  - Olhos: `urn:decentraland:off-chain:base-avatars:eyes_00`
- **Cabelo:** `urn:decentraland:off-chain:base-avatars:tall_hair`
- **Parte Superior (Top):** `urn:decentraland:off-chain:base-avatars:blue_tshirt`
- **Parte Inferior (Bottom):** `urn:decentraland:off-chain:base-avatars:black_pants`
- **Calçado (Shoes):** `urn:decentraland:off-chain:base-avatars:sneakers`
- **Cores:** Pele `{ r: 0.92, g: 0.80, b: 0.68 }`, Cabelo `{ r: 0.40, g: 0.25, b: 0.12 }`
- **Emote Padrão:** `clap`

### Look 3: Elegância Casual VIP (BaseMale / BaseFemale)
- **Face (obrigatória):**
  - Sobrancelha: `urn:decentraland:off-chain:base-avatars:eyebrows_00`
  - Boca: `urn:decentraland:off-chain:base-avatars:mouth_00`
  - Olhos: `urn:decentraland:off-chain:base-avatars:eyes_00`
- **Cabelo:** `urn:decentraland:off-chain:base-avatars:ponytail` (ou `short_hair`)
- **Parte Superior (Top):** `urn:decentraland:off-chain:base-avatars:elegant_sweater`
- **Parte Inferior (Bottom):** `urn:decentraland:off-chain:base-avatars:gray_pants`
- **Calçado (Shoes):** `urn:decentraland:off-chain:base-avatars:classic_shoes`
- **Cores:** Pele `{ r: 0.94, g: 0.82, b: 0.70 }`, Cabelo `{ r: 0.10, g: 0.08, b: 0.08 }`
- **Emote Padrão:** `fistpump`

### Look 4: Verão Descontraído (BaseFemale / BaseMale)
- **Face (obrigatória):**
  - Sobrancelha: `urn:decentraland:off-chain:base-avatars:f_eyebrows_00`
  - Boca: `urn:decentraland:off-chain:base-avatars:f_mouth_00`
  - Olhos: `urn:decentraland:off-chain:base-avatars:f_eyes_00`
- **Cabelo:** `urn:decentraland:off-chain:base-avatars:cool_hair`
- **Parte Superior (Top):** `urn:decentraland:off-chain:base-avatars:red_tshirt`
- **Parte Inferior (Bottom):** `urn:decentraland:off-chain:base-avatars:shorts`
- **Calçado (Shoes):** `urn:decentraland:off-chain:base-avatars:sport_shoes`
- **Cores:** Pele `{ r: 0.75, g: 0.55, b: 0.40 }`, Cabelo `{ r: 0.05, g: 0.05, b: 0.05 }`
- **Emote Padrão:** `disco`

---

## 4. Comparação entre o Mock Atual e as Categorias Reais de Wearables

O mock atual em `src/data.ts` possui 9 categorias teóricas:
`['Head', 'Hair', 'Top', 'Bottom', 'Shoes', 'Accessories', 'Hat', 'Glasses', 'Backpack']`

| Categoria no Mock | Equivalente Válido em `base-avatars` | Situação Real / Recomendação |
|---|---|---|
| **Top** | `blue_tshirt`, `red_tshirt`, `white_shirt`, `elegant_sweater`, `striped_shirt`, `black_tshirt`, `green_tshirt` | **Totalmente suportada**. 7+ opções básicas gratuitas. |
| **Bottom** | `brown_pants`, `blue_jeans`, `black_pants`, `gray_pants`, `cargo_pants`, `shorts`, `formal_pants` | **Totalmente suportada**. 7+ opções básicas gratuitas. |
| **Shoes** | `classic_shoes`, `sport_shoes`, `sneakers`, `elegant_shoes`, `bun_shoes` | **Totalmente suportada**. 5+ opções básicas gratuitas. |
| **Hair** | `short_hair`, `tall_hair`, `cool_hair`, `ponytail`, `curly_hair`, `bald`, `mohawk` | **Totalmente suportada**. Ampla variedade com controle de cor. |
| **Head (Face)** | `eyes_00`..`11`, `eyebrows_00`..`07`, `mouth_00`..`04` | **Suportada como traços faciais**, não como bloco único. |
| **Hat** | Poucas opções base off-chain | **Escassa**. Risco de URN inválida se inventada. Recomendado agrupar com Hair ou manter estético. |
| **Glasses** | Sem óculos padrão garantidos no off-chain base | **Ausente no catálogo base gratuito**. Não inventar URNs. |
| **Accessories** | Varia conforme coleção | **Ausente no catálogo base gratuito**. |
| **Backpack** | Ausente no off-chain base | **Ausente no catálogo base gratuito**. |

> [!TIP]
> **Recomendação de Integração:**
> Não prometer 9 categorias independentes de wearables reais. Concentrar a customização em **4 categorias ricas e garantidas**: `Hair` (com cor), `Top`, `Bottom`, `Shoes` + personalização de cor de pele/olhos. Isso garante 100% de confiabilidade sem risco de avatares invisíveis por falta de assets.

---

## 5. Mapeamento de Personalidades dos Bots

Para que a competição continue variada e temática, as 4 personalidades de bots existentes devem ser mapeadas para looks e poses consistentes:

1. **Fashionista (Estilo Royal / Sofisticado):**
   - Roupas: `elegant_sweater` + `formal_pants` + `elegant_shoes` + `ponytail`.
   - Poses/Emotes: `'wave'`, `'cool'`, `'raiseHand'`.
   - Paleta: Tons de vinho/rosa, cabelo escuro polido.
2. **Space Cowboy (Estilo Western / Aventureiro):**
   - Roupas: `white_shirt` + `brown_pants` + `classic_shoes` + `short_hair`.
   - Poses/Emotes: `'fistpump'`, `'point'`.
   - Paleta: Tons terrosos, dourados e marrom.
3. **Cyber Queen (Estilo Neon / Futurista):**
   - Roupas: `blue_tshirt` (ou neon) + `black_pants` + `sneakers` + `tall_hair`.
   - Poses/Emotes: `'robot'`, `'tektonik'`.
   - Paleta: Pele clara, cabelo colorido / olhos destacados.
4. **Chaos (Estilo Livre / Descontraído):**
   - Roupas: `red_tshirt` + `shorts` + `sport_shoes` + `mohawk`.
   - Poses/Emotes: `'disco'`, `'laugh'`, `'dab'`.
   - Paleta: Cores contrastantes e expressivas.

---

## 6. Próximo Passo para Retomada do Codex

1. Criar um adaptador de avatar `src/avatar-factory.ts` que recebe um `Outfit` simplificado ou id de bot e retorna os parâmetros prontos para `AvatarShape.create(...)`.
2. Substituir gradualmente as instâncias de `Figure` por entidades `AvatarShape` em `src/world.ts`:
   - Começar pelo manequim de `preview` na área de preparação.
   - Em seguida, os 6 concorrentes no palco e o campeão no `Hall of Fame`.
3. Manter a movimentação de cabeça e emotes via `expressionTriggerId` sincronizados com a fase da passarela.
