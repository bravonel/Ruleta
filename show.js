/* ============================================================
   TALLER DE EXPLORACIÓN SHOW — Controlador de experiencia de escenas
   Se apoya en el estado y la lógica compartida de app.js
   (state, activeModule, drawFromBag, recordRound, playSound,
   getPrevious*Id, clearRound, render, colors, delay, ...).
   Solo actúa cuando el modo show está activo.
   ============================================================ */

const sx = {
  active: false,
  scene: "splash",
  busy: false,
  rollTimer: null,
  liveTimer: null,
  wheelTimer: null,
  wheelRotation: 0,
  awaitingWheel: false,
  physicsRAF: null,
  physicsBodies: null,
  physicsPhase: null,
  physicsWinner: null,
  flickerTimer: null,
  phaseTimer: null,
  settleTimer: null,
  exitTimer: null,
  finalTimer: null,
  bulbEls: null,
  bulbChaseTimer: null,
  bulbFlashTimer: null
};

const sxEls = {};

function sxInit() {
  const root = document.getElementById("sxRoot");
  if (!root) {
    return;
  }
  sxEls.root = root;
  sxEls.scenes = Array.from(root.querySelectorAll(".sx-scene"));
  sxEls.curtain = document.getElementById("sxCurtain");
  sxEls.confetti = document.getElementById("sxConfetti");

  sxEls.moduleChip = document.getElementById("sxModuleChip");
  sxEls.audioBtn = document.getElementById("sxAudioBtn");
  sxEls.exitBtn = document.getElementById("sxExitBtn");

  // Splash
  sxEls.splashMeta = document.getElementById("sxSplashMeta");
  sxEls.playBtn = document.getElementById("sxPlayBtn");
  sxEls.splashHint = document.getElementById("sxSplashHint");

  // Participante
  sxEls.pEyebrow = document.getElementById("sxPEyebrow");
  sxEls.pTitle = document.getElementById("sxPTitle");
  sxEls.orbs = document.getElementById("sxOrbs");
  sxEls.pLabel = document.getElementById("sxPLabel");
  sxEls.pName = document.getElementById("sxPName");
  sxEls.pBulbs = document.getElementById("sxPBulbs");
  sxEls.candidates = document.getElementById("sxCandidates");
  sxEls.pSteps = document.getElementById("sxPSteps");
  sxEls.pNext = document.getElementById("sxPNext");
  sxEls.pContinueBtn = document.getElementById("sxPContinueBtn");
  sxEls.pRetryBtn = document.getElementById("sxPRetryBtn");
  sxEls.pSkipBtn = document.getElementById("sxPSkipBtn");

  // Ruleta
  sxEls.wheelSpin = document.getElementById("sxWheelSpin");
  sxEls.wheelRing = document.getElementById("sxWheelRing");
  sxEls.turnWrap = document.getElementById("sxTurnWrap");
  sxEls.turnName = document.getElementById("sxTurnName");
  sxEls.liveName = document.getElementById("sxLiveName");
  sxEls.wSteps = document.getElementById("sxWSteps");
  sxEls.wCount = document.getElementById("sxWCount");
  sxEls.wContinueBtn = document.getElementById("sxWContinueBtn");
  sxEls.wRetryBtn = document.getElementById("sxWRetryBtn");
  sxEls.wSkipBtn = document.getElementById("sxWSkipBtn");

  // Resultado
  sxEls.resultCard = document.getElementById("sxResultCard");
  sxEls.rWho = document.getElementById("sxRWho");
  sxEls.rWhat = document.getElementById("sxRWhat");
  sxEls.rSede = document.getElementById("sxRSede");
  sxEls.rEspecialidad = document.getElementById("sxREspecialidad");
  sxEls.rCategoria = document.getElementById("sxRCategoria");
  sxEls.rImg = document.getElementById("sxRImg");
  sxEls.newRoundBtn = document.getElementById("sxNewRoundBtn");
  sxEls.finishBtn = document.getElementById("sxFinishBtn");

  buildPlateBulbs(sxEls.pBulbs);

  sxEls.playBtn.addEventListener("click", startRound);
  sxEls.pContinueBtn.addEventListener("click", continueFromParticipant);
  sxEls.pRetryBtn.addEventListener("click", retryParticipant);
  sxEls.pSkipBtn.addEventListener("click", skipParticipant);
  sxEls.wContinueBtn.addEventListener("click", goToResult);
  sxEls.wRetryBtn.addEventListener("click", retryWheel);
  sxEls.wSkipBtn.addEventListener("click", skipWheel);
  sxEls.newRoundBtn.addEventListener("click", startRound);
  sxEls.finishBtn.addEventListener("click", () => {
    if (typeof setShowMode === "function") {
      setShowMode(false);
    }
  });
  sxEls.exitBtn.addEventListener("click", () => {
    if (typeof setShowMode === "function") {
      setShowMode(false);
    }
  });
  sxEls.audioBtn.addEventListener("click", () => {
    state.audioEnabled = !state.audioEnabled;
    localStorage.setItem("ruleta-show-audio-v1", state.audioEnabled ? "on" : "off");
    syncAudioBtn();
    if (typeof render === "function") {
      render();
    }
  });

  // Atajo opcional de previsualización: ?sxpreview=splash|participant|wheel|result
  maybePreview();

  syncShow();
}

