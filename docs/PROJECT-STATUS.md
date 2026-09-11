# Fashion Battle: standalone project

This folder contains its own Git repository, package manifest/lockfile, dependencies, source, tests, assets, metadata and CI workflow.

## Current status
- Mobile preview: port 8010 (`npm run start:mobile`).
- World destination: `leined.eth`. Publication/signing remains pending.
- Current migration branch: `codex/authoritative-fashion-battle`; prior standard-SDK fixes remain on `codex/gdd-alignment-fixes`. Per-duel reveal, 60-second preparation with early readiness, session preset restore, Back accessories, participant count and finalist SP are connected. UI has compact wardrobe selectors and a 16 px numeric text minimum.
- 63 automated tests passed after the migration; SDK bundle and type checking passed. No visual/mobile validation is claimed for this branch.
- Server-owned voting/rewards, private snapshots, heartbeat readiness and durable checkpoints are implemented with the pinned auth-server SDK. Local headless preview on 8011 reached its first tick; production persistence, cold starts and multiplayer remain unverified. No scene deployment was performed.
- The latest wardrobe layout, camera framing and audio still need owner validation on a phone.

## Preserved development material
- `AGENTS.md`, `CLAUDE.md`: standalone instructions.
- `.agents/skills/`, `skills-lock.json`: local official SDK skill references, copied with hash verification from the parent project. No parent-folder junctions are needed.
- `.cursor/`, `.vscode/`, `cursor.config`, `cursorignore`: editor guidance/settings.
- Existing handoffs, GDDs, implementation notes and `docs/qa/` remain in this folder. Historical reports can contain outdated paths/status.
- `backups/parent-AGENTS-original.md`: original parent instructions.
- `backups/fashion-before-consolidation.bundle`: Git recovery snapshot before consolidation.
- `backups/fashion-working-notes.zip`: local historical notes and QA snapshots, including previously Git-ignored documents.

## Outside this folder
The parent Ludoria scene and `.ludoria-backup`/`.template-backup` are unrelated to this standalone game and were not imported.

Before deleting the parent directory, move this ENTIRE folder outside it (including hidden `.git` and `.agents` folders), then open the new folder as the project. Deleting an ancestor also deletes every child folder. Stop/restart preview after relocating; its QR requires the local preview server to remain running.
