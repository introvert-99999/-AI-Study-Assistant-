// ui.js - everything that draws on the page. Uses textContent (never innerHTML) so AI text can't inject HTML.
const $ = (id) => document.getElementById(id);

// Tiny helper: el("button", {className:"x"}, "text", childNode)
const el = (tag, props = {}, ...kids) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...kids);
  return node;
};

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $("themeBtn").textContent = theme === "dark" ? "Light" : "Dark";
}

export function setStatus(msg, type = "") { $("status").textContent = msg; $("status").className = type; }

export function setBusy(busy) {
  $("generate").disabled = busy; // stops double clicks
  $("generate").textContent = busy ? "Generating..." : "Generate study material";
}

export function showTab(name) {
  document.querySelectorAll(".tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.tab === name);
    t.setAttribute("aria-selected", t.dataset.tab === name);
  });
  document.querySelectorAll(".panel").forEach((p) => (p.hidden = p.id !== "panel-" + name));
}

export function renderAll(data) {
  $("results").hidden = false;
  $("summary").replaceChildren(...data.summary.split(/\n+/).map((p) => el("p", { textContent: p })));
  renderQuiz(data.quiz);
  $("cards").replaceChildren(...data.flashcards.map(flashcard));
  showTab("summary");
}

function flashcard(c) {
  const card = el("button", { type: "button", className: "flip", title: "Flip card" },
    el("span", { className: "face front", textContent: c.front }),
    el("span", { className: "face back", textContent: c.back }));
  card.addEventListener("click", () => card.classList.toggle("flipped"));
  return card;
}

function renderQuiz(questions) {
  let score = 0, answered = 0;
  const board = el("p", { className: "score", textContent: `Score: 0 / ${questions.length}` });

  const blocks = questions.map((q, i) => {
    const note = el("p", { className: "muted" });
    const buttons = q.options.map((text) => el("button", { type: "button", className: "opt", textContent: text }));
    buttons.forEach((btn, j) => btn.addEventListener("click", () => {
      buttons.forEach((b) => (b.disabled = true)); // one answer per question
      buttons[q.answerIndex].classList.add("right");
      if (j === q.answerIndex) score++; else btn.classList.add("wrong");
      note.textContent = q.explanation || "";
      board.textContent = `Score: ${score} / ${questions.length}`;
      if (++answered === questions.length) {
        const pct = Math.round((score / questions.length) * 100);
        board.textContent += ` (${pct}%) - ${pct >= 80 ? "Great job!" : pct >= 50 ? "Good effort, review the missed ones." : "Keep studying and try again."}`;
      }
    }));
    return el("div", { className: "q" }, el("strong", { textContent: `${i + 1}. ${q.question}` }), ...buttons, note);
  });

  const retry = el("button", { type: "button", className: "ghost", textContent: "Retry quiz" });
  retry.addEventListener("click", () => renderQuiz(questions));
  $("quiz").replaceChildren(board, ...blocks, retry);
}

export function renderHistory(items, onOpen, onDelete) {
  $("clearHist").hidden = !items.length;
  const rows = items.map((h) => el("li", {},
    el("button", { type: "button", onclick: () => onOpen(h) }, h.title, el("small", { textContent: h.date })),
    el("button", { type: "button", className: "ghost", title: "Delete this entry", textContent: "x", onclick: () => onDelete(h.id) })));
  $("history").replaceChildren(...(rows.length ? rows : [el("li", { className: "muted", textContent: "Nothing saved yet. Generate something and it will appear here." })]));
}