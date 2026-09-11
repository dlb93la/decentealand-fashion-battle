<div align="center">

<img src="docs/media/fit-check-logo.png" alt="Fit Check logo" width="200" />

# FIT CHECK 👠
## Decentraland Fashion Battle

### **Dress. Pose. Vote. Win. Repeat.**

![Decentraland SDK7](https://img.shields.io/badge/Decentraland-SDK7-FF2D83?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Mobile First](https://img.shields.io/badge/Mobile-First-24754C?style=flat-square)
[![MIT License](https://img.shields.io/badge/License-MIT-FFD676?style=flat-square)](LICENSE)

**A mobile-first social fashion battle for Decentraland where players dress to a surprise theme, hit the runway, and let the audience decide who understood the assignment.**

**World:** `leined.eth` · **Built for the Friendzone Mobile Buildathon**

[**▶ Open Fit Check (web)**](https://decentraland.org/bevy-web/?realm=https%3A%2F%2Fworlds-content-server.decentraland.org%2Fworld%2Fleined.eth&position=0%2C0)

</div>

![Fit Check runway duel](docs/media/hero-runway.png)

## Fashion is already social. Fit Check makes it playable.

Virtual fashion is usually something you wear.

**Fit Check turns it into something people do together.**

Every round gives the room the same unexpected fashion prompt. Contestants have a limited time to build a look, then face each other in three 1v1 runway duels. While two players perform, everyone else becomes the audience — and the audience decides the winner.

That distinction is the heart of Fit Check:

> **The social layer is the scoring system.**

Watching is not downtime. If you are not on the runway, you can help decide what happens on it.

---

## The loop

**THEME → DRESS → RUNWAY → VOTE → RESULTS → REPEAT**

| Phase | What happens | Current timing |
|---|---|---:|
| Lobby | Players arrive; a human presence starts the loop | 10s |
| Theme Reveal | Everyone receives the same creative constraint | 4s |
| Preparation | Contestants build and save their look | 40s |
| Runway Intro | The active pair enters in neutral looks | 2s / duel |
| Pose | The active pair reveals and performs | 10s / duel |
| Voting | Eligible audience members choose A or B | up to 5s / duel |
| Duel Result | Winner and vote totals are shown | 3s / duel |
| Final Results | Top 3 and the local round reward are shown | 6s |
| Return | The experience flows automatically into the next lobby | 3s |

A complete three-duel round has a **maximum nominal cycle of 123 seconds**. Voting can end early when all eligible voters have voted.

---

## Dress for the prompt

![Fit Check wardrobe](docs/media/wardrobe.png)

The scene-owned wardrobe turns each theme into a creative constraint rather than a passive dress-up screen.

- **200 unique wearable URNs** across clothing, hair, accessories, appearance options and effects
- grouped, touch-oriented navigation with explicit pagination
- fitting view with look rotation
- one locally saved look for the current client session
- automatic saved-look restoration on the first wardrobe opening of later rounds
- scene-controlled fashion models: wardrobe choices do **not** grant wearable ownership or permanently modify a wallet avatar

The challenge is not owning the rarest item. It is answering the same theme differently from everyone else.

---

## The audience plays too

![Fit Check audience voting](docs/media/audience-voting.png)

Every contestant competes once per round in one of three 1v1 duels.

Players who are not in the active duel can judge it. Each eligible audience member gets one vote, while active duelists are blocked from voting in their own matchup. Duplicate, stale and invalid ballots are rejected by the game rules.

This is what makes the runway genuinely multiplayer:

**players create the looks, players perform the looks, and players decide which interpretation wins.**

Late arrivals can watch the current round and participate in voting when eligible without replacing the active cast.

---

## Designed to survive a quiet room

Fit Check does not require six humans before anything can happen.

A round starts when a human is present, and bots fill open contestant slots up to the six-person cast. They can dress, pose and vote, allowing a visitor to experience the complete loop during low-population periods.

Bots are a fallback for availability — **not a replacement for human social play**. Human players remain the reason each fashion battle becomes unpredictable.

---

## Results, rewards, and another reason to play

![Fit Check final results](docs/media/results.png)

Results rank the cast by duel performance and votes, then the experience automatically returns to the lobby for another theme.

The current prototype includes session-scoped Style Points, a cosmetic shop, session rankings and champion presentation. These systems are intentionally described for what they are: **prototype/session systems, not durable cross-visit progression**.

Replay value comes first from the social combinatorics:

**new theme + new outfit + new opponent + new audience = a different round.**

---

## A continuous social space

![Fit Check social session](docs/media/social-session.png)

Fit Check is a place you can enter while a round is already happening.

Visitors can arrive mid-round, move around the scene, watch the runway, vote when eligible, opt into stage framing with **WATCH STAGE**, return to normal exploration with **FREE CAMERA**, and stay for the next automatically scheduled round.

Phase changes do not teleport the visitor.

---

## Built for Friendzone

| Goal | Fit Check |
|---|---|
| **Mobile-first experience** | Touch-oriented wardrobe and voting UI, safe-area-aware layout, short decisions and automatic phase progression |
| **Social value** | Contestants perform; the audience determines duel outcomes |
| **Accessible interaction** | The core loop is visual and button-driven; text chat is not required to understand a round |
| **Low-population resilience** | Bots fill missing contestant slots so one visitor can still experience the loop |
| **Creativity** | Fashion's subjectivity becomes the competitive mechanic instead of being scored by a fixed algorithm |
| **Retention** | Themes, outfit combinations, opponents and voters change the meaning of each round |
| **Execution** | Complete repeating loop, synchronized match state, voting rules, wardrobe, bots, results and automated regression coverage |

The project owner also completed a **physical Android playtest** of the submission build. Browser-responsive testing and physical-device testing are treated as separate validation environments.

---

## Under the runway

Fit Check is a standalone **Decentraland SDK7** scene written in **TypeScript**, using ECS entities and React-ECS UI.

| Area | Implementation |
|---|---|
| Match rules | `src/model.ts` — phase state machine, pairs, ballots, scoring, bots and session rewards |
| Multiplayer | `src/network.ts` — CRDT presence, intentions, elected coordinator and shared snapshots |
| Themes & catalog | `src/data.ts`, `src/catalog.ts` |
| Wardrobe | `src/wardrobe.ts`, `src/ui/` |
| Arena & avatars | `src/world.ts`, `src/avatar-factory.ts` |
| Cameras | `src/presentation.ts` |
| Rankings | `src/rankings.ts` |
| Automated validation | `tests/` |

The coordinator is an **elected client**, not a trusted authoritative backend. Current Style Points, purchases, rankings and history are session-scoped rather than durable global progression.

That boundary is documented rather than hidden behind marketing language.

---

## Final verification

A final read-only audit of commit `8b22009f32803e58967a1169c64d47b473960480` reported:

- **61 / 61 automated tests passed**
- `npm run build` passed
- TypeScript checking completed without errors
- local preview health passed on port `8010`
- the full local browser loop was observed from lobby through theme, wardrobe, runway, voting, all three duels, results and the next round
- saved-look restoration, WATCH STAGE / FREE CAMERA and Day / Night presentation were observed
- no tracked project files were changed by that audit

Separately, the project owner performed a **physical Android playtest**. The automated browser audit did not claim to replace physical-device validation.

See [`docs/FINAL-SUBMISSION-STATUS.md`](docs/FINAL-SUBMISSION-STATUS.md) for the final scope and validation summary.

---

## Play / review

**World identifier:** `leined.eth`

**Verified direct web launch:**

[Open Fit Check](https://decentraland.org/bevy-web/?realm=https%3A%2F%2Fworlds-content-server.decentraland.org%2Fworld%2Fleined.eth&position=0%2C0)

The project is deployed on Decentraland's Worlds content infrastructure. The external ENS `leined.eth` is the World identity. An ENS `dcl.realm` text record has been configured to support bare-name realm resolution; resolver/cache propagation may not be instantaneous.

For the clearest review, allow one full round to progress from theme reveal through preparation, runway, voting and results.

---

## Run locally

### Requirements

- Git
- Node.js **22 LTS**
- npm
- internet access for dependencies and Decentraland wearable assets

```bash
git clone --branch codex/hackathon-mvp https://github.com/dlb93la/fit-check-fashion-battle.git
cd fit-check-fashion-battle
npm ci
npm test
npm run build
npm start
```

The local preview runs on port `8010`.

No `.env`, private asset bundle or credential is required to build and preview the scene.

### Mobile preview

```bash
npm run start:mobile
```

Open the Decentraland app once, keep the phone and development computer on the same local network, then scan the CLI QR code.

If the CLI selects a VPN address, replace it with the computer's LAN IPv4:

```text
decentraland://open?preview=http://<COMPUTER-LAN-IP>:8010&position=0,0
```

Do not use `localhost` or `127.0.0.1` from the phone.

---

## Project facts

- **Platform:** Decentraland SDK7
- **Runtime:** SDK 7.27.0
- **Arena:** 6 parcels in a 3×2 layout
- **Contestants per round:** 6
- **Duels per round:** 3
- **Preparation:** 40 seconds
- **Maximum nominal full round:** 123 seconds
- **Wearable catalog:** 200 unique wearable URNs
- **World:** `leined.eth`
- **Persistence:** current progression/reward systems are session-scoped

---

## Documentation

- [`design/gdd.md`](design/gdd.md) — final English Game Design Document and delivery scope
- [`docs/FINAL-SUBMISSION-STATUS.md`](docs/FINAL-SUBMISSION-STATUS.md) — final implementation/validation snapshot
- [`design/implementation-status.md`](design/implementation-status.md) — development audit/history
- [`design/delivery-validation.md`](design/delivery-validation.md) — earlier delivery evidence and validation passes
- [`docs/avatar-mobile-fixes.md`](docs/avatar-mobile-fixes.md) — avatar/mobile compatibility work
- [`GDD-TECNICO.md`](GDD-TECNICO.md) — original Portuguese design document retained for traceability

Some earlier audit documents are historical snapshots from before the final timing, Android and validation pass. **The final GDD and Final Submission Status above are the current submission references.**

---

## Scope boundaries

Fit Check is a competition prototype and deliberately documents what it does **not** claim.

- no trusted authoritative game server
- no durable global Style Point balance
- no persistent cross-visit leaderboard
- no persistent historical Hall of Fame
- no on-chain economy
- no claim that browser-responsive emulation equals physical mobile validation
- no claim that bots replace human playtesting

The goal is to make the implemented social loop easy to understand, easy to verify and honest about its current boundaries.

---

## Third-party content

Decentraland provides the SDK packages and base avatar wearables. Wearable metadata/models resolve from Decentraland content infrastructure and remain subject to their respective rights.

Fit Check's lounge audio and transition chime are generated from project scripts without third-party samples.

---

<div align="center">

## **There is no runway without an audience — and in Fit Check, the audience plays too.**

### **Dress. Pose. Vote. Win. Repeat.**

</div>
