const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const tileCount = 20;
const tileSize = canvas.width / tileCount;

let snake = [];
let snakeLength = 4;
let velocity = { x: 1, y: 0 };
let pendingDirection = null;
let food = { x: 10, y: 10 };
let score = 0;
let bestScore = Number(localStorage.getItem("snakeBestScore") || 0);
let gameLoop = null;
let gameRunning = false;

const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("bestScore");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const restartBtn = document.getElementById("restartBtn");

bestScoreEl.textContent = "Best: " + bestScore;

function resetGame() {
  snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 },
  ];
  snakeLength = 4;
  velocity = { x: 1, y: 0 };
  pendingDirection = null;
  score = 0;
  scoreEl.textContent = score;
  spawnFood();
  overlay.classList.remove("show");
  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(update, 1000 / 10); // 10 FPS
  gameRunning = true;
}

function spawnFood() {
  let newPos;
  do {
    newPos = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
    };
  } while (snake.some((s) => s.x === newPos.x && s.y === newPos.y));
  food = newPos;
}

function update() {
  if (!gameRunning) return;

  if (pendingDirection) {
    velocity = pendingDirection;
    pendingDirection = null;
  }

  const head = {
    x: snake[0].x + velocity.x,
    y: snake[0].y + velocity.y,
  };

  // تصادم مع الجدار
  if (
    head.x < 0 ||
    head.x >= tileCount ||
    head.y < 0 ||
    head.y >= tileCount
  ) {
    return endGame();
  }

  // تصادم مع النفس
  if (snake.some((s) => s.x === head.x && s.y === head.y)) {
    return endGame();
  }

  snake.unshift(head);

  // أكل الطعام
  if (head.x === food.x && head.y === food.y) {
    snakeLength++;
    score++;
    scoreEl.textContent = score;
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem("snakeBestScore", bestScore);
      bestScoreEl.textContent = "Best: " + bestScore;
    }
    spawnFood();
  }

  while (snake.length > snakeLength) {
    snake.pop();
  }

  draw();
}

function endGame() {
  gameRunning = false;
  clearInterval(gameLoop);
  overlayTitle.textContent = "Game Over";
  overlayText.textContent = "Your score: " + score;
  overlay.classList.add("show");
}

function draw() {
  // الخلفية
  ctx.fillStyle = "#050708";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // شبكة خفيفة
  for (let y = 0; y < tileCount; y++) {
    for (let x = 0; x < tileCount; x++) {
      const isDark = (x + y) % 2 === 0;
      ctx.fillStyle = isDark ? "#0b1120" : "#020617";
      ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }

  // الطعام (دائرة متوهجة)
  const foodCenterX = food.x * tileSize + tileSize / 2;
  const foodCenterY = food.y * tileSize + tileSize / 2;

  const gradient = ctx.createRadialGradient(
    foodCenterX,
    foodCenterY,
    2,
    foodCenterX,
    foodCenterY,
    tileSize
  );
  gradient.addColorStop(0, "#4ade80");
  gradient.addColorStop(1, "rgba(34,197,94,0.1)");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(foodCenterX, foodCenterY, tileSize / 2.2, 0, Math.PI * 2);
  ctx.fill();

  // الثعبان
  snake.forEach((segment, index) => {
    const px = segment.x * tileSize;
    const py = segment.y * tileSize;

    let alpha = 1 - index * 0.03;
    if (alpha < 0.25) alpha = 0.25;

    ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
    const radius = 8;

    const w = tileSize - 4;
    const h = tileSize - 4;
    const x = px + 2;
    const y = py + 2;

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  });

  // عيون الرأس (إضاءة بسيطة)
  const head = snake[0];
  const headCenterX = head.x * tileSize + tileSize / 2;
  const headCenterY = head.y * tileSize + tileSize / 2;

  ctx.fillStyle = "rgba(248,250,252,0.8)";
  ctx.beginPath();
  ctx.arc(headCenterX, headCenterY, 4, 0, Math.PI * 2);
  ctx.fill();
}

function changeDirection(dirX, dirY) {
  // منع الرجوع عكس الاتجاه مباشرة
  if (dirX === -velocity.x && dirY === -velocity.y) return;
  pendingDirection = { x: dirX, y: dirY };
}

document.addEventListener("keydown", (e) => {
  if (!gameRunning) {
    resetGame();
  }

  switch (e.key) {
    case "ArrowUp":
    case "w":
    case "W":
      changeDirection(0, -1);
      break;
    case "ArrowDown":
    case "s":
    case "S":
      changeDirection(0, 1);
      break;
    case "ArrowLeft":
    case "a":
    case "A":
      changeDirection(-1, 0);
      break;
    case "ArrowRight":
    case "d":
    case "D":
      changeDirection(1, 0);
      break;
  }
});

restartBtn.addEventListener("click", () => {
  resetGame();
});

// أول رسم وهو ثابت قبل بداية اللعبة
draw();
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const tileCount = 20;
const tileSize = canvas.width / tileCount;

let snake = [];
let snakeLength = 4;
let velocity = { x: 1, y: 0 };
let pendingDirection = null;
let food = { x: 10, y: 10 };
let score = 0;
let bestScore = Number(localStorage.getItem("snakeBestScore") || 0);
let gameLoop = null;
let gameRunning = false;

const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("bestScore");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const restartBtn = document.getElementById("restartBtn");

bestScoreEl.textContent = "Best: " + bestScore;

function resetGame() {
  snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 },
  ];
  snakeLength = 4;
  velocity = { x: 1, y: 0 };
  pendingDirection = null;
  score = 0;
  scoreEl.textContent = score;
  spawnFood();
  overlay.classList.remove("show");
  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(update, 1000 / 10); // 10 FPS
  gameRunning = true;
}

