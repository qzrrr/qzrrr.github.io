const html = document.documentElement;

// --- Theme toggle ---
const themeToggle = document.getElementById("themeToggle");

function setTheme(theme) {
  html.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  localStorage.setItem("theme", theme);
}

const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
  setTheme(savedTheme);
} else {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(prefersDark ? "dark" : "light");
}

themeToggle.addEventListener("click", () => {
  const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
  setTheme(next);
});

// --- Language toggle ---
const langToggle = document.getElementById("langToggle");

function setLang(lang) {
  html.setAttribute("data-lang", lang);
  langToggle.textContent = lang === "zh" ? "EN" : "中";
  localStorage.setItem("lang", lang);
}

// Default to English
const savedLang = localStorage.getItem("lang");
setLang(savedLang || "en");

langToggle.addEventListener("click", () => {
  const next = html.getAttribute("data-lang") === "zh" ? "en" : "zh";
  setLang(next);
});

// --- Starfield ---
(function () {
  const canvas = document.getElementById("starfield");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let W, H;
  const stars = [];
  const STAR_COUNT = 180;
  const SHOOTING_STAR_INTERVAL = [4000, 12000]; // ms range
  let shootingStars = [];
  let lastShootingStar = 0;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = document.documentElement.scrollHeight;
  }

  function randomStar(i) {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.8 + 0.4,
      baseAlpha: Math.random() * 0.4 + 0.35,
      twinkleSpeed: Math.random() * 0.015 + 0.005,
      twinkleOffset: Math.random() * Math.PI * 2,
      hue: Math.random() < 0.15 ? 30 + Math.random() * 20 : 210 + Math.random() * 40
    };
  }

  function initStars() {
    stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push(randomStar(i));
    }
  }

  function spawnShootingStar() {
    const fromLeft = Math.random() > 0.5;
    const x0 = fromLeft ? Math.random() * W * 0.5 : W * 0.5 + Math.random() * W * 0.5;
    const y0 = Math.random() * H * 0.5;
    const angle = (Math.random() * 0.5 + 0.2) * (fromLeft ? 1 : -1); // radians
    const len = Math.random() * 100 + 80;
    shootingStars.push({
      x0, y0,
      angle,
      len,
      progress: 0,
      speed: Math.random() * 0.018 + 0.012,
      alpha: 1
    });
  }

  function drawStar(s, t) {
    const alpha = s.baseAlpha + Math.sin(t * s.twinkleSpeed + s.twinkleOffset) * 0.25;
    const clamped = Math.max(0.15, Math.min(1, alpha));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${s.hue}, 60%, 78%, ${clamped})`;
    ctx.fill();

    // glow for larger stars
    if (s.r > 1.3) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${s.hue}, 60%, 78%, ${clamped * 0.15})`;
      ctx.fill();
    }
  }

  function drawShootingStar(ss) {
    const dx = Math.cos(ss.angle);
    const dy = Math.sin(ss.angle);
    const tailX = ss.x0 + ss.progress * ss.len * dx;
    const tailY = ss.y0 + ss.progress * ss.len * dy;
    const headX = tailX + 8 * dx;
    const headY = tailY + 8 * dy;
    const tipX = tailX - ss.len * 0.15 * dx;
    const tipY = tailY - ss.len * 0.15 * dy;

    // tail gradient
    const grad = ctx.createLinearGradient(tipX, tipY, headX, headY);
    grad.addColorStop(0, `rgba(255,255,255,0)`);
    grad.addColorStop(0.7, `rgba(255,255,255,${ss.alpha * 0.7})`);
    grad.addColorStop(1, `rgba(255,255,255,${ss.alpha})`);

    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(headX, headY);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // head glow
    ctx.beginPath();
    ctx.arc(headX, headY, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${ss.alpha})`;
    ctx.fill();
  }

  function animate(timestamp) {
    // Repopulate stars when theme changes dimensions
    if (canvas.width !== window.innerWidth) resize();

    const isDark = html.getAttribute("data-theme") === "dark";
    const bg = isDark ? "rgba(11,17,32,0.08)" : "rgba(245,247,250,0.06)";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Draw stars
    for (const s of stars) {
      drawStar(s, timestamp);
    }

    // Spawn shooting stars
    if (timestamp - lastShootingStar > SHOOTING_STAR_INTERVAL[0] + Math.random() * (SHOOTING_STAR_INTERVAL[1] - SHOOTING_STAR_INTERVAL[0])) {
      spawnShootingStar();
      lastShootingStar = timestamp;
    }

    // Update & draw shooting stars
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const ss = shootingStars[i];
      ss.progress += ss.speed;
      if (ss.progress > 0.7) {
        ss.alpha = Math.max(0, 1 - (ss.progress - 0.7) / 0.3);
      }
      if (ss.progress >= 1) {
        shootingStars.splice(i, 1);
        continue;
      }
      drawShootingStar(ss);
    }

    requestAnimationFrame(animate);
  }

  resize();
  initStars();
  lastShootingStar = performance.now();
  requestAnimationFrame(animate);

  window.addEventListener("resize", () => {
    resize();
    initStars();
  });
})();

// --- Tab switching on column page ---
const tabBar = document.getElementById("tabBar");
if (tabBar) {
  tabBar.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;

    tabBar.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const tab = btn.dataset.tab;
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    const panel = document.getElementById("panel-" + tab);
    if (panel) panel.classList.add("active");
  });
}
