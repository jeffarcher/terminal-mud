'use strict';

// ═══════════════════════════════════════════════════════════════
// PARSER
// ═══════════════════════════════════════════════════════════════

function parse(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return;

  // Character creation intercept
  if (state.chargenStep) { handleChargen(trimmed); return; }

  // Combat intercept
  if (state.combat) {
    const verb = trimmed.toUpperCase().split(' ')[0];
    const combatSkills = ['ATTACK','DODGE','HACK','CRUSH','VANISH','OVERLOAD',
                          'FORTIFY','SCAN','BACKSTAB','CLEAVE','RUN'];
    if (combatSkills.includes(verb)) { processCombatTurn(verb); return; }
    if (verb === 'STATS') { commands.stats(); return; }
    if (verb === 'HP' || verb === 'HEALTH') { commands.hp(); return; }
    if (verb === 'USE')   { commands.use(trimmed.slice(4).trim()); return; }
    print('You are in combat! Available actions: ' + state.character.skills.join(', '), 'error');
    return;
  }

  const parts = trimmed.toLowerCase().split(/\s+/);
  const verb  = parts[0];
  const rest  = parts.slice(1).join(' ');

  const aliases = {
    // Movement
    n: () => commands.go('north'),   north: () => commands.go('north'),
    s: () => commands.go('south'),   south: () => commands.go('south'),
    e: () => commands.go('east'),    east:  () => commands.go('east'),
    w: () => commands.go('west'),    west:  () => commands.go('west'),
    u: () => commands.go('up'),      up:    () => commands.go('up'),
    d: () => commands.go('down'),    down:  () => commands.go('down'),
    go: () => commands.go(rest),
    // Look
    l: () => commands.look(),  look: () => commands.look(),
    // Take
    take:     () => commands.take(rest),
    get:      () => commands.take(rest),
    pick:     () => commands.take(rest),
    'take all': () => commands.takeAll(),
    'get all':  () => commands.takeAll(),
    'grab all': () => commands.takeAll(),
    takeall:    () => commands.takeAll(),
    getall:     () => commands.takeAll(),
    // Examine
    examine: () => commands.examine(rest),
    x:       () => commands.examine(rest),
    read:    () => commands.examine(rest),
    inspect: () => commands.examine(rest),
    // Interact
    activate: () => commands.activate(rest),
    use:      () => commands.use(rest),
    equip:    () => commands.equip(rest),
    // Character
    i:         () => commands.inventory(),
    inventory: () => commands.inventory(),
    inv:       () => commands.inventory(),
    stats:     () => commands.stats(),
    stat:      () => commands.stats(),
    hp:        () => commands.hp(),
    health:    () => commands.hp(),
    allocate:  () => commands.allocate(rest),
    alloc:     () => commands.allocate(rest),
    cyberware: () => commands.cyberware(),
    implants:  () => commands.cyberware(),
    // Combat
    fight:  () => commands.fight(rest),
    attack: () => commands.fight(rest),
    kill:   () => commands.fight(rest),
    // Misc
    help:  () => commands.help(),
    '?':   () => commands.help(),
    clear: () => commands.clear(),
    cls:   () => commands.clear(),
  };

  if (aliases[verb]) {
    aliases[verb]();
  } else if (verb) {
    print('Command not recognized. Type HELP for commands.', 'error');
  }
}

// ═══════════════════════════════════════════════════════════════
// INPUT HANDLING
// ═══════════════════════════════════════════════════════════════

const history    = [];
let   historyIdx = -1;

const inputMirror = document.getElementById('input-mirror');

function syncInputWidth() {
  inputMirror.textContent = inputEl.value || '';
  inputEl.style.width = Math.max(2, inputMirror.offsetWidth) + 'px';
}

inputEl.addEventListener('input',  syncInputWidth);
inputEl.addEventListener('keyup',  syncInputWidth);
syncInputWidth();

inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const val = inputEl.value.trim();
    if (!val) return;
    history.unshift(val);
    historyIdx = -1;
    print(val, 'input-echo');
    inputEl.value = '';
    syncInputWidth();
    parse(val);
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (historyIdx < history.length - 1) {
      historyIdx++;
      inputEl.value = history[historyIdx];
      syncInputWidth();
    }
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (historyIdx > 0) { historyIdx--; inputEl.value = history[historyIdx]; }
    else { historyIdx = -1; inputEl.value = ''; }
    syncInputWidth();
  }
});

// Refocus input on click, but not when clicking inside the output area
document.addEventListener('click', (e) => {
  if (!output.contains(e.target)) inputEl.focus();
});

// ═══════════════════════════════════════════════════════════════
// BOOT SEQUENCE
// ═══════════════════════════════════════════════════════════════

function boot() {
  const lines = [
    { text: 'INITIALIZING...',          cls: 'system', delay: 300  },
    { text: 'LOADING WORLD DATA...',    cls: 'system', delay: 600  },
    { text: 'RENDERING ENVIRONMENT...', cls: 'system', delay: 900  },
    { text: '',                                         delay: 1100 },
    { text: '══════════════════════════════════════════', cls: 'dim', delay: 1200 },
    { text: '',                                         delay: 1250 },
    { text: 'WELCOME',                  cls: 'title-text', delay: 1400 },
    { text: '',                                         delay: 1450 },
    { text: 'You have entered a place that is part website,', delay: 1600 },
    { text: 'part world. Explore freely. Type carefully.',    delay: 1700 },
    { text: '',                                         delay: 1800 },
    { text: '══════════════════════════════════════════', cls: 'dim', delay: 1900 },
  ];
  lines.forEach(({ text, cls, delay }) => setTimeout(() => print(text, cls || ''), delay));
  setTimeout(() => {
    commands.look();
    updateStatus();
    inputEl.focus();
  }, 2200);
}

boot();

// HP regeneration — 1 HP every 8 seconds when out of combat
setInterval(() => {
  const ch = state.character;
  if (!ch || state.combat || ch.hp >= ch.maxHp) return;
  ch.hp = Math.min(ch.hp + 1, ch.maxHp);
  updateHUD();
}, 8000);