function spawnFood() {
  let newPos;
  do {
    newPos = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
    };
  } while (snake.some((s) => s.x === newPos.x && s.y === newPos.y));
  food = newPos;
}

function update() {
  if (!gameRunning) return;

  if (pendingDirection) {
    velocity = pendingDirection;
    pendingDirection = null;
  }

  const head = {
    x: snake[0].x + velocity.x,
    y: snake[0].y + velocity.y,
  };

  // تصادم مع الجدار
  if (
    head.x < 0 ||
    head.x >= tileCount ||
    head.y < 0 ||
    head.y >= tileCount
  ) {
    return endGame();
  }

  // تصادم مع النفس
  if (snake.some((s) => s.x === head.x && s.y === head.y)) {
    return endGame();
  }

  snake.unshift(head);

  // أكل الطعام
  if (head.x === food.x && head.y === food.y) {
    snakeLength++;
    score++;
    scoreEl.textContent = score;
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem("snakeBestScore", bestScore);
      bestScoreEl.textContent = "Best: " + bestScore;
    }
    spawnFood();
  }

  while (snake.length > snakeLength) {
    snake.pop();
  }

  draw();
}

function endGame() {
  gameRunning = false;
  clearInterval(gameLoop);
  overlayTitle.textContent = "Game Over";
  overlayText.textContent = "Your score: " + score;
  overlay.classList.add("show");
}

function draw() {
  // الخلفية
  ctx.fillStyle = "#050708";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // شبكة خفيفة
  for (let y = 0; y < tileCount; y++) {
    for (let x = 0; x < tileCount; x++) {
      const isDark = (x + y) % 2 === 0;
      ctx.fillStyle = isDark ? "#0b1120" : "#020617";
      ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }

  // الطعام (دائرة متوهجة)
  const foodCenterX = food.x * tileSize + tileSize / 2;
  const foodCenterY = food.y * tileSize + tileSize / 2;

  const gradient = ctx.createRadialGradient(
    foodCenterX,
    foodCenterY,
    2,
    foodCenterX,
    foodCenterY,
    tileSize
  );
  gradient.addColorStop(0, "#4ade80");
  gradient.addColorStop(1, "rgba(34,197,94,0.1)");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(foodCenterX, foodCenterY, tileSize / 2.2, 0, Math.PI * 2);
  ctx.fill();

  // الثعبان
  snake.forEach((segment, index) => {
    const px = segment.x * tileSize;
    const py = segment.y * tileSize;

    let alpha = 1 - index * 0.03;
    if (alpha < 0.25) alpha = 0.25;

    ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
    const radius = 8;

    const w = tileSize - 4;
    const h = tileSize - 4;
    const x = px + 2;
    const y = py + 2;

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  });

  // عيون الرأس (إضاءة بسيطة)
  const head = snake[0];
  const headCenterX = head.x * tileSize + tileSize / 2;
  const headCenterY = head.y * tileSize + tileSize / 2;

  ctx.fillStyle = "rgba(248,250,252,0.8)";
  ctx.beginPath();
  ctx.arc(headCenterX, headCenterY, 4, 0, Math.PI * 2);
  ctx.fill();
}

function changeDirection(dirX, dirY) {
  // منع الرجوع عكس الاتجاه مباشرة
  if (dirX === -velocity.x && dirY === -velocity.y) return;
  pendingDirection = { x: dirX, y: dirY };
}

document.addEventListener("keydown", (e) => {
  if (!gameRunning) {
    resetGame();
  }

  switch (e.key) {
    case "ArrowUp":
    case "w":
    case "W":
      changeDirection(0, -1);
      break;
    case "ArrowDown":
    case "s":
    case "S":
      changeDirection(0, 1);
      break;
    case "ArrowLeft":
    case "a":
    case "A":
      changeDirection(-1, 0);
      break;
    case "ArrowRight":
    case "d":
    case "D":
      changeDirection(1, 0);
      break;
  }
});

restartBtn.addEventListener("click", () => {
  resetGame();
});

// أول رسم وهو ثابت قبل بداية اللعبة
draw();
