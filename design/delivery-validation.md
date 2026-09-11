# Delivery validation — September 11, 2026

Scope: pair-specific reveal, automatic local preset restoration, optional scene cameras, English presentation and documentation. Round timings were not changed. The physical mobile and multi-device test pass was deferred by the project owner.

## Automated validation

- `npm test`: **57 tests passed**, zero failures.
- `npm run build`: bundle generated and TypeScript checking completed without errors.
- Reveal regression covers all three pairs, the countdown boundary, neutral inactive contestants, results and unknown IDs.
- Preset regression covers independent snapshots, first opening each round, preservation of unsaved edits on reopening, membership and the preparation deadline.
- Camera regression covers free default, opt-in, exit, same-phase re-entry, fitting mode and release through phase changes; presentation must not call teleport.
- World regression verifies backstage outfits differ from the revealed active pair and remain idle.

## Real desktop evidence

Fresh unretouched PNGs are in [screenshots/delivery](screenshots/delivery/). The [manifest](screenshots/delivery/manifest.json) records timestamps and SHA-256 hashes. Viewport: 1340×912. Source: Bevy Web local preview with its Basic Controller, one controlled visitor and bot opponents. This is not phone or multiple-human evidence.

| Capture | Evidence |
|---|---|
| [Wardrobe](screenshots/delivery/02-wardrobe-red-look.png) | English clothing navigation, red shirt selected, SAVE and FREE CAMERA available. |
| [Reopened edit](screenshots/delivery/03-reopened-unsaved-green-look.png) | Green unsaved edit survives leaving/reopening in the same round after a red preset was saved. |
| [Free runway view](screenshots/delivery/04-runway-free-view.png) | Normal player view during a duel; WATCH STAGE is opt-in. |
| [Neutral intro](screenshots/delivery/07-runway-neutral-countdown.png) | Countdown 1: both active contestants and backstage models still neutral. |
| [Revealed pair](screenshots/delivery/08-active-pair-revealed.png) | Same pair after countdown: outfits revealed, backstage still neutral. |
| [Restored preset](screenshots/delivery/09-saved-red-look-restored.png) | During a later Light & Shadow round, opening DRESS restores the saved red shirt instead of the unsaved green edit. |
| [Free view restored](screenshots/delivery/10-free-camera-restored.png) | Fitting view closed and normal Explorer player camera restored. |

The camera was entered, exited and re-entered through the visible controls. Returning to the normal camera was observed. Keyboard movement was attempted, but these still images do not establish a complete locomotion test. The scene code no longer relocates the visitor or disables movement. Explorer camera blending takes a short transition; intermediate screenshots are not instantaneous final framing.

The three-second intro was sampled at approximately two screenshots per second to identify genuine before/after frames. No timers, models, votes or results were injected to produce them. Captures were held in memory before export because file writes in the project trigger preview reloads.

The previous root-level screenshots and `gameplay-preview.mp4` remain **historical pre-patch evidence**. The older video has Portuguese UI, automatic framing and early reveal; do not submit it as a recording of the corrected build. It is a silent edited screenshot montage, not a smooth recording. A fresh continuous video with captured audio was not produced in this final pass.

## Preview and publishable files

- Local server `/about` returned `healthy: true` on port 8010.
- Installed SDK `getFiles()`/`validateFilesSizes()` passed: **212 publishable files, 8,316,217 bytes**.
- Largest file: `bin/index.js`, **5,861,682 bytes**.
- Design documentation and screenshots are excluded from scene deployment by `.dclignore`.
- These are local file measurements, not runtime GPU/mobile memory or every remote wearable asset.

## Continue on another computer

```sh
git clone --branch codex/hackathon-mvp https://github.com/dlb93la/decentealand-fashion-battle.git
cd decentealand-fashion-battle
npm ci
npm test
npm run build
npm start
```

For an existing clone, use `git pull --ff-only` before editing. Use Node.js 22 LTS. The preview URL on a different computer must use that computer's server; the current localhost address is not transferable. The saved outfit exists only in the running client session and does not migrate via Git.

GitHub publication transfers source and documentation. The configured World `leined.eth` still needs an authorized deployment signature for the updated game to become publicly playable there. This pass did not sign or deploy the World, access another physical computer, or validate the deferred mobile/multiplayer matrix.


## Final adjustments — September 11, 2026

Build and TypeScript validation completed without errors; 60 automated tests passed. New coverage verifies neutral body/hair variety without outfit disclosure, local lighting restoration without geometry changes, and delayed bot ballots. The preview server reports healthy on port 8010.

Desktop preview checks: decorative wall strips removed; neutral cast visibly varied; Day/Night toggles change architectural brightness; the wardrobe leaves a separate bottom camera band; Watch Stage enters the stage view and Free Camera releases it; pose and duel-result controls remain above the camera button. Captures are in `screenshots/final-adjustments/`. The full Hall remains deferred and is marked Work in Progress in the scene and GDD. Mobile device and multi-device network testing were not repeated for this patch.
