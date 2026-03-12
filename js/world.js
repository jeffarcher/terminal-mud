'use strict';

// ═══════════════════════════════════════════════════════════════
// WEAPONS
// ═══════════════════════════════════════════════════════════════

const WEAPONS = {
  rusty_pipe:      { name: 'rusty pipe',       dmgMin: 3,  dmgMax: 7,  stat: 'str', req: 0, desc: 'A length of corroded steel pipe. Heavy and brutal.', type: 'melee' },
  mono_blade:      { name: 'monoblade',         dmgMin: 6,  dmgMax: 14, stat: 'str', req: 4, desc: 'Monomolecular edge. Slices through armor like silk.', type: 'melee' },
  neural_spike:    { name: 'neural spike',      dmgMin: 5,  dmgMax: 12, stat: 'int', req: 4, desc: 'Fires a disruptive signal directly into enemy wetware.', type: 'hack',   statusInflict: 'HACKED' },
  flechette_gun:   { name: 'flechette pistol',  dmgMin: 4,  dmgMax: 10, stat: 'agi', req: 3, desc: 'Rapid-fire micro-dart weapon. Accurate and fast.', type: 'ranged', statusInflict: 'BLEEDING' },
  plasma_cutter:   { name: 'plasma cutter',     dmgMin: 8,  dmgMax: 18, stat: 'str', req: 5, desc: 'Industrial cutting tool repurposed for violence.', type: 'melee',  statusInflict: 'BURNING' },
  ice_breaker:     { name: 'ICE breaker',        dmgMin: 10, dmgMax: 20, stat: 'int', req: 6, desc: 'Military-grade intrusion tool. Melts enemy systems.', type: 'hack',   statusInflict: 'STUNNED' },
};

// ═══════════════════════════════════════════════════════════════
// ITEMS
// ═══════════════════════════════════════════════════════════════

const items = {
  // Original world
  note:             { name: 'a folded note',          description: 'The note reads: "Nothing here is permanent. Take what you need."', takeable: true },
  blueprint:        { name: 'a blueprint',             description: 'Technical diagrams for something ambitious. Half the lines trail off into question marks.', takeable: true },
  old_photo:        { name: 'an old photograph',       description: 'A blurry image of someone standing in front of a very early computer. You almost recognize them.', takeable: true },
  journal:          { name: 'a leather journal',       description: 'The pages are filled with small, careful handwriting. Ideas, doubts, late-night observations. It feels private.', takeable: false },
  // Gateway
  access_terminal:  { name: 'a pulsing terminal',      description: 'A neural-link access terminal. A cable port glows faint cyan. This is a portal to another layer of reality. Type ACTIVATE to jack in.', takeable: false, activatable: true },
  // Cyberspace
  scrap_weapon:     { name: 'a scrap pipe',            description: "Somebody's discarded weapon. Still has some heft to it.", takeable: true, weaponKey: 'rusty_pipe' },
  stim_pack:        { name: 'a stim pack',             description: 'Military-grade stimulant. Restores 25 HP when used.', takeable: true, useable: true, effect: 'heal25' },
  data_chip:        { name: 'a data chip',             description: "Encrypted. You're not sure what's on it, but it has value.", takeable: true },
  keyfob:           { name: 'a Corp keyfob',           description: 'An ARACHE CORP security fob. Might open something.', takeable: true },
  corrupted_log:    { name: 'a corrupted log',         description: 'Fragmented text: "...the AI was never meant to stay contained...project APEX was a mistake...we lost the kill sw—" It ends there.', takeable: true },
  network_map:      { name: 'a network map',           description: 'A partial schematic of the cyberspace grid. You can now navigate more clearly.', takeable: true },
  access_card:      { name: 'a server access card',   description: 'Tier-3 clearance. Required for the upper levels of the tower.', takeable: true },
  master_key:       { name: 'a master decryption key', description: 'The administrative override for the entire ARACHE CORP network. This is what you came for.', takeable: true },
};

// Auto-generate item entries for all weapons so they can be dropped and picked up
Object.entries(WEAPONS).forEach(([key, w]) => {
  if (!items[key]) {
    items[key] = { name: w.name, description: w.desc, takeable: true, weaponKey: key };
  }
});

// ═══════════════════════════════════════════════════════════════
// ENEMY DEFINITIONS
// ═══════════════════════════════════════════════════════════════