/* ---------- Sincronización con el modo show de app.js ---------- */
function syncShow() {
  if (!sxEls.root) {
    return;
  }
  const on = Boolean(state.showMode);
  sxEls.root.classList.toggle("is-visible", on);
  sxEls.root.setAttribute("aria-hidden", String(!on));
  document.body.classList.toggle("sx-active", on);

  if (on && !sx.active) {
    sx.active = true;
    resetToSplash();
  } else if (!on && sx.active) {
    sx.active = false;
    stopTimers();
  }

  if (on) {
    refreshChrome();
  }
}

function refreshChrome() {
  const module = activeModule();
  const nextRound = module.history.length + 1;
  sxEls.moduleChip.textContent = `Ronda ${nextRound} · ${module.name}`;
  sxEls.splashMeta.innerHTML =
    `<b>${module.participants.length}</b> participantes <span class="dot"></span> ` +
    `<b>${module.presentations.length}</b> PPIs <span class="dot"></span> Ronda <b>${nextRound}</b>`;
  syncAudioBtn();

  const ready = canPlayShowRound(module);
  sxEls.playBtn.disabled = !ready;
  sxEls.newRoundBtn.disabled = !ready;
  sxEls.splashHint.textContent = ready
    ? ""
    : "Agrega participantes y PPIs en el panel para iniciar";
}

function syncAudioBtn() {
  if (!sxEls.audioBtn) {
    return;
  }
  sxEls.audioBtn.textContent = state.audioEnabled ? "Audio" : "Silencio";
}

/* ---------- Navegación de escenas ---------- */
function showScene(scene) {
  sx.scene = scene;
  sxEls.scenes.forEach((node) => {
    node.classList.toggle("is-active", node.dataset.scene === scene);
  });
}

function resetToSplash() {
  stopTimers();
  sx.busy = false;
  sx.awaitingWheel = false;
  clearRound(true);
  sx.wheelRotation = 0;
  if (sxEls.wheelSpin) {
    sxEls.wheelSpin.style.transition = "none";
    sxEls.wheelSpin.style.transform = "rotate(0deg)";
  }
  buildWheel();
  refreshChrome();
  showScene("splash");
}

async function curtainSwitch(midFn) {
  const curtain = sxEls.curtain;
  curtain.style.transition = "transform .42s cubic-bezier(.7,0,.3,1)";
  curtain.style.transform = "translateX(0) skewX(-8deg)";
  await delay(420);
  if (typeof midFn === "function") {
    midFn();
  }
  curtain.style.transform = "translateX(110%) skewX(-8deg)";
  await delay(420);
  curtain.style.transition = "none";
  curtain.style.transform = "translateX(-110%) skewX(-8deg)";
}

/* ---------- Flujo de ronda ---------- */
async function startRound() {
  if (sx.busy) {
    return;
  }
  const module = activeModule();
  if (!canPlayShowRound(module)) {
    if (typeof toast === "function") {
      toast("Faltan datos para jugar la ronda");
    }
    return;
  }

  sx.busy = true;
  stopTimers();
  clearRound(true);
  sx.wheelRotation = 0;
  if (sxEls.wheelSpin) {
    sxEls.wheelSpin.style.transition = "none";
    sxEls.wheelSpin.style.transform = "rotate(0deg)";
  }
  buildWheel();

  if (state.eventMode.participants) {
    await curtainSwitch(() => showScene("participant"));
    sx.busy = false;
    runParticipantDraw();
  } else {
    await curtainSwitch(() => showScene("wheel"));
    sx.busy = false;
    runWheelSpin();
  }
}

/* ---------- Física: métricas de la esfera ---------- */
function getSphereMetrics() {
  const sphere = sxEls.orbs.closest(".sx-sphere");
  if (!sphere) {
    return { cx: 150, cy: 150, radius: 150 };
  }
  const rect = sphere.getBoundingClientRect();
  return { cx: rect.width / 2, cy: rect.height / 2, radius: Math.min(rect.width, rect.height) / 2 };
}

/* ---------- Física: crear orbs ---------- */
function initPhysicsOrbs(participants, winner) {
  const cap = 13;
  const pool = participants.slice(0, cap);
  // Guarantee the winner is in the pool
  if (winner && !pool.some((p) => p.id === winner.id)) {
    pool[pool.length - 1] = winner;
  }
  // Shuffle pool so color assignment varies each round
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  // Also shuffle the color palette per round
  const shuffledColors = colors.slice();
  for (let i = shuffledColors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledColors[i], shuffledColors[j]] = [shuffledColors[j], shuffledColors[i]];
  }
  const metrics = getSphereMetrics();
  const orbSize = Math.max(28, Math.min(metrics.radius * 0.28, 46));
  const orbRadius = orbSize / 2;
  const bodies = [];

  sxEls.orbs.innerHTML = "";
  sxEls.orbs.classList.add("physics-mode");

  pool.forEach((p, i) => {
    const el = document.createElement("div");
    el.className = "sx-orb";
    el.dataset.id = p.id;
    el.style.cssText = `--c:${shuffledColors[i % shuffledColors.length]}; width:${orbSize}px; height:${orbSize}px;`;
    el.title = p.name;
    sxEls.orbs.appendChild(el);

    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * (metrics.radius - orbRadius - 10);
    bodies.push({
      x: metrics.cx + Math.cos(angle) * dist,
      y: metrics.cy + Math.sin(angle) * dist,
      vx: (Math.random() - 0.5) * 400,
      vy: (Math.random() - 0.5) * 400,
      radius: orbRadius,
      el: el,
      id: p.id
    });
  });

  // position initial
  bodies.forEach((b) => {
    b.el.style.transform = `translate(${b.x - b.radius}px, ${b.y - b.radius}px)`;
  });

  return bodies;
}

