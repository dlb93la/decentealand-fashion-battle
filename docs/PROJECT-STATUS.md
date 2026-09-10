# Fashion Battle: standalone project

This folder contains its own Git repository, package manifest/lockfile, dependencies, source, tests, assets, metadata and CI workflow.

## Current status
- Mobile preview: port 8010 (`npm run start:mobile`).
- World destination: `leined.eth`. Publication/signing remains pending.
- Latest gameplay change: wardrobe navigation and lounge audio polish, commit `0b834ad`.
- 56 automated tests passed; SDK bundle and type checking passed before this documentation consolidation.
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
