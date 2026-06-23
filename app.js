const STORAGE_KEY = "ruleta-show-data-v2";
const AUDIO_KEY = "ruleta-show-audio-v1";
const EVENT_MODE_KEY = "ruleta-show-event-mode-v1";
const SHOW_MODE_KEY = "ruleta-show-stage-mode-v1";
const colors = ["#24a8df", "#f5a33a", "#e7603d", "#b72f91", "#51499a", "#18a4c8", "#25b86f"];
const suspenseLabels = ["???", "¿Quién será?", "En juego", "Preparados", "Siguiente"];

const state = {
  data: null,
  view: "event",
  rollingParticipant: false,
  rollingWheel: false,
  highlightedParticipantId: null,
  participantSpotlightSlot: null,
  selectedParticipant: null,
  selectedPresentation: null,
  editingPresentationId: null,
  pendingImageData: "",
  wheelRotation: 0,
  lastParticipantId: null,
  lastPresentationId: null,
  drawBags: {
    participants: new Map(),
    presentations: new Map()
  },
  eventMode: loadEventMode(),
  showMode: localStorage.getItem(SHOW_MODE_KEY) === "on",
  showSequenceRunning: false,
  showResultModalOpen: false,
  showReveal: null,
  suspenseLabel: randomSuspenseLabel(),
  audioEnabled: localStorage.getItem(AUDIO_KEY) !== "off"
};

const els = {
  body: document.body,
  moduleSelect: document.getElementById("moduleSelect"),
  viewTabs: document.querySelectorAll("[data-view]"),
  eventView: document.getElementById("eventView"),
  controlView: document.getElementById("controlView"),
  historyView: document.getElementById("historyView"),
  eventTitle: document.getElementById("eventTitle"),
  stageBand: document.querySelector(".stage-band"),
  stageGrid: document.querySelector(".stage-grid"),
  participantStage: document.querySelector(".participant-stage"),
  rouletteStage: document.querySelector(".roulette-stage"),
  participantsModeBtn: document.getElementById("participantsModeBtn"),
  presentationsModeBtn: document.getElementById("presentationsModeBtn"),
  participantsCardBtn: document.getElementById("participantsCardBtn"),
  presentationsCardBtn: document.getElementById("presentationsCardBtn"),
  participantsCardStatus: document.getElementById("participantsCardStatus"),
  presentationsCardStatus: document.getElementById("presentationsCardStatus"),
  hideParticipantsBtn: document.getElementById("hideParticipantsBtn"),
  hidePresentationsBtn: document.getElementById("hidePresentationsBtn"),
  showModeBtn: document.getElementById("showModeBtn"),
  showExitBtn: document.getElementById("showExitBtn"),
  playRoundBtn: document.getElementById("playRoundBtn"),
  showReveal: document.getElementById("showReveal"),
  showRevealEyebrow: document.getElementById("showRevealEyebrow"),
  showRevealName: document.getElementById("showRevealName"),
  showRevealMeta: document.getElementById("showRevealMeta"),
  showResultModal: document.getElementById("showResultModal"),
  showResultParticipant: document.getElementById("showResultParticipant"),
  showResultPpi: document.getElementById("showResultPpi"),
  showResultSede: document.getElementById("showResultSede"),
  showResultEspecialidad: document.getElementById("showResultEspecialidad"),
  showResultCategoria: document.getElementById("showResultCategoria"),
  showResultImageWrap: document.getElementById("showResultImageWrap"),
  showResultImage: document.getElementById("showResultImage"),
  showResultImageEmpty: document.getElementById("showResultImageEmpty"),
  closeShowResultBtn: document.getElementById("closeShowResultBtn"),
  modalNewRoundBtn: document.getElementById("modalNewRoundBtn"),
  audioToggle: document.getElementById("audioToggle"),
  audioLabel: document.getElementById("audioLabel"),
  roundCounter: document.getElementById("roundCounter"),
  participantCount: document.getElementById("participantCount"),
  presentationCount: document.getElementById("presentationCount"),
  participantField: document.getElementById("participantField"),
  participantReadout: document.getElementById("participantReadout"),
  presentationReadout: document.getElementById("presentationReadout"),
  wheel: document.getElementById("wheel"),
  wheelCenterLabel: document.getElementById("wheelCenterLabel"),
  drawParticipantBtn: document.getElementById("drawParticipantBtn"),
  spinWheelBtn: document.getElementById("spinWheelBtn"),
  newRoundBtn: document.getElementById("newRoundBtn"),
  finishEventBtn: document.getElementById("finishEventBtn"),
  resetEventBtn: document.getElementById("resetEventBtn"),
  winnerName: document.getElementById("winnerName"),
  winnerCard: document.getElementById("winnerCard"),
  winnerPresentation: document.getElementById("winnerPresentation"),
  presentationCard: document.getElementById("presentationCard"),
  topicBox: document.getElementById("topicBox"),
  topicList: document.getElementById("topicList"),
  presentationImage: document.getElementById("presentationImage"),
  recentHistoryList: document.getElementById("recentHistoryList"),
  addModuleBtn: document.getElementById("addModuleBtn"),
  deleteModuleBtn: document.getElementById("deleteModuleBtn"),
  moduleNameInput: document.getElementById("moduleNameInput"),
  saveModuleNameBtn: document.getElementById("saveModuleNameBtn"),
  moduleList: document.getElementById("moduleList"),
  activeModuleMeta: document.getElementById("activeModuleMeta"),
  participantForm: document.getElementById("participantForm"),
  participantNameInput: document.getElementById("participantNameInput"),
  bulkParticipantsInput: document.getElementById("bulkParticipantsInput"),
  bulkParticipantsBtn: document.getElementById("bulkParticipantsBtn"),
  participantsList: document.getElementById("participantsList"),
  participantAdminCount: document.getElementById("participantAdminCount"),
  presentationForm: document.getElementById("presentationForm"),
  presentationTitleInput: document.getElementById("presentationTitleInput"),
  presentationDoctorInput: document.getElementById("presentationDoctorInput"),
  presentationSedeInput: document.getElementById("presentationSedeInput"),
  presentationEspecialidadInput: document.getElementById("presentationEspecialidadInput"),
  presentationCategoriaInput: document.getElementById("presentationCategoriaInput"),
  presentationTopicsInput: document.getElementById("presentationTopicsInput"),
  presentationImageInput: document.getElementById("presentationImageInput"),
  savePresentationBtn: document.getElementById("savePresentationBtn"),
  cancelPresentationEditBtn: document.getElementById("cancelPresentationEditBtn"),
  presentationsList: document.getElementById("presentationsList"),
  presentationAdminCount: document.getElementById("presentationAdminCount"),
  exportDataBtn: document.getElementById("exportDataBtn"),
  importDataInput: document.getElementById("importDataInput"),
  clearLocalDataBtn: document.getElementById("clearLocalDataBtn"),
  resetAllDataBtn: document.getElementById("resetAllDataBtn"),
  clearHistoryBtn: document.getElementById("clearHistoryBtn"),
  historyTableBody: document.getElementById("historyTableBody"),
  toast: document.getElementById("toast"),
  confetti: document.getElementById("confetti")
};