/* ---------- Física: paso de simulación ---------- */
function physicsStep(bodies, dt, metrics, slowing) {
  const GRAVITY = 420;
  const WALL_REST = 0.65;
  const BALL_REST = 0.7;
  const DAMPING = slowing ? 0.94 : 0.999;
  const containerR = metrics.radius - 4; // slight inset from border

  // Turbulence: random air jets keep balls tumbling (like a lottery machine)
  const TURB_STRENGTH = slowing ? 0 : 520;
  const TURB_UP = slowing ? 0 : -600; // upward air current from bottom

  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];

    // Gravity (reduced so balls don't just pile at bottom)
    b.vy += GRAVITY * dt;

    // Upward air current — stronger when ball is in the lower half
    if (!slowing) {
      const belowCenter = (b.y - metrics.cy) / metrics.radius; // 0 at center, 1 at bottom
      if (belowCenter > 0) {
        b.vy += TURB_UP * belowCenter * dt;
      }
      // Random lateral + vertical bursts (air jets)
      if (Math.random() < 0.15) {
        b.vx += (Math.random() - 0.5) * TURB_STRENGTH;
        b.vy += (Math.random() - 0.7) * TURB_STRENGTH; // biased upward
      }
    }

    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // Circular wall collision
    const dx = b.x - metrics.cx;
    const dy = b.y - metrics.cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = containerR - b.radius;
    if (dist > maxDist) {
      const nx = dx / dist;
      const ny = dy / dist;
      b.x = metrics.cx + nx * maxDist;
      b.y = metrics.cy + ny * maxDist;
      const dot = b.vx * nx + b.vy * ny;
      b.vx -= (1 + WALL_REST) * dot * nx;
      b.vy -= (1 + WALL_REST) * dot * ny;
    }

    // Damping
    b.vx *= DAMPING;
    b.vy *= DAMPING;
  }

  // Ball-ball collisions
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i];
      const b = bodies[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = a.radius + b.radius;
      if (dist < minDist && dist > 0.01) {
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;
        a.x -= nx * overlap * 0.5;
        a.y -= ny * overlap * 0.5;
        b.x += nx * overlap * 0.5;
        b.y += ny * overlap * 0.5;
        const dvx = a.vx - b.vx;
        const dvy = a.vy - b.vy;
        const dvDot = dvx * nx + dvy * ny;
        if (dvDot > 0) {
          const impulse = dvDot * (1 + BALL_REST) * 0.5;
          a.vx -= impulse * nx;
          a.vy -= impulse * ny;
          b.vx += impulse * nx;
          b.vy += impulse * ny;
        }
      }
    }
  }

  // Position DOM
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    b.el.style.transform = `translate(${b.x - b.radius}px, ${b.y - b.radius}px)`;
  }
}

/* ---------- Física: loop (fixed timestep) ---------- */
function startPhysicsLoop(bodies) {
  let lastTime = performance.now();
  let accumulator = 0;
  const metrics = getSphereMetrics();
  const FIXED_DT = 1 / 60; // simular siempre a 60 pasos/seg
  const MAX_FRAME = 0.1;   // cap de frame real a 100ms (10fps mínimo)
  const MAX_STEPS = 4;     // máximo de sub-pasos por frame para evitar espiral

  function tick(now) {
    const frameTime = Math.min((now - lastTime) / 1000, MAX_FRAME);
    lastTime = now;
    accumulator += frameTime;

    let steps = 0;
    while (accumulator >= FIXED_DT && steps < MAX_STEPS) {
      physicsStep(bodies, FIXED_DT, metrics, sx.physicsPhase === "slowing");
      accumulator -= FIXED_DT;
      steps++;
    }
    // Descartar acumulador sobrante si se excedió MAX_STEPS
    if (steps >= MAX_STEPS) {
      accumulator = 0;
    }

    sx.physicsRAF = requestAnimationFrame(tick);
  }
  sx.physicsRAF = requestAnimationFrame(tick);
}

function stopPhysicsLoop() {
  if (sx.physicsRAF) {
    cancelAnimationFrame(sx.physicsRAF);
    sx.physicsRAF = null;
  }
}

/* ---------- Física: flicker de nombres (RAF delta) ---------- */
function startNameFlicker(module) {
  let ticks = 0;
  let elapsed = 0;
  let last = performance.now();
  const INTERVAL = 0.095; // 95ms entre cambios

  function tick(now) {
    elapsed += (now - last) / 1000;
    last = now;
    if (elapsed >= INTERVAL) {
      elapsed -= INTERVAL;
      const preview = randomItem(module.participants);
      sxEls.pName.textContent = preview.name;
      ticks += 1;
      if (ticks % 4 === 0) {
        playSound("tick");
      }
    }
    sx.flickerTimer = requestAnimationFrame(tick);
  }
  sx.flickerTimer = requestAnimationFrame(tick);
}

