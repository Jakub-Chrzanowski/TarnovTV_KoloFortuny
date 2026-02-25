const PHRASES = [
  { category: "POWIEDZENIA", phrase: "CZUJĘ JAK SERCE" },
  { category: "BAJKI", phrase: "KOT W BUTACH" },
  { category: "CODZIENNOŚĆ", phrase: "NIE MA LEKKO" },
  { category: "PRZYGODA", phrase: "TAJEMNICA LASU" },
  { category: "BAŚNIE", phrase: "ZŁOTA RYBKA" },
  { category: "PODRÓŻE", phrase: "WIELKA PRZYGODA" },
  { category: "MOTYWACJA", phrase: "SZCZĘŚCIE SPRZYJA" },
  { category: "PORY ROKU", phrase: "POLSKA ZŁOTA JESIEŃ" }
];

const ROW_LENGTH = 12;
const ALPHABET = "AĄBCĆDEĘFGHIJKLŁMNŃOÓPRSŚTUWYZŹŻQXV";

const current = PHRASES[Math.floor(Math.random() * PHRASES.length)];
let guessedLetters = [];
let flashLetters = [];
let audioContext = null;

const board = document.getElementById("board");
const categoryName = document.getElementById("categoryName");

function normalizeLetter(value) {
  return value
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Ł/g, "L");
}

function splitToRows(phrase) {
  const words = phrase.split(" ");
  const rows = [];
  let currentRow = "";

  for (const word of words) {
    const candidate = currentRow ? `${currentRow} ${word}` : word;
    if (candidate.length <= ROW_LENGTH) {
      currentRow = candidate;
    } else {
      if (currentRow) rows.push(currentRow);
      currentRow = word;
    }
  }

  if (currentRow) rows.push(currentRow);
  return rows;
}

function createBoardRows(phrase) {
  const rows = splitToRows(phrase);

  return rows.map((row) => {
    const chars = row.split("");
    const totalPadding = Math.max(0, ROW_LENGTH - chars.length);
    const leftPad = Math.floor(totalPadding / 2);
    const rightPad = totalPadding - leftPad;

    return [
      ...Array.from({ length: leftPad }, () => ({ kind: "empty" })),
      ...chars.map((char) => (char === " " ? { kind: "space" } : { kind: "letter", char })),
      ...Array.from({ length: rightPad }, () => ({ kind: "empty" }))
    ];
  });
}

function ensureAudio() {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    audioContext = new AudioCtx();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function playTone(type) {
  const ctx = ensureAudio();
  if (!ctx) return;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (type === "success" ? 0.22 : 0.3));
  gain.connect(ctx.destination);

  const tones = type === "success" ? [740, 987] : [220, 165];

  tones.forEach((frequency) => {
    const osc = ctx.createOscillator();
    osc.type = type === "success" ? "triangle" : "sawtooth";
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.connect(gain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + (type === "success" ? 0.22 : 0.3));
  });
}

function revealAllLetters() {
  guessedLetters = [
    ...new Set(current.phrase.split("").filter((char) => char !== " ").map(normalizeLetter))
  ];
}

function renderBoard() {
  board.innerHTML = "";
  categoryName.textContent = current.category;

  const rows = createBoardRows(current.phrase);

  rows.forEach((row) => {
    const rowEl = document.createElement("div");
    rowEl.className = "board-row";

    row.forEach((cell) => {
      let el;

      if (cell.kind === "empty") {
        el = document.createElement("div");
        el.className = "tile-empty";
      } else if (cell.kind === "space") {
        el = document.createElement("div");
        el.className = "tile-space";
      } else {
        const normalized = normalizeLetter(cell.char);
        const revealed = guessedLetters.includes(normalized);
        const flashing = flashLetters.includes(normalized);

        el = document.createElement("div");
        el.className = `tile${revealed ? " revealed" : ""}${flashing ? " flash" : ""}`;

        const letter = document.createElement("span");
        letter.className = "tile-letter";
        letter.textContent = cell.char;
        el.appendChild(letter);
      }

      rowEl.appendChild(el);
    });

    board.appendChild(rowEl);
  });
}

function pulseLetter(letter) {
  flashLetters = [letter];
  renderBoard();
  window.setTimeout(() => {
    flashLetters = [];
    renderBoard();
  }, 600);
}

function handleLetter(key) {
  const letter = normalizeLetter(key);
  if (!ALPHABET.includes(letter)) return;
  if (guessedLetters.includes(letter)) return;

  const hits = current.phrase
    .split("")
    .map(normalizeLetter)
    .filter((char) => char === letter).length;

  guessedLetters.push(letter);

  if (hits > 0) {
    playTone("success");
    pulseLetter(letter);
  } else {
    playTone("fail");
    renderBoard();
  }
}

document.addEventListener("keydown", (event) => {
  if (event.key === "/") {
    event.preventDefault();
    revealAllLetters();
    playTone("success");
    renderBoard();
    return;
  }

  if (event.key.length === 1) {
    handleLetter(event.key);
  }
});

document.addEventListener("pointerdown", () => {
  ensureAudio();
}, { once: true });

renderBoard();
