# Fashion Battle — estado real de implementação

Revisão: 11/09/2026. Código de referência: `af6320d` (polimento de gameplay em `0b834ad`). Nome exibido na cena: **Decentealand Fashion Battle**. Este documento descreve implementação e evidência, não aprovação pelo Creator Success ou pelo Friendzone Mobile Buildathon.

## Fonte do escopo e método

`design/gdd.md` não existia nesta cópia. Para permitir a revisão e o anexo, foi criada uma **cópia integral, sem alterações**, de `GDD-TECNICO.md`, versão 1.0 MVP. Esse documento não contém uma seção literalmente chamada “MVP Scope”: as referências equivalentes são §33 **MVP MUST-HAVE**, §34 **MVP NICE-TO-HAVE** e §37 **ORDEM DE DESENVOLVIMENTO**. Se houver outro GDD de submissão, esta matriz precisa ser reconciliada com ele.

Fontes: código TypeScript, catálogo, configuração, testes e captura real do Explorer Bevy Web. Os testes executados em clone limpo do GitHub passaram: **56/56**; bundle e checagem TypeScript sem erros. Testes de rede usam clientes simulados; não equivalem a certificação de multiplayer entre aparelhos.

Nesta sessão de captura, um visitante humano controlado pela automação e bots completaram uma rodada: tema **Date Night on the Moon**, troca de peça no provador, apresentação, votação dos duelos, Top 3, **+10 SP** para o visitante e próxima rodada **Summer on Saturn**. A UI de votação foi observada; não foi registrado um voto humano confirmado nesta captura. Não foram alterados timers, injetados resultados, trocados modelos ou fabricados estados para as imagens.

**Implementado** = caminho de execução existente e conectado. **Parcial** = parte do requisito ou da experiência ainda falta. **Não implementado** = sem caminho funcional correspondente. A coluna de status não substitui a avaliação de qualidade em dispositivos reais.

## 1. MVP obrigatório — GDD §33

| Item | Status | Observação técnica e limite |
|---|---|---|
| Lobby | Parcial | Spawn, ambiente, timer e instrução curta existem; o contador de participantes próprio do jogo não é exibido (`HeaderPill` recebe `memberCount`, mas não o usa). O indicador “nearby” pertence ao Explorer. |
| Theme system | Implementado | `THEMES` tem título, descrição, keywords e tipo; `begin()` seleciona por hash do número da rodada. A sequência é determinística, não sorteio independente. |
| 6-player structure | Implementado | Até seis humanos por rodada; bots completam seis; excedentes alternam participação e podem votar. Três pares distintos de dois competidores. |
| Wardrobe | Parcial | Catálogo compartilhado de 200 URNs, miniaturas, categorias/tipos/páginas e seleção gratuita; veste modelos NPC da cena. Categoria Back saiu da UI e o preset salvo não tem mais ação de restauração acessível. |
| Outfit privacy | Parcial | Modelos compartilhados usam roupa neutra durante tema/preparação; provadores exibem o look local. Todos os modelos revelam no início de RUNWAY, incluindo pares futuros; não há ocultação até o reveal individual. Avatares humanos fora do volume central não são ocultados. |
| 1v1 runway | Implementado | Dois modelos por duelo, três confrontos, giro e câmera do palco; não é torneio eliminatório nem cada jogador enfrenta múltiplos oponentes. |
| Poses | Implementado | Oito opções básicas e duas compráveis; mapeadas a emotes nativos, algumas com nomes de fantasia que não descrevem literalmente a animação. Há duplicação de animação entre Hero e Point. |
| Voting | Implementado | Um voto por espectador/duelo; dupla ativa não vota; valida rodada, duelo, candidato e duplicidade. Confirmação visual local e destaque no escolhido. Autoridade é um cliente eleito, não servidor confiável. |
| Bots | Implementado | Preenchimento automático, roupas, poses e votos; heurísticas usam tags, preferência e ruído limitado. A geração de roupas está concentrada nos seis primeiros índices, não explora o catálogo inteiro. |
| Results | Implementado | Top 3 mostra nome, votos e vitórias em duelo; o visitante vê seus SP ganhos. Não há SP individuais para cada linha do Top 3. |
| Style Points | Implementado | +10 participação, +50 vitória de duelo, +100 bônus de campeão; saldo e compras são da sessão compartilhada. Não há moeda blockchain ou saldo persistente. |
| Repeat loop | Implementado | RESULTADOS → retorno → lobby → nova rodada automático, observado no preview e coberto por teste de múltiplas rodadas. Sem humanos no lobby, o timer reinicia sem começar partida. |
| Mobile UI | Parcial | React-ECS, safe area, botões por toque e guarda-roupa à esquerda; a versão polida foi capturada em desktop 1280×720. Falta revalidar essa versão em Android/iOS e tamanhos/orientações alvo. |

## 2. Etapas de desenvolvimento — GDD §37