function stopNameFlicker() {
  if (sx.flickerTimer) {
    cancelAnimationFrame(sx.flickerTimer);
    sx.flickerTimer = null;
  }
}

/* ---------- Física: resaltar ganador (sin ocultar las demás) ---------- */
function isolateWinner(bodies, winner) {
  bodies.forEach((b) => {
    if (b.id === winner.id) {
      b.el.style.boxShadow = "inset 0 -8px 16px rgba(0,0,0,0.3), 0 0 36px 6px rgba(245, 163, 58, 0.95)";
      b.el.style.zIndex = "2";
    }
  });
}

/* ---------- Física: mover ganador al centro y agrandar ---------- */
function highlightWinnerInPlace(bodies, winner) {
  const winnerBody = bodies.find((b) => b.id === winner.id);
  if (!winnerBody) {
    return;
  }
  const metrics = getSphereMetrics();
  const el = winnerBody.el;
  // Move to center of sphere and scale up
  const cx = metrics.cx - winnerBody.radius;
  const cy = metrics.cy - winnerBody.radius;
  el.style.transition = "transform 0.5s cubic-bezier(.2,.8,.2,1.2), font-size 0.3s ease";
  el.style.transform = `translate(${cx}px, ${cy}px) scale(3)`;
  // Show only the first name on the orb
  el.textContent = formatParticipantOrbLabel(winner.name);
  el.style.fontSize = "5px";
  el.style.fontWeight = "800";
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.textAlign = "center";
  el.style.padding = "2px";
  el.style.lineHeight = "1.1";
  el.style.overflow = "hidden";
}

/* ---------- Física: limpiar timers ---------- */
function clearPhysicsTimers() {
  stopPhysicsLoop();
  stopNameFlicker();
  ["phaseTimer", "settleTimer", "exitTimer", "finalTimer"].forEach((key) => {
    if (sx[key]) {
      window.clearTimeout(sx[key]);
      sx[key] = null;
    }
  });
  sx.physicsBodies = null;
  sx.physicsPhase = null;
  sx.physicsWinner = null;
}

/* ---------- Escena participante ---------- */
function runParticipantDraw() {
  const module = activeModule();
  if (!module.participants.length || sx.busy) {
    return;
  }
  sx.busy = true;

  const winner = drawFromBag("participants", module, module.participants, getPreviousParticipantId(module));

  sxEls.pEyebrow.textContent = "";
  sxEls.pTitle.textContent = "¿Quién será?";
  sxEls.pLabel.textContent = "Las esferas están girando…";
  sxEls.pContinueBtn.hidden = true;
  sxEls.pRetryBtn.hidden = true;
  sxEls.pSkipBtn.hidden = false;
  setSteps(sxEls.pSteps, 0, 0);
  sxEls.pNext.textContent = "";

  sx.physicsWinner = winner;

  // Init physics orbs (no text, absolute positioned) — winner guaranteed in pool
  const bodies = initPhysicsOrbs(module.participants, winner);
  sx.physicsBodies = bodies;
  sx.physicsPhase = "active";

  // Start physics loop + name flicker
  startPhysicsLoop(bodies);
  startNameFlicker(module);
  playSound("suspense");

  // PHASE 1 (0–2.5s): Active bouncing — already running

  // PHASE 2 (2.5–3.5s): Slowing down
  sx.phaseTimer = window.setTimeout(() => {
    sx.physicsPhase = "slowing";
  }, 2500);

  // PHASE 3 (3.5s): Isolate winner — fade non-winners, winner glows solo
  sx.settleTimer = window.setTimeout(() => {
    stopNameFlicker();
    sxEls.pName.textContent = winner.name;

    isolateWinner(bodies, winner);
  }, 3500);

  // PHASE 4 (4.2s): Stop physics, scale winner in place
  sx.exitTimer = window.setTimeout(() => {
    stopPhysicsLoop();
    highlightWinnerInPlace(bodies, winner);
  }, 4200);

  // PHASE 5 (5s): Resolve — confetti + button (winner stays in sphere)
  sx.finalTimer = window.setTimeout(() => {
    settleParticipant(winner);
  }, 5000);
}