(async function init() {
  state.data = await loadData();
  bindEvents();
  render();
})();

async function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return normalizeData(JSON.parse(saved));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  try {
    const res = await fetch("assets/data/modules.json");
    const json = await res.json();
    return normalizeData(json);
  } catch {
    return normalizeData(null);
  }
}

function loadEventMode() {
  const fallback = { participants: true, presentations: true };
  const saved = localStorage.getItem(EVENT_MODE_KEY);
  if (!saved) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(saved);
    const mode = {
      participants: parsed.participants !== false,
      presentations: parsed.presentations !== false
    };
    return mode.participants || mode.presentations ? mode : fallback;
  } catch {
    localStorage.removeItem(EVENT_MODE_KEY);
    return fallback;
  }
}

function normalizeData(input) {
  const fallback = {
    activeModuleId: "modulo-1",
    modules: [
      { id: "modulo-1", name: "Módulo 1", participants: [], presentations: [], history: [] },
      { id: "modulo-2", name: "Módulo 2", participants: [], presentations: [], history: [] },
      { id: "modulo-3", name: "Módulo 3", participants: [], presentations: [], history: [] }
    ]
  };

  const data = input && Array.isArray(input.modules) ? input : fallback;
  data.modules = data.modules.map((module, moduleIndex) => {
    const moduleId = module.id || createId("modulo");
    return {
      id: moduleId,
      name: cleanText(module.name) || `Módulo ${moduleIndex + 1}`,
      participants: ensureArray(module.participants).map((participant) => {
        if (typeof participant === "string") {
          return { id: createId("participante"), name: cleanText(participant) };
        }
        return { id: participant.id || createId("participante"), name: cleanText(participant.name) };
      }).filter((participant) => participant.name),
      presentations: ensureArray(module.presentations).map((presentation) => ({
        id: presentation.id || createId("ppt"),
        title: cleanText(presentation.title || presentation.name),
        doctor: cleanText(presentation.doctor || ""),
        sede: cleanText(presentation.sede || ""),
        especialidad: cleanText(presentation.especialidad || ""),
        categoria: cleanText(presentation.categoria || ""),
        topics: ensureArray(presentation.topics).map(cleanText).filter(Boolean),
        image: presentation.image || presentation.imageData || "",
        imagePath: presentation.imagePath || ""
      })).filter((presentation) => presentation.title),
      history: ensureArray(module.history).map((entry, index) => ({
        id: entry.id || createId("ronda"),
        round: Number(entry.round) || index + 1,
        participantName: cleanText(entry.participantName),
        presentationTitle: cleanText(entry.presentationTitle),
        createdAt: entry.createdAt || new Date().toISOString()
      }))
    };
  });

  if (!data.modules.length) {
    data.modules = fallback.modules;
  }

  if (!data.modules.some((module) => module.id === data.activeModuleId)) {
    data.activeModuleId = data.modules[0].id;
  }

  return data;
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function cleanText(value) {
  return String(value || "").trim();
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function activeModule() {
  return state.data.modules.find((module) => module.id === state.data.activeModuleId) || state.data.modules[0];
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function saveEventMode() {
  localStorage.setItem(EVENT_MODE_KEY, JSON.stringify(state.eventMode));
}

function bindEvents() {
  els.moduleSelect.addEventListener("change", () => {
    state.data.activeModuleId = els.moduleSelect.value;
    clearRound();
    saveData();
    render();
  });

  els.viewTabs.forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      render();
    });
  });

  els.audioToggle.addEventListener("click", () => {
    state.audioEnabled = !state.audioEnabled;
    localStorage.setItem(AUDIO_KEY, state.audioEnabled ? "on" : "off");
    renderAudio();
    toast(state.audioEnabled ? "Audio activado" : "Audio desactivado");
  });
  els.showModeBtn.addEventListener("click", () => setShowMode(!state.showMode));
  els.showExitBtn.addEventListener("click", () => setShowMode(false));
  els.playRoundBtn.addEventListener("click", playShowRound);
  els.closeShowResultBtn.addEventListener("click", closeShowResultModal);
  els.modalNewRoundBtn.addEventListener("click", closeShowResultModal);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.showResultModalOpen) {
      closeShowResultModal();
      return;
    }
    if (event.key === "Escape" && state.showMode && !document.fullscreenElement) {
      setShowMode(false);
    }
  });
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && state.showMode) {
      state.showMode = false;
      localStorage.setItem(SHOW_MODE_KEY, "off");
      render();
    }
  });

  els.participantsModeBtn.addEventListener("click", () => setEventMode("participants", !state.eventMode.participants));
  els.presentationsModeBtn.addEventListener("click", () => setEventMode("presentations", !state.eventMode.presentations));
  els.participantsCardBtn.addEventListener("click", () => setEventMode("participants", !state.eventMode.participants));
  els.presentationsCardBtn.addEventListener("click", () => setEventMode("presentations", !state.eventMode.presentations));
  els.hideParticipantsBtn.addEventListener("click", () => setEventMode("participants", false));
  els.hidePresentationsBtn.addEventListener("click", () => setEventMode("presentations", false));

  els.drawParticipantBtn.addEventListener("click", drawParticipant);
  els.spinWheelBtn.addEventListener("click", spinWheel);
  els.newRoundBtn.addEventListener("click", () => {
    clearRound();
    state.showResultModalOpen = false;
    toast("Nueva ronda lista");
    render();
  });
  els.finishEventBtn.addEventListener("click", () => {
    clearRound();
    state.showResultModalOpen = false;
    toast("Evento finalizado");
    render();
  });
  els.resetEventBtn.addEventListener("click", resetEvent);

  els.addModuleBtn.addEventListener("click", addModule);
  els.deleteModuleBtn.addEventListener("click", deleteModule);
  els.saveModuleNameBtn.addEventListener("click", saveModuleName);

  els.participantForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addParticipant(els.participantNameInput.value);
    els.participantNameInput.value = "";
  });

  els.bulkParticipantsBtn.addEventListener("click", () => {
    const names = els.bulkParticipantsInput.value.split(/\r?\n/).map(cleanText).filter(Boolean);
    names.forEach(addParticipant);
    els.bulkParticipantsInput.value = "";
    toast(`${names.length} participante(s) agregados`);
    render();
  });

  els.presentationImageInput.addEventListener("change", handlePresentationImage);
  els.presentationForm.addEventListener("submit", savePresentation);
  els.cancelPresentationEditBtn.addEventListener("click", clearPresentationForm);
  els.exportDataBtn.addEventListener("click", exportData);
  els.importDataInput.addEventListener("change", importData);
  els.clearLocalDataBtn.addEventListener("click", clearLocalData);
  els.resetAllDataBtn.addEventListener("click", resetAllData);
  els.clearHistoryBtn.addEventListener("click", clearHistory);

  document.getElementById("imgLightboxClose").addEventListener("click", closeImageLightbox);
  document.querySelector(".img-lightbox-backdrop").addEventListener("click", closeImageLightbox);
}

