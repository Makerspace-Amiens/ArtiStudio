// ArtiStudio — Main application
let workspace = null;
let simulator = null;
let currentLang = 'fr';
let currentLevel = 1;
let animating = false;
let paused = false;
let animTimer = null;
let animQueue = [];
let animIndex = 0;
const PROGRAM_COOKIE_NAME = 'artistudio_program';
const PROGRAM_COOKIE_DAYS = 30;

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  const prefix = `${name}=`;
  for (const part of document.cookie.split(';')) {
    const cookie = part.trim();
    if (cookie.startsWith(prefix)) return cookie.slice(prefix.length);
  }
  return '';
}

function getSavedProgramState() {
  const raw = getCookie(PROGRAM_COOKIE_NAME);
  if (!raw) return null;

  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch (_) {
    return null;
  }
}

function persistProgramState() {
  if (!workspace) return;

  try {
    const xml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));
    const payload = encodeURIComponent(JSON.stringify({
      level: currentLevel,
      lang: currentLang,
      xml,
    }));
    setCookie(PROGRAM_COOKIE_NAME, payload, PROGRAM_COOKIE_DAYS);
  } catch (_) {}
}

function restoreSavedPreferences() {
  const savedState = getSavedProgramState();
  if (!savedState) return;

  if ([1, 2, 3].includes(savedState.level)) currentLevel = savedState.level;
  if (savedState.lang === 'fr' || savedState.lang === 'en') currentLang = savedState.lang;
}

// ─── Toolbox ─────────────────────────────────────────────────────────────────

function getToolbox(lang, level) {
  const t = I18N[lang];

  const artibotCategory = `
    <category name="${t.cat_artibot}" colour="210">
      <block type="artibot_forward"><field name="MM">100</field></block>
      <block type="artibot_backward"><field name="MM">100</field></block>
      <block type="artibot_turn_left"><field name="DEG">90</field></block>
      <block type="artibot_turn_right"><field name="DEG">90</field></block>
      <block type="artibot_pen_up"></block>
      <block type="artibot_pen_down"></block>
    </category>`;

  const controlCategory = `
    <category name="${t.cat_control}" colour="120">
      <block type="controls_repeat_ext">
        <value name="TIMES"><block type="math_number"><field name="NUM">4</field></block></value>
      </block>
      <block type="artibot_wait"><field name="SECONDS">1</field></block>
      <block type="artibot_go_home"></block>
      <block type="artibot_clear"></block>
    </category>`;

  const logicCategory = `
    <category name="${t.cat_logic}" colour="210">
      <block type="controls_if"></block>
      <block type="logic_compare"></block>
      <block type="logic_operation"></block>
      <block type="logic_boolean"></block>
      <block type="math_number"></block>
      <block type="math_arithmetic">
        <value name="A"><block type="math_number"><field name="NUM">1</field></block></value>
        <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
      </block>
    </category>
    <category name="${t.cat_variables}" custom="VARIABLE" colour="330"></category>
    <category name="${t.cat_functions}" custom="PROCEDURE" colour="290"></category>`;

  let xml = `<xml>${artibotCategory}`;
  if (level >= 2) xml += controlCategory;
  if (level >= 3) xml += logicCategory;
  xml += `</xml>`;
  return xml;
}

// ─── Blockly init ─────────────────────────────────────────────────────────────

function applyBlocklyMessages(lang) {
  const overrides = BLOCKLY_MSG[lang] || {};
  for (const [key, val] of Object.entries(overrides)) {
    Blockly.Msg[key] = val;
  }
}


