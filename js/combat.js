'use strict';

// ═══════════════════════════════════════════════════════════════
// STATUS EFFECTS
// ═══════════════════════════════════════════════════════════════

const STATUS = {
  BLEEDING:  { label: 'BLEEDING',  duration: 3, color: 'combat-dmg',
    onTurn: (t) => { const d = 3; t.hp -= d; return `${t.name} bleeds for ${d} damage.`; } },
  BURNING:   { label: 'BURNING',   duration: 3, color: 'combat-dmg',
    onTurn: (t) => { const d = roll(2, 4); t.hp -= d; return `${t.name} burns for ${d} damage.`; } },
  STUNNED:   { label: 'STUNNED',   duration: 1, color: 'combat-status',
    onTurn: (t) => { t._skipTurn = true; return `${t.name} is stunned and cannot act.`; } },
  HACKED:    { label: 'HACKED',    duration: 2, color: 'combat-status',
    onTurn: (t) => { t._dmgMult = 1.3; return `${t.name}'s systems are compromised (+30% damage taken).`; } },
  SLOWED:    { label: 'SLOWED',    duration: 2, color: 'combat-status',
    onTurn: (t) => { t._spdPenalty = true; return `${t.name} moves sluggishly.`; } },
  BLINDED:   { label: 'BLINDED',   duration: 2, color: 'combat-status',
    onTurn: (t) => { t._missChance = 0.4; return `${t.name} is blinded — reduced accuracy.`; } },
  FORTIFIED: { label: 'FORTIFIED', duration: 3, color: 'combat-heal',
    onTurn: (t) => { t._dmgReduction = 3; return `${t.name} is fortified — absorbing 3 damage.`; } },
  VANISHED:  { label: 'VANISHED',  duration: 1, color: 'combat-status',
    onTurn: (t) => { t._evadeAll = true; return `${t.name} is hidden in shadows.`; } },
};

// ═══════════════════════════════════════════════════════════════
// ENEMY SPAWNING
// ═══════════════════════════════════════════════════════════════

function spawnEnemy(defKey) {
  const def = ENEMY_DEFS[defKey];
  return {
    ...JSON.parse(JSON.stringify(def)),
    defKey,
    statusEffects: [],
    _skipTurn: false, _dmgMult: 1, _dmgReduction: 0,
    _missChance: 0,   _evadeAll: false, _spdPenalty: false,
  };
}

// ═══════════════════════════════════════════════════════════════
// COMBAT ENTRY
// ═══════════════════════════════════════════════════════════════

function startCombat(enemyKey) {
  const enemy = spawnEnemy(enemyKey);
  state.combat = { enemy, turn: 0, fled: false };
  gap();
  hr('─', 'combat');
  print(`⚔ COMBAT INITIATED — ${enemy.name.toUpperCase()}`, 'combat');
  hr('─', 'combat');
  print(enemy.desc, 'dim');
  gap();
  printCombatHP();
  gap();
  printSkills();
  gap();
}

function printCombatHP() {
  const c  = state.combat;
  const ch = state.character;
  const hpClass = ch.hp < ch.maxHp * 0.3 ? 'combat-enemy' : 'combat';
  print(`YOU: ${ch.hp}/${ch.maxHp} HP   |   ${c.enemy.name}: ${c.enemy.hp}/${c.enemy.maxHp} HP`, hpClass);
}

function printSkills() {
  print('Skills: ' + state.character.skills.join('  '), 'dim');
}

// ═══════════════════════════════════════════════════════════════
// COMBAT TURN
// ═══════════════════════════════════════════════════════════════

function processCombatTurn(playerAction) {
  if (!state.combat) return;
  const c     = state.combat;
  const ch    = state.character;
  const enemy = c.enemy;

  // Reset per-turn flags
  ch._skipTurn = false; enemy._skipTurn = false;
  enemy._dmgMult = 1;   enemy._dmgReduction = 0;
  enemy._missChance = 0; enemy._evadeAll = false;
  ch._dmgMult = 1;      ch._dmgReduction = 0;
  ch._missChance = 0;   ch._evadeAll = false;

  // Process player status effects
  [...ch.statusEffects].forEach(fx => {
    const def = STATUS[fx.key];
    if (def) print(def.onTurn(ch), def.color);
    fx.duration--;
    if (fx.duration <= 0) {
      ch.statusEffects = ch.statusEffects.filter(f => f.key !== fx.key);
      print(`${fx.key} fades.`, 'dim');
    }
  });

  // Process enemy status effects
  [...enemy.statusEffects].forEach(fx => {
    const def = STATUS[fx.key];
    if (def) print(def.onTurn(enemy), def.color);
    fx.duration--;
    if (fx.duration <= 0) {
      enemy.statusEffects = enemy.statusEffects.filter(f => f.key !== fx.key);
    }
  });

  if (enemy.hp <= 0) { endCombat(true); return; }
  if (ch.hp    <= 0) { endCombat(false); return; }

  // Player turn
  gap();
  if (ch._skipTurn) {
    print('You are stunned and lose your turn.', 'combat-status');
  } else {
    resolvePlayerAction(playerAction);
  }

  if (enemy.hp <= 0) { endCombat(true); return; }
  if (c.fled) return;

  // Enemy turn
  if (!enemy._skipTurn) resolveEnemyTurn();

  if (ch.hp <= 0) { endCombat(false); return; }

  gap();
  printCombatHP();
  gap();
  printSkills();
  gap();
}