const ENEMY_DEFS = {
  sec_drone: {
    name: 'Security Drone', hp: 18, maxHp: 18,
    atk: [4, 9], xp: 25, loot: null,
    statusChance: 0.25, statusInflict: 'BLINDED',
    desc: 'A hovering surveillance drone repurposed for enforcement. Red laser sight tracks your movement.',
    behavior: 'aggressive',
  },
  corp_guard: {
    name: 'Corp Guard', hp: 30, maxHp: 30,
    atk: [5, 12], xp: 40, loot: 'rusty_pipe',
    statusChance: 0.2, statusInflict: 'SLOWED',
    desc: 'Augmented corporate security in full body armor. Loyal to the corp, not to reason.',
    behavior: 'aggressive',
  },
  ice_spider: {
    name: 'ICE Spider', hp: 22, maxHp: 22,
    atk: [3, 8], xp: 30, loot: null,
    statusChance: 0.4, statusInflict: 'HACKED',
    desc: 'An intrusion countermeasure construct. It moves like static and thinks in binary.',
    behavior: 'hacker',
  },
  street_gang: {
    name: 'Gang Member', hp: 25, maxHp: 25,
    atk: [6, 11], xp: 35, loot: 'flechette_gun',
    statusChance: 0.3, statusInflict: 'BLEEDING',
    desc: 'Wired on cheap stims, eyes glowing faint red. Looking for an excuse.',
    behavior: 'aggressive',
  },
  black_market_enforcer: {
    name: 'Black Market Enforcer', hp: 45, maxHp: 45,
    atk: [8, 16], xp: 70, loot: 'mono_blade',
    statusChance: 0.35, statusInflict: 'STUNNED',
    desc: 'A towering figure in a long coat. Cybernetic arms built for breaking things. Including you.',
    behavior: 'aggressive',
  },
  rogue_ai: {
    name: 'Rogue AI Fragment', hp: 35, maxHp: 35,
    atk: [7, 14], xp: 60, loot: 'neural_spike',
    statusChance: 0.5, statusInflict: 'STUNNED',
    desc: 'A shard of a broken AI rattling around in the server grid. Dangerous and desperate.',
    behavior: 'hacker',
  },
  apex_hunter: {
    name: 'APEX-7 Hunter', hp: 60, maxHp: 60,
    atk: [10, 20], xp: 100, loot: 'ice_breaker',
    statusChance: 0.4, statusInflict: 'BURNING',
    desc: 'Military-grade combat construct. It knows your name. It has been sent specifically for you.',
    behavior: 'boss',
  },
};

// ═══════════════════════════════════════════════════════════════
// WORLD — ROOMS
// ═══════════════════════════════════════════════════════════════

