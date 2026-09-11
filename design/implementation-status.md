# Fashion Battle — estado real de implementação

Revisão local: **11/09/2026**. Base auditada: **`c368090`**; correções atuais na branch **`codex/gdd-alignment-fixes`**. Nome da cena: **Decentealand Fashion Battle**. A etapa de correções alterou gameplay/UI conforme descrito abaixo. A cena não foi publicada.

## Correções aplicadas após a auditoria

- Reveal individual: cada dupla permanece neutra durante sua contagem; pares futuros continuam neutros no backstage. Os que já se apresentaram permanecem revelados até o retorno.
- Guarda-roupa: categoria Costas e ação **Usar salvo** conectadas aos sistemas existentes. Categorias/tipos navegam por seletores compactos, com uma coluna de itens em painéis estreitos.
- Lobby: contador de pessoas online e instruções em português; visitantes que chegam durante a preparação recebem orientação de audiência/próxima rodada.
- Resultados: cada finalista mostra os próprios SP, além de votos e vitórias.
- Legibilidade: o componente comum de texto garante mínimo de 16 px antes da compensação de escala; a altura e a paginação do guarda-roupa foram recalculadas. Ainda requer inspeção no aparelho.
- Preparação: 60 s configuráveis; PRONTO pode abreviar após 10 s mínimos quando todos os competidores presentes confirmam. Mantido o segundo final de bloqueio do look.
- Verificação da etapa: **57 testes aprovados**; compilação e TypeScript verificados. Sem nova validação visual, sem simular que o jogo foi acessado.

Servidor confiável, persistência durável, medição de desempenho e validação mobile permanecem pendentes. Os números de pacote/avisos de dependências abaixo pertencem à auditoria inicial, antes destas alterações, e não foram usados para afirmar conformidade do novo runtime.

## Fontes, skill e método

O escopo auditado é [gdd.md](gdd.md), versão 1.0 MVP, já presente no clone. Não existe nele uma seção chamada literalmente “MVP Scope”: o equivalente é **§33 MVP MUST-HAVE**, com opcionais em §34 e futuros em §35. §36 descreve a aceitação do fluxo completo. O relatório anterior e suas imagens são evidência histórica, não execução desta revisão.

Foi executado na raiz o comando solicitado:

```sh
npx skills add https://github.com/dcl-regenesislabs/opendcl --skill game-design
```