// ═══════════════════════════════════════════════════════════════
// PLAYER ACTION RESOLUTION
// ═══════════════════════════════════════════════════════════════

function resolvePlayerAction(action) {
  const c      = state.combat;
  const ch     = state.character;
  const enemy  = c.enemy;
  const skills = ch.skills;
  const verb   = action.toUpperCase();

  if (!skills.includes(verb)) {
    print(`You don't know how to ${verb}. Available: ${skills.join(', ')}`, 'error');
    printCombatHP();
    gap();
    printSkills();
    return;
  }

  const weapon = ch.equippedWeapon ? WEAPONS[ch.equippedWeapon] : null;

  switch (verb) {
    case 'ATTACK': {
      let dmg = weapon ? roll(weapon.dmgMin, weapon.dmgMax) + Math.floor(ch.stats[weapon.stat] * 0.5)
                       : roll(2, 5 + ch.stats.str);
      if (enemy._dmgMult !== 1) dmg = Math.floor(dmg * enemy._dmgMult);
      if (enemy._dmgReduction)  dmg = Math.max(1, dmg - enemy._dmgReduction);
      if (chance(enemy._missChance)) { print('Your attack misses!', 'dim'); break; }
      enemy.hp -= dmg;
      print(`You strike ${enemy.name} for ${dmg} damage.`, 'combat');
      if (weapon?.statusInflict && chance(0.35)) inflictStatus(enemy, weapon.statusInflict);
      break;
    }
    case 'DODGE': {
      print('You brace, ready to dodge the next strike.', 'combat');
      inflictStatus(ch, 'VANISHED');
      break;
    }
    case 'HACK': {
      const dmg = Math.floor((ch.stats.int * 2 + roll(1, 6)) * 0.6);
      enemy.hp -= dmg;
      print(`You breach ${enemy.name}'s systems for ${dmg} damage.`, 'combat');
      if (chance(0.5)) inflictStatus(enemy, 'HACKED');
      break;
    }
    case 'CRUSH': {
      const dmg = roll(8, 14) + Math.floor(ch.stats.str * 0.8);
      enemy.hp -= dmg;
      print(`You crush ${enemy.name} with brute force — ${dmg} damage!`, 'combat');
      if (chance(0.4)) inflictStatus(enemy, 'STUNNED');
      break;
    }
    case 'VANISH': {
      print('You dissolve into the shadows.', 'combat-status');
      inflictStatus(ch, 'VANISHED');
      break;
    }
    case 'OVERLOAD': {
      const dmg = roll(12, 22) + ch.stats.int;
      enemy.hp -= dmg;
      print(`SYSTEM OVERLOAD — ${enemy.name} takes ${dmg} damage and goes haywire!`, 'combat');
      inflictStatus(enemy, 'STUNNED');
      inflictStatus(enemy, 'HACKED');
      break;
    }
    case 'FORTIFY': {
      print('You steel your body against damage.', 'combat-heal');
      inflictStatus(ch, 'FORTIFIED');
      const heal = Math.floor(ch.stats.end * 1.5);
      ch.hp = Math.min(ch.maxHp, ch.hp + heal);
      print(`You recover ${heal} HP.`, 'combat-heal');
      break;
    }
    case 'SCAN': {
      print(`[SCAN RESULTS — ${enemy.name}]`, 'combat');
      print(`HP: ${enemy.hp}/${enemy.maxHp}  |  ATK: ${enemy.atk[0]}-${enemy.atk[1]}`, 'dim');
      print(`Status: ${enemy.statusEffects.map(e => e.key).join(', ') || 'none'}`, 'dim');
      print(`Weakness: ${enemy.behavior === 'hacker' ? 'HIGH — vulnerable to INT attacks' : 'STANDARD'}`, 'dim');
      break;
    }
    case 'BACKSTAB': {
      if (ch.statusEffects.find(e => e.key === 'VANISHED')) {
        const dmg = roll(10, 18) + ch.stats.agi * 2;
        enemy.hp -= dmg;
        print(`You emerge from darkness — BACKSTAB for ${dmg} damage!`, 'combat');
        ch.statusEffects = ch.statusEffects.filter(e => e.key !== 'VANISHED');
      } else {
        print('Backstab requires you to be VANISHED first.', 'error');
      }
      break;
    }
    case 'CLEAVE': {
      const dmg = roll(6, 12) + ch.stats.str;
      enemy.hp -= dmg;
      print(`Cleave — ${dmg} damage! The blow staggers ${enemy.name}.`, 'combat');
      if (chance(0.5)) inflictStatus(enemy, 'SLOWED');
      break;
    }
    case 'RUN': {
      const escapeChance = 0.3 + ch.stats.agi * 0.05;
      if (chance(escapeChance)) {
        print('You manage to disengage and flee!', 'success');
        state.combat.fled = true;
        state.combat = null;
        commands.look();
      } else {
        print('You try to run but cannot escape!', 'error');
      }
      break;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// ENEMY ACTION RESOLUTION
// ═══════════════════════════════════════════════════════════════

function resolveEnemyTurn() {
  const c     = state.combat;
  const ch    = state.character;
  const enemy = c.enemy;

  if (ch._evadeAll) {
    print(`${enemy.name} strikes — but you are hidden. Attack misses!`, 'combat');
    ch._evadeAll = false;
    return;
  }

  let dmg = roll(enemy.atk[0], enemy.atk[1]);
  if (ch._dmgMult !== 1)   dmg = Math.floor(dmg * ch._dmgMult);
  if (ch._dmgReduction)    dmg = Math.max(1, dmg - ch._dmgReduction);
  if (chance(ch._missChance)) { print(`${enemy.name} attacks but misses you.`, 'dim'); return; }

  ch.hp -= dmg;
  print(`${enemy.name} attacks for ${dmg} damage.`, 'combat-enemy');
  updateHUD();

  if (chance(enemy.statusChance)) inflictStatus(ch, enemy.statusInflict);

  if (enemy.behavior === 'boss' && chance(0.3)) {
    const extra = roll(5, 10);
    ch.hp -= extra;
    print(`${enemy.name} fires a secondary weapon for ${extra} additional damage!`, 'combat-enemy');
    updateHUD();
  }
}

// ═══════════════════════════════════════════════════════════════
// STATUS EFFECT HELPER
// ═══════════════════════════════════════════════════════════════

function inflictStatus(target, key) {
  if (!STATUS[key]) return;
  const existing = target.statusEffects.find(e => e.key === key);
  if (existing) { existing.duration = STATUS[key].duration; return; }
  target.statusEffects.push({ key, duration: STATUS[key].duration });
  const label = target === state.character ? 'You are' : `${target.name} is`;
  print(`${label} now ${key}!`, 'combat-status');
}

// ═══════════════════════════════════════════════════════════════
// COMBAT END
// ═══════════════════════════════════════════════════════════════

function endCombat(playerWon) {
  const c  = state.combat;
  const ch = state.character;
  gap();
  if (playerWon) {
    const enemy = c.enemy;
    hr('─', 'success');
    print(`${enemy.name} DEFEATED.`, 'levelup');
    hr('─', 'success');
    ch.kills++;
    grantXP(enemy.xp);
    if (enemy.loot) {
      const room = world[state.location];
      if (!room.items.includes(enemy.loot) && !state.inventory.includes(enemy.loot)) {
        room.items.push(enemy.loot);
        print(`${enemy.name} drops: ${WEAPONS[enemy.loot]?.name || items[enemy.loot]?.name || enemy.loot}`, 'loot');
      }
    }
    if (!world[state.location].enemyRespawn) {
      world[state.location].enemies = world[state.location].enemies.filter(e => e !== c.enemy.defKey);
    }
  } else {
    hr('─', 'error');
    print('YOU HAVE BEEN DEFEATED.', 'error');
    hr('─', 'error');
    print('Resetting to last checkpoint...', 'system');
    ch.hp = Math.floor(ch.maxHp * 0.5);
    ch.statusEffects = [];
    state.location = 'neon_alley';
    updateStatus();
    updateHUD();
    setTimeout(() => { gap(); commands.look(); }, 800);
  }
  state.combat = null;
  updateHUD();
  gap();
}
