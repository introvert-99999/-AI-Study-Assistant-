// app.js - wires the buttons to the other modules.
import { generate } from "./api.js";
import * as store from "./storage.js";
import * as ui from "./ui.js";

const $ = (id) => document.getElementById(id);
const MAX_CHARS = 8000;
let current = null; // the generation currently on screen

function updateCount() {
  const n = $("notes").value.length;
  $("count").textContent = `${n} / ${MAX_CHARS} characters`;
  $("count").classList.toggle("warn", n > MAX_CHARS);
}

function refreshHistory() {
  ui.renderHistory(store.getHistory(), openFromHistory, (id) => { store.removeHistory(id); refreshHistory(); });
}

function openFromHistory(item) {
  current = item;
  $("notes").value = item.notes;
  updateCount();
  ui.renderAll(item);
  ui.setStatus("Loaded from history.", "ok");
}

async function onGenerate() {
  const notes = $("notes").value.trim();
  const key = store.getKey();
  if (!key) {
    $("settings").hidden = false;
    $("keyInput").focus();
    return ui.setStatus("Add your API key in Settings first.", "error");
  }
  if (!notes) return ui.setStatus("Please type a topic or paste some notes first.", "error");
  if (notes.length > MAX_CHARS) return ui.setStatus(`Notes are too long. Keep them under ${MAX_CHARS} characters.`, "error");

  ui.setBusy(true);
  ui.setStatus("Asking the AI... this can take a few seconds.");
  try {
    const data = await generate(key, notes, $("style").value, $("level").value);
    current = store.addHistory({ title: notes.split("\n")[0].slice(0, 50), notes, ...data });
    ui.renderAll(data);
    refreshHistory();
    ui.setStatus("Done! Your study material is ready.", "ok");
  } catch (err) {
    ui.setStatus(err.message || "Something went wrong.", "error");
  } finally {
    ui.setBusy(false);
  }
}

// --- events ---
$("generate").addEventListener("click", onGenerate);
$("notes").addEventListener("input", updateCount);
$("tabs").addEventListener("click", (e) => { const t = e.target.closest(".tab"); if (t) ui.showTab(t.dataset.tab); });

$("themeBtn").addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  store.setTheme(next);
  ui.applyTheme(next);
});

$("settingsBtn").addEventListener("click", () => {
  const box = $("settings");
  box.hidden = !box.hidden;
  $("settingsBtn").setAttribute("aria-expanded", !box.hidden);
});
$("saveKey").addEventListener("click", () => {
  const k = $("keyInput").value.trim();
  if (!k) return ui.setStatus("Paste a key first.", "error");
  store.setKey(k);
  ui.setStatus("API key saved in this browser.", "ok");
});
$("removeKey").addEventListener("click", () => { store.removeKey(); $("keyInput").value = ""; ui.setStatus("API key removed.", "ok"); });

$("copy").addEventListener("click", async () => {
  if (!current) return;
  try { await navigator.clipboard.writeText(current.summary); ui.setStatus("Summary copied.", "ok"); }
  catch { ui.setStatus("Could not copy. Select the text and copy it manually.", "error"); }
});
$("download").addEventListener("click", () => {
  if (!current) return;
  const link = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([current.summary], { type: "text/plain" })),
    download: "summary.txt",
  });
  link.click();
  URL.revokeObjectURL(link.href);
});
$("speak").addEventListener("click", () => {
  if (!current) return;
  if (!("speechSynthesis" in window)) return ui.setStatus("Your browser cannot read aloud.", "error");
  if (speechSynthesis.speaking) return speechSynthesis.cancel(); // click again to stop
  speechSynthesis.speak(new SpeechSynthesisUtterance(current.summary));
});
$("clearHist").addEventListener("click", () => {
  if (confirm("Delete all saved history?")) { store.clearHistory(); refreshHistory(); }
});

// --- start ---
ui.applyTheme(store.getTheme());
$("keyInput").value = store.getKey();
updateCount();
refreshHistory();