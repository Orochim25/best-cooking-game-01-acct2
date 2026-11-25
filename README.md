# Sushi Rush — Omakase Bar

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/Orochim25/best-cooking-game-01-acct2/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/Orochim25/best-cooking-game-01-acct2/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A complete 2D cooking game for the make.fun **best-cooking-game-20261125-0137** bounty: run a conveyor-belt sushi bar. Cook rice, slice fish, roll maki, plate nigiri and serve every ticket before its timer runs out — three missed orders end the shift.

## Play

Open `game/index.html` in a desktop browser (or serve `game/` with any static server). No network needed.

- **WASD / arrow keys** — move the chef
- **E** (or click a station) — use the station: take ingredients, cook rice, slice fish, roll maki, plate dishes, serve
- **M** — mute the sound effects

## The kitchen

- **Ingredient bins** — rice, salmon, tuna, shrimp, nori, avocado, cucumber, tamago
- **Rice cooker** — rice takes 4s to cook and stays fresh for 10s
- **Cutting board** — slice salmon, tuna or shrimp in 3s
- **Rolling mat** — rice + nori + filling, rolled into maki
- **Plating** — build nigiri (rice + sliced fish) or plate a finished roll
- **Serve window** — hand the plate to the customer

Seven recipes, a 150-second shift, score + time bonus + combo. All art is drawn in canvas and all sounds are synthesized with WebAudio — no external assets.

## Entry

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with `buildDossier` from `vendor/makefun-game.ts`.