| Fase | Status | Mapeamento / observação |
|---|---|---|
| 1 — Cena isolada | Implementado | Repositório independente, configurações, skills e dependências locais; sem dependência do antigo Ludoria. |
| 2 — Lobby + Stage | Implementado | `FashionWorld` constrói arena, provadores, passarela, backstage e Hall of Fame em TypeScript. |
| 3 — Game State Machine | Implementado | `model.ts`: oito estados efetivos; setup/reveal/pose foram agrupados em RUNWAY. |
| 4 — Theme System | Implementado | `data.ts` + `model.ts:begin`; texto aparece na UI e no mundo. |
| 5 — Wardrobe | Parcial | Seleção e aplicação funcionando; Back e restauração do preset não estão acessíveis. |
| 6 — Duel System | Implementado | Geração de pares, temporização, votação e resultado intermediário de cada duelo. |
| 7 — Voting | Implementado | Regras centralizadas em `vote()` e feedback de confirmação na UI. |
| 8 — Bots | Implementado | Regras determinísticas para reduzir dependência de população humana. |
| 9 — Rewards | Implementado | Pontos e compras validados no estado de sessão. |
| 10 — Mobile polish | Parcial | Layout e áudio atualizados; falta avaliação física da versão atual, legibilidade e performance medidas. |
| 11 — Hall of Fame | Parcial | Registro de até 20 vitórias na sessão e modelo do último campeão; sem histórico persistente entre sessões. |
| 12 — Testing | Parcial | 56 testes automatizados, build e ciclo real com bots; faltam regressão atual entre dois aparelhos, reconexões em rede real e matriz mobile. |

## 3. Opcionais e futuros — GDD §34–35

| Item | Status | Observação |
|---|---|---|
| Hall of Fame persistente | Não implementado | Histórico em `State.hall`; não há banco ou storage persistente. |
| Performance cosmetics | Parcial | Sparkles, título Fashion Icon e poses extras existem; confetti, hearts, smoke, fire e dance floor do GDD não estão implementados. |
| Advanced bot personalities | Parcial | Preferências royal/western/cyber/chaos; Comedian compartilha preferência chaos, sem IA comportamental avançada. |
| Global rankings | Não implementado | `rankings.ts` calcula dia/semana/todos apenas sobre contas da sessão. |
| Saved presets | Parcial | `saveLook` armazena uma cópia em memória e `restoreLook` existe; o botão “USAR LOOK” foi removido no polimento. Salvar não oferece hoje um fluxo completo de restaurar. |
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

Entidades visuais centrais: dois provadores locais, até seis figuras de participantes, dois slots ativos de duelo, modelo do campeão, placa de Hall of Fame, volume AvatarModifierArea central, luz/marcador local de voto, câmera virtual e áudio global local. Não há servidor próprio, API de conta, banco ou integração econômica on-chain.

### Duração real

CONFIG: lobby 15 s, tema 4 s, preparação 90 s, cada duelo 3 s de intro + 20 s de pose + até 10 s de voto + 6 s de resultado; resultado final 15 s e retorno 3 s. Máximo nominal: **244 s por ciclo de seis participantes**, sem contar carregamento, estabilização de rede ou atrasos. Votos completos encerram a fase antes do timeout. READY não acelera a preparação; o timer governa a transição.

## 5. Divergências explícitas em relação ao GDD

| Referência | Implementação atual / motivo conhecido |
|---|---|
| §8: preparação sugerida de 60 s | Usa 90 s. Valor configurável; não há justificativa de balanceamento medida no código. Aumenta a duração da demo. |
| §9 e §13: ocultar até o reveal de cada dupla | `outfitRevealed()` retorna true em todo RUNWAY; look aparece durante o countdown e também no backstage. Simplificação atual, com perda de suspense e possibilidade de antecipar looks. |
| §28: dez estados | Oito estados; DUEL_SETUP/RUNWAY_REVEAL/POSE agrupados em RUNWAY e FINAL_RESULTS chamado RESULTS. Estrutura simplificada, funcional, mas não separa o instante visual de reveal. |
| §17: autoridade de servidor | Coordenador é um cliente CRDT eleito. MVP sem infraestrutura backend; antitrapaça e integridade de longo prazo não estão resolvidas. |
| §10: Back e categorias | Navegação reagrupada em português por pedido de polimento; Back foi retirado. Dados e geometria de acessórios de costas permanecem no código, sem seletor atual. |
| §11: presets | Salvar existe, restaurar perdeu o acesso na UI ao reduzir botões por pedido do usuário. Necessita decisão de produto para manter simplicidade e cumprir o requisito. |
| §14: nomes de poses | Hero/Point usam raiseHand, Cool usa dab, Laugh usa headexplode, Victory usa clap. Adaptação aos emotes suportados, não animações próprias com esses nomes. |
| §5: múltiplos duelos por jogador | Cada participante disputa um único confronto por rodada; os três duelos pertencem à partida. Resolver a redação ambígua ou expandir o formato, se necessário. |
| §20: SP no Top 3 | Linhas mostram votos/vitórias; só o ganho do jogador local é exibido. Demais pontuações existem no estado. |
| §22–23: efeitos/loja de exemplo | Loja real: Superstar 250, Royal (pose) 400, Sparkles 500, Fashion Icon 1000. Entradas e outros efeitos foram reduzidos ao subconjunto existente. |
| §25–27: histórico/rankings | Hall da sessão guarda até 20 registros; exibição 3D mostra o último campeão. Ranking “todos” significa toda a sessão, não toda a história pública do jogo. Persistência/global estão entre opcionais do GDD. |
| §31: countdown/áudio | Contagem falada substituída por sinal de três segundos e trilha contínua a pedido do usuário. Não há som distinto de vitória ativo; transições compartilham o sinal. |

