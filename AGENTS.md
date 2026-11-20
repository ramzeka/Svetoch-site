# Svetoch patch journal

## Sources and builds

- Edit one file per version in data/patches. Set a unique ID and timeline order, the Russian title and date, and the exact game commit. Include the release tag for released previews. Label changes after the latest release separately.
- Verify numbers and behaviors against the game revision for that patch and the preceding revision when reporting a change. Record only behavior that reached the game. Use the names and units from that revision.
- When a historical name occurs in both a summary and an entity entry, check both rendered occurrences against the display name in the patch's game revision.
- Run node tools/build-patches.mjs from the repository root. Commit the resulting dist/changes.html with the corresponding data. Run node tools/build-patches.mjs --check to verify that the generated page and required media match the checked-in sources.
- The hosting configuration publishes dist. Keep these rules, patch data, and building tools at the repository root or in their source directories.

## Writing a patch

- Use one change per list entry. Group ability changes under the ability name. Put character-wide movement, art, and effects in their character section.
- For a new hero or enemy, record verified starting stats, behavior, and new animations. For an existing entity, report only changes. Use values and units in the form “18 → 12” for changes.
- List items by their in-game names. Mark new, changed, and removed items explicitly. A removal contains the name and status. Earlier notes keep the old stats.
- Keep existing version and entity anchors when editing historical entries. Use a shared note and link when a change or demonstration belongs to more than one entity.
- Keep the text visible. Keep the patch heading and descriptions in Russian.

## Media and review

- Use game art and playback from the matching revision. Record each asset's game commit. Place general gameplay under “Геймплей” and focused demonstrations alongside the related character or change.
- When a patch calls for a source sprite, use the frame from that revision's atlas for the portrait. For code-drawn prototype actors, identify the source drawing. Label gameplay captures separately. Before batching, compare one portrait with its source and check the pivot across the demonstrated poses.
- Supply a still for an animated asset and check the reduced-motion presentation. Include only media referenced by the patch or its surrounding page. Store captures, logs, source checkouts, and local paths outside the website repository.
- Open the generated page at desktop and mobile widths. Check the changed version, direct anchors, playable media, and one adjacent version. Check the navigation with reduced motion when changing the media or layout.
- Review the generated output and staged files before opening a PR. Keep publication through a PR into main.