function settleParticipant(winner) {
  clearPhysicsTimers();

  state.selectedParticipant = winner;
  state.lastParticipantId = winner.id;

  sxEls.pLabel.textContent = "Participante seleccionado";
  sxEls.pName.textContent = winner.name;

  // Keep all physics orbs in the sphere — find the winner by data-id
  // and scale it up with golden glow
  const winnerOrb = sxEls.orbs.querySelector(`[data-id="${winner.id}"]`);
  if (winnerOrb) {
    winnerOrb.style.boxShadow = "inset 0 -8px 16px rgba(0,0,0,0.3), 0 0 36px 6px rgba(245, 163, 58, 0.95)";
    winnerOrb.style.zIndex = "2";
    winnerOrb.style.transition = "transform 0.5s cubic-bezier(.2,.8,.2,1.2), font-size 0.3s ease";
    // Move to center of sphere and scale up
    const metrics = getSphereMetrics();
    const r = parseFloat(winnerOrb.style.width) / 2 || 23;
    const cx = metrics.cx - r;
    const cy = metrics.cy - r;
    winnerOrb.style.transform = `translate(${cx}px, ${cy}px) scale(3)`;
    // Show only the first name on the orb
    winnerOrb.textContent = formatParticipantOrbLabel(winner.name);
    winnerOrb.style.fontSize = "5px";
    winnerOrb.style.fontWeight = "800";
    winnerOrb.style.display = "flex";
    winnerOrb.style.alignItems = "center";
    winnerOrb.style.justifyContent = "center";
    winnerOrb.style.textAlign = "center";
    winnerOrb.style.padding = "2px";
    winnerOrb.style.lineHeight = "1.1";
    winnerOrb.style.overflow = "hidden";
  }

  playSound("win");
  sxConfettiBurst();

  sx.busy = false;
  sxEls.pSkipBtn.hidden = true;
  sxEls.pRetryBtn.hidden = false;

  if (state.eventMode.presentations) {
    sxEls.pContinueBtn.textContent = "Girar la ruleta";
    sxEls.pContinueBtn.hidden = false;
  } else {
    recordRound();
    if (typeof render === "function") {
      render();
    }
    sxEls.pContinueBtn.textContent = "Ver resultado";
    sxEls.pContinueBtn.hidden = false;
  }
}

function skipParticipant() {
  // Physics-based skip
  if (sx.physicsWinner) {
    const winner = sx.physicsWinner;
    clearPhysicsTimers();
    settleParticipant(winner);
    return;
  }
  // Legacy fallback
  if (sx.rollTimer) {
    window.clearInterval(sx.rollTimer);
    sx.rollTimer = null;
    const module = activeModule();
    const winner = drawFromBag("participants", module, module.participants, getPreviousParticipantId(module));
    settleParticipant(winner);
  }
}

function retryParticipant() {
  if (sx.busy) {
    return;
  }
  clearPhysicsTimers();
  sxEls.pContinueBtn.hidden = true;
  sxEls.pRetryBtn.hidden = true;
  sxEls.pSkipBtn.hidden = false;
  state.selectedParticipant = null;
  state.lastParticipantId = null;
  runParticipantDraw();
}

async function continueFromParticipant() {
  if (sx.busy) {
    return;
  }
  if (state.eventMode.presentations) {
    sx.busy = true;
    await curtainSwitch(() => showScene("wheel"));
    sx.busy = false;
    runWheelSpin();
  } else {
    goToResult();
  }
}

/* ---------- Escena ruleta ---------- */
function runWheelSpin() {
  const module = activeModule();
  if (!module.presentations.length || sx.busy) {
    return;
  }
  sx.busy = true;

  const winner = drawFromBag("presentations", module, module.presentations, getPreviousPresentationId(module));
  const winnerIndex = module.presentations.findIndex((item) => item.id === winner.id);
  const segment = 360 / module.presentations.length;
  const targetCenter = winnerIndex * segment + segment / 2;
  const correction = normalizeDegrees(360 - targetCenter);
  const current = normalizeDegrees(sx.wheelRotation);
  const delta = normalizeDegrees(correction - current);
  sx.wheelRotation += 1440 + delta;

  sxEls.turnWrap.hidden = !state.selectedParticipant;
  if (state.selectedParticipant) {
    sxEls.turnName.textContent = state.selectedParticipant.name;
  }
  sxEls.liveName.textContent = "—";
  sxEls.wCount.textContent = `${module.presentations.length} PPIs en la ruleta`;
  setSteps(sxEls.wSteps, state.eventMode.participants ? 2 : 1, state.eventMode.participants ? 2 : 1);
  sxEls.wContinueBtn.hidden = true;
  sxEls.wRetryBtn.hidden = true;
  sxEls.wSkipBtn.hidden = false;

  startBulbChase();
  sxEls.wheelSpin.style.transition = "transform 4.1s cubic-bezier(0.16, 0.84, 0.3, 1)";
  // forzar reflow para asegurar la transición
  void sxEls.wheelSpin.offsetWidth;
  sxEls.wheelSpin.style.transform = `rotate(${sx.wheelRotation}deg)`;
  playSound("spin");

  let ticks = 0;
  let liveElapsed = 0;
  let liveLast = performance.now();
  const LIVE_INTERVAL = 0.15; // 150ms
  function liveTick(now) {
    liveElapsed += (now - liveLast) / 1000;
    liveLast = now;
    if (liveElapsed >= LIVE_INTERVAL) {
      liveElapsed -= LIVE_INTERVAL;
      const preview = randomItem(module.presentations);
      sxEls.liveName.textContent = preview.title;
      ticks += 1;
      if (ticks % 3 === 0) {
        playSound("tick");
      }
    }
    sx.liveTimer = requestAnimationFrame(liveTick);
  }
  sx.liveTimer = requestAnimationFrame(liveTick);

  sx.wheelTimer = window.setTimeout(() => settleWheel(winner), 4100);
}

function settleWheel(winner) {
  if (sx.liveTimer) {
    cancelAnimationFrame(sx.liveTimer);
    sx.liveTimer = null;
  }
  sx.wheelTimer = null;

  state.selectedPresentation = winner;
  state.lastPresentationId = winner.id;
  sxEls.liveName.textContent = winner.title;

  recordRound();
  if (typeof render === "function") {
    render();
  }

  startBulbFlash();
  playSound("win");
  sxConfettiBurst();

  sx.busy = false;
  sxEls.wSkipBtn.hidden = true;
  sxEls.wRetryBtn.hidden = false;
  sxEls.wContinueBtn.hidden = false;
}

