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

// --- Particle Network Background ---
(function () {
  const canvas = document.getElementById("starfield");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let W, H;
  let mouseX = -1000, mouseY = -1000;
  const particles = [];
  const PARTICLE_COUNT = 80;
  const CONNECT_DIST = 150;
  const MOUSE_REPEL_DIST = 120;
  const MOUSE_REPEL_FORCE = 0.3;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = document.documentElement.scrollHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 1.0,
      angle: Math.random() * Math.PI * 2,
      driftAmp: Math.random() * 0.15 + 0.05,
      driftSpeed: Math.random() * 0.004 + 0.002
    };
  }

  function initParticles() {
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle());
    }
  }

  function draw(timestamp) {
    if (canvas.width !== window.innerWidth) resize();

    const isDark = html.getAttribute("data-theme") === "dark";

    ctx.clearRect(0, 0, W, H);

    // --- Soft radial vignette — blends into CSS body gradient ---
    const cx = W / 2, cy = H / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy) * 1.1;
    const vignette = ctx.createRadialGradient(cx, cy, maxR * 0.25, cx, cy, maxR);
    if (isDark) {
      vignette.addColorStop(0, "rgba(10,16,28,0)");
      vignette.addColorStop(0.45, "rgba(8,14,26,0.06)");
      vignette.addColorStop(0.75, "rgba(6,10,20,0.18)");
      vignette.addColorStop(1, "rgba(3,6,14,0.40)");
    } else {
      vignette.addColorStop(0, "rgba(230,238,250,0)");
      vignette.addColorStop(0.45, "rgba(220,232,248,0.05)");
      vignette.addColorStop(0.75, "rgba(205,222,242,0.15)");
      vignette.addColorStop(1, "rgba(190,212,238,0.32)");
    }
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    // --- Update particles ---
    for (const p of particles) {
      p.angle += p.driftSpeed;
      p.vx += Math.cos(p.angle) * p.driftAmp * 0.05;
      p.vy += Math.sin(p.angle) * p.driftAmp * 0.05;
      p.vx *= 0.999;
      p.vy *= 0.999;

      const dxM = p.x - mouseX;
      const dyM = p.y - mouseY;
      const distM = Math.sqrt(dxM * dxM + dyM * dyM);
      if (distM < MOUSE_REPEL_DIST && distM > 0.1) {
        const force = (MOUSE_REPEL_DIST - distM) / MOUSE_REPEL_DIST * MOUSE_REPEL_FORCE;
        p.vx += (dxM / distM) * force;
        p.vy += (dyM / distM) * force;
      }

      p.x += p.vx;
      p.y += p.vy;

      const margin = 50;
      if (p.x < -margin) p.x = W + margin;
      if (p.x > W + margin) p.x = -margin;
      if (p.y < -margin) p.y = H + margin;
      if (p.y > H + margin) p.y = -margin;
    }

    // --- Draw connections (very subtle) ---
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DIST) {
          const opacity = (1 - dist / CONNECT_DIST) * (1 - dist / CONNECT_DIST) * 0.12;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = isDark
            ? `rgba(140,195,255,${opacity})`
            : `rgba(100,150,210,${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // --- Draw particles (soft watercolor glow) ---
    for (const p of particles) {
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      if (isDark) {
        glow.addColorStop(0, "rgba(150,205,255,0.45)");
        glow.addColorStop(0.3, "rgba(110,170,240,0.15)");
        glow.addColorStop(0.6, "rgba(80,140,220,0.04)");
        glow.addColorStop(1, "rgba(60,120,200,0)");
      } else {
        glow.addColorStop(0, "rgba(110,160,220,0.28)");
        glow.addColorStop(0.3, "rgba(130,175,225,0.09)");
        glow.addColorStop(0.6, "rgba(150,185,230,0.03)");
        glow.addColorStop(1, "rgba(160,195,235,0)");
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Core — just a hint
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = isDark
        ? "rgba(200,230,255,0.55)"
        : "rgba(100,150,210,0.3)";
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  // --- Mouse tracking ---
  document.addEventListener("mousemove", function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  document.addEventListener("mouseleave", function () {
    mouseX = -1000;
    mouseY = -1000;
  });

  resize();
  initParticles();
  requestAnimationFrame(draw);

  window.addEventListener("resize", () => {
    resize();
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
