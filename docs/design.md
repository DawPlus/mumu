## Current revision — 30-second supermarket rampage

User explicitly approved switching to the mischievous turtle supermarket concept. This replaces driving/parking entirely. Relative drag joystick moves a turtle in a small isometric shop; release stops; keyboard arrows/WASD also work. Small cans break immediately; accumulating mass unlocks boxes at 40, shelves at 130, fridges at 270. Consecutive destruction within 1.5s earns up to 4x points. Objects visibly tumble, the turtle grows, and the round ends after 30 active seconds. Results show score and destruction count with one-button replay and local best score. Cartoon/3D share the same simulation. Pause/help/visibility and first 3D loading suspend time; controls reset when leaving play. No additional production dependencies. Previous design/verification below is historical.

## Current revision — continuous fast braking

User changed the core loop to fast automatic driving, precise stopping, endless repetition, no stages. Difficulty is derived from accumulated successful stops: speed rises from 4 toward 6.6m/s, bay shrinks from 4.4 toward 2.8m; car length 2.4m, braking 4.5m/s². Bounds preserve a reachable stopping point. One tap brakes; stopping early also fails. Existing double-tap boost remains. Wins automatically continue after 0.7s; failures retry the same difficulty after 1s. Pause/help/hidden page suspend simulation and transition. No stage chooser, stars or blocking result screen. Roadside supporters and both render modes remain. Best cumulative successes use a new storage key; old stage records are left untouched. Earlier notes below are historical.

## Current revision — roadside supporters

The user replaced all pedestrian obstacles with supporters. Potato and pumpkin stay on sidewalks in every stage, wave while driving and bounce on success. No crossings, collisions, automatic stops, hit penalties or boost knockback. The car controls and five parking challenges remain. Stars depend only on parking accuracy. A 900ms victory beat shows cheering before the result dialog. Earlier notes below are historical.

# 거북아, 주차해! — playable first version

Agreed: portrait mobile web, fixed diagonal camera, cartoon/3D toggle; automatic reverse, tap to brake gradually, tap at rest to resume, rapid double tap to boost and knock residents away. A later tap brakes the boost. Whole car inside bay at rest wins. Five stages; retry the failed stage. Sweet potato child and pumpkin grandma provide predictable interruptions. No graphic injury.

Implementation choice: Vite + TypeScript; Canvas 2D hand-drawn-style view and Three.js toy view share one deterministic simulation. No Expo/native APIs, backend, accounts, or external asset dependence. User explicitly requested implementation here, then iteration through play.

Input ruling: first tap brakes immediately; second within 260ms boosts; further taps during a 300ms boost grace period do not cancel it; the next tap after grace brakes. Stop outside bay allows resuming. Overrunning far boundary fails. Ordinary collision stops the car and costs one star, residents cross and player may resume. Boost collision sends residents tumbling away.

Plan:

- [x] Physics/input tests: gradual braking, boost/rescue, full containment, stage bounds, predictable pedestrians, collision, frame-rate stability.
- [x] Shared simulation + five stages.
- [x] Two original renderers + mobile UI, tutorial, sound toggle, pause, stage replay and local best stars.
- [x] Lint/typecheck/tests/build; browser check mobile and desktop, both modes and winning/retry flows.

Visual: warm paper, forest-green ink, tomato car, mint turtle; thick imperfect outlines in cartoon, rounded toy forms in 3D. The game world is the main content, not a landing page or dashboard. Match supplied illustration direction instead of unrelated dashboard styles. Fixed readable camera with open car cabin so turtle stays visible.

## Verification and review

- npm test: 15/15 passed, including all five solvable stages, overshot stops, bump-then-boost and wall-clock touch timing.
- npm run lint, npm run typecheck, npm run build: passed.
- Browser: 390×844 cartoon and 3D inspected; 1440×1000 desktop inspected. First-stage 3-star win through actual UI.
- Browser smoke checks in tests/browser.smoke.ts: first 3D load + concurrent help/resume; win/help/chooser/next-stage; touch boost/brake/stop/pause/resume. All passed after reproducing failures.
- Review fixed four findings: auxiliary dialogs losing results; asynchronous loading overwriting pause; overshot stops without loss; previously bumped residents immune to boost.
- Browser checks additionally found and fixed simulation-clock tap timing under slow rendering and stage-selector handlers accidentally binding the gameplay surface.
- No physical iPhone/Android run or external deployment. Dev-only picomatch advisory remains with no patched version available from the registry; production dependency audit reports zero. Three.js lazy chunk is 134 kB gzip; build emits the >500 kB uncompressed chunk advisory.
- Visual critique: clear one-screen mobile play, hand-drawn and toy views share original characters. Cartoon is simplified code illustration; finer character art and physical-device performance are next iteration work.

## Full browser play-through follow-up

User requested running the game and testing while away. Server confirmed listening on port 5173. Through UI controls (no game-state injection), all five stages won in cartoon and all five won in 3D. Verified failure, same-stage retry, Space brake, touch double-tap boost, braking the boost, pause/resume. Browser console empty. At 320×640 there is no horizontal overflow and the brake button bottom is 590px (inside the viewport). Unit suite 15/15, lint, typecheck and production build passed again. Fixed the test driver to distinguish initial acceleration from a stopped car instead of relying on a rounded 0 km/h label. No product code change needed in this follow-up. Physical-device Safari/Android testing remains outstanding.

## Continuous-loop verification

11 unit tests passed, including solvability at 0/1/5/10/30/100/1000 clears, monotonic bounded difficulty, early-stop failure, retry, supporters and wall-clock input. Lint, typecheck and build passed. Orca's embedded page reported document.hidden and suspended animations, so the final interactive tests ran in an isolated headless Chrome via a temporary Playwright install outside the repository. Both cartoon and 3D completed seven consecutive stops using UI input without state injection; speed rose and bay narrowed each run. Verified automatic retry, paused transitions, boost/brake, 3D-loading help pause, persistent best count after reload, 320px viewport controls and no page errors. Inspected both 390px screenshots. No physical phone test or deployment.

## Supermarket verification

11 unit tests, lint, typecheck and production build passed. A fresh reviewer found a slow-frame clock bug and needless rendering while paused; both fixed. Countdown subtracts actual active elapsed time while physics work stays bounded; a 5fps regression proves the round still ends at 30 seconds. Browser instrumentation verified that pause stops canvas drawing and resume restores it. Isolated headless Chrome mobile tests completed full 30-second rounds in both modes using drag events: 91 objects destroyed, maximum growth reached, scores 8480/8230. Verified release stops, help/3D loading pauses time, replay resets, best persists after reload, 320px horizontal fit, and no page errors. Final 390px cartoon/3D screenshots inspected. No physical phone test or deployment. Physics is deliberately lightweight tumble animation rather than a rigid-body engine.