function render() {
  renderAudio();
  renderShowMode();
  renderViews();
  renderModules();
  renderEvent();
  renderControl();
  renderHistory();
}

function renderAudio() {
  els.body.classList.toggle("audio-off", !state.audioEnabled);
  els.audioLabel.textContent = state.audioEnabled ? "Audio" : "Silencio";
  els.audioToggle.title = state.audioEnabled ? "Audio activado" : "Audio desactivado";
  els.audioToggle.setAttribute("aria-label", els.audioToggle.title);
}

function renderShowMode() {
  els.body.classList.toggle("show-mode", state.showMode);
  els.showModeBtn.textContent = state.showMode ? "Vista normal" : "Vista show";
  els.showModeBtn.setAttribute("aria-label", state.showMode ? "Salir de vista show" : "Entrar a vista show");
  els.showModeBtn.setAttribute("aria-pressed", String(state.showMode));
  els.showExitBtn.hidden = !state.showMode;
  if (state.showMode && !state.showResultModalOpen) {
    resetStageScroll();
  }
  if (typeof syncShow === "function") {
    syncShow();
  }
}

function renderViews() {
  els.viewTabs.forEach((button) => button.classList.toggle("is-active", button.dataset.view === state.view));
  els.eventView.classList.toggle("is-visible", state.view === "event");
  els.controlView.classList.toggle("is-visible", state.view === "control");
  els.historyView.classList.toggle("is-visible", state.view === "history");
}

function setShowMode(enabled) {
  state.showMode = enabled;
  localStorage.setItem(SHOW_MODE_KEY, enabled ? "on" : "off");

  if (!enabled) {
    state.showResultModalOpen = false;
  }

  if (enabled) {
    state.view = "event";
    const fullscreenTarget = document.documentElement;
    if (!document.fullscreenElement && fullscreenTarget.requestFullscreen) {
      fullscreenTarget.requestFullscreen().catch(() => {});
    }
  } else if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }

  render();
}

function renderModules() {
  const module = activeModule();
  els.moduleSelect.innerHTML = state.data.modules.map((item) => {
    return `<option value="${escapeAttr(item.id)}"${item.id === module.id ? " selected" : ""}>${escapeHtml(item.name)}</option>`;
  }).join("");
}

function renderEvent() {
  const module = activeModule();
  const participants = module.participants;
  const presentations = module.presentations;
  const nextRound = module.history.length + 1;
  const participantsEnabled = state.eventMode.participants;
  const presentationsEnabled = state.eventMode.presentations;

  els.eventTitle.textContent = getEventTitle();
  els.roundCounter.textContent = nextRound;
  els.participantCount.textContent = participants.length;
  els.presentationCount.textContent = presentations.length;
  els.participantReadout.textContent = state.selectedParticipant?.name || state.suspenseLabel;
  els.presentationReadout.textContent = state.selectedPresentation?.title || state.suspenseLabel;
  els.winnerName.textContent = state.selectedParticipant?.name || state.suspenseLabel;
  els.winnerPresentation.textContent = state.selectedPresentation?.title || state.suspenseLabel;
  els.wheelCenterLabel.textContent = state.selectedPresentation ? "Resultado" : "PPI";

  renderParticipantField(participants);
  renderWheel(presentations);
  renderTopics();
  renderRecentHistory(module.history);
  renderEventMode();
  renderShowReveal(module);
  renderShowResultModal();

  els.drawParticipantBtn.hidden = !participantsEnabled;
  els.spinWheelBtn.hidden = !presentationsEnabled;
  els.playRoundBtn.disabled = state.rollingParticipant || state.rollingWheel || state.showSequenceRunning || !canPlayShowRound(module);
  els.drawParticipantBtn.disabled = !participantsEnabled || state.rollingParticipant || state.rollingWheel || !participants.length;
  els.spinWheelBtn.disabled = !presentationsEnabled || state.rollingParticipant || state.rollingWheel || !presentations.length || (participantsEnabled && !state.selectedParticipant);
}

function renderShowResultModal() {
  const isOpen = state.showMode && state.showResultModalOpen;
  const presentation = state.selectedPresentation;
  const imageSource = presentation?.image || presentation?.imagePath || "";

  els.showResultModal.classList.toggle("is-open", isOpen);
  els.showResultModal.setAttribute("aria-hidden", String(!isOpen));
  els.showResultParticipant.textContent = state.selectedParticipant?.name || "No aplica";
  els.showResultPpi.textContent = presentation?.doctor || presentation?.title || "No aplica";
  els.showResultSede.textContent = presentation?.sede ? `Sede: ${presentation.sede}` : "";
  els.showResultEspecialidad.textContent = presentation?.especialidad ? `Especialidad: ${presentation.especialidad}` : "";
  els.showResultCategoria.textContent = presentation?.categoria ? `Categoría: ${presentation.categoria}` : "";
  els.showResultImageWrap.classList.toggle("has-image", Boolean(imageSource));

  if (imageSource) {
    els.showResultImage.src = imageSource;
    els.showResultImage.hidden = false;
    els.showResultImageEmpty.hidden = true;
  } else {
    els.showResultImage.hidden = true;
    els.showResultImage.removeAttribute("src");
    els.showResultImageEmpty.hidden = false;
  }
}

function renderShowReveal(module = activeModule()) {
  const reveal = state.showReveal || defaultShowReveal(module);
  els.showReveal.classList.toggle("is-rolling", reveal.kind === "rolling");
  els.showReveal.classList.toggle("is-final", reveal.kind === "participant" || reveal.kind === "presentation");
  els.showReveal.classList.toggle("is-idle", reveal.kind === "idle");
  els.showRevealEyebrow.textContent = reveal.eyebrow;
  els.showRevealName.textContent = reveal.title;
  els.showRevealMeta.textContent = reveal.meta;
}

function defaultShowReveal(module) {
  if (state.rollingParticipant) {
    return {
      kind: "rolling",
      eyebrow: "Seleccionando participante",
      title: "Esferas en movimiento",
      meta: module.name
    };
  }
  if (state.rollingWheel) {
    return {
      kind: "rolling",
      eyebrow: "Girando ruleta PPI",
      title: "Ruleta en movimiento",
      meta: module.name
    };
  }
  if (state.selectedPresentation) {
    return {
      kind: "presentation",
      eyebrow: "PPI seleccionado",
      title: state.selectedPresentation.title,
      meta: state.selectedParticipant?.name || module.name
    };
  }
  if (state.selectedParticipant) {
    return {
      kind: "participant",
      eyebrow: "Participante seleccionado",
      title: state.selectedParticipant.name,
      meta: state.eventMode.presentations ? "Ahora va la ruleta PPI" : "Resultado final"
    };
  }
  return {
    kind: "idle",
    eyebrow: "Taller de exploración",
    title: "Listos para jugar",
    meta: module.name
  };
}