function skipWheel() {
  if (sx.wheelTimer) {
    window.clearTimeout(sx.wheelTimer);
    sx.wheelTimer = null;
    if (sx.liveTimer) {
      cancelAnimationFrame(sx.liveTimer);
      sx.liveTimer = null;
    }
    const module = activeModule();
    const winner = module.presentations.find((item) => item.id === state.lastPresentationId)
      || module.presentations[0];
    // Saltar la animación: posicionar la ruleta de inmediato.
    sxEls.wheelSpin.style.transition = "transform .5s ease-out";
    void sxEls.wheelSpin.offsetWidth;
    sxEls.wheelSpin.style.transform = `rotate(${sx.wheelRotation}deg)`;
    settleWheel(winner);
  }
}

/* ---------- Foquitos de la ruleta (RAF delta) ---------- */
function startBulbChase() {
  stopBulbAnimation();
  const bulbs = sx.bulbEls;
  if (!bulbs || !bulbs.length) {
    return;
  }
  let current = 0;
  const trail = 3;
  let elapsed = 0;
  let last = performance.now();
  const INTERVAL = 0.055; // 55ms

  bulbs.forEach((g) => { g.style.opacity = "0.15"; });

  function tick(now) {
    elapsed += (now - last) / 1000;
    last = now;
    if (elapsed >= INTERVAL) {
      elapsed -= INTERVAL;
      bulbs.forEach((g) => { g.style.opacity = "0.15"; });
      for (let t = 0; t < trail; t++) {
        const idx = (current - t + bulbs.length) % bulbs.length;
        bulbs[idx].style.opacity = String(1 - t * 0.25);
      }
      current = (current + 1) % bulbs.length;
    }
    sx.bulbChaseTimer = requestAnimationFrame(tick);
  }
  sx.bulbChaseTimer = requestAnimationFrame(tick);
}

function startBulbFlash() {
  stopBulbAnimation();
  const bulbs = sx.bulbEls;
  if (!bulbs || !bulbs.length) {
    return;
  }
  let on = true;
  let elapsed = 0;
  let last = performance.now();
  const INTERVAL = 0.35; // 350ms

  bulbs.forEach((g) => { g.style.opacity = "1"; });

  function tick(now) {
    elapsed += (now - last) / 1000;
    last = now;
    if (elapsed >= INTERVAL) {
      elapsed -= INTERVAL;
      on = !on;
      bulbs.forEach((g) => { g.style.opacity = on ? "1" : "0.2"; });
    }
    sx.bulbFlashTimer = requestAnimationFrame(tick);
  }
  sx.bulbFlashTimer = requestAnimationFrame(tick);
}

function stopBulbAnimation() {
  if (sx.bulbChaseTimer) {
    cancelAnimationFrame(sx.bulbChaseTimer);
    sx.bulbChaseTimer = null;
  }
  if (sx.bulbFlashTimer) {
    cancelAnimationFrame(sx.bulbFlashTimer);
    sx.bulbFlashTimer = null;
  }
  if (sx.bulbEls) {
    sx.bulbEls.forEach((g) => { g.style.opacity = "1"; });
  }
}

/* ---------- Re-giro de ruleta ---------- */
function retryWheel() {
  if (sx.busy) {
    return;
  }
  // Deshacer la ronda registrada por settleWheel
  const module = activeModule();
  if (module.history.length) {
    module.history.pop();
    if (typeof saveData === "function") {
      saveData();
    }
  }
  state.selectedPresentation = null;
  state.lastPresentationId = null;
  sxEls.wContinueBtn.hidden = true;
  sxEls.wRetryBtn.hidden = true;
  sxEls.wSkipBtn.hidden = false;
  stopBulbAnimation();
  runWheelSpin();
}

/* ---------- Escena resultado ---------- */
async function goToResult() {
  if (sx.busy) {
    return;
  }
  sx.busy = true;
  renderResult();
  await curtainSwitch(() => showScene("result"));
  sx.busy = false;
  refreshChrome();
  sxConfettiBurst();
}

function renderResult() {
  const participant = state.selectedParticipant;
  const presentation = state.selectedPresentation;
  const imageSource = presentation?.image || presentation?.imagePath || "";

  sxEls.resultCard.classList.toggle("no-participant", !participant);
  sxEls.resultCard.classList.toggle("no-ppi", !presentation);
  sxEls.resultCard.classList.toggle("no-photo", !imageSource);

  if (participant) {
    sxEls.rWho.textContent = participant.name;
  }
  if (presentation) {
    sxEls.rWhat.textContent = presentation.doctor || presentation.title;
    sxEls.rSede.textContent = presentation.sede ? `Sede: ${presentation.sede}` : "";
    sxEls.rEspecialidad.textContent = presentation.especialidad ? `Especialidad: ${presentation.especialidad}` : "";
    sxEls.rCategoria.textContent = presentation.categoria ? `Categoría: ${presentation.categoria}` : "";
  }
  if (imageSource) {
    sxEls.rImg.src = imageSource;
  } else {
    sxEls.rImg.removeAttribute("src");
  }
}

