'use strict';

// ═══════════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════════

const state = {
  location: 'entrance',
  inventory: [],
  flags: {
    portalActivated: false,
    characterCreated: false,
    enteredCyberspace: false,
  },
  moves: 0,
  character: null,
  combat: null,
  chargenStep: null,
  bootChoice: false,
};

// ═══════════════════════════════════════════════════════════════
// OUTPUT HELPERS
// ═══════════════════════════════════════════════════════════════

const output    = document.getElementById('output');
const inputEl   = document.getElementById('input');
const locDisplay = document.getElementById('loc-display');
const invDisplay = document.getElementById('inv-display');
const hud       = document.getElementById('hud');
const hudRow    = document.getElementById('hud-row');

function print(text = '', cls = '') {
  const line = document.createElement('div');
  line.className = 'line' + (cls ? ' ' + cls : '');
  line.textContent = text;
  output.appendChild(line);
  output.scrollTop = output.scrollHeight;
}

function printLines(lines, cls = '') { lines.forEach(l => print(l, cls)); }
function gap() { print('', 'gap'); }
function hr(char = '─', cls = 'dim') { print(char.repeat(46), cls); }

// ═══════════════════════════════════════════════════════════════
// STATUS BAR
// ═══════════════════════════════════════════════════════════════

function updateStatus() {
  locDisplay.textContent = 'LOCATION: ' + (world[state.location]?.name || state.location.toUpperCase());
  invDisplay.textContent = state.inventory.length
    ? 'CARRYING: ' + state.inventory.slice(0, 4).map(i => items[i]?.name || i).join(', ') + (state.inventory.length > 4 ? '...' : '')
    : 'INVENTORY: EMPTY';
}

// ═══════════════════════════════════════════════════════════════
// HUD
// ═══════════════════════════════════════════════════════════════

function updateHUD() {
  const ch = state.character;
  if (!ch) return;
  hud.classList.add('visible');
  const hpClass = ch.hp < ch.maxHp * 0.3 ? 'hud-hp-low' : 'hud-val';
  const weapon  = ch.equippedWeapon ? WEAPONS[ch.equippedWeapon].name : 'fists';
  const fx      = ch.statusEffects.map(e => e.key).join(' ') || '—';
  hudRow.innerHTML = `
    <span class="hud-stat"><span class="hud-label">NAME </span><span class="hud-val">${ch.name}</span></span>
    <span class="hud-stat"><span class="hud-label">LVL </span><span class="hud-val">${ch.level}</span></span>
    <span class="hud-stat"><span class="hud-label">HP </span><span class="${hpClass}">${ch.hp}/${ch.maxHp}</span></span>
    <span class="hud-stat"><span class="hud-label">XP </span><span class="hud-val">${ch.xp}/${ch.xpNext}</span></span>
    <span class="hud-stat"><span class="hud-label">STR </span><span class="hud-val">${ch.stats.str}</span></span>
    <span class="hud-stat"><span class="hud-label">AGI </span><span class="hud-val">${ch.stats.agi}</span></span>
    <span class="hud-stat"><span class="hud-label">INT </span><span class="hud-val">${ch.stats.int}</span></span>
    <span class="hud-stat"><span class="hud-label">END </span><span class="hud-val">${ch.stats.end}</span></span>
    <span class="hud-stat"><span class="hud-label">WEAPON </span><span class="hud-val">${weapon}</span></span>
    ${ch.statPoints > 0 ? `<span class="hud-stat hud-hp-low"><span class="hud-label">STAT POINTS </span><span class="hud-val">${ch.statPoints} AVAILABLE</span></span>` : ''}
    ${ch.statusEffects.length ? `<span class="hud-stat hud-status-fx"><span class="hud-label">STATUS </span>${fx}</span>` : ''}
  `;
}

// ═══════════════════════════════════════════════════════════════
// SAVE / LOAD
// ═══════════════════════════════════════════════════════════════

const SAVE_KEY = 'terminalMudSave';

function saveGame() {
  if (!state.flags.characterCreated) return;
  const ch = state.character;
  const data = {
    location: state.location,
    inventory: state.inventory,
    flags: { ...state.flags },
    moves: state.moves,
    character: ch ? {
      name:           ch.name,
      cls:            ch.cls,
      level:          ch.level,
      xp:             ch.xp,
      xpNext:         ch.xpNext,
      statPoints:     ch.statPoints,
      cyberPoints:    ch.cyberPoints,
      cyberware:      [...ch.cyberware],
      hp:             ch.hp,
      maxHp:          ch.maxHp,
      stats:          { ...ch.stats },
      statusEffects:  [],
      equippedWeapon: ch.equippedWeapon,
      kills:          ch.kills,
    } : null,
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

function hasSaveData() {
  return !!localStorage.getItem(SAVE_KEY);
}

function applyLoadedSave(data) {
  state.location    = data.location;
  state.inventory   = data.inventory;
  state.flags       = data.flags;
  state.moves       = data.moves;
  state.combat      = null;
  state.chargenStep = null;
  if (data.character) {
    const ch = data.character;
    // Re-attach the skills getter lost during JSON serialization
    Object.defineProperty(ch, 'skills', {
      get()        { return getSkills(this.stats, this.cls); },
      configurable: true,
      enumerable:   false,
    });
    state.character = ch;
  }
}

// ═══════════════════════════════════════════════════════════════
// DICE & UTILITIES
// ═══════════════════════════════════════════════════════════════

function roll(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function chance(p) { return Math.random() < p; }

function buildHPBar(hp, maxHp, width = 20) {
  const filled = Math.round((hp / maxHp) * width);
  const empty  = width - filled;
  return '[' + '█'.repeat(Math.max(0, filled)) + '░'.repeat(Math.max(0, empty)) + ']';
}