## 6. Evidência visual e vídeo

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

Durante a abertura do guarda-roupa houve sobreposição transitória do jogador com o painel; os frames posteriores confirmam que a câmera reposiciona e libera o modelo à direita. Alguns textos 3D do palco são pequenos/pouco legíveis na vista capturada. Não há alteração de gameplay nesta tarefa documental.

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

`npm start` abre Bevy Web e serve a cena na porta 8010. Para mobile, use `npm run start:mobile`, celular e PC na mesma rede, Decentraland instalado e QR do CLI. Se o CLI escolher VPN/Tailscale, substitua pelo IP LAN do PC em `decentraland://open?preview=http://<IP-LAN>:8010&position=0,0`. O `/about` em `http://<IP-LAN>:8010/about` deve retornar JSON saudável. A raiz HTTP do servidor não é a interface jogável; o Explorer consome esse servidor.

Entre como visitante, espere o tema, abra VESTIR, escolha uma peça e SALVAR/READY. Aguarde os três duelos. No duelo em que você participa, não pode votar; vote nos demais. Verifique resultado, saldo e reinício. Para testar multiplayer, utilize identidades distintas no mesmo preview e compare tema, timer, votos confirmados e saldo após reconexão/saída do coordenador.

Para publicar no World configurado: `npm run deploy:world`, com assinatura do proprietário autorizado de `leined.eth`. **Preview local e GitHub não são uma publicação jogável permanente.** Esta tarefa não publicou nem assinou a cena.

A instalação auditada anteriormente encontrou 15 avisos de dependências, incluindo `protobufjs` crítico na cadeia do SDK. Build funcional não significa auditoria de segurança aprovada; não aplicar `npm audit fix --force` sem testar uma versão SDK compatível.

## 8. Gaps prioritários e aderência ao objetivo da submissão

1. **Reveal e privacidade:** ocultar cada par até acabar a intro e manter pares futuros neutros, ou revisar explicitamente §9/§13 do GDD. Considerar também o limite de privacidade visual no cliente.
2. **Wardrobe e presets:** decidir como disponibilizar Back e restauração do look salvo sem reintroduzir navegação confusa; reconciliar o GDD com as remoções pedidas no polimento.
3. **Validação mobile atual:** testar Android/iOS, orientação e safe areas, leitura dos textos, toque, câmera, áudio/ducking, carga dos wearables e pelo menos duas rodadas completas.
4. **Multiplayer e integridade:** repetir duas identidades/aparelhos reais, saída do coordenador, perda de conexão, voto perto do timeout e tentativa de dados inválidos. Servidor confiável continua faltando para cumprir literalmente a exigência server-authoritative.
5. **Apresentação e escopo:** contador próprio de participantes, SP dos finalistas, legibilidade de textos 3D e rótulos de poses; ajustar no código ou no documento. Medir entendimento em 10 segundos com revisores, em vez de declarar a meta comprovada.
6. **Retorno entre visitas:** hoje a motivação é repetir temas/competir/comprar dentro da sessão. Persistência de saldo, desbloqueios e Hall/ranking é necessária se a submissão prometer progressão durável; não prometer retenção entre dias com a implementação atual.
7. **Duração e formato:** validar se uma rodada de até ~4 minutos atende ao pitch. Um clipe de 50 s editado não prova jogo de 50 s. Definir se “múltiplos duelos” se refere à partida ou a cada jogador.
8. **Opcionais:** entradas, demais efeitos, global ranking e histórico persistente permanecem fora do MVP funcional. Para bater literalmente com todos os exemplos/futuros do GDD seria preciso implementá-los; para fechar o MVP, mantê-los claramente como roadmap.
9. **Entrega pública:** publicar no destino autorizado, abrir o link em outro dispositivo e preparar um vídeo H.264 fluido com áudio se exigido pela submissão. Confirmar separadamente os requisitos oficiais vigentes dos programas; não foram auditados nesta tarefa.

**Leitura para Creator Success / Buildathon:** loop claro e repetição automática têm evidência real; interação social existe por votação de looks alheios, mas esta captura usa bots; retenção é apenas de sessão; escopo é uma arena de seis participantes com três duelos, não um serviço persistente completo. Não há métricas de diversão, D1/D7, estabilidade mobile ou aprovação do programa comprovadas por este material.