function initBlockly(lang, level) {
  let savedXml = workspace ? Blockly.Xml.workspaceToDom(workspace) : null;
  if (!savedXml) {
    const savedState = getSavedProgramState();
    if (savedState && savedState.xml) {
      try {
        savedXml = Blockly.Xml.textToDom(savedState.xml);
      } catch (_) {
        savedXml = null;
      }
    }
  }

  if (workspace) {
    workspace.dispose();
    workspace = null;
  }

  applyBlocklyMessages(lang);
  setArtiBotMsg(lang);

  const container = document.getElementById('blockly-div');
  workspace = Blockly.inject(container, {
    toolbox: getToolbox(lang, level),
    theme: Blockly.Themes.Zelos,
    grid: { spacing: 20, length: 3, colour: '#e2e8f0', snap: true },
    move: { scrollbars: true, drag: true, wheel: true },
    zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3 },
    trashcan: true,
    sounds: false,
  });

  if (savedXml) {
    try { Blockly.Xml.domToWorkspace(savedXml, workspace); } catch (_) {}
  }

  workspace.addChangeListener((event) => {
    if (event && event.isUiEvent) return;
    updatePseudoCode();
    persistProgramState();
  });
}

// ─── Command queue builder ────────────────────────────────────────────────────

function buildCommandQueue() {
  const queue = [];
  const robot = {
    forward:  (mm)  => queue.push({ cmd: 'FORWARD',     mm: Number(mm) }),
    backward: (mm)  => queue.push({ cmd: 'BACKWARD',    mm: Number(mm) }),
    turnLeft: (deg) => queue.push({ cmd: 'TURN_LEFT',   deg: Number(deg) }),
    turnRight:(deg) => queue.push({ cmd: 'TURN_RIGHT',  deg: Number(deg) }),
    penUp:    ()    => queue.push({ cmd: 'PEN_UP' }),
    penDown:  ()    => queue.push({ cmd: 'PEN_DOWN' }),
    wait:     (sec) => queue.push({ cmd: 'WAIT',        seconds: Number(sec) }),
    goHome:   ()    => queue.push({ cmd: 'HOME' }),
    clear:    ()    => queue.push({ cmd: 'CLEAR' }),
  };

  try {
    const code = Blockly.JavaScript.workspaceToCode(workspace);
    // eslint-disable-next-line no-new-func
    new Function('robot', code)(robot);
  } catch (e) {
    console.warn('ArtiBot execution error:', e);
    showError();
  }

  // Guard: cap at 10000 commands to avoid freeze
  return queue.slice(0, 10000);
}

// ─── Execution ────────────────────────────────────────────────────────────────

function getAnimDelay() {
  const v = parseInt(document.getElementById('speed-slider').value, 10);
  return Math.round(900 / Math.pow(v, 1.4));
}

function stopAnimation() {
  animating = false;
  paused = false;
  if (animTimer) { clearTimeout(animTimer); animTimer = null; }
}

function runInstant() {
  stopAnimation();
  simulator.reset();
  const queue = buildCommandQueue();
  for (const cmd of queue) simulator.executeCommand(cmd);
  simulator.render();
  updatePenStatus();
}

function runAnimated() {
  stopAnimation();
  simulator.reset();
  animQueue = buildCommandQueue();
  animIndex = 0;
  animating = true;
  paused = false;
  updateButtons();
  stepAnimation();
}

function stepAnimation() {
  if (!animating || paused) return;
  if (animIndex >= animQueue.length) {
    animating = false;
    updateButtons();
    return;
  }
  const cmd = animQueue[animIndex++];
  simulator.executeCommand(cmd);
  simulator.render();
  updatePenStatus();

  const delay = cmd.cmd === 'WAIT' ? cmd.seconds * 1000 : getAnimDelay();
  animTimer = setTimeout(stepAnimation, delay);
}

function togglePause() {
  if (!animating) return;
  paused = !paused;
  updateButtons();
  if (!paused) stepAnimation();
}

function resetAll() {
  stopAnimation();
  simulator.reset();
  updateButtons();
  updatePenStatus();
}

function recenterView() {
  simulator.recenterView();
}

// ─── UI update helpers ────────────────────────────────────────────────────────

function updateButtons() {
  const t = I18N[currentLang];
  const runBtn   = document.getElementById('run-btn');
  const pauseBtn = document.getElementById('pause-btn');

  runBtn.disabled   = animating && !paused;
  pauseBtn.disabled = !animating;
  pauseBtn.textContent = paused ? t.resume : t.pause;
}

function updatePenStatus() {
  const t = I18N[currentLang];
  const el = document.getElementById('pen-status');
  const isDown = simulator ? simulator.isPenDown : true;
  el.textContent = isDown ? t.pen_down : t.pen_up;
  el.className = isDown ? 'pen-indicator pen-down' : 'pen-indicator pen-up';
}