/* ---------- Construcción de la ruleta (solo colores) ---------- */
function buildWheel() {
  const module = activeModule();
  const count = Math.max(module.presentations.length, 1);
  const NS = "http://www.w3.org/2000/svg";
  const CX = 380;
  const CY = 380;
  const R_RIM_OUT = 358;
  const R_RIM_IN = 318;
  const R_BULB = 338;
  const STEP = 360 / count;

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 760 760");

  svg.innerHTML = `
    <defs>
      <radialGradient id="sxGoldHub" cx="0.4" cy="0.32" r="0.9">
        <stop offset="0" stop-color="#fdf0bd"/><stop offset="0.55" stop-color="#e8b945"/>
        <stop offset="1" stop-color="#9a6a12"/>
      </radialGradient>
    </defs>
  `;

  const add = (tag, attrs) => {
    const node = document.createElementNS(NS, tag);
    for (const key in attrs) {
      node.setAttribute(key, attrs[key]);
    }
    svg.appendChild(node);
    return node;
  };
  const polar = (r, deg) => {
    const rad = (deg - 90) * Math.PI / 180;
    return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
  };

  add("circle", { cx: CX, cy: CY, r: R_RIM_OUT, fill: "#0c1331" });

  for (let i = 0; i < count; i += 1) {
    const a0 = i * STEP;
    const a1 = (i + 1) * STEP;
    const [x0, y0] = polar(R_RIM_IN, a0);
    const [x1, y1] = polar(R_RIM_IN, a1);
    const large = STEP > 180 ? 1 : 0;
    add("path", {
      d: `M ${CX} ${CY} L ${x0} ${y0} A ${R_RIM_IN} ${R_RIM_IN} 0 ${large} 1 ${x1} ${y1} Z`,
      fill: colors[i % colors.length],
      stroke: "#f3d98a",
      "stroke-width": 2.2
    });
  }

  add("circle", { cx: CX, cy: CY, r: 134, fill: "url(#sxGoldHub)", stroke: "#6b4a08", "stroke-width": 3 });
  add("circle", { cx: CX, cy: CY, r: 112, fill: "#ffffff" });

  sxEls.wheelSpin.innerHTML = "";
  sxEls.wheelSpin.appendChild(svg);

  // --- Foquitos en SVG estático (no gira) ---
  const ringSvg = document.createElementNS(NS, "svg");
  ringSvg.setAttribute("viewBox", "0 0 760 760");
  ringSvg.innerHTML = `
    <defs>
      <linearGradient id="sxGoldRim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#c4b47a"/><stop offset="0.35" stop-color="#a89030"/>
        <stop offset="0.7" stop-color="#866214"/><stop offset="1" stop-color="#5e420a"/>
      </linearGradient>
      <radialGradient id="sxBulbOn" cx="0.35" cy="0.3" r="0.85">
        <stop offset="0" stop-color="#fffef8"/><stop offset="0.4" stop-color="#ffe566"/>
        <stop offset="1" stop-color="#c89520"/>
      </radialGradient>
      <filter id="sxBulbGlow" x="-150%" y="-150%" width="400%" height="400%">
        <feGaussianBlur stdDeviation="8" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <circle cx="${CX}" cy="${CY}" r="341" fill="none" stroke="url(#sxGoldRim)" stroke-width="34"/>
    <circle cx="${CX}" cy="${CY}" r="358" fill="none" stroke="#6b4a08" stroke-width="3"/>
  `;
  sx.bulbEls = [];
  const bulbCount = Math.min(24, Math.max(16, count));
  for (let i = 0; i < bulbCount; i += 1) {
    const [bx, by] = polar(R_BULB, (360 / bulbCount) * i);
    const g = document.createElementNS(NS, "g");
    const glow = document.createElementNS(NS, "circle");
    glow.setAttribute("cx", bx); glow.setAttribute("cy", by);
    glow.setAttribute("r", 16); glow.setAttribute("fill", "rgba(255,225,100,0.45)");
    glow.setAttribute("filter", "url(#sxBulbGlow)");
    const bulb = document.createElementNS(NS, "circle");
    bulb.setAttribute("cx", bx); bulb.setAttribute("cy", by);
    bulb.setAttribute("r", 11); bulb.setAttribute("fill", "url(#sxBulbOn)");
    g.appendChild(glow);
    g.appendChild(bulb);
    ringSvg.appendChild(g);
    sx.bulbEls.push(g);
  }
  sxEls.wheelRing.innerHTML = "";
  sxEls.wheelRing.appendChild(ringSvg);
}


/* ---------- Auxiliares de render ---------- */
function renderOrbs(participants, rolling, winner = null) {
  const cap = 13;
  let pool = participants;
  if (winner) {
    pool = [winner, ...participants.filter((p) => p.id !== winner.id)].slice(0, cap);
    pool = shuffleStable(pool, winner);
  } else {
    pool = participants.slice(0, cap);
  }

  sxEls.orbs.innerHTML = pool.map((participant, index) => {
    const label = formatParticipantOrbLabel(participant.name);
    const classes = [
      "sx-orb",
      rolling ? "rolling" : "",
      winner && participant.id === winner.id ? "winner" : ""
    ].filter(Boolean).join(" ");
    return `<div class="${classes}" style="--c:${colors[index % colors.length]}" title="${escapeAttr(participant.name)}">${escapeHtml(label)}</div>`;
  }).join("");
}