const world = {
  // ── Original rooms ──────────────────────────────────────────
  entrance: {
    name: 'THE ENTRANCE',
    description: [
      'You stand before a terminal. The amber glow of the screen',
      'illuminates your face in the dark.',
      '',
      'A blinking cursor awaits your command.',
      'To the NORTH, a faint hum suggests a room full of ideas.',
      'To the EAST, you see what looks like an archive.',
      'To the WEST, there is a door you have never noticed before.',
      'A faint electric hum leaks through its edges.',
    ],
    exits: { north: 'lab', east: 'archive', west: 'gateway' },
    items: ['note'],
    enemies: [],
  },
  lab: {
    name: 'THE LAB',
    description: [
      "You're in a cluttered workspace. Half-finished projects",
      'litter every surface. Code scrolls across a secondary monitor.',
      '',
      'This is where things get built.',
      '',
      'To the SOUTH lies the entrance. To the WEST, a quieter room.',
    ],
    exits: { south: 'entrance', west: 'garden' },
    items: ['blueprint'],
    enemies: [],
  },
  archive: {
    name: 'THE ARCHIVE',
    description: [
      'Shelves stretch upward into darkness, lined with folders,',
      'hard drives, and yellowing printouts.',
      '',
      'Everything ever made is here, waiting.',
      '',
      'To the WEST is the entrance.',
    ],
    exits: { west: 'entrance' },
    items: ['old_photo'],
    enemies: [],
  },
  garden: {
    name: 'THE GARDEN',
    description: [
      'An unexpected room. No screens here — just a small desk',
      'with a journal, a window that shows nothing but static,',
      'and the distant sound of rain.',
      '',
      'To the EAST is the lab. To the WEST, a door you do not',
      'remember ever seeing before. It is slightly open.',
    ],
    exits: { east: 'lab', west: 'void' },
    items: ['journal'],
    enemies: [],
  },

  void: {
    name: 'THE VOID',
    description: [
      'There is no floor here. There is no ceiling.',
      'You are standing on something that feels like ground',
      'but looks like nothing at all.',
      '',
      'The air does not move. Sound does not carry.',
      'You said something just now — you are almost certain of it.',
      '',
      'In the far distance, or perhaps directly in front of you,',
      'something shifts. It does not repeat.',
      '',
      'You have the distinct feeling that this place was here',
      'long before the rest of it was built around it.',
      '',
      'To the EAST is the way back.',
    ],
    exits: { east: 'garden' },
    items: [],
    enemies: [],
  },

  // ── Gateway ─────────────────────────────────────────────────
  gateway: {
    name: 'THE GATEWAY',
    description: [
      'The room is barely a room — just a concrete floor and',
      'a wall dominated by a massive server rack.',
      '',
      'In the center of the rack, a single terminal pulses',
      'with a cold cyan light. A cable runs into the floor',
      'and disappears.',
      '',
      'This is a threshold. You can feel it.',
      '',
      'To the EAST is the entrance.',
    ],
    exits: { east: 'entrance' },
    items: ['access_terminal'],
    enemies: [],
  },

  // ── Cyberspace rooms ─────────────────────────────────────────
  neon_alley: {
    name: 'NEON ALLEY', cyber: true,
    description: [
      'You materialize in a rain-slicked alley. Holographic',
      'advertisements bleed color into standing water.',
      'Everything smells like ozone and burned circuitry.',
      '',
      'A WANTED: DEAD OR ALIVE sign flickers with your face on it.',
      'Someone knows you are here.',
      '',
      'NORTH: The Black Market.  EAST: The Sprawl.',
      'SOUTH: The Grid Terminal.',
    ],
    exits: { north: 'black_market', east: 'the_sprawl', south: 'grid_terminal' },
    items: ['scrap_weapon'],
    enemies: ['street_gang'],
    enemyRespawn: true,
  },
  black_market: {
    name: 'THE BLACK MARKET', cyber: true,
    description: [
      'A labyrinth of stalls selling things that should not exist.',
      'Wetware, unlicensed implants, pre-collapse data cores.',
      'A vendor eyes you from behind mirrored goggles.',
      '',
      'The air is thick with the smell of solder and secrets.',
      '',
      'SOUTH: Neon Alley.  EAST: Corporate Plaza.',
    ],
    exits: { south: 'neon_alley', east: 'corp_plaza' },
    items: ['stim_pack', 'data_chip'],
    enemies: ['black_market_enforcer'],
    enemyRespawn: false,
  },
  the_sprawl: {
    name: 'THE SPRAWL', cyber: true,
    description: [
      'Endless towers of stacked housing units lean over narrow',
      'streets. Faces peer from behind broken screens.',
      'The city is alive here — barely.',
      '',
      'WEST: Neon Alley.  NORTH: Corporate Plaza.  EAST: The Undernet.',
    ],
    exits: { west: 'neon_alley', north: 'corp_plaza', east: 'undernet' },
    items: [],
    enemies: ['corp_guard', 'sec_drone'],
    enemyRespawn: true,
  },
  corp_plaza: {
    name: 'CORPORATE PLAZA', cyber: true,
    description: [
      'A sterile open space surrounded by glass towers.',
      'Security cameras track everything. The logo of ARACHE CORP',
      'rotates slowly overhead in holographic blue.',
      '',
      'You do not belong here. They know it.',
      '',
      'WEST: Black Market.  SOUTH: The Sprawl.  NORTH: Server Tower.',
    ],
    exits: { west: 'black_market', south: 'the_sprawl', north: 'server_tower' },
    items: ['keyfob'],
    enemies: ['corp_guard', 'sec_drone'],
    enemyRespawn: true,
  },
  undernet: {
    name: 'THE UNDERNET', cyber: true,
    description: [
      'Below the city grid, in uncharted data space.',
      'Broken constructs drift past like debris in still water.',
      'Something is watching from the dark of the deep stack.',
      '',
      'It feels ancient. Or just abandoned.',
      '',
      'WEST: The Sprawl.  NORTH: The Server Core.',
    ],
    exits: { west: 'the_sprawl', north: 'server_core' },
    items: ['corrupted_log'],
    enemies: ['ice_spider', 'rogue_ai'],
    enemyRespawn: true,
  },
  grid_terminal: {
    name: 'THE GRID TERMINAL', cyber: true,
    description: [
      'A junction node in the network. Banks of monitors display',
      'real-time data flows — financial transactions, surveillance',
      'feeds, comm traffic. Someone is watching everything.',
      '',
      'You could learn a great deal here, if you had time.',
      '',
      'NORTH: Neon Alley.  EAST: The Undernet.',
    ],
    exits: { north: 'neon_alley', east: 'undernet' },
    items: ['network_map'],
    enemies: ['ice_spider'],
    enemyRespawn: false,
  },
  server_tower: {
    name: 'SERVER TOWER — LOBBY', cyber: true,
    description: [
      "The ground floor of ARACHE CORP's data fortress.",
      'Humming server racks line every wall floor to ceiling.',
      'The temperature is sub-zero. Your breath fogs.',
      '',
      'SOUTH: Corporate Plaza.  UP: Server Core.',
    ],
    exits: { south: 'corp_plaza', up: 'server_core' },
    items: ['access_card'],
    enemies: ['corp_guard', 'sec_drone'],
    enemyRespawn: true,
  },
  server_core: {
    name: 'THE SERVER CORE', cyber: true,
    description: [
      'You are at the heart of it. The room pulses with data.',
      'The air crackles with barely contained processing power.',
      '',
      'At the center stands APEX-7. It turns to face you.',
      '"I have been waiting," it says.',
      '',
      'There is no exit but through it.',
      '',
      'SOUTH: Server Tower.  DOWN: The Undernet.',
    ],
    exits: { south: 'server_tower', down: 'undernet' },
    items: ['master_key'],
    enemies: ['apex_hunter'],
    enemyRespawn: false,
    isBossRoom: true,
  },
};