function updatePseudoCode() {
  if (!workspace) return;
  initPseudoGenerators(currentLang);
  const code = workspaceToPseudo(workspace);
  document.getElementById('pseudo-code').textContent = code || '';
}

function showError() {
  const el = document.getElementById('pseudo-code');
  el.textContent = I18N[currentLang].run_error;
}

function applyTranslations(lang) {
  const t = I18N[lang];
  document.getElementById('app-title').textContent   = t.title;
  document.getElementById('app-subtitle').textContent = t.subtitle;
  document.getElementById('run-btn').textContent     = t.run;
  document.getElementById('pause-btn').textContent   = t.pause;
  document.getElementById('reset-btn').textContent   = t.reset;
  document.getElementById('recenter-btn').textContent = t.recenter;
  document.getElementById('lang-btn').textContent    = t.lang_toggle;
  document.getElementById('pseudo-title').textContent = t.pseudocode_title;
  document.getElementById('speed-label').textContent = t.speed;
  document.getElementById('mode-animated').textContent = t.mode_animated;
  document.getElementById('mode-instant').textContent  = t.mode_instant;

  document.querySelectorAll('.level-btn').forEach(btn => {
    const lv = parseInt(btn.dataset.level, 10);
    btn.querySelector('.level-num').textContent   = t[`level${lv}`];
    btn.querySelector('.level-name').textContent  = t[`level${lv}_label`];
  });

  updatePenStatus();
  updateButtons();
}

// ─── Level switching ──────────────────────────────────────────────────────────

function setLevel(level) {
  currentLevel = level;
  document.querySelectorAll('.level-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.level, 10) === level);
  });
  stopAnimation();
  initBlockly(currentLang, currentLevel);
  updatePseudoCode();
}

// ─── Language switching ───────────────────────────────────────────────────────

function setLanguage(lang) {
  currentLang = lang;
  applyTranslations(lang);
  initPseudoGenerators(lang);
  initBlockly(lang, currentLevel);
  updatePseudoCode();
}

function toggleLanguage() {
  setLanguage(currentLang === 'fr' ? 'en' : 'fr');
}

// ─── Exec mode ────────────────────────────────────────────────────────────────

function getExecMode() {
  return document.getElementById('exec-mode').value;
}

// ─── Run button ───────────────────────────────────────────────────────────────

function onRun() {
  if (getExecMode() === 'instant') {
    runInstant();
  } else {
    runAnimated();
  }
}

// ─── Canvas resize ────────────────────────────────────────────────────────────

function setupCanvasResize() {
  const container = document.getElementById('canvas-container');
  const canvas    = document.getElementById('sim-canvas');

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === canvas.width && h === canvas.height) return;
    canvas.width  = w;
    canvas.height = h;
    if (simulator) simulator.render();
  }

  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

function init() {
  defineArtiBotBlocks();
  initJsGenerators();
  restoreSavedPreferences();

  const canvas = document.getElementById('sim-canvas');
  simulator = new Simulator(canvas);
  setupCanvasResize();

  // Level buttons
  document.querySelectorAll('.level-btn').forEach(btn => {
    const level = parseInt(btn.dataset.level, 10);
    btn.classList.toggle('active', level === currentLevel);
    btn.addEventListener('click', () => setLevel(level));
  });

  // Control buttons
  document.getElementById('run-btn').addEventListener('click', onRun);
  document.getElementById('pause-btn').addEventListener('click', togglePause);
  document.getElementById('reset-btn').addEventListener('click', resetAll);
  document.getElementById('recenter-btn').addEventListener('click', recenterView);
  document.getElementById('lang-btn').addEventListener('click', toggleLanguage);

  // Blockly SVG resize on window resize
  window.addEventListener('resize', () => { if (workspace) Blockly.svgResize(workspace); });

  // Init Blockly
  initBlockly(currentLang, currentLevel);
  applyTranslations(currentLang);
  updatePseudoCode();
  updatePenStatus();
}

window.addEventListener('DOMContentLoaded', init);
