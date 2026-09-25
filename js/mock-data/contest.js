export const CONTEST_TITLE = "Police in the Eyes of a Child";
export const CONTEST_TITLE_RU = "Полиция глазами ребенка";
export const CONTEST_STORAGE_KEY = "allseattle_votes";
export const CONTEST_VOTED_KEY = "allseattle_voted_entries";

export const CONTEST_ENTRIES = [
  { id: "e1", title: "My Neighborhood Hero", author: "Ava, age 7", photo: "img/contest/contest-1.webp", baseVotes: 128 },
  { id: "e2", title: "The Friendly Patrol Car", author: "Noah, age 6", photo: "img/contest/contest-2.webp", baseVotes: 94 },
  { id: "e3", title: "Helping Me Cross the Street", author: "Mia, age 8", photo: "img/contest/contest-3.webp", baseVotes: 151 },
  { id: "e4", title: "K-9 Unit and Me", author: "Liam, age 9", photo: "img/contest/contest-4.webp", baseVotes: 76 },
  { id: "e5", title: "Officer Friendly at School", author: "Zoe, age 7", photo: "img/contest/contest-5.webp", baseVotes: 112 },
  { id: "e6", title: "Thank You for Keeping Us Safe", author: "Ethan, age 8", photo: "img/contest/contest-6.webp", baseVotes: 89 },
];

function readVoteMap() {
  try {
    return JSON.parse(localStorage.getItem(CONTEST_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeVoteMap(map) {
  try {
    localStorage.setItem(CONTEST_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* localStorage unavailable — votes just won't persist this session */
  }
}

function readVotedSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem(CONTEST_VOTED_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function writeVotedSet(set) {
  try {
    localStorage.setItem(CONTEST_VOTED_KEY, JSON.stringify([...set]));
  } catch {
    /* localStorage unavailable */
  }
}

export function getVotes(entryId, baseVotes) {
  const map = readVoteMap();
  return typeof map[entryId] === "number" ? map[entryId] : baseVotes;
}

export function hasVoted(entryId) {
  return readVotedSet().has(entryId);
}

export function incrementVote(entryId, baseVotes) {
  const map = readVoteMap();
  const current = typeof map[entryId] === "number" ? map[entryId] : baseVotes;
  map[entryId] = current + 1;
  writeVoteMap(map);
  const voted = readVotedSet();
  voted.add(entryId);
  writeVotedSet(voted);
  return map[entryId];
}

export function resetVotes() {
  try {
    localStorage.removeItem(CONTEST_STORAGE_KEY);
    localStorage.removeItem(CONTEST_VOTED_KEY);
  } catch {
    /* localStorage unavailable */
  }
}