Instalação concluída; o **SKILL.md completo foi lido antes da auditoria**. Fonte: [Decentraland Game Design & Scene Optimization](https://github.com/dcl-regenesislabs/opendcl/blob/main/skills/game-design/SKILL.md); cópia usada: [skill local](../.agents/skills/game-design/SKILL.md). A instalação substituiu a versão anterior de `game-design` de `decentraland/sdk-skills`; as demais skills foram mantidas. `skills-lock.json` registra a nova origem e o hash do instalador. SHA-256 do arquivo efetivamente lido: `c31f8073041da40c4dd8d21b28bdb008232dfcf6ad2336552767378b4627be25`.

Critérios: filosofia de mundo contínuo (§1 da skill), orçamento por parcelas (§2), texturas (§3), preloading/performance (§4–5), input (§6), estado (§7), UX (§8) e MVP (§9). As recomendações de design são distinguidas das restrições de API. Os quatro eixos Creator Success pedidos pelo usuário são analisados ao final; a skill não apresenta uma rubrica formal de aprovação do programa.

**Validação feita nesta revisão:**

- Node.js **22.23.2** e npm **10.9.8** instalados no usuário, em `~/.local/lib/node-v22.23.2-linux-x64`, com comandos em `~/.local/bin`. O tarball foi verificado contra o SHA-256 publicado por nodejs.org.
- `npm ci`: concluído, 319 pacotes adicionados, mantendo o lockfile do projeto.
- `npm test`: **56 aprovados, zero falhas/ignorados**. `npm run build`: bundle gerado e TypeScript sem erros, exit code 0.
- Testes usam transpilation/stubs ECS e clientes de rede simulados. Eles comprovam regras nos cenários cobertos; não comprovam renderização real, toque, áudio, desempenho ou múltiplos aparelhos. O teste de reveal foi atualizado na etapa de correções para validar o comportamento individual alinhado ao GDD.
- `npm start -- --no-browser`: servidor de preview ativo em **8010**. `/about` respondeu HTTP 200, `healthy: true`, content/comms/lambdas saudáveis; o campo BFF informa `healthy: false`. Isso é o estado retornado pelo preview, não uma certificação de todos os serviços.
- Aberto o Bevy Web no navegador integrado e tentado acesso como visitante. Apareceu aviso de GPU/WebGPU; depois, **“World not found”** para o realm local. A tentativa direta de abrir `/about` nesse navegador retornou **`net::ERR_BLOCKED_BY_CLIENT`**, embora o terminal acesse o endpoint. Portanto, **a cena 3D não foi validada visualmente nesta revisão**. Não foi feita nova partida nem teste mobile; o bloqueio do navegador não demonstra defeito no gameplay.
- `npm audit`: 15 vulnerabilidades reportadas (2 baixas, 5 moderadas, 7 altas, 1 crítica; a crítica em `protobufjs`). Não foi aplicada atualização forçada do SDK.

**Implementado** = caminho conectado no código e comportamento básico coberto onde há testes. **Parcial** = falta parte do requisito ou validação essencial explicitada na linha. **Não implementado** = não há caminho funcional correspondente. Não se atribui um percentual global: itens têm pesos diferentes e existem opcionais.

## Alertas de alinhamento, sinalizados antes de concluir a auditoria

1. GDD §4.3 (“somente dois jogadores” no palco) só pode ser garantido para os **dois modelos de competidores controlados pela cena**, não como expulsão de visitantes. O GDD não pede kick/remoção de AFK; não há motivo para inventar essa exigência.
2. “Partida curta” (§1) e preparação sugerida de 60 s (§8) já deixam pouco espaço para o checklist da skill de loop jogável em menos de 60 s. Após a correção, a implementação usa **60 s de preparação e até 214 s de ciclo nominal**, podendo abreviar por prontidão. É divergência de recomendação de design, não proibição técnica.
3. O fluxo contínuo não contradiz o GDD: resultados encerram a rodada, não a presença na cena. A implementação deve continuar acomodando entrada e saída em qualquer fase.
4. A generalização da skill sobre consentimento para teleporte precisa ser aplicada com a distinção oficial entre mudança de cena e movimento interno; detalhes em DCL Compliance.

## 1. MVP obrigatório — GDD §33

| Item | Status | Observação técnica e limite |
|---|---|---|
| Lobby | Implementado | Spawn, timer, instruções e contador de pessoas online em `HeaderPill`; bots não são contados como humanos online. |
| Theme system | Implementado | `THEMES` tem título, descrição, keywords e tipo; `begin()` seleciona por hash do número da rodada. A sequência é determinística, não sorteio independente. |
| 6-player structure | Implementado | Até seis humanos por rodada; bots completam seis; excedentes alternam participação e podem votar. Três pares distintos de dois competidores. |
| Wardrobe | Implementado | Catálogo compartilhado, miniaturas, seletores/páginas, Costas e restauração de um preset da sessão conectados. Veste modelos da cena e não concede posse de wearables. |
| Outfit privacy | Parcial | Modelos compartilhados usam roupa neutra durante tema/preparação; provadores exibem o look local. Cada dupla revela após sua própria intro; pares futuros continuam neutros. Dados de looks ainda circulam pelo CRDT. Avatares humanos fora do volume central não são ocultados. |
| 1v1 runway | Implementado | Dois modelos por duelo, três confrontos, giro e câmera do palco; não é torneio eliminatório nem cada jogador enfrenta múltiplos oponentes. |
| Poses | Implementado | Oito opções básicas e duas compráveis; mapeadas a emotes nativos, algumas com nomes de fantasia que não descrevem literalmente a animação. Há duplicação de animação entre Hero e Point. |
| Voting | Parcial | Mecânica de um voto por espectador/duelo; dupla ativa não vota; valida rodada, duelo, candidato e duplicidade. Confirmação visual local e destaque no escolhido. A exigência server-authoritative do GDD §17 não foi cumprida: autoridade é um cliente eleito, não servidor confiável. O mapa de votos também é sincronizado, apesar de não ser exibido publicamente. |
| Bots | Implementado | Preenchimento automático, roupas, poses e votos; heurísticas usam tags, preferência e ruído limitado. A geração de roupas está concentrada nos seis primeiros índices, não explora o catálogo inteiro. |
| Results | Implementado | Top 3 mostra nome, votos, vitórias e SP individuais; ganho local permanece separado, zero para quem não integrou o elenco. |
| Style Points | Implementado | +10 participação, +50 vitória de duelo, +100 bônus de campeão; saldo e compras são da sessão compartilhada. Não há moeda blockchain ou saldo persistente. |
| Repeat loop | Implementado | RESULTADOS → retorno → lobby → nova rodada automático, coberto por teste de múltiplas rodadas; a observação visual citada na versão anterior é histórica. Sem humanos no lobby, o timer reinicia sem começar partida. |
| Mobile UI | Parcial | React-ECS, safe area, botões por toque e guarda-roupa à esquerda; a nova versão tem fonte mínima de 16 px e seletores compactos, ainda sem captura atual. Falta revalidar essa versão em Android/iOS e tamanhos/orientações alvo. |

## DCL Compliance

Avaliação contra a skill instalada, distinguindo restrições da plataforma, recomendações e pontos ainda não medidos.

| Regra / sistema | Avaliação | Evidência e consequência |
|---|---|---|
| Cena contínua, sem tela própria de início | Conforme no fluxo implementado | `index.ts:main()` monta mundo/UI; `model.ts:initial/step/begin` começa no lobby, inicia com presença humana e repete. Não há botão obrigatório “Start” da cena. Login/loading do Explorer pertencem à plataforma. “Sempre ativa” não significa backend rodando sem clientes: sem humanos o lobby espera, e não há processo autoritativo persistente. |
| Sem game over forçado | Conforme no modelo | `RESULTS → RETURN_TO_LOBBY → LOBBY`; perder ainda rende participação para quem está no elenco. Não há logout, kick, tela terminal permanente ou exigência de reiniciar o cliente. |
| Timer de preparação | Permitido, com divergência de UX/duração | `CONFIG.preparation = 60`; `step()` só aceita outfit enquanto `remaining > 1`; `UiController.tick()` fecha o provador próprio em T−1 e marca ready. Expirar o prazo congela a inscrição do look, não expulsa o jogador. `READY` abrevia depois de 10 s se todos os competidores presentes confirmarem; continua não sendo requisito para integrar a rodada. Não pode ser confundido com controle sobre rascunhos/fechamento do Backpack nativo. |
| Não remover jogadores / AFK | Nenhuma expulsão implementada; tratamento AFK não implementado | Heartbeat a cada 2 s e `LeaseObserver` expira presença sem atualização após 30 s. Um usuário imóvel continua emitindo heartbeat e não é detectado como AFK. A expiração remove elegibilidade/presença lógica, não avatar do usuário. `engine.removeEntity` em `AvatarFigure.place()` substitui um NPC da cena, não remove um jogador. |
| Drop-in / drop-out | Parcial | Entrada tardia entra na audiência e pode votar; elenco de competidores fica fixo até a próxima rodada. Saída não apaga votos já aceitos e aciona eleição quando necessário. Competidor desconectado continua representado pelo look/modelo registrado; não há substituição imediata ou regra explícita de desistência. `PreparationView` agora orienta quem não está no elenco a votar e aguardar a próxima rodada. Testes simulados cobrem parte disso; falta validar conexões reais. |
| Transições e movimento interno | Uso de API compatível; experiência a validar | `Presentation.tick()` chama `movePlayerTo` com destinos internos (lobby, provador, audiência) e configura `VirtualCamera/MainCamera`. `scene.json` declara `ALLOW_TO_MOVE_PLAYER_INSIDE_SCENE`. Não utiliza `teleportTo` para expulsar pessoas. Não usa `InputModifier` para congelar locomoção. Contudo, movimenta também espectadores a cada fase e não há opt-out local da câmera do show; convém validar se visitantes conseguem circular confortavelmente. |
| Palco com dois competidores | Conforme para modelos, não garantia de exclusão humana | `currentDuel()` escolhe um par; `FashionWorld.update()` posiciona seus dois `AvatarShape` no palco e os demais no backstage. Colliders ajudam a separar áreas. Isso não prova que nenhum visitante possa ocupar/ver o palco em todos os clientes. |
| Privacidade e visibilidade pelas bordas | Parcial | Robe nos modelos antes de RUNWAY, provadores estritamente locais e `AvatarModifierArea` num volume central. Avatar externo ao volume permanece visível; paredes não são sigilo. O snapshot/Presence leva dados de look a clientes, e isso ainda não equivale a sigilo contra cliente modificado. O reveal individual foi corrigido. |
| Espaço compartilhado e votação | Interação implementada; confiança e sigilo parciais | Há voto sobre outro competidor e feedback só local. Mas `State.ballots` e as intenções Presence são compartilhados; não existe anonimato contra cliente modificado. `SessionAudit` não equivale a backend. A skill não obriga servidor próprio; o GDD §17 é quem exige autoridade de servidor. |
| Mobile e input | Parcial | Ações principais têm `onMouseDown`/botões de toque; não dependem de mouse wheel/teclado. `src/ui/primitives.tsx` adapta pixels e safe area. O componente comum `Label` agora aplica mínimo de 16 px; seletores compactos e uma coluna em telas estreitas reduzem compressão de texto. O menor layout de guarda-roupa passou de 384 para 262 px (área útil muito pequena ainda exige validação). O painel pode ocupar aproximadamente metade da tela. Falta teste de legibilidade/corte/toque em aparelhos alvo. |
| Feedback audiovisual | Parcial em relação à recomendação de todas as ações | Troca de roupa/seleção atualiza o estado local; voto mostra pendência até confirmação do coordenador, depois som e marcador. Há trilha e sinal nas fases. Não há cue dedicado para cada seleção, compra, READY ou vitória; `victory.wav` estar no disco não comprova reprodução. |
| Protótipo pequeno | Diverge da sugestão, sem violação | Configuração atual é 3×2, seis parcelas; a skill recomenda começar em 1–2. A cena é uma arena única com Hall of Fame. Não reduzir parcelas automaticamente: isso mudaria o espaço do projeto. |
| Loop jogável em menos de 60 s | Não atende se interpretado como ciclo completo | O ciclo nominal dura até 214 s, com até 60 s de preparação; o primeiro ato de vestir pode ocorrer antes de 60 s, mas isso não prova um ciclo completo nessa duração. Reconciliar a definição usada na submissão. |
| 1 jogador e 5+ simultâneos | Cobertura lógica, validação real pendente | Bots preenchem seis e testes simulam 1–9 humanos. Não foram conectados cinco humanos reais nesta revisão. Bots garantem atividade, mas não comprovam interação social humana significativa. |

### Ressalva técnica sobre teleporte

A frase da skill sobre teleporte depender de aceite não deve ser aplicada indiscriminadamente. A documentação oficial distingue **`movePlayerTo` dentro dos limites da cena**, sem tela de confirmação por movimento, de **teleporte para outra cena**, que pede confirmação. O código utiliza o primeiro e declara a permissão correspondente. Logo, não há evidência de “expulsão sem consentimento” neste fluxo. Fontes consultadas nesta revisão: [Player Avatar](https://github.com/decentraland/docs/blob/main/creator/sdk7/interactivity/player-avatar.md) e [External Links](https://docs.decentraland.org/creator/scenes-sdk7/interactivity/external-links).

### Orçamento de seis parcelas — métricas e limites da conclusão

`scene.json`: seis parcelas contíguas, domínio horizontal **48×32 m**, base `(0,0)`. Aplicando literalmente as fórmulas da **skill**, obtém-se:

| Recurso | Referência da skill para n=6 | O que foi verificado |
|---|---:|---|
| Triângulos | 60.000 | Não medidos no renderer; não declarar conformidade pelo número de chamadas `box()`. |
| Entidades | 1.200 | Não medido o pico real incluindo NPCs, efeitos e runtime. |
| Corpos físicos | 1.800 | Há colliders em piso, paredes e barreiras; não medido o total real. |
| Materiais | ~56,15 | Existem materiais PBR por entidade; custo/deduplicação efetiva do renderer não medidos. |
| Texturas | ~28,07 | 204 PNG locais de 128×128, todos potência de dois. Arquivos no catálogo não equivalem a texturas simultaneamente carregadas; wearables remotos também precisam ser considerados. Não declarar aprovação desse limite. |
| Altura | ~56,15 m | Arena principal possui teto em y=10; não foi feita medição completa de todos os bounds renderizados. |
| Draw calls (alvo) | 1.800 | Não medidos. |
| Pacote de arquivos | 90 MB, respeitando teto geral de 300 MB | `getFiles()` do SDK 7.27.0, com seus ignores reais: **8.310.245 bytes** (~8,31 MB / 7,93 MiB), abaixo da referência. |
| Quantidade de arquivos | 1.200 | **212** arquivos publicáveis nesta revisão. |
| Arquivo individual | 50 MB | Maior: `bin/index.js`, **5.855.710 bytes**. `validateFilesSizes()` passou. |

O pacote não inclui `design/`, `docs/`, `dclcontext/`, `src/`, `tests/` nem `.agents/`. O SDK gerou `dclcontext/` durante o postinstall; é contexto de desenvolvimento e já é excluído pelo ignore padrão do SDK. Modelos de wearables são resolvidos remotamente: **bytes publicáveis não representam download total, RAM, tempo de carga ou GPU**. As fórmulas acima são o critério da skill solicitado; o destino configurado é um World, cuja elegibilidade/quota de publicação não foi verificada nem utilizada nesta tarefa.

Performance no código: estado do coordenador avança aproximadamente a cada 0,2 s; heartbeat a cada 2 s; poses repetem no máximo a cada 8 s; aparência e posição usam caches. Ainda há varredura de presenças, JSON/arrays e atualizações de texto/mundo por frame; o snapshot inteiro de sessão é republicado, com `accounts` sem limite explícito por quantidade de visitantes. Sparkles e acessórios reutilizam geometria, mas mudanças de posição recriam a entidade de avatar por workaround documentado de locomotion. Não há `AssetLoad`, LOD ou medição de FPS/memória no fluxo atual. Isso identifica pontos a medir, não comprova lag.

## 2. Etapas de desenvolvimento — GDD §37

| Fase | Status | Mapeamento / observação |
|---|---|---|
| 1 — Cena isolada | Implementado | Repositório independente, configurações, skills e dependências locais; sem dependência do antigo Ludoria. |
| 2 — Lobby + Stage | Implementado | `FashionWorld` constrói arena, provadores, passarela, backstage e Hall of Fame em TypeScript. |
| 3 — Game State Machine | Implementado | `model.ts`: oito estados efetivos; setup/reveal/pose foram agrupados em RUNWAY. |
| 4 — Theme System | Implementado | `data.ts` + `model.ts:begin`; texto aparece na UI e no mundo. |
| 5 — Wardrobe | Implementado | Seleção, aplicação, Costas e restauração do preset acessíveis; aparência a revalidar. |
| 6 — Duel System | Implementado | Geração de pares, temporização, votação e resultado intermediário de cada duelo. |
| 7 — Voting | Parcial | Mecânica e feedback conectados em `vote()`/UI; falta autoridade de servidor exigida pelo §17. |
| 8 — Bots | Implementado | Regras determinísticas para reduzir dependência de população humana. |
| 9 — Rewards | Implementado | Pontos e compras validados no estado de sessão. |
| 10 — Mobile polish | Parcial | Layout e áudio atualizados; falta avaliação física da versão atual, legibilidade e performance medidas. |
| 11 — Hall of Fame | Parcial | Registro de até 20 vitórias na sessão e modelo do último campeão; sem histórico persistente entre sessões. |
| 12 — Testing | Parcial | 57 testes automatizados e build na etapa de correções; ciclo real com bots documentado apenas na captura histórica; faltam regressão atual entre dois aparelhos, reconexões em rede real e matriz mobile. |

## 3. Opcionais e futuros — GDD §34–35

| Item | Status | Observação |
|---|---|---|
| Hall of Fame persistente | Não implementado | Histórico em `State.hall`; não há banco ou storage persistente. |
| Performance cosmetics | Parcial | Sparkles, título Fashion Icon e poses extras existem; confetti, hearts, smoke, fire e dance floor do GDD não estão implementados. |
| Advanced bot personalities | Parcial | Preferências royal/western/cyber/chaos; Comedian compartilha preferência chaos, sem IA comportamental avançada. |
| Global rankings | Não implementado | `rankings.ts` calcula dia/semana/todos apenas sobre contas da sessão. |
| Saved presets | Implementado | `saveLook` guarda cópia em memória e **Usar salvo** chama `restoreLook`, respeitando fase/prazo. Não persiste entre sessões. |
| Special entrances | Não implementado | A pose Royal comprável não é uma entrada coreografada. |
| Audio polish | Implementado | Loop instrumental local de 40 s, sinal de transição de 3 s, efeito de voto e ducking; o MP4 deste anexo é mudo e não valida o áudio. |
| Demais possibilidades do §35 | Não implementado | Temporadas, torneios, temas criados pela comunidade, campeonato semanal, coleções, palcos criados por jogadores, eventos/patrocínios e snapshots históricos exportáveis não têm sistemas próprios. O modelo do campeão da sessão não equivale a snapshots persistentes. |

## 4. Arquitetura atual

| Arquivo / pasta | Responsabilidade |
|---|---|
| `src/index.ts` | `main()` instancia rede, mundo, apresentação e auditoria, registra renderer React-ECS e um sistema que chama seus ticks. |
| `src/model.ts` | Estado puro; `begin`, `step`, `vote`, `settleDuel`, `settleMatch`, `buy`, regras de reveal e pontuação. |
| `src/data.ts` | CONFIG, temas, poses, loja, interface `InventoryProvider`, validação de outfit e heurísticas dos bots. |
| `src/catalog.ts` | URNs, nomes, thumbnails e tags do catálogo base. Modelos de wearables são carregados remotamente. |
| `src/wardrobe.ts` | Agrupa índices originais por Superior/Inferior/Corpo todo/Pés etc.; classifica tipos por nomes, sem criar novas peças. |
| `src/network.ts` | Componentes `fashion::session:v1` e `fashion::presence:v1`, sincronização CRDT, presença, eleição de coordenador e publicação de snapshots JSON. |
| `src/shared/lease.ts` | Observação de heartbeat e expiração de presenças para eleição/participação. |
| `src/world.ts` | `FashionWorld` e figuras AvatarShape, primitivas, materiais, colliders, luzes, textos, privacidade, previews locais, palco, campeão e fontes de áudio. |
| `src/avatar-factory.ts` | Conversão Outfit → corpo/wearables/cores/emote; URNs e timestamps de animação. |
| `src/presentation.ts` | VirtualCamera/MainCamera e transições de jogador com `movePlayerTo`; libera câmera fora das fases apropriadas. |
| `src/ui/` | Views de lobby, preparação, runway, voto, resultado, loja e rank; controller local, dimensões e primitivas adaptadas ao canvas. |
| `src/rankings.ts` | Estatísticas por dia/semana UTC e totais em memória. |
| `src/session-audit.ts` | Logs de votos confirmados/resultados para comparar sessões; não é backend nem persistência. |
| `assets/` | Miniaturas e áudio local; `scripts/generate-lounge-audio.py` reproduz a trilha e o sinal próprios. |
| `tests/` | Regras, cenários de rede simulada, catálogo, câmera, avatares, áudio, limites de fluxo e regressões. |
| `scene.json` | Seis parcels em 3×2, spawn, permissões de teleporte/emote e destino World `leined.eth`. |
| `design/` | Este relatório, cópia do GDD, screenshots e MP4; excluído da publicação da cena por `.dclignore`. |

### Estado, rede e confiança

Os clientes publicam intenção na Presence. O coordenador eleito chama `step()` e publica a Session sincronizada. Os demais renderizam o snapshot. Isso reduz decisões independentes conflitantes, mas **não constitui autoridade segura**: clientes possuem o código, e votos/outfits circulam em dados compartilhados. A privacidade de voto/outfit é uma escolha visual da UI, não sigilo criptográfico contra um cliente modificado.

Mapeamento de componentes: `Transform`, `MeshRenderer`, `MeshCollider` e `Material` compõem o cenário; `AvatarShape` representa participantes/bots e `AvatarAttach` prende acessórios; `TextShape`/`Billboard` mostram informações; `LightSource`, `AudioSource` e `AvatarModifierArea` cuidam de luz, áudio e privacidade; `VirtualCamera`/`MainCamera` enquadram o show. Os componentes customizados de rede guardam JSON, e as regras estão no modelo TypeScript, não em um sistema ECS por cada seção do GDD. A geometria está em código por escolha registrada em `AGENTS.md`, não em composite.

Entidades visuais centrais: dois provadores locais, até seis figuras de participantes, dois slots ativos de duelo, modelo do campeão, placa de Hall of Fame, volume AvatarModifierArea central, luz/marcador local de voto, câmera virtual e áudio global local. Não há servidor próprio, API de conta, banco ou integração econômica on-chain.

### Duração nominal pelo código

CONFIG: lobby 15 s, tema 4 s, preparação até 60 s (mínimo 10 s para abreviar por prontidão), cada duelo 3 s de intro + 20 s de pose + até 10 s de voto + 6 s de resultado; resultado final 15 s e retorno 3 s. Máximo nominal: **214 s por ciclo de seis participantes**, sem contar carregamento, estabilização de rede ou atrasos. Votos completos encerram a fase antes do timeout. READY abrevia quando todos os competidores presentes confirmam, após a janela mínima; o timeout mantém a rodada avançando mesmo sem confirmação.

## 5. Divergências explícitas em relação ao GDD

| Referência | Estado após as correções / motivo verificável |
|---|---|
| §8: preparação de 60 s | Alinhada à sugestão. Prontidão permite abreviar após 10 s para reduzir espera ociosa. O ciclo completo continua maior que o checklist de 60 s da skill. |
| §9 e §13: reveal individual | Corrigido em `outfitRevealed`; ainda não há sigilo de dados contra clientes modificados, nem ocultação global do avatar real do jogador fora do volume da cena. |
| §28: dez estados | Oito estados; setup/intro/pose ficam em RUNWAY, com limiar temporal explícito para reveal. Não há necessidade funcional demonstrada de criar mais estados apenas para igualar nomes. |
| §17: servidor autoritativo | Ainda não implementado. Coordenação atual é eleição CRDT entre clientes; não há backend confiável. A razão original de produto não está documentada no código. |
| §10: categorias | Costas voltou como grupo com acessórios existentes. Navegação foi reorganizada em português; `Backpack` legado continua fora da UI por não representar itens úteis. |
| §11: presets | Fluxo de salvar/restaurar completo na sessão. O próprio §34 os classifica como opcionais, em contraste com a redação do §11. |
| §14: poses | Hero/Point compartilham `raiseHand`, Cool usa `dab`, Laugh usa `headexplode`, Victory usa `clap`. Adaptação aos emotes nativos, não animações próprias. |
| §5 versus §12: múltiplos duelos | Um duelo por participante e três pares por rodada, conforme exemplo do §12. §5 é ambíguo; não expandir automaticamente para torneio. |
| §20: SP do Top 3 | Corrigido: cada linha mostra a recompensa individual. |
| §22–23: efeitos/loja | Loja mantém Superstar 250, Royal (pose) 400, Sparkles 500 e título 1000. Outros itens são exemplos/opcionais e não existem no código. |
| §25–27: histórico/rankings | Hall de até 20 registros e ranking em memória. Não há continuidade garantida entre sessões; persistência/global são opcionais no GDD. |
| §31: áudio | Trilha, transição e voto existem; falta feedback dedicado de vitória/algumas ações. Ter um arquivo no disco não prova uso. |

## 6. Evidência visual e vídeo — material histórico do repositório

**Não recapturados nesta auditoria.** A descrição abaixo preserva os registros do relatório anterior; a revisão atual não repetiu nem certificou essa execução.

PNG originais do Bevy Web, **1280×720**, desktop, sem retoques. HUD/minimapa do Explorer podem aparecer. Isto não é evidência de execução em telefone físico nem de múltiplos humanos.

| Arquivo em `screenshots/` | O que demonstra |
|---|---|
| `00-lobby-inicial-diagnostico.png` | Primeiro lobby, jogador visitante e modelos de provador; painel de preview ainda aberto. Bots da competição só são criados ao iniciar a rodada. |
| `01-lobby.png` | Lobby seguinte, bots/modelos ao fundo; jogador local ainda executa emote. Não declarar que todos os avatares estão parados. |
| `02-theme-reveal.png` | Theme Reveal: Date Night on the Moon e descrição na tela. |
| `03-preparacao-timer.png` | Preparação e timer, com provador local visível; look local é a exceção intencional à privacidade. |
| `04-guarda-roupa.png` | Painel, miniaturas e preview após a transição de câmera. |
| `05-runway-intro-ja-revelado.png` | Countdown do duelo com roupas já reveladas: evidencia a divergência, não um “antes” neutro. |
| `06-runway-pose.png` | Duelo ativo com poses e look aplicado. |
| `07-votacao.png` | UI VOTAR A / VOTAR B como audiência. |
| `08-resultados-style-points.png` | Top 3, votos, vitórias e +10 SP do visitante. |
| `09-proxima-rodada.png` | Novo tema após o retorno automático. |

`screenshots/manifest.json` registra frame de origem, timestamp e SHA-256 dos nove PNG selecionados. A imagem inicial extra foi capturada antes da sequência.

**Não foi criada uma imagem de runway com outfit neutro**, pois esse estado visual não é implementado. A captura do lobby não prova imobilidade de todos os personagens. Os modelos de competição ficam no backstage; a vista de spawn não é um close do conjunto.

`gameplay-preview.mp4`: **49,58 s**, 1280×720, MPEG-4 Part 2 (`mp4v`), 12 fps de saída. Montagem de frames reais amostrados aproximadamente uma vez por segundo, com cortes/trechos acelerados e quadros repetidos; **sem áudio capturado e sem interpolação**. Inclui lobby inicial, o ciclo observado e a revelação do tema seguinte. Não é gravação fluida a 12 fps nativos, não serve para medir FPS e não representa uma rodada de 50 segundos. A legenda no próprio vídeo informa a natureza da captura. Pode exigir player compatível com MPEG-4 Part 2; para distribuição web ampla, converter a H.264 com um encoder disponível, preservando a identificação de edição.

Segundo o relatório anterior, durante a abertura do guarda-roupa houve sobreposição transitória do jogador com o painel; os frames posteriores confirmam que a câmera reposiciona e libera o modelo à direita. Alguns textos 3D do palco são pequenos/pouco legíveis na vista capturada. Não há alteração de gameplay nesta tarefa documental.

## 7. Como rodar para revisão

Requisitos: Git, Node.js 22 LTS com npm, internet para pacotes e wearables, navegador compatível ou app Decentraland. O projeto não exige `.env`, chave privada ou assinatura para preview.

```sh
git clone --branch codex/hackathon-mvp https://github.com/dlb93la/decentealand-fashion-battle.git
cd decentealand-fashion-battle
npm ci
npm test
npm run build
npm start
```

O servidor desta revisão foi deixado ativo. [Abrir preview local no Bevy Web](https://decentraland.org/bevy-web/?preview=true&realm=http://127.0.0.1:8010&position=0,0). Usar um navegador externo com acesso ao localhost e GPU disponível; no navegador integrado houve bloqueio de acesso local.

`npm start` abre Bevy Web e serve a cena na porta 8010. Para mobile, use `npm run start:mobile`, celular e PC na mesma rede, Decentraland instalado e QR do CLI. Se o CLI escolher VPN/Tailscale, substitua pelo IP LAN do PC em `decentraland://open?preview=http://<IP-LAN>:8010&position=0,0`. O `/about` em `http://<IP-LAN>:8010/about` deve retornar JSON saudável. A raiz HTTP do servidor não é a interface jogável; o Explorer consome esse servidor.

Entre como visitante, espere o tema, abra VESTIR, escolha uma peça e SALVAR/READY. Aguarde os três duelos. No duelo em que você participa, não pode votar; vote nos demais. Verifique resultado, saldo e reinício. Para testar multiplayer, utilize identidades distintas no mesmo preview e compare tema, timer, votos confirmados e saldo após reconexão/saída do coordenador.

Para publicar no World configurado: `npm run deploy:world`, com assinatura do proprietário autorizado de `leined.eth`. **Preview local e GitHub não são uma publicação jogável permanente.** Esta tarefa não publicou nem assinou a cena.

A instalação desta revisão encontrou 15 avisos de dependências, incluindo `protobufjs` crítico na cadeia do SDK. Build funcional não significa auditoria de segurança aprovada; não aplicar `npm audit fix --force` sem testar uma versão SDK compatível.

## 8. Gaps prioritários e aderência ao objetivo da submissão

### Quatro critérios solicitados para Creator Success

Esta matriz usa os quatro eixos fornecidos pelo usuário. Não é declaração de elegibilidade, pontuação oficial ou aprovação do programa.

| Critério | Estado honesto | O que falta comprovar ou completar |
|---|---|---|
| Core loop | **Implementado na lógica; alinhamento parcial** | Fechar privacidade/reveal por dupla, completar resultados e confirmar rodada real sem reinício. Definir o significado de “curta” frente aos 214 s nominais e ao checklist da skill. Testes atuais passam, mas preview 3D desta revisão ficou bloqueado no navegador. |
| Interação social significativa | **Mecânica existente; evidência humana insuficiente nesta revisão** | Votar e interpretar looks dos outros afeta resultados. Fazer playtest sem instruções com 2–3 pessoas (recomendação da skill), depois 5+ simultâneas, incluindo entradas/saídas. Verificar entendimento, feedback e se as pessoas interagem além dos botões. Autoridade/anonimato precisam ser resolvidos ou explicitamente limitados. |
| Retenção | **Sessão implementada; retorno entre visitas não sustentado por persistência própria** | Temas, SP, compras e Hall estimulam outra rodada enquanto a sessão existe. Não há armazenamento durável, métricas de retorno ou promessa comprovada de D1/D7. Persistência é opcional no GDD, mas necessária se a proposta prometer progresso garantido entre dias. |
| Escopo do projeto | **MVP delimitado; aceite ainda incompleto** | Uma arena e seis competidores são escopo concreto. Falta fechar os itens parciais, orçamento de runtime/mobile e limites declarados; separar servidor confiável, persistência e futuros das promessas da entrega. Pacote de arquivos cabe na referência da skill; isso não valida performance. |

### Prioridades para fechar a entrega

1. **Servidor e privacidade dos dados:** migrar a autoridade de resultados/pontos/votos para serviço confiável; manter looks futuros e identidade dos votos fora de snapshots públicos. É a principal mudança estrutural restante.
2. **Mobile real:** validar o layout alterado, toque, safe areas, câmera, emotes, áudio e duas rodadas completas; ajustar com evidência visual.
3. **Drop-in/drop-out:** validar reconexão e saída do coordenador; decidir se competidor desconectado mantém inscrição, desiste ou é substituído. Não expulsar AFK da cena.
4. **Retenção:** persistir SP, compras e histórico se a entrega prometer continuidade entre visitas. Não anunciar ranking global enquanto for restrito à sessão.
5. **Performance e feedback:** medir rede/memória/FPS e carga dos wearables; completar os sons de ações/vitória com assets existentes, sem aumentar efeitos arbitrariamente.
6. **Aceite e documentação:** resolver as ambiguidades de duração, número de duelos e alcance do sigilo. Validar compreensão e interação com pessoas reais. Publicação depende de assinatura autorizada e não faz parte do push Git.

### O que significa “100%” neste relatório

Para **100% do MVP obrigatório**, fechar os itens parciais do checklist: privacidade de dados/avatares, votação conforme a exigência de autoridade do GDD e validação mobile. Lobby, categorias, presets, reveal individual e SP dos finalistas já receberam correções de código. Reexecutar o fluxo de aceite §36 em dispositivos reais; o build sozinho não satisfaz esse critério.

Para **100% de consistência documental**, resolver ambiguidades do GDD: §5 fala em múltiplos duelos por jogador, mas §12 define três pares; §11 pede um preset, porém §34 o classifica como nice-to-have; a duração inicial é recomendada/configurável, não um valor obrigatório. Registrar decisões de produto antes de dizer que uma adaptação equivale à especificação. Quando não há justificativa verificável para uma divergência, o motivo permanece **não documentado**, sem atribuir intenção ao autor.

Para **todos os opcionais/futuros**, persistência global, novas entradas/efeitos, temporadas, eventos e conteúdo comunitário continuam roadmap. Não são requisitos para chamar o MVP de completo, e não se deve inflar o escopo adicionando-os automaticamente. Para aderir à skill e aos quatro eixos, além de código, ainda falta evidência de compreensão, interação humana, repetição voluntária e desempenho medido.
