# Fit Check — Decentraland Fashion Battle
## Game Design Document

**Version 1.3 — Final Friendzone submission scope — September 11, 2026**  
**Platform:** Decentraland SDK7  
**Target experience:** Mobile-first social play

This English edition is the current submission design reference. The original Portuguese draft remains in [`GDD-TECNICO.md`](../GDD-TECNICO.md) for traceability. Historical audit documents may describe earlier timings or validation states; this document defines the final intended and implemented submission scope.

---

## 1. Product concept

**Dress. Pose. Vote. Win. Repeat.**

Fit Check turns virtual fashion into a multiplayer social game.

Players receive a shared surprise theme, create a look, perform in a one-on-one runway duel, vote on other contestants, earn session-scoped Style Points and continue into another round.

The core idea is intentionally social:

> **The social layer is the scoring system.**

Fashion is subjective. Instead of asking an algorithm to determine the "best" outfit, Fit Check makes human judgment the mechanic. Contestants create the content, contestants perform it, and the audience determines the outcome.

The scene remains a continuous social space: visitors may arrive mid-round, walk around, watch, vote when eligible and remain for the next round without restarting the application.

Bots fill empty contestant slots so one human visitor can experience the full loop. Bots support availability; they are not a substitute for human social interaction.

---

## 2. Core loop and timing

**LOBBY → THEME → PREPARATION → 3× (INTRO → POSE → VOTE → DUEL RESULT) → RESULTS → RETURN**

| Stage | Duration | Player experience |
|---|---:|---|
| Lobby | 10s | Explore and wait for the next selection. A round requires human presence. |
| Theme Reveal | 4s | Read the shared theme and description. |
| Preparation | 40s | Open DRESS, choose clothing, SAVE a preferred look and optionally mark READY. |
| Duel Intro | 2s / duel | The active pair enters while still visually neutral. |
| Runway Pose | 10s / duel | The active pair reveals and performs. Backstage remains neutral. |
| Voting | Up to 5s / duel | Eligible audience members vote A or B; the phase may end early when required votes are complete. |
| Duel Result | 3s / duel | Winner and vote totals are displayed. |
| Final Results | 6s | Top 3 and the local player's earned Style Points are shown. |
| Return | 3s | The experience automatically continues into the next lobby. |

**Maximum nominal three-duel cycle: 123 seconds.**

READY confirms readiness but does not shorten the preparation timer. The wardrobe closes at the deadline and the last accepted look remains locked for the round.

Each individual duel sequence takes at most 20 seconds.

---

## 3. Participants and social interaction

A round has six contestant slots arranged into three distinct 1v1 pairs.

Humans fill available slots and bots fill the remainder. Excess humans rotate into later rounds. Late arrivals can observe the active round and vote when eligible without replacing the current cast.

Each eligible audience member has one vote per duel.

The active duelists cannot vote in their own duel. Self-votes, duplicate ballots, stale requests and invalid candidates are rejected by the coordinating client's game rules. Pending and confirmed vote states provide feedback.

Bots can fill, dress, pose and vote using theme tags, style preferences and bounded variation.

Presence expiry handles missing heartbeats rather than inactivity: standing still does not count as AFK, and the scene does not eject idle visitors.

---

## 4. Wardrobe and saved look

The shared free catalog contains **200 unique wearable URNs** with bundled thumbnails.

The wardrobe applies items to scene-controlled fashion models. It does not grant wearable ownership and does not permanently modify a visitor's wallet avatar.

Navigation includes:

- Upper
- Lower
- Full body
- Feet
- Hair
- Accessories
- Appearance
- Effects

DRESS opens the fitting view. SAVE stores one independent local snapshot and closes the wardrobe.

On the first DRESS opening in each later round, the saved snapshot is automatically restored. Reopening DRESS within the same round preserves current edits.

FREE CAMERA exits fitting mode without saving or discarding the currently equipped edits.

The preset exists **in memory for the current client session only**. Reloading or changing devices does not transfer it.

---

## 5. Reveal and camera freedom

Theme reveal and preparation keep contestant scene models visually neutral.

During each two-second runway intro, the active pair is also still neutral. When pose time begins, only that pair reveals its submitted looks and starts performing. Inactive contestants remain neutral through runway, voting and duel-result phases.

Final results reveal the cast.

This is visual concealment on scene-controlled models, not cryptographic secrecy.

The default view remains the Explorer's normal player camera.

- **WATCH STAGE** opts into stage framing.
- **FREE CAMERA** releases the scene camera and restores ordinary exploration.
- **DRESS** explicitly enters fitting-room framing.

Phase changes do not teleport visitors and do not disable locomotion. Camera choice does not affect scoring, voting eligibility or round membership.

---

## 6. Voting and scoring

Voting turns spectatorship into gameplay.

Eligible visitors choose contestant A or B during each duel. The coordinating game model validates ballots and settles the duel.

Current Style Point rules:

- **+10 SP** participation
- **+50 SP** duel win
- **+100 SP** overall champion bonus

Ties are resolved by deterministic model rules.

Style Points are a **session-scoped prototype reward system**, not a durable wallet balance or on-chain currency.

---

## 7. Rewards and repeat play

Session Style Points can be used for the implemented prototype cosmetic rewards:

- Superstar Pose — 250 SP
- Royal Pose — 400 SP
- Sparkles Effect — 500 SP
- Fashion Icon title — 1,000 SP

These purchases do not grant extra voting power.

