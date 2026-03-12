'use strict';

// ═══════════════════════════════════════════════════════════════
// CLASSES
// ═══════════════════════════════════════════════════════════════

const CLASSES = {
  netrunner: {
    label: 'NETRUNNER',
    desc: 'High INT hacker. Excels at system intrusion and disabling enemies remotely.',
    base: { str: 2, agi: 3, int: 6, end: 3 },
  },
  street_samurai: {
    label: 'STREET SAMURAI',
    desc: 'High STR/AGI warrior. Deals heavy physical damage and dodges with precision.',
    base: { str: 6, agi: 4, int: 2, end: 4 },
  },
  ghost: {
    label: 'GHOST',
    desc: 'High AGI infiltrator. Vanishes in combat, strikes from the shadows.',
    base: { str: 3, agi: 6, int: 4, end: 2 },
  },
  fixer: {
    label: 'FIXER',
    desc: 'Balanced operative. Decent at everything, masters of improvisation.',
    base: { str: 4, agi: 4, int: 4, end: 4 },
  },
};

// ═══════════════════════════════════════════════════════════════
// CYBERWARE
// ═══════════════════════════════════════════════════════════════

const CYBERWARE = [
  { id: 'dermal_plating',    name: 'Dermal Plating',    cost: 2, desc: 'Subdermal armor weave. Hardens the skin against impact.',              effect: { end: 1 } },
  { id: 'reflex_boosters',   name: 'Reflex Boosters',   cost: 3, desc: 'Neural-linked muscle accelerators. You move before you think.',        effect: { agi: 2 } },
  { id: 'neural_processor',  name: 'Neural Processor',  cost: 3, desc: 'Expanded cognitive implant. Overclocks your wetware.',                 effect: { int: 2 } },
  { id: 'muscle_grafts',     name: 'Muscle Grafts',     cost: 2, desc: 'Synthetic fibers bonded to existing muscle. Raw power upgrade.',       effect: { str: 1 } },
  { id: 'pain_dampener',     name: 'Pain Dampener',     cost: 1, desc: 'Filters pain signals at the spinal cord. You feel less.',              effect: { end: 1 } },
  { id: 'optical_targeting', name: 'Optical Targeting', cost: 2, desc: 'HUD targeting overlay. Every shot is calculated.',                     effect: { agi: 1 } },
  { id: 'subdermal_plating', name: 'Subdermal Plating', cost: 4, desc: 'Heavy armor plating beneath the skin. You endure.',                   effect: { end: 2, maxHp: 10 } },
  { id: 'adrenal_booster',   name: 'Adrenal Booster',   cost: 3, desc: 'On-demand combat stimulant release. Fight harder, move faster.',      effect: { str: 1, agi: 1 } },
];

// ═══════════════════════════════════════════════════════════════
// SKILLS
// ═══════════════════════════════════════════════════════════════

function getSkills(stats, cls) {
  const skills = ['ATTACK', 'RUN'];
  if (stats.agi >= 4) skills.push('DODGE');
  if (stats.int >= 4) skills.push('HACK');
  if (stats.str >= 5) skills.push('CRUSH');
  if (stats.agi >= 6) skills.push('VANISH');
  if (stats.int >= 6) skills.push('OVERLOAD');
  if (stats.end >= 5) skills.push('FORTIFY');
  if (cls === 'netrunner'      && stats.int >= 3) skills.push('SCAN');
  if (cls === 'ghost'          && stats.agi >= 3) skills.push('BACKSTAB');
  if (cls === 'street_samurai' && stats.str >= 4) skills.push('CLEAVE');
  return [...new Set(skills)];
}

// ═══════════════════════════════════════════════════════════════
// CHARACTER FACTORY
// ═══════════════════════════════════════════════════════════════

function createCharacter(name, cls) {
  const base  = CLASSES[cls].base;
  const maxHp = 20 + base.end * 5;
  return {
    name,
    cls,
    level: 1,
    xp: 0,
    xpNext: 100,
    statPoints: 0,
    cyberPoints: 5,
    cyberware: [],
    hp: maxHp,
    maxHp,
    stats: { ...base },
    statusEffects: [],
    equippedWeapon: null,
    kills: 0,
    get skills() { return getSkills(this.stats, this.cls); },
  };
}

function xpToLevel(level) { return Math.floor(100 * Math.pow(1.5, level - 1)); }

// ═══════════════════════════════════════════════════════════════
// XP & LEVELING
// ═══════════════════════════════════════════════════════════════

function grantXP(amount) {
  const ch = state.character;
  ch.xp += amount;
  print(`+${amount} XP`, 'success');
  while (ch.xp >= ch.xpNext) {
    ch.xp    -= ch.xpNext;
    ch.level++;
    ch.xpNext     = xpToLevel(ch.level);
    ch.statPoints += 3;
    ch.maxHp      += 5 + ch.stats.end;
    ch.hp          = ch.maxHp;
    gap();
    print('▲ LEVEL UP! ▲', 'levelup');
    print(`You are now level ${ch.level}. +3 stat points available. HP fully restored.`, 'levelup');
    print('Type STATS to view and ALLOCATE [stat] to spend points.', 'dim');
    gap();
  }
  updateHUD();
}

// ═══════════════════════════════════════════════════════════════
// CHARACTER CREATION FLOW
// ═══════════════════════════════════════════════════════════════