function setShowReveal(kind, eyebrow, title, meta) {
  state.showReveal = { kind, eyebrow, title, meta };
  renderShowReveal();
}

function openShowResultModal() {
  if (state.showMode) {
    state.showResultModalOpen = true;
  }
}

function closeShowResultModal() {
  state.showResultModalOpen = false;
  clearRound(false);
  render();
  resetStageScroll();
  window.requestAnimationFrame(resetStageScroll);
}

function resetStageScroll() {
  if (els.stageBand) {
    els.stageBand.scrollTop = 0;
    els.stageBand.scrollLeft = 0;
  }
}

function canPlayShowRound(module = activeModule()) {
  const needsParticipants = state.eventMode.participants;
  const needsPresentations = state.eventMode.presentations;
  return (!needsParticipants || module.participants.length > 0) && (!needsPresentations || module.presentations.length > 0);
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function randomSuspenseLabel() {
  return suspenseLabels[randomInt(suspenseLabels.length)] || "???";
}

function renderEventMode() {
  const participantsEnabled = state.eventMode.participants;
  const presentationsEnabled = state.eventMode.presentations;

  els.participantsModeBtn.classList.toggle("is-active", participantsEnabled);
  els.presentationsModeBtn.classList.toggle("is-active", presentationsEnabled);
  els.participantsModeBtn.setAttribute("aria-pressed", String(participantsEnabled));
  els.presentationsModeBtn.setAttribute("aria-pressed", String(presentationsEnabled));
  els.participantStage.hidden = !participantsEnabled;
  els.rouletteStage.hidden = !presentationsEnabled;
  els.winnerCard.hidden = !participantsEnabled;
  els.presentationCard.hidden = !presentationsEnabled;
  els.topicBox.hidden = !presentationsEnabled;
  els.stageGrid.classList.toggle("is-single", participantsEnabled !== presentationsEnabled);

  // Sync module cards
  els.participantsCardBtn.classList.toggle("is-active", participantsEnabled);
  els.presentationsCardBtn.classList.toggle("is-active", presentationsEnabled);
  els.participantsCardBtn.setAttribute("aria-pressed", String(participantsEnabled));
  els.presentationsCardBtn.setAttribute("aria-pressed", String(presentationsEnabled));
  els.participantsCardStatus.textContent = participantsEnabled ? "Activo" : "Inactivo";
  els.presentationsCardStatus.textContent = presentationsEnabled ? "Activo" : "Inactivo";
}

function getEventTitle() {
  if (state.eventMode.participants && state.eventMode.presentations) {
    return "Seleccionadas pantallas Participantes y PPI";
  }
  if (state.eventMode.participants) {
    return "Seleccionada pantalla Participantes";
  }
  return "Seleccionada pantalla PPI";
}

function setEventMode(kind, enabled) {
  if (!enabled && state.eventMode[kind] && activeModeCount() === 1) {
    toast("Debe quedar activo Personas o PPIs");
    return;
  }

  state.eventMode[kind] = enabled;
  if (!state.eventMode.participants && !state.eventMode.presentations) {
    state.eventMode[kind] = true;
  }
  clearRound();
  saveEventMode();
  render();
}

function activeModeCount() {
  return Number(state.eventMode.participants) + Number(state.eventMode.presentations);
}

function renderParticipantField(participants) {
  if (!participants.length) {
    els.participantField.classList.remove("is-dense");
    els.participantField.innerHTML = `<p class="empty-state">Agrega participantes en el panel para iniciar la dinámica.</p>`;
    return;
  }

  const stageParticipants = visibleStageParticipants(participants);
  els.participantField.classList.toggle("is-dense", stageParticipants.length > 10);
  els.participantField.innerHTML = stageParticipants.map((participant, index) => {
    const classes = [
      "participant-orb",
      state.rollingParticipant ? "is-rolling" : "",
      state.highlightedParticipantId === participant.id ? "is-highlighted" : "",
      state.selectedParticipant?.id === participant.id ? "is-winner" : ""
    ].filter(Boolean).join(" ");
    const label = formatParticipantOrbLabel(participant.name);
    return `<div class="${classes}" style="--orb-color: ${colors[index % colors.length]}" title="${escapeAttr(participant.name)}" aria-label="${escapeAttr(participant.name)}"><span class="orb-label">${escapeHtml(label)}</span></div>`;
  }).join("");
}

function formatParticipantOrbLabel(name) {
  const words = cleanText(name).split(/\s+/).filter(Boolean);
  if (!words.length) {
    return "";
  }
  return words[words.length - 1];
}

function visibleStageParticipants(participants) {
  const cap = 12;
  const visibleLimit = Math.min(cap, participants.length);
  const activeParticipantId = state.selectedParticipant?.id || state.highlightedParticipantId;
  const activeParticipant = participants.find((participant) => participant.id === activeParticipantId);
  const displayPool = state.rollingParticipant
    ? shuffle(participants.filter((participant) => participant.id !== activeParticipant?.id))
    : participants.filter((participant) => participant.id !== activeParticipant?.id);

  if (!activeParticipant) {
    return displayPool.slice(0, cap);
  }

  const spotlightSlot = normalizeVisibleParticipantSlot(state.participantSpotlightSlot, activeParticipant.id, visibleLimit);
  const visibleParticipants = [];
  for (let index = 0; index < visibleLimit; index += 1) {
    if (index === spotlightSlot) {
      visibleParticipants.push(activeParticipant);
      continue;
    }
    const nextParticipant = displayPool.shift();
    if (nextParticipant) {
      visibleParticipants.push(nextParticipant);
    }
  }
  return visibleParticipants;
}

function randomVisibleParticipantSlot(participants) {
  const visibleLimit = Math.min(12, participants.length);
  return visibleLimit > 1 ? 1 + randomInt(visibleLimit - 1) : 0;
}

function normalizeVisibleParticipantSlot(slot, participantId, visibleLimit) {
  if (visibleLimit <= 1) {
    return 0;
  }
  if (Number.isInteger(slot)) {
    return Math.min(Math.max(slot, 0), visibleLimit - 1);
  }
  return 1 + (stableHash(participantId) % (visibleLimit - 1));
}

function stableHash(value) {
  return cleanText(value).split("").reduce((hash, character) => {
    return ((hash << 5) - hash + character.charCodeAt(0)) >>> 0;
  }, 0);
}

function renderWheel(presentations) {
  const gradient = buildWheelGradient(presentations.length || 6);
  els.wheel.style.setProperty("--wheel-bg", gradient);
  els.wheel.style.setProperty("--wheel-rotation", `${state.wheelRotation}deg`);
}

function buildWheelGradient(count) {
  const safeCount = Math.max(count, 1);
  const step = 360 / safeCount;
  const stops = [];
  for (let index = 0; index < safeCount; index += 1) {
    const start = Math.round(index * step * 100) / 100;
    const end = Math.round((index + 1) * step * 100) / 100;
    stops.push(`${colors[index % colors.length]} ${start}deg ${end}deg`);
  }
  return `conic-gradient(${stops.join(", ")})`;
}

function renderTopics() {
  const presentation = state.selectedPresentation;
  const topics = presentation?.topics || [];
  const imageSource = presentation?.image || presentation?.imagePath || "";
  els.topicBox.classList.toggle("has-image", Boolean(imageSource));
  els.topicList.innerHTML = topics.length
    ? topics.map((topic) => `<li>${escapeHtml(topic)}</li>`).join("")
    : imageSource
      ? `<li>Imagen PPI asociada</li>`
      : `<li>Sin temas capturados</li>`;

  if (imageSource) {
    els.presentationImage.src = imageSource;
    els.presentationImage.hidden = false;
  } else {
    els.presentationImage.hidden = true;
    els.presentationImage.removeAttribute("src");
  }
}

function renderRecentHistory(history) {
  const recent = history.slice(-5).reverse();
  els.recentHistoryList.innerHTML = recent.length
    ? recent.map((entry) => `<li>${escapeHtml(formatHistorySummary(entry))}</li>`).join("")
    : `<li>Sin rondas registradas</li>`;
}

function formatHistorySummary(entry) {
  const participant = cleanText(entry.participantName);
  const presentation = cleanText(entry.presentationTitle);
  if (participant && presentation && participant !== "No aplica" && presentation !== "No aplica") {
    return `${participant} - ${presentation}`;
  }
  if (participant && participant !== "No aplica") {
    return participant;
  }
  if (presentation && presentation !== "No aplica") {
    return presentation;
  }
  return "Ronda sin resultado";
}

function renderControl() {
  const module = activeModule();
  els.moduleNameInput.value = module.name;
  els.activeModuleMeta.textContent = `${module.participants.length} participantes / ${module.presentations.length} PPIs`;
  els.participantAdminCount.textContent = module.participants.length;
  els.presentationAdminCount.textContent = module.presentations.length;

  els.moduleList.innerHTML = state.data.modules.map((item) => `
    <div class="row-item ${item.id === module.id ? "is-active" : ""}">
      <div class="row-title">
        <strong>${escapeHtml(item.name)}</strong>
        <span>${item.participants.length} participantes, ${item.presentations.length} PPIs</span>
      </div>
      <div class="row-actions">
        <button class="quiet-action" type="button" data-select-module="${escapeAttr(item.id)}">Usar</button>
      </div>
    </div>
  `).join("");

  els.participantsList.innerHTML = module.participants.length
    ? module.participants.map((participant) => `
      <div class="row-item">
        <div class="row-title"><strong>${escapeHtml(participant.name)}</strong></div>
        <div class="row-actions">
          <button class="quiet-action" type="button" data-remove-participant="${escapeAttr(participant.id)}">Quitar</button>
        </div>
      </div>
    `).join("")
    : `<p class="empty-state">Sin participantes registrados.</p>`;

  els.presentationsList.innerHTML = module.presentations.length
    ? module.presentations.map((presentation) => {
      const lines = [];
      if (presentation.sede) lines.push(`Sede: ${escapeHtml(presentation.sede)}`);
      if (presentation.especialidad) lines.push(`Especialidad: ${escapeHtml(presentation.especialidad)}`);
      if (presentation.categoria) lines.push(`Categoría: ${escapeHtml(presentation.categoria)}`);
      const imgSrc = presentation.image || presentation.imagePath || "";
      return `
      <div class="row-item">
        ${imgSrc ? `<img class="row-thumb" src="${escapeAttr(imgSrc)}" alt="">` : `<span class="row-thumb row-thumb--empty"></span>`}
        <div class="row-title">
          <strong>${escapeHtml(presentation.title)}</strong>
          ${lines.length ? `<span>${lines.join("<br>")}</span>` : `<span>${presentation.topics.length} temas</span>`}
        </div>
        <div class="row-actions">
          <button class="secondary-action" type="button" data-edit-presentation="${escapeAttr(presentation.id)}">Editar</button>
          <button class="quiet-action" type="button" data-remove-presentation="${escapeAttr(presentation.id)}">Quitar</button>
        </div>
      </div>`;
    }).join("")
    : `<p class="empty-state">Sin PPIs registrados.</p>`;

  bindDynamicControlButtons();
}

function bindDynamicControlButtons() {
  document.querySelectorAll("[data-select-module]").forEach((button) => {
    button.addEventListener("click", () => {
      state.data.activeModuleId = button.dataset.selectModule;
      clearRound();
      saveData();
      render();
    });
  });

  document.querySelectorAll("[data-remove-participant]").forEach((button) => {
    button.addEventListener("click", () => removeParticipant(button.dataset.removeParticipant));
  });

  document.querySelectorAll("[data-edit-presentation]").forEach((button) => {
    button.addEventListener("click", () => editPresentation(button.dataset.editPresentation));
  });

  document.querySelectorAll("[data-remove-presentation]").forEach((button) => {
    button.addEventListener("click", () => removePresentation(button.dataset.removePresentation));
  });

  document.querySelectorAll(".row-thumb[src]").forEach((thumb) => {
    thumb.addEventListener("click", () => openImageLightbox(thumb.src));
  });
}

function renderHistory() {
  const module = activeModule();
  els.historyTableBody.innerHTML = module.history.length
    ? module.history.slice().reverse().map((entry) => `
      <tr>
        <td>${entry.round}</td>
        <td>${escapeHtml(entry.participantName)}</td>
        <td>${escapeHtml(entry.presentationTitle)}</td>
        <td>${formatDate(entry.createdAt)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="4">Sin rondas registradas.</td></tr>`;
}

async function playShowRound() {
  const module = activeModule();
  if (state.rollingParticipant || state.rollingWheel || state.showSequenceRunning) {
    return;
  }
  if (!canPlayShowRound(module)) {
    toast("Faltan datos para jugar la ronda");
    return;
  }

  state.showSequenceRunning = true;
  clearRound(false);
  setShowReveal("idle", "Nueva ronda", "Listos para jugar", module.name);
  render();
  await delay(260);

  try {
    if (state.eventMode.participants) {
      const participant = await drawParticipant();
      if (!participant) {
        return;
      }
      if (state.eventMode.presentations) {
        await delay(720);
      }
    }

    if (state.eventMode.presentations) {
      await spinWheel();
    }
  } finally {
    state.showSequenceRunning = false;
    render();
  }
}

function drawParticipant() {
  const module = activeModule();
  if (!state.eventMode.participants) {
    toast("Activa Personas para sortear participantes");
    return Promise.resolve(null);
  }
  if (!module.participants.length) {
    toast("Agrega participantes antes de sortear");
    return Promise.resolve(null);
  }
  if (state.rollingParticipant || state.rollingWheel) {
    return Promise.resolve(null);
  }

  clearRound(false);
  state.participantSpotlightSlot = randomVisibleParticipantSlot(module.participants);
  state.rollingParticipant = true;
  setShowReveal("rolling", "Seleccionando participante", "Esferas en movimiento", module.name);
  playSound("suspense");
  render();

  return new Promise((resolve) => {
    let ticks = 0;
    const ticker = window.setInterval(() => {
      const preview = randomItem(module.participants);
      state.highlightedParticipantId = preview.id;
      setShowReveal("rolling", "Seleccionando participante", preview.name, "Las esferas están en movimiento");
      renderParticipantField(module.participants);
      ticks += 1;
      if (ticks % 4 === 0) {
        playSound("tick");
      }
      if (ticks >= 24) {
        window.clearInterval(ticker);
        state.selectedParticipant = drawFromBag("participants", module, module.participants, getPreviousParticipantId(module));
        state.participantSpotlightSlot = randomVisibleParticipantSlot(module.participants);
        state.lastParticipantId = state.selectedParticipant.id;
        state.highlightedParticipantId = state.selectedParticipant.id;
        state.rollingParticipant = false;
        setShowReveal(
          "participant",
          "Participante seleccionado",
          state.selectedParticipant.name,
          state.eventMode.presentations ? "Ahora va la ruleta PPI" : "Resultado final"
        );
        if (!state.eventMode.presentations) {
          recordRound();
          openShowResultModal();
        }
        playSound("win");
        burstConfetti();
        render();
        resolve(state.selectedParticipant);
      }
    }, 90);
  });
}

function spinWheel() {
  const module = activeModule();
  if (!state.eventMode.presentations) {
    toast("Activa PPIs para girar la ruleta");
    return Promise.resolve(null);
  }
  if (state.eventMode.participants && !state.selectedParticipant) {
    toast("Primero sortea un participante");
    return Promise.resolve(null);
  }
  if (!module.presentations.length) {
    toast("Agrega PPIs antes de girar");
    return Promise.resolve(null);
  }
  if (state.rollingParticipant || state.rollingWheel) {
    return Promise.resolve(null);
  }

  const winner = drawFromBag("presentations", module, module.presentations, getPreviousPresentationId(module));
  const winnerIndex = module.presentations.findIndex((presentation) => presentation.id === winner.id);
  const segment = 360 / module.presentations.length;
  const targetCenter = winnerIndex * segment + segment / 2;
  const correction = normalizeDegrees(360 - targetCenter);
  const currentRotation = normalizeDegrees(state.wheelRotation);
  const rotationDelta = normalizeDegrees(correction - currentRotation);

  state.rollingWheel = true;
  state.selectedPresentation = null;
  state.wheelRotation += 1440 + rotationDelta;
  setShowReveal("rolling", "Girando ruleta PPI", "Ruleta en movimiento", state.selectedParticipant?.name || module.name);
  playSound("spin");
  render();

  return new Promise((resolve) => {
    let ticks = 0;
    const revealTicker = window.setInterval(() => {
      const preview = randomItem(module.presentations);
      setShowReveal("rolling", "Girando ruleta PPI", preview.title, "El PPI se está seleccionando");
      ticks += 1;
      if (ticks % 3 === 0) {
        playSound("tick");
      }
    }, 150);

    window.setTimeout(() => {
      window.clearInterval(revealTicker);
      state.selectedPresentation = winner;
      state.lastPresentationId = winner.id;
      state.rollingWheel = false;
      const metaParts = [winner.especialidad, winner.sede, winner.categoria].filter(Boolean).join(" · ");
      setShowReveal("presentation", "PPI seleccionado", winner.title, metaParts || state.selectedParticipant?.name || "Resultado final");
      recordRound();
      openShowResultModal();
      playSound("win");
      burstConfetti();
      render();
      resolve(winner);
    }, 4100);
  });
}

function recordRound() {
  const module = activeModule();
  if (state.eventMode.participants && !state.selectedParticipant) {
    return;
  }
  if (state.eventMode.presentations && !state.selectedPresentation) {
    return;
  }

  module.history.push({
    id: createId("ronda"),
    round: module.history.length + 1,
    participantName: state.selectedParticipant?.name || "No aplica",
    presentationTitle: state.selectedPresentation?.title || "No aplica",
    createdAt: new Date().toISOString()
  });
  saveData();
}

function clearRound(resetWheel = true) {
  state.rollingParticipant = false;
  state.rollingWheel = false;
  state.showResultModalOpen = false;
  state.highlightedParticipantId = null;
  state.participantSpotlightSlot = null;
  state.selectedParticipant = null;
  state.selectedPresentation = null;
  state.showReveal = null;
  state.suspenseLabel = randomSuspenseLabel();
  if (resetWheel) {
    state.wheelRotation = 0;
  }
}

function resetEvent() {
  const module = activeModule();
  if (!window.confirm(`¿Reiniciar la dinámica de "${module.name}" y limpiar su historial?`)) {
    return;
  }
  module.history = [];
  resetDrawBags(module.id);
  clearRound();
  saveData();
  toast("Dinámica reiniciada");
  render();
}

function addModule() {
  const module = {
    id: createId("modulo"),
    name: `Módulo ${state.data.modules.length + 1}`,
    participants: [],
    presentations: [],
    history: []
  };
  state.data.modules.push(module);
  state.data.activeModuleId = module.id;
  clearRound();
  saveData();
  toast("Módulo agregado");
  render();
}

function deleteModule() {
  if (state.data.modules.length <= 1) {
    toast("Debe existir al menos un módulo");
    return;
  }
  const module = activeModule();
  if (!window.confirm(`¿Eliminar "${module.name}"?`)) {
    return;
  }
  state.data.modules = state.data.modules.filter((item) => item.id !== module.id);
  state.data.activeModuleId = state.data.modules[0].id;
  clearRound();
  saveData();
  toast("Módulo eliminado");
  render();
}

function saveModuleName() {
  const module = activeModule();
  const name = cleanText(els.moduleNameInput.value);
  if (!name) {
    toast("Escribe un nombre de módulo");
    return;
  }
  module.name = name;
  saveData();
  toast("Módulo actualizado");
  render();
}

function addParticipant(name) {
  const cleanName = cleanText(name);
  if (!cleanName) {
    return;
  }
  activeModule().participants.push({ id: createId("participante"), name: cleanName });
  saveData();
  render();
}

function removeParticipant(id) {
  const module = activeModule();
  module.participants = module.participants.filter((participant) => participant.id !== id);
  if (state.selectedParticipant?.id === id) {
    state.selectedParticipant = null;
  }
  saveData();
  render();
}

function openImageLightbox(src) {
  const lb = document.getElementById("imgLightbox");
  const img = document.getElementById("imgLightboxImg");
  img.src = src;
  lb.hidden = false;
}

function closeImageLightbox() {
  const lb = document.getElementById("imgLightbox");
  lb.hidden = true;
  document.getElementById("imgLightboxImg").removeAttribute("src");
}

function handlePresentationImage(event) {
  const file = event.target.files[0];
  state.pendingImageData = "";
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    state.pendingImageData = reader.result;
    toast("Imagen cargada");
  };
  reader.readAsDataURL(file);
}

function savePresentation(event) {
  event.preventDefault();
  const module = activeModule();
  const title = cleanText(els.presentationTitleInput.value);
  const topics = els.presentationTopicsInput.value.split(/\r?\n/).map(cleanText).filter(Boolean);
  if (!title) {
    toast("Escribe el nombre del PPI");
    return;
  }

  const doctor = cleanText(els.presentationDoctorInput.value);
  const sede = cleanText(els.presentationSedeInput.value);
  const especialidad = cleanText(els.presentationEspecialidadInput.value);
  const categoria = cleanText(els.presentationCategoriaInput.value);

  if (state.editingPresentationId) {
    const presentation = module.presentations.find((item) => item.id === state.editingPresentationId);
    if (presentation) {
      presentation.title = title;
      presentation.doctor = doctor;
      presentation.sede = sede;
      presentation.especialidad = especialidad;
      presentation.categoria = categoria;
      presentation.topics = topics;
      if (state.pendingImageData) {
        presentation.image = state.pendingImageData;
        presentation.imagePath = "";
      }
    }
    toast("PPI actualizado");
  } else {
    module.presentations.push({
      id: createId("ppt"),
      title,
      doctor,
      sede,
      especialidad,
      categoria,
      topics,
      image: state.pendingImageData,
      imagePath: ""
    });
    toast("PPI agregado");
  }

  clearPresentationForm();
  saveData();
  render();
}

function editPresentation(id) {
  const presentation = activeModule().presentations.find((item) => item.id === id);
  if (!presentation) {
    return;
  }
  state.editingPresentationId = id;
  state.pendingImageData = "";
  els.presentationTitleInput.value = presentation.title;
  els.presentationDoctorInput.value = presentation.doctor || "";
  els.presentationSedeInput.value = presentation.sede || "";
  els.presentationEspecialidadInput.value = presentation.especialidad || "";
  els.presentationCategoriaInput.value = presentation.categoria || "";
  els.presentationTopicsInput.value = presentation.topics.join("\n");
  els.presentationImageInput.value = "";
  els.savePresentationBtn.textContent = "Actualizar PPI";
  els.cancelPresentationEditBtn.hidden = false;
  els.presentationTitleInput.focus();
}

function removePresentation(id) {
  const module = activeModule();
  module.presentations = module.presentations.filter((presentation) => presentation.id !== id);
  if (state.selectedPresentation?.id === id) {
    state.selectedPresentation = null;
  }
  saveData();
  render();
}

function clearPresentationForm() {
  state.editingPresentationId = null;
  state.pendingImageData = "";
  els.presentationForm.reset();
  els.savePresentationBtn.textContent = "Guardar PPI";
  els.cancelPresentationEditBtn.hidden = true;
}

function exportData() {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ruleta-show-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      state.data = normalizeData(JSON.parse(reader.result));
      resetDrawBags();
      clearRound();
      saveData();
      toast("Datos importados");
      render();
    } catch {
      toast("El JSON no tiene un formato válido");
    }
    els.importDataInput.value = "";
  };
  reader.readAsText(file);
}

