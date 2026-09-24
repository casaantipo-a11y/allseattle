import { CONTEST_ENTRIES, getVotes, incrementVote, hasVoted, resetVotes } from "../mock-data/contest.js";

function entryTemplate(entry) {
  const votes = getVotes(entry.id, entry.baseVotes);
  const voted = hasVoted(entry.id);
  return `
  <article class="card contest-card" data-entry="${entry.id}">
    <span class="contest-badge">Entry</span>
    <div class="contest-card-photo"><img src="${entry.photo}" alt="${entry.title}" loading="lazy"></div>
    <div class="contest-card-body">
      <h3 style="margin-bottom:2px;">${entry.title}</h3>
      <p class="muted" style="font-size:13px;margin-bottom:0;">by ${entry.author}</p>
      <div class="contest-vote-count" data-vote-count>${votes} votes</div>
      <button class="btn ${voted ? "btn-outline" : ""} btn-block" data-vote-btn ${voted ? "disabled" : ""}>
        ${voted ? "Voted ✓" : "Vote"}
      </button>
    </div>
  </article>`;
}

function render() {
  const grid = document.getElementById("contest-grid");
  if (!grid) return;
  grid.innerHTML = CONTEST_ENTRIES.map(entryTemplate).join("");
}

function wireVoting() {
  const grid = document.getElementById("contest-grid");
  if (!grid) return;
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-vote-btn]");
    if (!btn || btn.disabled) return;
    const card = btn.closest("[data-entry]");
    const id = card.dataset.entry;
    const entry = CONTEST_ENTRIES.find((x) => x.id === id);
    const newCount = incrementVote(id, entry.baseVotes);
    const countEl = card.querySelector("[data-vote-count]");
    countEl.textContent = `${newCount} votes`;
    btn.textContent = "Voted ✓";
    btn.disabled = true;
    btn.classList.add("btn-outline");
  });
}

function wireReset() {
  const btn = document.getElementById("reset-votes-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    resetVotes();
    render();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  render();
  wireVoting();
  wireReset();
});
