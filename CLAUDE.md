# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

This is a static, no-build browser game. Open `index.html` directly in a browser — no server, bundler, or install step required.

## Architecture

Pure vanilla JS split across 6 files loaded in dependency order (defined in `index.html`):

1. **`world.js`** — All static data: `WEAPONS`, `items`, `ENEMY_DEFS`, and the `world` room map. Room objects define `exits`, `items`, `enemies`, `enemyRespawn`, and `cyber` (boolean flag for cyberspace rooms). Weapon item entries are auto-generated from `WEAPONS` at the bottom of this file.

2. **`engine.js`** — Global `state` object, DOM output helpers (`print`, `gap`, `hr`), status bar/HUD rendering (`updateStatus`, `updateHUD`), and dice utilities (`roll`, `chance`).

3. **`character.js`** — `CLASSES` definitions, `createCharacter()`, XP/leveling (`grantXP`), multi-step character creation flow (`startChargen` / `handleChargen`), and `enterCyberspace()`.

4. **`combat.js`** — `STATUS` effect definitions, enemy spawning, `startCombat`, `processCombatTurn`, `resolvePlayerAction`, `resolveEnemyTurn`, `inflictStatus`, and `endCombat`.

5. **`commands.js`** — The `commands` object containing all player-facing actions: `look`, `go`, `take`, `takeAll`, `examine`, `activate`, `use`, `equip`, `inventory`, `stats`, `hp`, `allocate`, `fight`, `help`, `clear`.

6. **`main.js`** — `parse()` (input → command dispatch with combat/chargen intercepts), command aliases, input history (↑/↓), and the `boot()` sequence.

## Key Patterns

**State machine**: `state.chargenStep` and `state.combat` act as intercept flags in the parser. When either is set, `parse()` routes input to the relevant handler instead of the normal command aliases.

**Two-layer world**: Rooms without `cyber: true` are the "real world" (exploration only). Rooms with `cyber: true` have enemies, random encounter logic on entry (50% chance), and respawn behavior controlled per-room via `enemyRespawn`.

**Skills are derived**: `character.skills` is a getter on the character object that calls `getSkills(stats, cls)` — skills unlock dynamically as stats increase via `ALLOCATE`.

**Status effects**: Applied to both player and enemies via `inflictStatus()`. Each effect in `STATUS` has an `onTurn` callback that mutates per-turn flags (`_skipTurn`, `_dmgMult`, `_evadeAll`, etc.) which are reset at the start of each turn in `processCombatTurn`.

**Defeat checkpoint**: On player death, HP is restored to 50% and location resets to `neon_alley`.
