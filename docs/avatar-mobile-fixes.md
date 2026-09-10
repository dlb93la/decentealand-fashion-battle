# Avatar/mobile compatibility fixes — 2026-09-10

User reproduction: Android loads scene but fitting-room and lobby NPCs are invisible; desktop models run in place and emotes fail.

Changes confined to Fashion Battle:
- Removed per-frame scale writes to AvatarShape entities; cached destination values avoid redundant position writes including float precision differences.
- Unused slots remove/restore AvatarShape rather than using a zero-scale skeleton.
- Replaced nonstandard dance/cool/laugh/point expression IDs with documented built-in IDs. Pose labels remain game labels (Laugh currently uses headexplode; Point uses raiseHand).
- Replay active emotes every 8 seconds with increasing timestamps; no frame-by-frame restart. Background contestants remain idle.
- Player privacy volume now covers the central floor only during THEME_REVEAL/PREPARATION. Fitting rooms, backstage and gallery are physically outside it, independent of mobile support for arbitrary NPC exclude IDs. This intentionally does not hide real players outside the central volume. Prepared mock outfits remain neutral until reveal.
- Privacy component only updates on actual phase/player changes.

Validation: 54 automated tests passed; SDK build/type checking passed. Regression coverage includes zero-scale avoidance, stationary transforms, bounded emote replay, relocation resets and NPC exclusion from privacy volume. Local preview wearable metadata resolves to public HTTPS content URLs (not localhost).

Visual follow-up: background idle confirmed in Bevy. Relocation still caused stage running, so AvatarShape entities are now replaced only on actual relocation, preserving avatar IDs, appearance and attached effects. Stage idle and turntable rotation were then observed. Fully qualified base-emote URNs are used for NPC expressions; player actions retain the native short names. Selecting Dance was observed animating the stage NPC. Android visibility and animation still require device confirmation; not every emote has been visually checked.

Android root cause is not confirmed without device logs/retest. Mobile source supports AvatarShape, but arbitrary NPC IDs are not always forwarded to avatar exclusion matching. No claim of full mobile validation. Reopen the app and the existing QR to discard the old scene/avatar state.

Official references:
- https://github.com/decentraland/docs/blob/main/creator/sdk7/interactivity/npc-avatars.md
- https://github.com/decentraland/docs/blob/main/creator/sdk7/interactivity/player-avatar.md
- https://github.com/decentraland/godot-explorer/blob/main/lib/src/scene_runner/components/avatar_shape.rs
