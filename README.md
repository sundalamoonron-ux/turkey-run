# Turkey Run — The Great Thanksgiving Escape

[![make.fun](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/c/turkey-run-game-01)
[![Rank](https://make.fun/badge/turkey-run-game-01/sundalamoonron-ux/turkey-run/rank.svg)](https://make.fun/c/turkey-run-game-01)
[![Reward](https://make.fun/badge/turkey-run-game-01/sundalamoonron-ux/turkey-run/reward.svg)](https://make.fun/c/turkey-run-game-01)

Thanksgiving is coming — and you are the main course. A top-down 2D escape
game: you are a turkey running for its life across the farmyard, through the
barn and into the kitchen, chased by a farmer who patrols, spots you, hunts
you down and corners you against the walls. Dodge the oven and the carving
knives he throws (and the ones raining from the kitchen ceiling), grab corn
for points, hide in the hay when he gets too close, and reach the forest
gate at 1,200 metres to escape.

## How to play

| Control | Action |
| --- | --- |
| WASD / arrows | Run |
| Space or click | Dash (toward the mouse when no key is held) |
| H (hold, standing still in hay) | Hide — the farmer loses your trail |
| P | Pause · M mute · R restart |
| Enter / click | Start, run again |

The farmer has moods: he patrols his rounds, chases when he sees you,
searches where he last saw you when you break line of sight, and runs
faster when you are cornered. Haystacks block his sight. Three lives; a
knife or the oven costs one, the farmer's grab costs one. Corn is +10, a
golden feather +50, a near-miss +5, escaping is +250.

## Play it

```sh
python3 -m http.server 8080 --directory game   # then open http://localhost:8080
```

No build step, no network, no libraries: plain static files under `game/`,
all art drawn on canvas, all sound synthesized with the Web Audio API.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to `/output` and writes
`/output/dossier.json` with the vendored make.fun library.

## Layout

- `game/index.html` — the page and the canvas
- `game/src/main.js` — boot, loop, screens, scoring
- `game/src/config.js` — tuning constants and stage definitions
- `game/src/turkey.js` — the player: run, dash, hide, take a hit
- `game/src/farmer.js` — the hunter: patrol, chase, search, corner
- `game/src/world.js` — stages, ovens, knives, corn, haystacks, gate
- `game/src/render.js` — backdrops, props, HUD, banners
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — synthesized gobbles, stings and music
- `game/src/shots.js` — deterministic scenes for screenshots
