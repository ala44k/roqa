const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const restartBtn = document.getElementById("restartBtn");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");

const playerSize = 50;
const playerImg = new Image();
playerImg.src = "https://i.ibb.co/gZD5b0f5/hqdefault.png";

const ground = { y: 360, height: 40 };
const gravity = 0.8;
const jumpPower = -18;

let player = {
  x: 50,
  y: ground.y - playerSize,
  width: playerSize,
  height: playerSize,
  velocityY: 0,
};

const keys = { left: false, right: false };

let obstacles = [];
let pits = [];
let obstacleSpeed = 2;
let frameCount = 0;
let score = 0;
let isGameOver = false;

let jumpCount = 0;

const obstacleImageSources = [
  "https://i.postimg.cc/4KcZvs0n/1.jpg",
];

const obstacleImages = obstacleImageSources.map((src) => {
  const img = new Image();
  img.src = src;
  return img;
});

let imagesToLoad = 1 + obstacleImages.length;
const crashSound = new Audio("https://www.soundjay.com/button/sounds/button-10.mp3");

function checkAllImagesLoaded() {
  imagesToLoad--;
  if (imagesToLoad === 0) {
    startGame();
  }
}

playerImg.onload = checkAllImagesLoaded;
obstacleImages.forEach((img) => (img.onload = checkAllImagesLoaded));

function spawnObstacle() {
  const img =
    obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
  const size = 40;
  const y = ground.y - size;
  obstacles.push({ x: canvas.width, y, width: size, height: size, img });
}

function spawnObstacleOrPit() {
  const isPit = Math.random() < 0.3; // 30% احتمال حفرة

  if (isPit) {
    const pitWidth = 40; // حفرة أنحف
    pits.push({ x: canvas.width, width: pitWidth });
  } else {
    spawnObstacle();
  }
}

function update() {
  frameCount++;

  if (keys.left) player.x -= 5;
  if (keys.right) player.x += 5;

  player.velocityY += gravity;
  player.y += player.velocityY;

  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  if (player.y + player.height >= ground.y) {
    player.y = ground.y - player.height;
    player.velocityY = 0;
    jumpCount = 0; // إعادة عداد القفزات عند ملامسة الأرض
  }

  if (frameCount % 100 === 0) spawnObstacleOrPit();

  if (frameCount % 600 === 0) obstacleSpeed += 0.5;

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const ob = obstacles[i];
    ob.x -= obstacleSpeed;

    const collide =
      player.x < ob.x + ob.width &&
      player.x + player.width > ob.x &&
      player.y < ob.y + ob.height &&
      player.y + player.height > ob.y;

    if (collide) {
      crashSound.play();
      isGameOver = true;
      restartBtn.style.display = "inline-block";
      clearInterval(timerInterval);
      return;
    }

    if (ob.x + ob.width < 0) {
      obstacles.splice(i, 1);
      score++;
    }
  }

  for (let i = pits.length - 1; i >= 0; i--) {
    pits[i].x -= obstacleSpeed;
    if (pits[i].x + pits[i].width < 0) {
      pits.splice(i, 1);
      score++;
    }
  }

  const playerOnGround = player.y + player.height >= ground.y;
  let fellInPit = false;
  for (const pit of pits) {
    if (
      player.x + player.width > pit.x &&
      player.x < pit.x + pit.width &&
      playerOnGround
    ) {
      fellInPit = true;
      break;
    }
  }
  if (fellInPit) {
    crashSound.play();
    isGameOver = true;
    restartBtn.style.display = "inline-block";
    clearInterval(timerInterval);
    return;
  }

  scoreDisplay.textContent = "النقاط: " + score;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // رسم الشمس في الزاوية العلوية اليمنى
  const sunX = canvas.width - 80;
  const sunY = 80;
  const sunRadius = 30;

  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
  ctx.fillStyle = "yellow";
  ctx.fill();
  ctx.closePath();

  ctx.strokeStyle = "orange";
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const startX = sunX + Math.cos(angle) * sunRadius;
    const startY = sunY + Math.sin(angle) * sunRadius;
    const endX = sunX + Math.cos(angle) * (sunRadius + 15);
    const endY = sunY + Math.sin(angle) * (sunRadius + 15);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  // رسم الأرض
  ctx.fillStyle = "#228B22";
  ctx.fillRect(0, ground.y, canvas.width, ground.height);

  // رسم الحفر
  pits.forEach((pit) => {
    ctx.fillStyle = "#222";
    ctx.fillRect(pit.x, ground.y, pit.width, ground.height);
  });

  // رسم اللاعب
  if (playerImg.complete && playerImg.naturalWidth > 0) {
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
  } else {
    ctx.fillStyle = "#FF6347";
    ctx.fillRect(player.x, player.y, player.width, player.height);
  }

  // رسم العوائق
  obstacles.forEach((ob) => {
    if (ob.img.complete && ob.img.naturalWidth > 0) {
      ctx.drawImage(ob.img, ob.x, ob.y, ob.width, ob.height);
    } else {
      ctx.fillStyle = "#888";
      ctx.fillRect(ob.x, ob.y, ob.width, ob.height);
    }
  });
}

