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
let solveMode = false;

const board = document.getElementById("board");
const categoryName = document.getElementById("categoryName");
const overlay = document.getElementById("solveOverlay");
const solveInput = document.getElementById("solveInput");

function normalizeLetter(value) {
  return value
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Ł/g, "L");
}

function normalizePhrase(value) {
  return value
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Ł/g, "L")
    .replace(/\s+/g, " ")
    .trim();
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
    pulseLetter(letter);
  } else {
    renderBoard();
  }
}

function openSolveMode() {
  solveMode = true;
  overlay.classList.remove("hidden");
  solveInput.value = "";
  window.setTimeout(() => solveInput.focus(), 10);
}

function closeSolveMode() {
  solveMode = false;
  overlay.classList.add("hidden");
  solveInput.value = "";
}

function submitSolve() {
  const guess = normalizePhrase(solveInput.value);
  if (!guess) {
    closeSolveMode();
    return;
  }

  if (guess === normalizePhrase(current.phrase)) {
    revealAllLetters();
    renderBoard();
  }

  closeSolveMode();
}

document.addEventListener("keydown", (event) => {
  if (solveMode) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSolveMode();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      submitSolve();
    }

    return;
  }

  if (event.key === "/") {
    event.preventDefault();
    openSolveMode();
    return;
  }

  if (event.key.length === 1) {
    handleLetter(event.key);
  }
});

solveInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    submitSolve();
  }

  if (event.key === "Escape") {
    event.preventDefault();
    closeSolveMode();
  }
});

overlay.addEventListener("click", (event) => {
  if (event.target === overlay) {
    closeSolveMode();
  }
});

renderBoard();
