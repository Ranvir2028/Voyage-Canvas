// =====================================================
//   VOYAGE CANVAS — Main JS (Global)
// =====================================================

const API_BASE = "http://localhost:5000";

// ── Toast Notifications ──────────────────────────────
function showToast(message, type = "info", duration = 3500) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const icons = { success: "✓", error: "✕", info: "✦" };
  toast.innerHTML = `
    <span style="color: ${type === "success" ? "#4ade80" : type === "error" ? "#f87171" : "var(--gold)"}">
      ${icons[type] || "✦"}
    </span>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

// ── Loading Overlay ──────────────────────────────────
function showLoading(text = "Loading...", subtext = "") {
  const overlay = document.getElementById("loadingOverlay");
  if (!overlay) return;
  const t = document.getElementById("loadingText");
  const s = document.getElementById("loadingSubtext");
  if (t) t.textContent = text;
  if (s) s.textContent = subtext;
  overlay.classList.add("active");
}

function hideLoading() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.classList.remove("active");
}

// ── API Helper ───────────────────────────────────────
async function apiCall(endpoint, method = "GET", body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

// ── Date Utilities ───────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysBetween(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)));
}

// ── Currency Format ───────────────────────────────────
function formatCurrency(amount, currency = "USD") {
  const sym = currency === "INR" ? "₹" : "$";
  return `${sym}${Number(amount).toLocaleString()}`;
}

// ── LocalStorage Trip Data ────────────────────────────
function saveTripData(data) {
  localStorage.setItem("vc_trip_data", JSON.stringify(data));
}

function loadTripData() {
  try {
    const raw = localStorage.getItem("vc_trip_data");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveItinerary(data) {
  localStorage.setItem("vc_itinerary", JSON.stringify(data));
}

function loadItinerary() {
  try {
    const raw = localStorage.getItem("vc_itinerary");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ── Animate on scroll ────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".step-card, .feature-card, .card");
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => (e.target.style.opacity = "1"), i * 80);
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1 },
  );
  cards.forEach((c) => {
    c.style.opacity = "0";
    c.style.transition = "opacity 0.5s ease";
    obs.observe(c);
  });
});
