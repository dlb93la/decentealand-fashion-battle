# Decentealand Fashion Battle — Game Design Document

Version 1.1 — submission scope, September 11, 2026. Platform: Decentraland SDK7, with mobile as the target experience.

This English edition supersedes the original Portuguese 1.0 draft for this delivery. The original remains in [GDD-TECNICO.md](../GDD-TECNICO.md) for traceability. This is an explicit scope revision, not a claim that every feature in the original draft has been implemented. See [implementation-status.md](implementation-status.md) for evidence and remaining gaps.

## Product concept

Dress for an unexpected theme, perform in a one-on-one runway duel, vote on other contestants, earn Style Points, and play another round. The scene is a continuous social space: visitors may arrive mid-round, walk around, watch, and leave without ending the world.

The intended appeal is interpreting playful prompts and seeing how other people interpret them. Bots fill empty contestant slots so one visitor can complete the loop. Bots support availability; they do not replace evidence of enjoyable human interaction.

## Core loop and timing

Lobby → theme reveal → preparation → three runway duels and votes → final results → lobby.

| Stage | Duration | Player experience |
|---|---:|---|
| Lobby | 15 s | Explore and wait for the next selection. A round requires human presence. |
| Theme reveal | 4 s | Read the theme and its description. |
| Preparation | 90 s | Open DRESS, choose clothing, SAVE the preferred look, and mark READY. |
| Duel intro | 3 s per duel | Both contestants wear neutral outfits during the countdown. |
| Runway poses | 20 s per duel | Only the active pair reveals and performs; backstage stays neutral. |
| Voting | Up to 10 s per duel | Eligible audience members vote A or B. All required votes can end this phase early. |
| Duel result | 6 s per duel | Display the winner and vote totals. |
| Final results | 15 s | Show Top 3 and the local player's earned Style Points. |
| Return | 3 s | Continue automatically to the next lobby. |

Maximum nominal cycle: 244 seconds. Timings are deliberately unchanged for this delivery. READY does not shorten preparation. The wardrobe closes at the last second; the last accepted look remains locked for the round. The installed Game Design skill recommends a core loop below 60 seconds; this round does not meet that recommendation. Timing evaluation is deferred, not presented as resolved.

## Participants and social interaction

A round has six contestants arranged into three distinct pairs. Each contestant competes once per round. Humans fill available slots and bots fill the remainder; excess humans rotate into subsequent rounds. Late arrivals can watch and vote when eligible without changing the current cast.

Each eligible audience member has one vote per duel. Active duelists cannot vote in their own duel. Self-votes, duplicate votes, stale requests and invalid candidates are rejected by the coordinating client's game rules. A pending and confirmed vote state provides feedback. Bots use theme tags, style preferences and bounded variation.

Presence expiry handles missing heartbeats, not inactivity: standing still does not count as AFK. No player is expelled from the scene. A disconnected contestant may remain represented by its NPC until the round ends.

## Wardrobe and saved looks

The shared free catalog contains 200 wearable URNs with bundled thumbnails. The outfit is applied to scene-owned models, not a purchase or permanent change to the visitor's wallet avatar.

Navigation uses Upper (shirts, sweaters, tops, jackets), Lower (pants, skirts, shorts), Full body (dresses, jumpsuits), Feet (sandals, heels, sneakers, boots, shoes), Hair, Accessories, Appearance and Effects. Types are inferred from catalog names. Full-body items reuse the catalog's existing upper-body slot; these are not newly authored assets.

DRESS opens the fitting view. SAVE stores an independent local snapshot and closes it. On the first opening in each later round, the saved snapshot is restored automatically. Reopening in the same round preserves edits. FREE CAMERA closes the fitting view without saving or discarding the currently equipped edits; DRESS returns to it. There is one preset, in memory for the current client session only. Reloading or changing machines does not transfer it.

The old Backpack/Back selector and location shortcut menu are outside this revised delivery scope. The corresponding legacy data may remain for compatibility.

## Reveal and camera freedom

Theme reveal and preparation keep contestant models neutral. During each runway intro, the active pair is still neutral. After the three-second countdown, only that pair reveals. Inactive contestants remain neutral during runway, voting and duel results. Final results reveal the cast.

This is visual concealment on scene models, not cryptographic secrecy. Outfit data is synchronized to clients, and visitors' own Explorer avatars outside the privacy volume are not hidden by a global rule. Remote wearable loading can affect the visible reveal timing.

The default view is the Explorer's normal player camera. WATCH STAGE opts into framing during runway, voting, duel results and final results. FREE CAMERA immediately requests release of the scene camera and restores ordinary exploration. The choice persists across phase changes locally; phase changes never teleport the visitor. Opening DRESS explicitly selects fitting-room framing; FREE CAMERA exits it. Camera selection does not affect voting eligibility, scoring or round membership, and is not a spectator-only participation opt-out.

