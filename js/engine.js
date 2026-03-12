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
// DICE & UTILITIES
// ═══════════════════════════════════════════════════════════════

function roll(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function chance(p) { return Math.random() < p; }

function buildHPBar(hp, maxHp, width = 20) {
  const filled = Math.round((hp / maxHp) * width);
  const empty  = width - filled;
  return '[' + '█'.repeat(Math.max(0, filled)) + '░'.repeat(Math.max(0, empty)) + ']';
}