The current Hall/champion presentation is a session prototype rather than a persistent historical gallery. Rankings and results do not claim durable cross-visit storage.

The primary retention loop is social variation:

**new theme + new outfit + new opponent + new audience = a different round.**

Persistent progression, global rankings, permanent Hall history and durable unlocks remain future work.

---

## 8. Mobile-first design

The core loop is intentionally visual and button-driven.

Mobile-oriented decisions include:

- large explicit DRESS / READY controls
- touch-oriented wardrobe categories and pagination
- direct A/B voting
- clear phase timers
- automatic round progression
- optional stage framing rather than forced camera control
- core gameplay that does not require text chat
- safe-area-aware UI positioning
- a low-population loop that works with one human visitor plus bots

The project owner completed a **physical Android playtest** of the submission build.

Browser-responsive testing and physical-device testing are treated as separate environments. iOS physical-device validation is not claimed.

---

## 9. Architecture and trust model

Fit Check is built with Decentraland SDK7, TypeScript, ECS and React-ECS UI.

Key responsibilities:

| Path | Responsibility |
|---|---|
| `src/model.ts` | Match phases, pairs, votes, scoring, bots and session rewards |
| `src/network.ts` | CRDT presence, intentions, elected coordinator and shared snapshots |
| `src/data.ts`, `src/catalog.ts` | Timing, themes, inventory and catalog data |
| `src/wardrobe.ts` | Wardrobe grouping/navigation |
| `src/world.ts` | Arena, scene-controlled figures and presentation entities |
| `src/avatar-factory.ts` | Outfit/avatar representation |
| `src/presentation.ts` | Optional virtual camera selection/release |
| `src/ui/` | Touch UI, wardrobe, voting, results, shop and ranking views |
| `src/rankings.ts` | Session statistics |
| `tests/` | Automated model/network/wardrobe/avatar/camera/world regressions |

The shared match uses a **client-elected coordinator**, not a trusted authoritative backend.

The prototype does not claim:

- server-authoritative anti-cheat
- durable database persistence
- an on-chain game economy
- permanent progress while no clients remain

---

## 10. World and deployment

The arena uses six parcels in a 3×2 layout.

The configured and deployed World identity is:

`leined.eth`

A direct public web launch is available at:

`https://decentraland.org/bevy-web/?realm=https%3A%2F%2Fworlds-content-server.decentraland.org%2Fworld%2Fleined.eth&position=0%2C0`

The external ENS uses a `dcl.realm` record for bare-name realm resolution. Resolver/cache propagation can be separate from the existence of the deployment itself.

GitHub publication and Decentraland World publication are separate operations.

---

## 11. Presentation and audio

The arena uses a warm peach/coral/cream fashion-lounge palette with mint and gold accents.

Live displays communicate theme, phase and timing. The central runway uses clear A/B contestant presentation and a dedicated audience voting interface.

A local instrumental loop accompanies gameplay, with transition/vote feedback and audio ducking.

Players can select local Day or Night presentation without changing shared match rules.

---

## 12. Final MVP scope

| System | Final submission scope |
|---|---|
| Lobby | Continuous entry space and repeating rounds |
| Theme | Shared prompt before preparation |
| Contestants | Six slots, bot filling and three unique 1v1 duels |
| Wardrobe | 200-URN free scene wardrobe with one session preset |
| Reveal | Neutral models until each active pair's intro ends |
| Runway | Active pair reveal and built-in pose/emote presentation |
| Voting | One eligible vote per duel with validation and feedback |
| Bots | Fill, dress, pose and vote |
| Results | Duel results, Top 3 and local SP |
| Rewards | Session SP and prototype cosmetic purchases |
| Repeat loop | Automatic next round |
| Cameras | Optional fitting/stage views with free exploration |
| Mobile | Touch-oriented UI; physical Android playtest completed |
| Hall/history | Session/prototype presentation only; durable history deferred |

---

## 13. Final validation snapshot

A final read-only audit of commit `8b22009f32803e58967a1169c64d47b473960480` reported:

- **61 planned tests, 61 passed, 0 failed, 0 skipped**
- build completed successfully
- TypeScript checking completed without errors
- local preview health passed
- a complete local browser round was observed through all three duels and the next lobby
- wardrobe, SAVE, READY, reveal, voting, results, saved-look restoration, stage/free camera and Day/Night behavior were observed
- the audit made no tracked project changes

The automated audit itself did not claim independent physical-device or cryptographically independent multi-client validation. Physical Android testing was performed separately by the project owner.

---

## 14. Known boundaries / future work

Future work includes:

- durable progress and unlocks
- trusted authoritative services where appropriate
- persistent global rankings and historical Hall
- expanded effects and presentation
- wider bot outfit coverage
- measured runtime/mobile performance budgets
- physical iOS validation
- broader independent multi-human/multi-device testing
- measured player retention

These are roadmap items, not claims about the submitted prototype.

---

## 15. Run locally

```bash
git clone --branch codex/hackathon-mvp https://github.com/dlb93la/fit-check-fashion-battle.git
cd fit-check-fashion-battle
npm ci
npm test
npm run build
npm start
```

Requirements: Git, Node.js 22 LTS, npm and internet access for dependencies and wearable assets.

For mobile preview:

```bash
npm run start:mobile
```

The local preview server runs on port `8010`.

---

## 16. Submission principle

Fit Check is not trying to make fashion objective.

It makes fashion's subjectivity the reason people need each other.

> **There is no runway without an audience — and in Fit Check, the audience plays too.**