async function clearLocalData() {
  if (!window.confirm("¿Borrar cambios locales y volver a la base inicial?")) {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
  state.data = await loadData();
  resetDrawBags();
  clearRound();
  toast("Cambios locales borrados");
  render();
}

function resetAllData() {
  if (!window.confirm("⚠️ ¿Estás seguro?\n\nEsto borrará TODOS los datos guardados (módulos, participantes, historial) y recargará la página desde cero.\n\nEsta acción no se puede deshacer.")) {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

function clearHistory() {
  const module = activeModule();
  if (!module.history.length) {
    toast("No hay historial por limpiar");
    return;
  }
  if (!window.confirm(`¿Limpiar historial de "${module.name}"?`)) {
    return;
  }
  module.history = [];
  saveData();
  render();
}

function randomItem(items) {
  return items[randomInt(items.length)];
}

function shuffle(items) {
  const copy = items.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function drawFromBag(kind, module, items, avoidId = null) {
  if (!items.length) {
    return null;
  }

  const bags = state.drawBags[kind];
  const validIds = new Set(items.map((item) => item.id));
  let bag = bags.get(module.id) || [];
  bag = bag.filter((id) => validIds.has(id));

  if (!bag.length) {
    bag = shuffle(items.map((item) => item.id));
    if (avoidId && bag.length > 1 && bag[0] === avoidId) {
      const swapIndex = bag.findIndex((id) => id !== avoidId);
      [bag[0], bag[swapIndex]] = [bag[swapIndex], bag[0]];
    }
  }

  const winnerId = bag.shift();
  bags.set(module.id, bag);
  return items.find((item) => item.id === winnerId) || items[0];
}

function getPreviousParticipantId(module) {
  if (state.lastParticipantId) {
    return state.lastParticipantId;
  }
  const previousName = module.history.at(-1)?.participantName;
  return module.participants.find((participant) => participant.name === previousName)?.id || null;
}

function getPreviousPresentationId(module) {
  if (state.lastPresentationId) {
    return state.lastPresentationId;
  }
  const previousTitle = module.history.at(-1)?.presentationTitle;
  return module.presentations.find((presentation) => presentation.title === previousTitle)?.id || null;
}

function resetDrawBags(moduleId = null) {
  if (moduleId) {
    state.drawBags.participants.delete(moduleId);
    state.drawBags.presentations.delete(moduleId);
  } else {
    state.drawBags.participants.clear();
    state.drawBags.presentations.clear();
  }
  state.lastParticipantId = null;
  state.lastPresentationId = null;
}

function randomInt(max) {
  if (max <= 1) {
    return 0;
  }

  const cryptoSource = window.crypto || window.msCrypto;
  if (cryptoSource?.getRandomValues && max <= 0x100000000) {
    const values = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / max) * max;
    let value;
    do {
      cryptoSource.getRandomValues(values);
      value = values[0];
    } while (value >= limit);
    return value % max;
  }

  return Math.floor(Math.random() * max);
}

function normalizeDegrees(degrees) {
  return ((degrees % 360) + 360) % 360;
}

/* ===== SISTEMA DE AUDIO POR CAPAS =====
   Capa 1 – Background (loop): Everlasting Style, vol bajo, siempre en show mode
   Capa 2 – Incidentales: sonidos de escena (esferas, ruleta, transiciones)
   Capa 3 – SFX: efectos puntuales (win, tick)
*/

const audioLayers = {
  bg: null,        // background loop
  sphereMusic: null, // Inspiring Success (esferas)
  sphereTimer: null, // Game Timer loop (esferas)
  wheelSpin: null,   // Electronic Wheel Spin
  transition: null,  // GameRewardTransition
  victory: null      // Inspiring Victory (resultado)
};

const VOL = {
  bg: 0.25,
  sphereMusic: 0.45,
  sphereTimer: 0.30,
  wheelSpin: 0.50,
  transition: 0.40,
  win: 0.55,
  victory: 0.65,
  tick: 0.10
};

function startBgMusic() {
  if (audioLayers.bg) return;
  const audio = new Audio("assets/audio/MA_Sound_Gallery_The Everlasting Style_0-33_01.mp3");
  audio.loop = true;
  audio.volume = VOL.bg;
  audio.play().catch(() => {});
  audioLayers.bg = audio;
}

function stopBgMusic() {
  if (audioLayers.bg) {
    audioLayers.bg.pause();
    audioLayers.bg.currentTime = 0;
    audioLayers.bg = null;
  }
}

function fadeOutAudio(audio, duration) {
  if (!audio) return;
  // Limpiar fade previo si existe
  if (audio._fadeInterval) {
    clearInterval(audio._fadeInterval);
    audio._fadeInterval = null;
  }
  if (audio.paused || audio.volume <= 0.01) {
    try { audio.pause(); } catch (_) {}
    return;
  }
  const step = 0.02;
  const steps = Math.max(1, audio.volume / step);
  const interval = Math.max(10, duration / steps);
  audio._fadeInterval = setInterval(() => {
    if (audio.volume > step) {
      audio.volume = Math.max(0, audio.volume - step);
    } else {
      audio.volume = 0;
      audio.pause();
      audio.currentTime = 0;
      clearInterval(audio._fadeInterval);
      audio._fadeInterval = null;
    }
  }, interval);
}

function startSphereAudio() {
  if (!state.audioEnabled) return;
  // Detener previos si existen (retry) — corte inmediato
  stopSphereAudio(true);
  // Capa: Inspiring Success
  const music = new Audio("assets/audio/Inspiring Success.wav");
  music.volume = VOL.sphereMusic;
  music.play().catch(() => {});
  audioLayers.sphereMusic = music;
  // Capa: Game Timer loop
  const timer = new Audio("assets/audio/MA_Tuttkile_GameTimer_5_Loop.wav");
  timer.loop = true;
  timer.volume = VOL.sphereTimer;
  timer.play().catch(() => {});
  audioLayers.sphereTimer = timer;
}

function stopSphereAudio(immediate) {
  if (audioLayers.sphereMusic) {
    if (immediate) {
      audioLayers.sphereMusic.pause();
      audioLayers.sphereMusic.currentTime = 0;
    } else {
      fadeOutAudio(audioLayers.sphereMusic, 400);
    }
    audioLayers.sphereMusic = null;
  }
  if (audioLayers.sphereTimer) {
    if (immediate) {
      audioLayers.sphereTimer.pause();
      audioLayers.sphereTimer.currentTime = 0;
    } else {
      fadeOutAudio(audioLayers.sphereTimer, 400);
    }
    audioLayers.sphereTimer = null;
  }
}

function startWheelAudio() {
  if (!state.audioEnabled) return;
  // Detener previo si existe (retry)
  stopWheelAudio();
  const spin = new Audio("assets/audio/Electronic Wheel Spin 5 sec.wav");
  spin.volume = VOL.wheelSpin;
  spin.play().catch(() => {});
  audioLayers.wheelSpin = spin;
}

function stopWheelAudio() {
  if (audioLayers.wheelSpin) {
    audioLayers.wheelSpin.pause();
    audioLayers.wheelSpin.currentTime = 0;
    audioLayers.wheelSpin = null;
  }
}

function playTransitionSound() {
  if (!state.audioEnabled) return;
  // Detener transición previa si aún suena
  if (audioLayers.transition) {
    audioLayers.transition.pause();
    audioLayers.transition.currentTime = 0;
  }
  const t = new Audio("assets/audio/MA_Tuttkile_GameRewardTransition_1.wav");
  t.volume = VOL.transition;
  t.play().catch(() => {});
  audioLayers.transition = t;
}

function startVictoryAudio() {
  if (!state.audioEnabled) return;
  stopVictoryAudio();
  const v = new Audio("assets/audio/Inspiring Victory.wav");
  v.loop = false;
  v.volume = VOL.victory;
  v.play().catch(() => {});
  audioLayers.victory = v;
}

function stopVictoryAudio() {
  if (audioLayers.victory) {
    audioLayers.victory.pause();
    audioLayers.victory.currentTime = 0;
    audioLayers.victory = null;
  }
}

function playSound(name) {
  if (!state.audioEnabled) return;

  if (name === "suspense") {
    startSphereAudio();
    return;
  }
  if (name === "spin") {
    startWheelAudio();
    return;
  }
  if (name === "win") {
    stopSphereAudio();
    stopWheelAudio();
    const audio = new Audio("assets/audio/Inspiring Complete.wav");
    audio.volume = VOL.win;
    audio.play().catch(() => synthSound(name));
    return;
  }
  if (name === "victory") {
    startVictoryAudio();
    return;
  }
  if (name === "transition") {
    playTransitionSound();
    return;
  }
  // tick - sintetizado
  synthSound(name);
}

function stopAllIncidentals() {
  stopSphereAudio(true);
  stopWheelAudio();
  stopVictoryAudio();
  if (audioLayers.transition) {
    audioLayers.transition.pause();
    audioLayers.transition.currentTime = 0;
    audioLayers.transition = null;
  }
}

function synthSound(name) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;
  if (name === "tick") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(740, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.045);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(VOL.tick, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    osc.start(now);
    osc.stop(now + 0.1);
    return;
  }
  osc.type = name === "win" ? "triangle" : "sawtooth";
  osc.frequency.setValueAtTime(name === "win" ? 520 : 140, now);
  osc.frequency.exponentialRampToValueAtTime(name === "win" ? 920 : 260, now + 0.22);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
  osc.start(now);
  osc.stop(now + 0.42);
}

function burstConfetti() {
  const pieces = 42;
  els.confetti.innerHTML = "";
  for (let index = 0; index < pieces; index += 1) {
    const piece = document.createElement("i");
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[index % colors.length];
    piece.style.animationDelay = `${Math.random() * 240}ms`;
    piece.style.transform = `rotate(${Math.random() * 180}deg)`;
    els.confetti.appendChild(piece);
  }
  window.setTimeout(() => {
    els.confetti.innerHTML = "";
  }, 2000);
}

let toastTimer = null;
function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    els.toast.classList.remove("is-visible");
  }, 2200);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return cleanText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}
