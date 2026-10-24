# Surface brief — The Development History Graph Panel (`extension/`)

- Scope: M1 checkpoint graph panel — a webview view in the VS Code secondary side bar. Visitor mode: Operate.
- Audience and job: a solo developer mid-flow reads the checkpoint file as the map of where they have been — where am I, what else was tried, how to switch without fear.
- Action and proof: clicking a station switches the workspace to that checkpoint; success = the 15-minute branching scenario runs start-to-finish from the panel alone. Content: the workspace's real checkpoints (origin + manual now; AI types later). States: empty, loading, error, ready, switching; tens of nodes.
- Chosen direction and memorable moment: The Interchange Sheet — transit wayfinding x orienteering; the course thread redraws whole on every switch, so the ride is visible and abandoned legs persist as ghosts.
- Constraints: VS Code theme owns shell and standard controls; day map / night race follow the theme; keyboard reachable; high-contrast safe; plain TypeScript + inline SVG (no framework). Do not invent: restore semantics (exact state restore; ignored files survive), delete semantics (children reattach), checkpoint vocabulary.
- Unresolved: the inversion moment (default on, reduced-motion safe), condensed type via system stack first (bundle a face only if the finish review demands it).

## Direction contract

- THESIS: The development history read as a transit sheet with an orienteering course over it — every branch a routed line, the path you actually rode drawn as one purple thread; it refuses the category's dot-and-hairline git graph.
- OWN-WORLD: Theme-derived ground (paper on light, night on dark); ink structure routed at 45°; course purple owns the ridden path; blue carries alternate branches; condensed-caps station labels with type micro-tags; numbered control rings; ghost dashes for abandoned legs; the active station floods with the course color, strong ring kept.
- STORY: The developer sees where they are, what else was tried, and clicks a station to switch; abandoned ideas stay as ghosts so nothing feels lost; every switch lands complete in one frame.
- FIRST VIEWPORT: The sheet — header strip (CHECKPOINT FILE, count, rendition note), then the routed column: main line down the left with stations, the 45-degree branch peeling right, the purple course riding the ridden path with numbered control rings, the active station flooded with the course color; footer legend (course / ghost / branch) and time-first reading. The signature move — the course thread redrawing whole on each switch — lives on the column.
- FORM: The Interchange Sheet — candidate 4 of the re-roll's grounded hand (transit wayfinding x orienteering, network-led); seed:80703b4f4a3833dc.
- FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
