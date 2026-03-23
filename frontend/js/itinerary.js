// ============================================================
//   itinerary.js — Voyage Canvas Itinerary Dashboard
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const itinerary = loadItinerary();
  let tripData = loadTripData();

  if (!itinerary) {
    document.body.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:2rem;background:var(--midnight);color:var(--cream);">
        <div style="font-size:4rem;">🗺️</div>
        <h2 style="font-family:var(--font-display);">No Itinerary Yet</h2>
        <p style="color:var(--muted);margin-bottom:1rem;">You haven't generated an itinerary yet.</p>
        <a href="/planner" class="btn btn-primary">✦ &nbsp;Start Planning</a>
      </div>`;
    return;
  }

  // Build tripData from itinerary if missing
  if (!tripData) {
    tripData = {
      destination: itinerary.destination || "—",
      days: itinerary.totalDays || itinerary.days?.length || 3,
      duration: itinerary.totalDays || itinerary.days?.length || 3,
      budget: itinerary.totalBudget || 0,
      currency: itinerary.currency || "USD",
      groupType: itinerary.groupType || "Solo",
    };
    localStorage.setItem("vc_trip_data", JSON.stringify(tripData));
  }

  renderBanner(itinerary, tripData);
  renderOverview(itinerary);
  renderDayNav(itinerary);
  renderBudget(itinerary);
  renderPieChart(itinerary.budgetBreakdown);
  renderPackingList(itinerary);
  renderDayCards(itinerary);
  fetchWeather(tripData.destination);

  const totalUSD =
    tripData.currency === "USD" ? tripData.budget : tripData.budget / 83.5;
  renderCurrencyTrio(tripData.destination, totalUSD);
});

// ── Banner ────────────────────────────────────────────────────
function renderBanner(itin, trip) {
  const sym = itin.currencySymbol || "$";
  const days = itin.totalDays || itin.days?.length || trip.days || "—";

  document
    .getElementById("tripTitle")
    ?.setText?.(`${itin.destination} Adventure`);

  const el = (id) => document.getElementById(id);
  if (el("bannerDestination"))
    el("bannerDestination").textContent = itin.destination || "—";
  if (el("bannerDays")) el("bannerDays").textContent = `${days} Days`;
  if (el("bannerBudget"))
    el("bannerBudget").textContent =
      `${sym}${Number(itin.totalBudget || trip.budget || 0).toLocaleString()}`;
  if (el("bannerGroup"))
    el("bannerGroup").textContent = itin.groupType || trip.groupType || "—";
  if (el("tripTitle"))
    el("tripTitle").textContent = `${itin.destination} — ${days} Day Itinerary`;
}

// ── Overview ──────────────────────────────────────────────────
function renderOverview(itin) {
  const el = (id) => document.getElementById(id);

  // Summary
  if (el("tripSummary")) {
    el("tripSummary").textContent =
      itin.summary || `Explore the wonders of ${itin.destination}.`;
  }

  // Best time to visit
  if (el("bestTimeToVisit")) {
    el("bestTimeToVisit").textContent =
      itin.bestTimeToVisit ||
      itin.best_time_to_visit ||
      "Year-round destination — check seasonal weather before booking.";
  }

  // Local tips
  const tipsContainer = el("localTips") || el("travelTips");
  if (tipsContainer) {
    const tips = itin.localTips || itin.travelTips || itin.local_tips || [];
    if (tips.length > 0) {
      tipsContainer.innerHTML = tips
        .map(
          (tip) =>
            `<li style="margin-bottom:0.5rem; color:var(--muted); font-size:0.88rem;">💡 ${tip}</li>`,
        )
        .join("");
    }
  }

  // Highlights
  const hlContainer = el("highlights");
  if (hlContainer) {
    const highlights = itin.highlights || [];
    hlContainer.innerHTML = highlights
      .map((h) => `<span class="badge badge-gold">${h}</span>`)
      .join("");
  }

  // Local cuisine
  const cuisineContainer = el("localCuisine");
  if (cuisineContainer) {
    const cuisine = itin.localCuisine || itin.local_cuisine || [];
    cuisineContainer.innerHTML = cuisine
      .map((c) => `<span class="badge">🍽️ ${c}</span>`)
      .join("");
  }

  // Weather info
  if (itin.weather && typeof itin.weather === "object") {
    if (el("weatherTypical"))
      el("weatherTypical").textContent = itin.weather.typical || "";
    if (el("weatherTemp"))
      el("weatherTemp").textContent = itin.weather.temperature || "";
    if (el("weatherWear"))
      el("weatherWear").textContent = itin.weather.what_to_wear || "";
  }
}

// ── Day Navigation ────────────────────────────────────────────
function renderDayNav(itin) {
  const nav = document.getElementById("dayNav");
  if (!nav || !itin.days?.length) return;
  nav.innerHTML = itin.days
    .map(
      (day, i) => `
    <button class="day-nav-btn ${i === 0 ? "active" : ""}"
      onclick="scrollToDay(${i + 1}); setActiveDayNav(this)">
      Day ${day.day || i + 1}
    </button>
  `,
    )
    .join("");
}

function scrollToDay(dayNum) {
  document
    .getElementById(`day-${dayNum}`)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setActiveDayNav(btn) {
  document
    .querySelectorAll(".day-nav-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
}

// ── Budget Bars ───────────────────────────────────────────────
function renderBudget(itin) {
  const bars = document.getElementById("budgetBars");
  const totEl = document.getElementById("totalBudgetDisplay");
  const sym = itin.currencySymbol || "$";
  const bd = itin.budgetBreakdown || {};

  if (!bars) return;

  const total = Object.values(bd).reduce((a, b) => a + (Number(b) || 0), 0);
  if (totEl) totEl.textContent = `${sym}${Math.round(total).toLocaleString()}`;

  const categories = [
    { key: "accommodation", label: "Accommodation", color: "#c9a84c" },
    { key: "food", label: "Food & Dining", color: "#e8c96d" },
    { key: "transport", label: "Transport", color: "#8896a8" },
    { key: "activities", label: "Activities", color: "#f5e6b8" },
    { key: "shopping", label: "Shopping", color: "#4a6080" },
    { key: "misc", label: "Misc", color: "#2a3f5f" },
  ];

  bars.innerHTML = categories
    .map((cat) => {
      const amount = Number(bd[cat.key]) || 0;
      if (amount === 0) return "";
      const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
      return `
      <div class="budget-bar-item" style="margin-bottom:0.8rem;">
        <div style="display:flex;justify-content:space-between;margin-bottom:0.3rem;">
          <span style="font-size:0.78rem;color:var(--muted);">${cat.label}</span>
          <span style="font-size:0.78rem;color:var(--gold);">${sym}${Math.round(amount).toLocaleString()} <span style="color:var(--muted);">(${pct}%)</span></span>
        </div>
        <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
          <div style="height:100%;width:0%;background:${cat.color};border-radius:3px;transition:width 1s ease;" data-width="${pct}%"></div>
        </div>
      </div>`;
    })
    .join("");

  // Animate bars
  setTimeout(() => {
    bars.querySelectorAll("[data-width]").forEach((bar) => {
      bar.style.width = bar.dataset.width;
    });
  }, 300);
}

// ── Packing List ──────────────────────────────────────────────
function renderPackingList(itin) {
  const container = document.getElementById("packingList");
  if (!container) return;

  const items = itin.packingList || itin.packing_list || [];
  if (items.length === 0) {
    container.innerHTML =
      '<p style="color:var(--muted);font-size:0.85rem;">No packing list available.</p>';
    return;
  }

  container.innerHTML = items
    .map(
      (item) => `
    <div style="display:flex;align-items:center;gap:0.6rem;padding:0.4rem 0;border-bottom:1px solid var(--border);">
      <input type="checkbox" style="accent-color:var(--gold);cursor:pointer;" />
      <span style="font-size:0.83rem;color:var(--muted);">${item}</span>
    </div>
  `,
    )
    .join("");
}

// ── Day Cards ─────────────────────────────────────────────────
function renderDayCards(itin) {
  const container = document.getElementById("dayCards");
  if (!container || !itin.days?.length) return;
  const sym = itin.currencySymbol || "$";

  container.innerHTML = itin.days
    .map(
      (day, i) => `
    <div class="day-card" id="day-${day.day || i + 1}">
      <div class="day-card-header">
        <div>
          <span class="day-number">Day ${day.day || i + 1}</span>
          <h3 class="day-theme">${day.theme || `Day ${i + 1}`}</h3>
          <span style="font-size:0.78rem;color:var(--muted);">${day.date || ""} ${day.weather ? "· " + day.weather : ""}</span>
        </div>
        <div style="text-align:right;">
          <div style="font-family:var(--font-stamp);font-size:1.2rem;color:var(--gold);">${sym}${Math.round(day.dailyTotal || 0).toLocaleString()}</div>
          <div style="font-size:0.7rem;color:var(--muted);">Daily Total</div>
        </div>
      </div>

      <div class="day-timeline">
        ${renderSlot(day.morning, "🌅", "Morning", sym)}
        ${renderSlot(day.afternoon, "☀️", "Afternoon", sym)}
        ${renderSlot(day.evening, "🌙", "Evening", sym)}
      </div>

      <div class="day-accommodation">
        <span style="font-size:0.8rem;color:var(--gold);">🏨 ${day.accommodation?.name || "See booking"}</span>
        <span style="font-size:0.78rem;color:var(--muted);margin-left:1rem;">${day.accommodation?.type || ""}</span>
        <span style="font-size:0.78rem;color:var(--gold);margin-left:auto;">${sym}${Math.round(day.accommodation?.cost || 0)}/night</span>
        <span style="font-size:0.78rem;color:var(--muted);margin-left:0.5rem;">· ${day.accommodation?.rating || ""}</span>
      </div>
    </div>
  `,
    )
    .join("");
}

function renderSlot(slot, emoji, label, sym) {
  if (!slot) return "";
  return `
    <div class="timeline-slot">
      <div class="timeline-dot">${emoji}</div>
      <div class="timeline-content">
        <div class="timeline-time">${slot.time || label}</div>
        <div class="timeline-title">${slot.title || label}</div>
        <div class="timeline-desc">${slot.description || ""}</div>
        <div style="display:flex;gap:1rem;margin-top:0.5rem;flex-wrap:wrap;">
          ${slot.location ? `<span style="font-size:0.75rem;color:var(--muted);">📍 ${slot.location}</span>` : ""}
          ${slot.cost ? `<span style="font-size:0.75rem;color:var(--gold);">${sym}${slot.cost}</span>` : ""}
        </div>
        ${slot.tips ? `<div style="margin-top:0.5rem;font-size:0.75rem;color:var(--gold);font-style:italic;">💡 ${slot.tips}</div>` : ""}
      </div>
    </div>`;
}

// ── Weather ───────────────────────────────────────────────────
async function fetchWeather(city) {
  if (!city) return;
  try {
    const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
    const data = await res.json();
    if (!data.success || !data.current?.success) return;
    const w = data.current;
    const el = (id) => document.getElementById(id);
    if (el("weatherTemp")) el("weatherTemp").textContent = `${w.temperature}°C`;
    if (el("weatherDesc")) el("weatherDesc").textContent = w.description || "";
    if (el("weatherHumid"))
      el("weatherHumid").textContent = `${w.humidity}% humidity`;
    if (el("weatherCity"))
      el("weatherCity").textContent = `${w.city}, ${w.country}`;
    if (el("weatherIcon")) el("weatherIcon").src = w.iconUrl || "";
    if (el("weatherFeels"))
      el("weatherFeels").textContent = `Feels like ${w.feelsLike}°C`;
    if (el("weatherWind"))
      el("weatherWind").textContent = `${w.windSpeed} m/s wind`;
  } catch (e) {
    console.warn("Weather fetch failed:", e);
  }
}

// ── Pie Chart ─────────────────────────────────────────────────
function renderPieChart(bd) {
  const canvas = document.getElementById("budgetPieChart");
  if (!canvas || !bd) return;
  const ctx = canvas.getContext("2d");

  const COLORS = [
    "#c9a84c",
    "#e8c96d",
    "#f5e6b8",
    "#8896a8",
    "#4a6080",
    "#2a3f5f",
  ];
  const keys = [
    "accommodation",
    "food",
    "transport",
    "activities",
    "shopping",
    "misc",
  ];
  const slices = [];
  let total = 0;

  keys.forEach((key, i) => {
    const val = Number(bd[key]) || 0;
    if (val > 0) {
      slices.push({ val, color: COLORS[i] });
      total += val;
    }
  });

  if (total === 0) return;

  const sym = loadItinerary()?.currencySymbol || "$";
  const chartTot = document.getElementById("chartTotal");
  if (chartTot)
    chartTot.textContent = `${sym}${Math.round(total).toLocaleString()}`;

  const cx = 100,
    cy = 100,
    r = 85,
    inner = 52;
  let angle = -Math.PI / 2;
  ctx.clearRect(0, 0, 200, 200);

  slices.forEach((s) => {
    const sweep = (s.val / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + sweep);
    ctx.closePath();
    ctx.fillStyle = s.color;
    ctx.strokeStyle = "#0d1526";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    angle += sweep;
  });

  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, 2 * Math.PI);
  ctx.fillStyle = "#0d1526";
  ctx.fill();
}

// ── Currency Trio ─────────────────────────────────────────────
async function renderCurrencyTrio(destination, totalBudgetUSD) {
  const trio = document.getElementById("currencyTrio");
  if (!trio || !destination || !totalBudgetUSD) return;
  try {
    const res = await fetch(
      `/api/currency/convert?amount=${totalBudgetUSD}&destination=${encodeURIComponent(destination)}`,
    );
    const data = await res.json();
    if (!data.success) return;
    const c = data.conversion;
    trio.innerHTML = `
      <div class="currency-trio-item primary">
        <span class="currency-trio-amount">${c.local.symbol}${c.local.amount.toLocaleString()}</span>
        <span class="currency-trio-code">${c.local.code} (Local)</span>
      </div>
      <div class="currency-trio-item">
        <span class="currency-trio-amount">${c.usd.symbol}${c.usd.amount.toLocaleString()}</span>
        <span class="currency-trio-code">USD</span>
      </div>
      <div class="currency-trio-item">
        <span class="currency-trio-amount">${c.inr.symbol}${c.inr.amount.toLocaleString()}</span>
        <span class="currency-trio-code">INR</span>
      </div>`;
  } catch (e) {
    if (trio) trio.style.display = "none";
  }
}