function shuffleStable(pool, winner) {
  const others = shuffle(pool.filter((p) => p.id !== winner.id));
  const slot = others.length ? 1 + randomInt(others.length) : 0;
  const result = others.slice();
  result.splice(Math.min(slot, result.length), 0, winner);
  return result;
}

function updateCandidates(participants) {
  const picks = shuffle(participants).slice(0, 6);
  const hotIndex = picks.length ? randomInt(picks.length) : -1;
  sxEls.candidates.innerHTML = picks.map((participant, index) => {
    const label = formatParticipantOrbLabel(participant.name);
    return `<span class="${index === hotIndex ? "hot" : ""}">${escapeHtml(label)}</span>`;
  }).join("");
}

function setSteps(container, current, total) {
  if (!container) {
    return;
  }
  if (!total) {
    container.innerHTML = "";
    return;
  }
  let html = "";
  for (let i = 1; i <= total; i += 1) {
    html += `<i class="${i <= current ? "on" : ""}"></i>`;
  }
  container.innerHTML = html;
}

function buildPlateBulbs(container) {
  if (!container) {
    return;
  }
  const arr = [];
  const hStep = 8;
  for (let pct = 4; pct <= 96; pct += hStep) {
    arr.push(`<i style="left:${pct}%;top:0;animation-delay:${(arr.length % 6) * 0.16}s"></i>`);
    arr.push(`<i style="left:${pct}%;top:100%;animation-delay:${(arr.length % 6) * 0.16}s"></i>`);
  }
  for (let pct = 25; pct <= 75; pct += 25) {
    arr.push(`<i style="left:0;top:${pct}%;animation-delay:${(arr.length % 6) * 0.16}s"></i>`);
    arr.push(`<i style="left:100%;top:${pct}%;animation-delay:${(arr.length % 6) * 0.16}s"></i>`);
  }
  container.innerHTML = arr.join("");
}

function sxConfettiBurst() {
  const layer = sxEls.confetti;
  if (!layer) {
    return;
  }
  const palette = colors.concat(["#fdf0bd", "#ffffff"]);
  const pieces = 70;
  for (let i = 0; i < pieces; i += 1) {
    const piece = document.createElement("i");
    piece.style.left = Math.random() * 100 + "%";
    piece.style.background = palette[i % palette.length];
    piece.style.animationDuration = 2.4 + Math.random() * 1.8 + "s";
    piece.style.animationDelay = Math.random() * 0.5 + "s";
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    layer.appendChild(piece);
    window.setTimeout(() => piece.remove(), 4600);
  }
}

function stopTimers() {
  [["rollTimer", "interval"], ["liveTimer", "raf"], ["wheelTimer", "timeout"]].forEach(([key, kind]) => {
    if (sx[key]) {
      if (kind === "interval") {
        window.clearInterval(sx[key]);
      } else if (kind === "raf") {
        cancelAnimationFrame(sx[key]);
      } else {
        window.clearTimeout(sx[key]);
      }
      sx[key] = null;
    }
  });
  stopBulbAnimation();
  clearPhysicsTimers();
}

/* ---------- Previsualización para QA / demo ---------- */
function maybePreview() {
  const params = new URLSearchParams(location.search);
  const scene = params.get("sxpreview");
  if (!scene) {
    return;
  }
  state.showMode = true;
  document.body.classList.add("show-mode", "sx-active");
  sx.active = true;
  sxEls.root.classList.add("is-visible");
  refreshChrome();
  buildWheel();
  const module = activeModule();

  if (scene === "participant") {
    state.selectedParticipant = module.participants[0] || null;
    sxEls.pEyebrow.textContent = "";
    sxEls.pTitle.textContent = "¿Quién será?";
    sxEls.pLabel.textContent = "Participante seleccionado";
    sxEls.pName.textContent = state.selectedParticipant?.name || "—";
    setSteps(sxEls.pSteps, 0, 0);
    sxEls.pNext.textContent = "";
    renderOrbs(module.participants, false, state.selectedParticipant);
    sxEls.pSkipBtn.hidden = true;
    sxEls.pContinueBtn.hidden = false;
    sxEls.pContinueBtn.textContent = "Girar la ruleta";
  } else if (scene === "wheel") {
    state.selectedParticipant = module.participants[0] || null;
    sxEls.turnWrap.hidden = !state.selectedParticipant;
    sxEls.turnName.textContent = state.selectedParticipant?.name || "—";
    sxEls.liveName.textContent = module.presentations[0]?.title || "—";
    sxEls.wCount.textContent = `${module.presentations.length} PPIs en la ruleta`;
    setSteps(sxEls.wSteps, 2, 2);
    sxEls.wSkipBtn.hidden = true;
    sxEls.wContinueBtn.hidden = false;
  } else if (scene === "result") {
    state.selectedParticipant = module.participants[0] || null;
    state.selectedPresentation = module.presentations[0] || null;
    renderResult();
    sxConfettiBurst();
  }

  showScene(scene === "splash" ? "splash" : scene);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", sxInit);
} else {
  sxInit();
}