function startChargen() {
  state.chargenStep = { step: 'name' };
  gap();
  hr('═');
  print('NEURAL LINK ESTABLISHED', 'cyber-title');
  hr('═');
  gap();
  print('Before you cross over, the system needs to build your identity.', 'chargen');
  print('This data will persist as long as you are jacked in.', 'chargen');
  gap();
  print('STEP 1 OF 3: Enter your operator handle.', 'chargen');
  print('(This is your name in cyberspace)', 'dim');
  gap();
}

function handleChargen(input) {
  const step = state.chargenStep;

  if (step.step === 'name') {
    const name = input.trim().slice(0, 20);
    if (!name) { print('A name is required.', 'error'); return; }
    step.pendingName = name;
    step.step = 'class';
    gap();
    print(`Handle confirmed: ${name}`, 'success');
    gap();
    print('STEP 2 OF 3: Choose your operative class.', 'chargen');
    gap();
    Object.entries(CLASSES).forEach(([, cls], i) => {
      print(`  [${i + 1}] ${cls.label}`, 'chargen-opt');
      print(`       ${cls.desc}`, 'dim');
      const b = cls.base;
      print(`       STR:${b.str} AGI:${b.agi} INT:${b.int} END:${b.end}`, 'dim');
      gap();
    });
    print('Type 1, 2, 3, or 4 to choose.', 'chargen');
    return;
  }

  if (step.step === 'class') {
    const n    = parseInt(input.trim());
    const keys = Object.keys(CLASSES);
    if (!n || n < 1 || n > 4) { print('Enter 1, 2, 3, or 4.', 'error'); return; }
    const clsKey = keys[n - 1];
    const cls    = CLASSES[clsKey];

    state.character = createCharacter(step.pendingName, clsKey);
    step.step = 'cyberware';

    gap();
    hr('═');
    print(`CLASS SELECTED: ${cls.label}`, 'cyber-title');
    hr('═');
    gap();
    print('STEP 3 OF 3: Install cyberware implants.', 'chargen');
    print(`You have ${state.character.cyberPoints} cyberware points to spend.`, 'chargen');
    gap();
    showCyberwareMenu();
    return;
  }

  if (step.step === 'cyberware') {
    const trimmed = input.trim().toLowerCase();
    if (trimmed === 'done' || trimmed === '0') {
      completeCybergen(step);
      return;
    }
    const n  = parseInt(trimmed);
    const ch = state.character;
    if (!n || n < 1 || n > CYBERWARE.length) {
      print(`Enter 1-${CYBERWARE.length} to install, or DONE to continue.`, 'error');
      return;
    }
    const cw = CYBERWARE[n - 1];
    if (ch.cyberware.includes(cw.id)) {
      print(`${cw.name} is already installed.`, 'error');
      return;
    }
    if (ch.cyberPoints < cw.cost) {
      print(`Not enough points. Need ${cw.cost}, have ${ch.cyberPoints}.`, 'error');
      return;
    }
    ch.cyberware.push(cw.id);
    ch.cyberPoints -= cw.cost;
    Object.entries(cw.effect).forEach(([stat, val]) => {
      if (stat === 'maxHp') { ch.maxHp += val; ch.hp += val; }
      else { ch.stats[stat] += val; }
    });
    print(`>> ${cw.name} installed.`, 'success');
    gap();
    if (ch.cyberPoints > 0) {
      print(`Points remaining: ${ch.cyberPoints}`, 'chargen');
      gap();
      showCyberwareMenu();
    } else {
      print('All points spent. Type DONE to jack in.', 'dim');
    }
    return;
  }
}

function showCyberwareMenu() {
  const ch = state.character;
  CYBERWARE.forEach((cw, i) => {
    const installed  = ch.cyberware.includes(cw.id);
    const affordable = ch.cyberPoints >= cw.cost;
    const effectStr  = Object.entries(cw.effect).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(', ');
    const tag        = installed ? ' [INSTALLED]' : (!affordable ? ' [INSUFFICIENT]' : '');
    print(`  [${i + 1}] ${cw.name} — ${cw.cost} pts${tag}`, installed ? 'success' : (affordable ? 'chargen-opt' : 'dim'));
    print(`       ${cw.desc}`, 'dim');
    print(`       Effect: ${effectStr}`, 'dim');
    gap();
  });
  print(`Points remaining: ${ch.cyberPoints} | Enter a number to install, DONE to continue.`, 'chargen');
}

function completeCybergen(step) {
  const ch = state.character;
  state.chargenStep = null;
  state.flags.characterCreated = true;

  gap();
  hr('═');
  print('IMPLANTS LOCKED IN', 'cyber-title');
  hr('═');
  gap();
  print(`Welcome, ${ch.name}. Identity matrix locked.`, 'success');
  gap();
  if (ch.cyberware.length) {
    print('Installed cyberware:', 'chargen');
    ch.cyberware.forEach(id => {
      const cw = CYBERWARE.find(c => c.id === id);
      print(`  — ${cw.name}`, 'dim');
    });
    gap();
  }
  print('Your starting skills:', 'chargen');
  ch.skills.forEach(s => print(`  — ${s}`, 'dim'));
  gap();
  print('Jacking in now...', 'system');
  setTimeout(() => enterCyberspace(), 1200);
}

// ═══════════════════════════════════════════════════════════════
// CYBERSPACE ENTRY
// ═══════════════════════════════════════════════════════════════

function enterCyberspace() {
  state.location = 'neon_alley';
  state.flags.enteredCyberspace = true;
  updateStatus();
  updateHUD();
  gap();
  hr('─');
  print('// CYBERSPACE LAYER ACTIVE //', 'cyber-title');
  hr('─');
  commands.look();
}