let timeElapsed = 0;
let timerInterval;

function loop() {
  update();
  draw();
  if (!isGameOver) requestAnimationFrame(loop);
}

function startGame() {
  timeElapsed = 0;
  score = 0;
  obstacleSpeed = 3;
  frameCount = 0;
  isGameOver = false;
  obstacles = [];
  pits = [];
  jumpCount = 0;
  restartBtn.style.display = "none";
  timerDisplay.textContent = "الوقت: 0s";
  scoreDisplay.textContent = "النقاط: 0";
  timerInterval = setInterval(() => {
    timeElapsed++;
    timerDisplay.textContent = "الوقت: " + timeElapsed + "s";
  }, 1000);
  loop();
}

restartBtn.addEventListener("click", () => {
  Object.assign(player, {
    x: 50,
    y: ground.y - player.height,
    velocityY: 0,
  });
  jumpCount = 0;
  clearInterval(timerInterval);
  startGame();
});

document.addEventListener("keydown", (e) => {
  if (e.code === "ArrowLeft") keys.left = true;
  if (e.code === "ArrowRight") keys.right = true;

  if (e.code === "Space" && jumpCount < 2 && !isGameOver) {
    player.velocityY = jumpPower;
    jumpCount++;
  }
});
document.addEventListener("touchstart", () => {
  jump();
});
document.addEventListener("keyup", (e) => {
  if (e.code === "ArrowLeft") keys.left = false;
  if (e.code === "ArrowRight") keys.right = false;
});
 const sounds = [
  new Audio("https://voca.ro/1cMChHLs7mhi"),
  new Audio("https://voca.ro/1kiAn93j0cn8"),
  new Audio("https://voca.ro/1zDuqXpfp5Vh"),
];

// تشغيل صوت عشوائي عند التصادم
function playCollisionSound() {
  const sound = sounds[Math.floor(Math.random() * sounds.length)];
  sound.currentTime = 0;
  sound.play().catch((e) => {
    console.warn("لم يتم تشغيل الصوت تلقائيًا: ", e);
  });
}
let soundReady = false;

document.addEventListener("keydown", () => {
  if (!soundReady) {
    sounds.forEach(s => {
      s.play().then(() => s.pause()).catch(() => {});
    });
    soundReady = true;
  }
});
const jumpBtn = document.getElementById("mobile-jump-button");

if (jumpBtn) {
  jumpBtn.addEventListener("touchstart", (e) => {
    e.preventDefault(); // منع السحب
    jump();
  });

  jumpBtn.addEventListener("click", (e) => {
    e.preventDefault();
    jump();
  });
}
