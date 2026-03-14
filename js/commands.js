'use strict';

const commands = {

  look() {
    const loc = world[state.location];
    if (!loc) return;
    gap();
    print('[ ' + loc.name + ' ]', loc.cyber ? 'cyber-title' : 'title-text');
    gap();
    const desc = Array.isArray(loc.description) ? loc.description.join(' ') : loc.description;
    print(desc);
    const here = (loc.items || []).filter(i => !state.inventory.includes(i));
    if (here.length) {
      gap();
      print('You can see: ' + here.map(i => items[i]?.name || i).join(', ') + '.', 'dim');
    }
    if (loc.enemies && loc.enemies.length) {
      gap();
      print('Enemies here: ' + loc.enemies.map(e => ENEMY_DEFS[e]?.name || e).join(', ') + '.', 'combat-enemy');
    }
    gap();
  },

  go(dir) {
    if (!dir) { print('Go where? Try: GO NORTH, GO SOUTH, etc.', 'error'); return; }
    const loc  = world[state.location];
    const dest = loc?.exits?.[dir.toLowerCase()];
    if (!dest) { print("You can't go that way.", 'error'); return; }

    // Random encounter on entering cyber rooms
    const destRoom = world[dest];
    if (destRoom?.cyber && destRoom?.enemies?.length && state.character) {
      if (chance(0.5)) {
        const enemyKey = destRoom.enemies[Math.floor(Math.random() * destRoom.enemies.length)];
        state.location = dest;
        state.moves++;
        updateStatus();
        gap();
        print('As you enter ' + destRoom.name + ' — you are ambushed!', 'combat-enemy');
        startCombat(enemyKey);
        return;
      }
    }
    state.location = dest;
    state.moves++;
    updateStatus();
    commands.look();
  },

  take(itemName) {
    if (!itemName) { print('Take what?', 'error'); return; }
    const loc   = world[state.location];
    const match = (loc?.items || []).find(id =>
      items[id]?.name.toLowerCase().includes(itemName.toLowerCase()) && !state.inventory.includes(id)
    );
    if (!match) { print("You don't see that here.", 'error'); return; }
    if (!items[match].takeable) { print('You decide to leave that where it is.', 'dim'); return; }
    state.inventory.push(match);
    print('You take ' + items[match].name + '.', 'success');
    commands._tryEquip(match);
    updateStatus();
  },

  takeAll() {
    const loc       = world[state.location];
    const available = (loc?.items || []).filter(id => !state.inventory.includes(id) && items[id]?.takeable);
    const skipped   = (loc?.items || []).filter(id => !state.inventory.includes(id) && items[id] && !items[id].takeable);
    if (!available.length && !skipped.length) { print('There is nothing here to take.', 'dim'); return; }
    available.forEach(id => {
      state.inventory.push(id);
      print('You take ' + items[id].name + '.', 'success');
      commands._tryEquip(id);
    });
    skipped.forEach(id => print(`You leave ${items[id].name} where it is.`, 'dim'));
    if (available.length) updateStatus();
  },

  // Internal helper — auto-equip a weapon if stat requirements met
  _tryEquip(id) {
    if (!items[id].weaponKey) return;
    const w  = WEAPONS[items[id].weaponKey];
    const ch = state.character;
    if (!ch) return;
    if (ch.stats[w.stat] >= w.req) {
      ch.equippedWeapon = items[id].weaponKey;
      print(`You equip the ${w.name}.`, 'success');
      updateHUD();
    } else {
      print(`(Requires ${w.stat.toUpperCase()} ${w.req} to equip.)`, 'dim');
    }
  },

  examine(itemName) {
    if (!itemName) { print('Examine what?', 'error'); return; }
    const all   = [...(world[state.location]?.items || []), ...state.inventory];
    const match = all.find(id => items[id]?.name.toLowerCase().includes(itemName.toLowerCase()));
    if (!match) { print("You don't see that here.", 'error'); return; }
    gap();
    print(items[match].description);
    gap();
  },

  activate(itemName) {
    if (!itemName) { print('Activate what?', 'error'); return; }
    const loc   = world[state.location];
    const match = (loc?.items || []).find(id => items[id]?.name.toLowerCase().includes(itemName.toLowerCase()));
    if (!match)               { print("You don't see that here.", 'error'); return; }
    if (!items[match].activatable) { print("You can't activate that.", 'error'); return; }
    if (match === 'access_terminal') {
      state.flags.characterCreated ? enterCyberspace() : startChargen();
    }
  },

  use(itemName) {
    if (!itemName) { print('Use what?', 'error'); return; }
    const match = state.inventory.find(id => items[id]?.name.toLowerCase().includes(itemName.toLowerCase()));
    if (!match)             { print("You aren't carrying that.", 'error'); return; }
    if (!items[match].useable) { print("You can't use that.", 'error'); return; }
    if (items[match].effect === 'heal25') {
      const ch     = state.character;
      if (!ch) { print('You feel fine.', 'dim'); return; }
      const healed = Math.min(25, ch.maxHp - ch.hp);
      ch.hp        = Math.min(ch.maxHp, ch.hp + 25);
      state.inventory = state.inventory.filter(i => i !== match);
      print(`You use ${items[match].name}. Restored ${healed} HP.`, 'combat-heal');
      updateHUD();
      updateStatus();
    }
  },

  equip(weaponName) {
    if (!weaponName) { print('Equip what?', 'error'); return; }
    const ch    = state.character;
    if (!ch)    { print('No character active.', 'error'); return; }
    const match = state.inventory.find(id =>
      items[id]?.weaponKey && WEAPONS[items[id].weaponKey]?.name.toLowerCase().includes(weaponName.toLowerCase())
    );
    if (!match) { print("You aren't carrying that weapon.", 'error'); return; }
    const w = WEAPONS[items[match].weaponKey];
    if (ch.stats[w.stat] < w.req) { print(`You need ${w.stat.toUpperCase()} ${w.req} to equip ${w.name}.`, 'error'); return; }
    ch.equippedWeapon = items[match].weaponKey;
    print(`You equip the ${w.name}.`, 'success');
    updateHUD();
  },

  inventory() {
    if (!state.inventory.length) { print("You aren't carrying anything.", 'dim'); return; }
    gap();
    print('You are carrying:');
    state.inventory.forEach(id => {
      const item      = items[id];
      const weaponNote = item?.weaponKey ? ` [${WEAPONS[item.weaponKey].dmgMin}-${WEAPONS[item.weaponKey].dmgMax} dmg]` : '';
      print('  — ' + (item?.name || id) + weaponNote, 'dim');
    });
    gap();
  },

  stats() {
    const ch = state.character;
    if (!ch) { print('No character active. Find the gateway terminal.', 'dim'); return; }
    gap();
    print(`[ ${ch.name} — ${CLASSES[ch.cls].label} ]`, 'cyber-title');
    gap();
    print(`Level: ${ch.level}  |  XP: ${ch.xp} / ${ch.xpNext}  |  Kills: ${ch.kills}`);
    print(`HP: ${ch.hp} / ${ch.maxHp}`);
    gap();
    print(`STR: ${ch.stats.str}   AGI: ${ch.stats.agi}   INT: ${ch.stats.int}   END: ${ch.stats.end}`);
    if (ch.statPoints > 0) print(`STAT POINTS AVAILABLE: ${ch.statPoints}  — type ALLOCATE [stat] to spend`, 'levelup');
    gap();
    print(`Skills: ${ch.skills.join(', ')}`);
    gap();
    if (ch.equippedWeapon) {
      const w = WEAPONS[ch.equippedWeapon];
      print(`Equipped: ${w.name} (${w.dmgMin}-${w.dmgMax} dmg, ${w.stat.toUpperCase()}-based)`, 'dim');
    }
    gap();
  },

  hp() {
    const ch = state.character;
    if (!ch) { print('No character active.', 'dim'); return; }
    gap();
    const hpClass = ch.hp < ch.maxHp * 0.3 ? 'error' : ch.hp < ch.maxHp * 0.6 ? 'loot' : 'success';
    print(`HP  ${buildHPBar(ch.hp, ch.maxHp)}  ${ch.hp} / ${ch.maxHp}`, hpClass);
    if (ch.statusEffects.length) {
      gap();
      print('Active status effects:', 'dim');
      ch.statusEffects.forEach(fx => {
        print(`  — ${fx.key}  (${fx.duration} turn${fx.duration !== 1 ? 's' : ''} remaining)`, 'combat-status');
      });
    } else {
      print('No active status effects.', 'dim');
    }
    gap();
  },

  allocate(stat) {
    const ch  = state.character;
    if (!ch)               { print('No character.', 'error'); return; }
    if (!ch.statPoints)    { print('No stat points available.', 'error'); return; }
    const key = stat?.toLowerCase();
    if (!['str', 'agi', 'int', 'end'].includes(key)) { print('Allocate to: STR, AGI, INT, or END', 'error'); return; }
    ch.stats[key]++;
    ch.statPoints--;
    if (key === 'end') { ch.maxHp += 5; ch.hp += 5; }
    print(`${key.toUpperCase()} increased to ${ch.stats[key]}.`, 'success');
    print(`New skills: ${ch.skills.join(', ')}`, 'dim');
    updateHUD();
  },

  fight(enemyName) {
    const loc = world[state.location];
    if (!loc?.enemies?.length)  { print('There is nothing to fight here.', 'dim'); return; }
    if (!state.character)       { print('You have no character. Find the gateway first.', 'error'); return; }
    let enemyKey = enemyName
      ? loc.enemies.find(e => ENEMY_DEFS[e]?.name.toLowerCase().includes(enemyName.toLowerCase()))
      : loc.enemies[0];
    if (!enemyKey) { print('No such enemy here.', 'error'); return; }
    startCombat(enemyKey);
  },

  help() {
    const inCyber = world[state.location]?.cyber;
    gap();
    print('AVAILABLE COMMANDS', 'title-text');
    gap();
    const cmds = [
      ['LOOK / L',          'describe surroundings'],
      ['GO [dir]',          'move (NORTH, SOUTH, EAST, WEST, UP, DOWN)'],
      ['TAKE [item]',       'pick up an item'],
      ['TAKE ALL',          'pick up everything in the room'],
      ['EXAMINE [item] / X','look closely at something'],
      ['ACTIVATE [item]',   'interact with an object'],
      ['USE [item]',        'use a consumable'],
      ['EQUIP [weapon]',    'equip a weapon from inventory'],
      ['INVENTORY / I',     'list carried items'],
      ['HP / HEALTH',       'check HP and status effects'],
      ['STATS',             'view character stats and skills'],
      ['ALLOCATE [stat]',   'spend level-up stat points'],
      ['CYBERWARE',         'view installed implants'],
      ['SAVE',              'save game to browser storage'],
      ['LOAD',              'load most recent save'],
      ['HELP',              'this message'],
      ['CLEAR',             'clear the screen'],
    ];
    if (inCyber) {
      cmds.push(['FIGHT [enemy]',              'engage an enemy in combat']);
      cmds.push(['ATTACK / HACK / DODGE',      'basic combat actions']);
      cmds.push(['VANISH / CRUSH / OVERLOAD',  'advanced combat skills']);
    }
    cmds.forEach(([cmd, desc]) => print('  ' + cmd.padEnd(24) + desc, 'dim'));
    gap();
  },

  cyberware() {
    const ch = state.character;
    if (!ch) { print('No character loaded.', 'error'); return; }
    gap();
    print('INSTALLED CYBERWARE', 'title-text');
    gap();
    if (!ch.cyberware.length) {
      print('No implants installed.', 'dim');
    } else {
      ch.cyberware.forEach(id => {
        const cw = CYBERWARE.find(c => c.id === id);
        const effectStr = Object.entries(cw.effect).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(', ');
        print(`  ${cw.name}`, 'chargen-opt');
        print(`  ${cw.desc}`, 'dim');
        print(`  Effect: ${effectStr}`, 'dim');
        gap();
      });
    }
  },

  save() {
    if (!state.flags.characterCreated) { print('Nothing to save yet.', 'dim'); return; }
    saveGame();
    print('Game saved.', 'success');
  },

  load() {
    if (!hasSaveData()) { print('No save data found.', 'error'); return; }
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    applyLoadedSave(data);
    updateHUD();
    updateStatus();
    gap();
    print('Save loaded.', 'success');
    gap();
    commands.look();
  },

  clear() { output.innerHTML = ''; },
};