The scene does not disable locomotion. Camera changes target scene-owned virtual cameras without moving the player's avatar.

## Rewards and reasons to repeat

Participation awards 10 SP, each duel win awards 50 SP, and the overall champion receives an additional 100 SP. Results show names, votes and duel wins for the Top 3, plus the local player's earned points. A tie is resolved by the deterministic ranking rules in the model.

Clothing remains free. Session SP can buy Superstar Pose (250), Royal Pose (400), Sparkles Effect (500) and Fashion Icon title (1,000). Purchases do not grant voting strength. Pose labels map to built-in Decentraland emotes; they are not custom animations.

The Hall stores up to 20 session wins and displays the latest champion. Today/week/session rankings are computed only from session accounts. The retention promise is another round during the current session. Persistent balances, unlocks, saved presets, global rankings and history across visits are roadmap features.

## MVP Scope

| Required system | Delivery definition |
|---|---|
| Lobby | A live entry space and automatically repeating round lobby. |
| Theme system | Shared theme title and description before preparation. |
| Six-contestant structure | Six contestants, bot filling and three unique 1v1 pairs. |
| Wardrobe | Free catalog, grouped navigation, outfit editing and one automatically restored session preset. |
| Outfit privacy and reveal | Neutral shared models until the active pair's intro ends. |
| Runway | Active pair on stage, built-in pose selection and opt-in framing. |
| Voting | One eligible vote per duel, validation and confirmation feedback. |
| Bots | Fill, dress, pose and vote without blocking the loop. |
| Results | Top 3, duel totals and local earned SP. |
| Style Points | Session rewards, balances and cosmetic purchases. |
| Repeat loop | Automatic next round without restarting the application. |
| Camera freedom | Enter/exit fitting and stage views; no automatic player relocation. |
| Mobile UI | Touch controls, safe-area layout and readable access to the core loop; physical-device validation remains outstanding. |

## Architecture and trust model

SDK7 TypeScript creates the scene with ECS entities and React-ECS UI. A pure state model controls phases, votes and rewards. CRDT Presence components carry intentions and heartbeats; an elected client advances and publishes the shared Session. The coordinator is not a trusted backend. This delivery does not claim server-authoritative anti-cheat, durable storage, an on-chain economy or progress while no clients remain.

The arena uses six parcels in a 3×2 layout. Assets include local thumbnails and original audio; wearables resolve remotely. The configured deployment target is the World `leined.eth`. Publishing requires the authorized owner's signature; pushing the repository does not deploy the World.

## Presentation and audio

The delivery arena uses a warm peach/coral/cream palette with mint and gold accents, potted palms, lounge seating, visible reflector fixtures and live phase/timer displays on the side walls. A contrasting central sign and an A/B interface panel keep theme and contestant identities readable. TVs are scene-native information displays, not video streams.

English scene controls, theme descriptions and delivery documentation. A 40-second local instrumental loop accompanies gameplay. A three-second chime signals phase changes and a short sound acknowledges voting. Background audio ducks for effects and returns afterward. Distinct victory audio and sound feedback for every clothing/save action are not part of the implemented polish.

## Explicit revisions from version 1.0

- Preparation is 90 seconds, not the suggested 60; duration tuning is deferred.
- Eight actual phases replace the ten proposed labels; intro and pose are timed portions of RUNWAY.
- Each contestant plays one duel per round, not several.
- Scene models display outfits; wallet inventory/economy is not a delivery requirement.
- One automatically restored local session preset replaces a separate restore menu.
- Back selection is removed from the delivery UI.
- Camera framing is optional and does not teleport visitors.
- Top 3 shows vote/duel totals; SP gain is local, rather than shown for every finalist.
- Client coordination replaces the proposed trusted server for this prototype. Trust limitations remain explicit.
- Retention, ranks, Hall and cosmetics are session-only. Persistent and global systems remain roadmap.
- Royal is a pose purchase, not a special entrance. Additional example effects are roadmap.

## Roadmap and evaluation gaps

Persistent progress and unlocks; trusted authoritative service; global rankings and historical Hall; special entrances and additional effects; expanded bot outfit coverage; measured asset loading and runtime budgets; mobile readability and performance; multi-device reconnection and five-human sessions; unsolicited reviewer playtests; measured return rates.

These are not completed features or guarantees of program acceptance. Current delivery evidence and its capture limitations are tracked separately in the implementation report.

## Running the prototype

```sh
git clone --branch codex/hackathon-mvp https://github.com/dlb93la/decentealand-fashion-battle.git
cd decentealand-fashion-battle
npm ci
npm test
npm run build
npm start
```

Use Node.js 22 LTS and internet access for dependencies and wearable assets. `npm start` serves port 8010 and opens Bevy Web. For mobile preview use `npm run start:mobile` and the CLI QR on the same LAN; if it selects a VPN address, substitute the computer's LAN IP. The server health route is `/about`; `/` is not the playable application.
