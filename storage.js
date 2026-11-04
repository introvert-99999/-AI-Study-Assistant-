// storage.js - everything that touches localStorage lives here.
const KEYS = { theme: "sa_theme", apiKey: "sa_api_key", history: "sa_history" };

export const getTheme = () => localStorage.getItem(KEYS.theme) || "light";
export const setTheme = (t) => localStorage.setItem(KEYS.theme, t);

export const getKey = () => localStorage.getItem(KEYS.apiKey) || "";
export const setKey = (k) => localStorage.setItem(KEYS.apiKey, k);
export const removeKey = () => localStorage.removeItem(KEYS.apiKey);

export function getHistory() {
  try { return JSON.parse(localStorage.getItem(KEYS.history)) || []; }
  catch { return []; } // corrupted data: start fresh instead of crashing
}
const saveHistory = (list) => localStorage.setItem(KEYS.history, JSON.stringify(list));

export function addHistory(item) {
  const entry = { id: Date.now(), date: new Date().toLocaleString(), ...item };
  saveHistory([entry, ...getHistory()].slice(0, 20)); // keep the latest 20
  return entry;
}
export const removeHistory = (id) => saveHistory(getHistory().filter((h) => h.id !== id));
export const clearHistory = () => localStorage.removeItem(KEYS.history);