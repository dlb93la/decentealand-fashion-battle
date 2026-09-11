# DECENTEALAND FASHION BATTLE
## GAME DESIGN DOCUMENT — TECHNICAL / AI DEVELOPMENT GUIDE

**Projeto:** Decentealand  
**Versão:** 1.0 MVP  
**Objetivo:** Friendzone / Decentraland Hackathon  
**Plataforma prioritária:** Mobile  
**Documento destinado a:** Antigravity, Codex e desenvolvedores humanos

---

# 1. VISÃO GERAL

Decentealand Fashion Battle é uma experiência social multiplayer competitiva baseada em criação de outfits, interpretação de temas, performance e votação.

O jogador recebe um tema inesperado e possui tempo limitado para montar um visual.

Após a preparação, os competidores aparecem no palco em duelos 1v1.

Os jogadores que estão na audiência votam naquele que melhor interpretou o tema.

O resultado gera Style Points, progressão cosmética e registros no Hall of Fame.

## CORE LOOP

LOBBY  
↓  
THEME REVEAL  
↓  
WARDROBE  
↓  
RUNWAY DUEL  
↓  
VOTING  
↓  
RESULTS  
↓  
REWARD  
↓  
LOBBY  
↓  
NEXT ROUND

## PRINCÍPIO DO PRODUTO

O jogador deve:

**DRESS → POSE → VOTE → WIN → REPEAT**

A experiência deve ser fácil de entender em menos de 10 segundos e permitir uma partida curta, social e repetível.

---

# 2. REGRAS DE ESCOPO

## PRIORIDADE MÁXIMA

O MVP deve possuir uma partida completa e funcional.

Toda feature deve ser avaliada nesta ordem:

1. Jogabilidade.
2. Multiplayer/social.
3. Mobile UX.
4. Retenção.
5. Apresentação/polish.
6. Features secundárias.

Se uma feature ameaçar impedir o loop principal de funcionar, ela deve ser adiada.

## NÃO FAZER

Não criar:

- mundo enorme;
- economia complexa;
- combate;
- inventário blockchain completo;
- sistemas desnecessários de crafting;
- IA generativa para criação de roupas;
- meta-game complexo;
- sistemas que não impactem diretamente a experiência principal.

---

# 3. ISOLAMENTO DA CENA

IMPORTANTE:

A experiência deve ser construída em uma NOVA CENA/MÓDULO.

Não destruir ou substituir o trabalho anterior do projeto.

Antes de programar:

- analisar estrutura existente;
- identificar cena atual;
- identificar infraestrutura multiplayer existente;
- identificar sistemas de avatar;
- identificar componentes reutilizáveis.

Sempre reutilizar infraestrutura existente quando apropriado.

Evitar refactors globais.

A nova experiência deve ser modular e removível.

---

# 4. ESTRUTURA DA EXPERIÊNCIA

A arena deve possuir quatro áreas principais.

## 4.1 LOBBY

Funções:

- spawn;
- espera;
- socialização;
- countdown;
- informações da próxima partida;
- número de jogadores;
- acesso visual ao palco.

Elementos:

- Fashion Battle logo;
- Next Round timer;
- Player count;
- Hall of Fame preview;
- instruções rápidas.

---

## 4.2 WARDROBE AREA

Área dedicada à preparação.

Durante a preparação:

- jogador escolhe outfit;
- altera categorias;
- visualiza resultado;
- confirma participação.

Todos os jogadores devem possuir acesso aos cosméticos disponíveis.

---

## 4.3 RUNWAY / STAGE

Palco principal.

Elementos:

- dois slots de competidor;
- iluminação;
- backdrop;
- display do tema;
- spotlight;
- efeitos opcionais;
- área de audiência.

Somente dois jogadores permanecem no palco por duelo.

---

## 4.4 HALL OF FAME

Espaço persistente ou preparado para persistência.

Exibir:

- vencedores;
- temas;
- votos;
- melhores looks;
- campeões recentes.

Posteriormente pode conter modelos/estátuas dos vencedores.

