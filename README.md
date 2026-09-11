# Fit Check — Decentraland Fashion Battle

**Dress. Pose. Vote. Win. Repeat.** Standalone Decentraland SDK7 fashion competition for the Friendzone mobile buildathon.

## Run

Install Git and Node.js 22 LTS (includes npm). Clone and run:

```sh
git clone https://github.com/dlb93la/fit-check-fashion-battle.git
cd fit-check-fashion-battle
npm ci
npm test
npm run build
npm start
```

Port: 8010. Only Fashion Battle is included here. No parent-project files are required.

The default branch is `codex/hackathon-mvp`; cloning checks it out automatically. To continue development on another machine, run `git pull --ff-only` before editing and commit/push your changes when finished. Run `npm ci` again when the lockfile changes. Avoid editing the same files simultaneously on two machines without first synchronizing commits.

No `.env`, private assets or credentials are needed to build and preview. Internet access is required to install dependencies and load Decentraland avatars. Publishing the scene is a separate step from cloning or publishing this repository.

## Mobile preview

```sh
npm run start:mobile
```

Open the Decentraland app once, connect the phone and computer to the same local network, then scan the CLI QR. If it selects a VPN address, substitute the computer's LAN IPv4:

```text
decentraland://open?preview=http://<COMPUTER-LAN-IP>:8010&position=0,0
```

Do not use localhost or 127.0.0.1 on the phone. Keep the preview running. To diagnose connectivity, open http://<COMPUTER-LAN-IP>:8010/about on the phone; it should return JSON.

[Official mobile preview guide](https://github.com/decentraland/docs/blob/main/creator/sdk7/building-for-mobile/preview-on-mobile.md)

## Play

1. Join the lobby; rounds start automatically. Bots fill empty places up to six contestants.
2. Read the theme and dress your show avatar during the 90-second preparation.
3. Tap DRESS for the fitting view. Browse clothing groups, garment types, larger thumbnails and explicit pages in the left panel. ROTATE LOOK rotates the preview. Main wardrobe items are free.
4. Tap READY or let the timer finish. Shared models stay neutral during preparation and the three-second duel intro. Only the active pair reveals afterward; backstage stays neutral.
5. Each pair has 20 seconds to pose while rotating, then up to 10 seconds of voting. Voting ends early when everyone eligible votes. Duelists cannot vote in their own duel.
6. Use WATCH STAGE for optional framing and FREE CAMERA to return to exploration. Opening DRESS also offers FREE CAMERA to exit. Phase changes never teleport you.
7. SAVE stores one local session look; first DRESS opening each round restores it automatically. Reopening in the same round preserves edits.
8. View results, Style Points and the champion in the Hall of Fame. The next round starts automatically.

## Catalog

200 unique wearable URNs, including clothing, hair, accessories and 18 eye variants; not 200 full costumes. Optimized thumbnails total about 0.47 MiB. All 451 distinct representation files total 58.43 MiB across body variants, fetched remotely as needed. This is neither startup download size nor RAM usage. Sources and measurements are in docs/.

## Architecture

- src/model.ts: state machine, votes, scoring and bots.
- src/network.ts: CRDT presence, elected coordinator and snapshots.
- src/data.ts and src/catalog.ts: timing, themes, inventory and rewards.
- src/world.ts and src/avatar-factory.ts: arena and NPC avatars.
- src/presentation.ts and src/ui/: touch UI and cameras.
- tests/: rules, simulated networking and rendering regressions.

The local wardrobe dresses NPC avatars; it does not grant wearable ownership. Native Backpack integration cannot forcibly save unconfirmed drafts or close the native interface. The scene-owned wardrobe handles its own timer.

## Delivery status

Read the [English GDD](design/gdd.md), [implementation report](design/implementation-status.md) and [final validation/evidence](design/delivery-validation.md). These distinguish session-only functionality from roadmap and historical captures.

The loop, bots, wardrobe, pair voting, session points, cosmetic shop and Hall of Fame are implemented. The coordinator is an elected client, not a trusted backend. Points and history persist only for the shared session.

Android avatar visibility/emotes and a complete two-device round were validated by the project owner after the fixes. See docs/avatar-mobile-fixes.md for the implementation history.

The latest polish adds an original 40-second lounge loop with effect ducking, a three-second transition chime, and a larger left-hand wardrobe. The new layout and audio still need an on-device playthrough before publication. Configure the authorized destination before running `npm run deploy` (LAND) or `npm run deploy:world` (World). World deployment is configured for `leined.eth` in scene.json and a signature from an authorized wallet. A GitHub repository does not publish a playable realm.

## Third-party content

SDK packages and base avatar wearables are provided by Decentraland. Metadata and thumbnail origins are in docs/catalog-selected.json; models load from Decentraland content servers. Third-party assets retain their respective rights. This repository grants no new license over them.

Audio: `scripts/generate-lounge-audio.py` generates the original lounge loop and transition chime without third-party samples. Music plays globally and fades down for local feedback, then returns without restarting the loop.

## Standalone development files

Instructions and SDK skills are bundled in this repository. See [project status and recovery notes](docs/PROJECT-STATUS.md). Local historical backups live in `backups/` and are excluded from Git and scene deployment. Move the entire project folder outside its parent before deleting that parent.