---

# 5. PARTICIPANTES

Configuração inicial:

**6 participantes por partida**

Estrutura:

2 jogadores = palco  
4 jogadores = audiência

Os jogadores competem em múltiplos duelos.

Jogadores insuficientes são preenchidos por bots.

Configuração:

MAX_PLAYERS = 6  
MAX_STAGE_PLAYERS = 2

---

# 6. BOT SYSTEM

Bots existem para garantir que a experiência permaneça jogável com baixa população.

Bots devem:

- escolher outfit;
- interpretar tema;
- executar pose;
- competir;
- votar.

Bots NÃO precisam utilizar IA generativa.

## PERSONALIDADES

### FASHIONISTA

Busca elegância e coordenação.

### CHAOS

Busca combinações estranhas/divertidas.

### CYBERPUNK

Prioriza elementos tecnológicos.

### SPACE COWBOY

Prioriza roupas western/futuristas.

### COMEDIAN

Busca interpretações absurdas.

O algoritmo pode combinar:

Theme keywords  
+  
Bot personality  
+  
Available cosmetics  
+  
controlled randomness

---

# 7. TEMAS

Os temas devem ser interpretativos.

O jogador nunca deve ser obrigado tecnicamente a usar determinada categoria de item.

O objetivo é interpretação social.

## TIPOS

### DIRECT

Summer on Saturn  
Winter on Mars

### CONCEPTUAL

Light & Shadow  
Future Nostalgia

### HUMOROUS

Make Me Laugh  
Worst Outfit Ever

### CHARACTER

Space Cowboy  
Alien Celebrity

### SITUATIONAL

First Date on the Moon  
Royal Wedding on Mars

O sistema deve ser data-driven.

Estrutura:

Theme

- id
- title
- description
- keywords
- category

---

# 8. PREPARAÇÃO

Tempo recomendado inicial:

**60 segundos**

Pode ser configurável.

Ao começar:

THEME REVEAL

O tema é apresentado de forma dramática.

Depois:

PREPARE YOUR LOOK  
60...59...58...

---

# 9. OUTFIT PRIVACY

Durante a preparação, os participantes NÃO devem conseguir ver claramente os outfits dos outros.

Utilizar:

- robe padrão;
- avatar placeholder;
- outro sistema visual equivalente.

Objetivo:

- impedir cópia;
- preservar suspense;
- aumentar impacto do reveal.

Quando o jogador entra no palco:

**OUTFIT REVEAL**

O look real aparece.

---

# 10. WARDROBE

Todos os cosméticos necessários para a experiência devem estar disponíveis no MVP.

NÃO utilizar raridade ou posse externa como requisito para competir.

Categorias:

- Head
- Hair
- Face
- Top
- Bottom
- Shoes
- Hat
- Glasses
- Accessories
- Back
- Effects

O inventário deve ser inicialmente MOCK/LOCAL se a integração completa for complexa.

A camada de dados deve permitir substituir posteriormente:

Mock Inventory  
→  
Decentraland Wearables / Inventory

sem reescrever o jogo.

---

# 11. PRESETS

Permitir salvar pelo menos um outfit durante a sessão.

Opcional futuro:

- Preset 1
- Preset 2
- Preset 3

Presets são especialmente úteis para temas recorrentes.

---

# 12. DUEL SYSTEM

Após a preparação:

Os seis participantes são organizados em três confrontos.

Exemplo:

DUEL 1  
A × B

DUEL 2  
C × D

DUEL 3  
E × F

Cada duelo possui:

- entrada;
- reveal;
- pose;
- votação;
- resultado/intermediário.

---

# 13. RUNWAY PRESENTATION

Cada duelo deve ter uma apresentação curta.

Sequência:

SPOTLIGHT  
↓  
3  
↓  
2  
↓  
1  
↓  
REVEAL  
↓  
POSE

O competidor deve poder executar uma pose/emote.

A câmera deve favorecer o espetáculo.

---

# 14. POSES / EMOTES

MVP:

- Hero
- Dance
- Flex
- Cool
- Wave
- Victory
- Laugh
- Point

A arquitetura deve abstrair a implementação de animação.

Pose:

- id
- name
- animation
- optional effect

Utilizar recursos nativos do Decentraland quando disponíveis.

---

# 15. VOTING

A audiência vê dois competidores.

Pergunta:

# WHO WORE IT BEST?

Opções:

VOTE PLAYER A  
VOTE PLAYER B

Cada pessoa possui um voto.

Competidores daquele duelo não votam em si mesmos.

Depois de votar:

- botão desaparece;
- voto é registrado;
- spotlight mostra a escolha.

---

# 16. VOTING FEEDBACK

Após votar:

O participante escolhido recebe um spotlight.

Texto opcional:

VOTE CAST

Isso fornece confirmação visual imediata.

Não revelar publicamente quem votou em quem.

---

# 17. VOTING ALGORITHM

Modelo inicial:

Cada espectador = 1 voto.

Duelo:

votesA  
vs  
votesB

Vencedor do duelo recebe:

+DUEL_WIN_POINTS

O sistema deve permanecer server-authoritative quando multiplayer real estiver disponível.

Não confiar no cliente para determinar o resultado.

---

# 18. BOT VOTING

Bots utilizam score interno.

Exemplo:

themeMatchScore  
+ outfitCoherence  
+ personalityPreference  
+ randomness

A aleatoriedade deve ser limitada para impedir resultados totalmente arbitrários.

---

# 19. ROUND SCORING

Sugestão inicial:

Participation = 10  
Duel Win = 50  
Final Winner Bonus = 100

Valores centralizados em configuração.

O sistema pode posteriormente ser balanceado.

---

# 20. RESULTADOS

Após todos os duelos:

# FASHION BATTLE RESULTS

Mostrar:

🥇 FIRST PLACE  
🥈 SECOND PLACE  
🥉 THIRD PLACE

Mostrar:

- nome;
- votos;
- duelos vencidos;
- Style Points ganhos.

Todos os participantes recebem algum progresso.

---

# 21. STYLE POINTS

Moeda interna de progressão.

Usada para desbloquear elementos cosméticos da experiência.

NÃO usar os pontos para bloquear as roupas fundamentais.

Style Points desbloqueiam:

- poses;
- efeitos;
- entrances;
- títulos;
- celebration animations;
- presentation cosmetics.

---

# 22. PERFORMANCE COSMETICS

Inspirado na ideia de que apresentação faz parte do espetáculo.

Exemplos:

SPOTLIGHT  
CONFETTI  
HEARTS  
SMOKE  
FIRE  
SPARKLES  
DANCE FLOOR  
SPECIAL ENTRANCE

Esses elementos devem ser cosméticos.

Nunca conceder vantagem competitiva direta.

---

# 23. SHOP

STYLE SHOP

Itens exemplo:

Superstar Pose — 250  
Confetti Effect — 300  
Royal Entrance — 500  
Fire Entrance — 750  
Fashion Icon Title — 1000

Todos os preços devem ser configuráveis.

---

# 24. RECOMPENSA DE PARTICIPAÇÃO

Todos recebem alguma recompensa.

Objetivo:

evitar:

LOSS → ZERO PROGRESS → QUIT

Em vez disso:

LOSS → SMALL REWARD → TRY AGAIN

---

# 25. HALL OF FAME DATA

Estrutura:

FashionRecord

- winnerId
- winnerName
- theme
- votes
- date
- outfit
- pose
- cosmetics/effects

---

# 26. HALL OF FAME VISUAL

Após a vitória:

O look vencedor pode aparecer em um display.

Formato:

🏆 WINNER

SUMMER ON SATURN

Player Name

87 Votes

Podemos posteriormente gerar uma representação persistente do avatar.

---

# 27. RANKINGS

Preparar suporte para:

BEST OF THE DAY  
BEST OF THE WEEK  
BEST OF ALL TIME

Métricas possíveis:

- wins;
- votes received;
- total participations;
- win rate.

Não é obrigatório implementar ranking global no primeiro MVP.

---

# 28. GAME STATES

Implementar uma máquina de estados única.

LOBBY  
THEME_REVEAL  
PREPARATION  
DUEL_SETUP  
RUNWAY_REVEAL  
POSE  
VOTING  
DUEL_RESULT  
FINAL_RESULTS  
RETURN_TO_LOBBY

Cada estado precisa ter:

- entry;
- duration;
- UI;
- logic;
- exit condition.

---

# 29. MOBILE-FIRST UX

A experiência deve funcionar por touchscreen.

Botões:

- grandes;
- claros;
- poucos por tela.

Priorizar:

Tap  
Swipe  
Simple selection

Evitar dependência de:

Keyboard  
Mouse precision  
Tiny UI elements

---

# 30. PERFORMANCE

Arena pequena.

Low poly.

Poucos efeitos simultâneos.

Evitar assets gigantes.

Evitar lógica contínua desnecessária.

Especialmente importante:

- loading;
- avatar performance;
- UI responsiveness;
- network traffic.

---

# 31. ÁUDIO

Feedback prioritário:

THEME REVEAL  
COUNTDOWN  
RUNWAY  
VOTE  
VICTORY

Música de fundo pode ser adicionada posteriormente.

---

# 32. RETENTION

O sistema deve incentivar:

"mais uma partida."

Mecanismos:

- temas diferentes;
- progressão;
- desbloqueios;
- Hall of Fame;
- competição;
- bots;
- rankings;
- melhores performances.

---

# 33. MVP MUST-HAVE

Obrigatório:

✓ Lobby  
✓ Theme system  
✓ 6-player structure  
✓ Wardrobe  
✓ Outfit privacy  
✓ 1v1 runway  
✓ Poses  
✓ Voting  
✓ Bots  
✓ Results  
✓ Style Points  
✓ Repeat loop  
✓ Mobile UI

---

# 34. MVP NICE-TO-HAVE

Adicionar depois:

○ Hall of Fame persistente  
○ Performance cosmetics  
○ Advanced bot personalities  
○ Global rankings  
○ Saved presets  
○ Special entrances  
○ Audio polish

---

# 35. FUTURE FEATURES

Possibilidades futuras:

- seasonal themes;
- tournaments;
- community-created themes;
- weekly championship;
- global leaderboard;
- fashion collections;
- player-created stages;
- special events;
- sponsored themes;
- historical Hall of Fame;
- avatar snapshots.

---

# 36. CRITÉRIO DE QUALIDADE

O MVP somente será considerado pronto quando:

1. jogador entra;
2. recebe tema;
3. cria outfit;
4. outros jogadores não veem seu outfit;
5. jogadores entram no palco;
6. outfit é revelado;
7. pose acontece;
8. audiência vota;
9. resultado é calculado;
10. recompensa é entregue;
11. jogador retorna ao lobby;
12. outra partida começa.

Tudo deve funcionar sem reinicialização manual.

---

# 37. ORDEM DE DESENVOLVIMENTO

PHASE 1  
Cena isolada

PHASE 2  
Lobby + Stage

PHASE 3  
Game State Machine

PHASE 4  
Theme System

PHASE 5  
Wardrobe

PHASE 6  
Duel System

PHASE 7  
Voting

PHASE 8  
Bots

PHASE 9  
Rewards

PHASE 10  
Mobile polish

PHASE 11  
Hall of Fame

PHASE 12  
Testing

---

# 38. REGRA FINAL PARA A IA

Não confundir complexidade técnica com qualidade.

O objetivo é:

**uma experiência pequena, extremamente polida, social e repetível.**

A experiência precisa ser divertida mesmo com poucos jogadores.

O jogador deve entender imediatamente:

"Recebi um tema."

"Vou me vestir."

"Vou subir no palco."

"As pessoas vão votar."

"Quero ganhar."

# DRESS.
# POSE.
# VOTE.
# WIN.
# REPEAT.