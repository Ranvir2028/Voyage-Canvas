// ============================================================
//   itinerary.js — Voyage Canvas Itinerary Dashboard
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const itinerary = loadItinerary();
  let tripData = loadTripData();

  if (!itinerary) {
    document.getElementById("noItineraryState").style.display = "flex";
    document.getElementById("itineraryContent").style.display = "none";
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
  updateMap(tripData.destination);
  fetchDepartureRoute(tripData.destination);

  const totalUSD =
    tripData.currency === "USD" ? tripData.budget : tripData.budget / 83.5;
  renderCurrencyTrio(tripData.destination, totalUSD);
});

// ── Banner ────────────────────────────────────────────────────
function renderBanner(itin, trip) {
  const sym = itin.currencySymbol || "$";
  const days = itin.totalDays || itin.days?.length || trip.days || "—";
  const el = (id) => document.getElementById(id);

  if (el("tripTitle"))
    el("tripTitle").textContent = `${itin.destination} — ${days} Day Itinerary`;
  if (el("bannerDestination"))
    el("bannerDestination").textContent = itin.destination || "—";
  if (el("bannerDays")) el("bannerDays").textContent = `${days} Days`;
  if (el("bannerBudget"))
    el("bannerBudget").textContent =
      `${sym}${Number(itin.totalBudget || trip.budget || 0).toLocaleString()}`;
}

// ── Map Update ────────────────────────────────────────────────
function updateMap(destination) {
  const frame = document.getElementById("mapFrame");
  const label = document.getElementById("mapLabel");
  if (!frame || !destination) return;
  frame.src = `https://maps.google.com/maps?q=${encodeURIComponent(destination)}&output=embed&z=11`;
  if (label) label.textContent = destination;
}

// ── Overview ──────────────────────────────────────────────────
function renderOverview(itin) {
  const el = (id) => document.getElementById(id);

  if (el("tripSummary"))
    el("tripSummary").textContent =
      itin.summary || `Explore the wonders of ${itin.destination}.`;

  if (el("bestTimeToVisit"))
    el("bestTimeToVisit").textContent =
      itin.bestTimeToVisit ||
      itin.best_time_to_visit ||
      "Year-round destination — check seasonal weather before booking.";

  const tipsContainer = el("localTips") || el("travelTips");
  if (tipsContainer) {
    const tips = itin.localTips || itin.travelTips || itin.local_tips || [];
    if (tips.length > 0) {
      tipsContainer.innerHTML = tips
        .map(
          (tip) =>
            `<li style="margin-bottom:0.5rem;color:var(--muted);font-size:0.88rem;">💡 ${tip}</li>`,
        )
        .join("");
    }
  }

  const hlContainer = el("highlights");
  if (hlContainer) {
    const highlights = itin.highlights || [];
    hlContainer.innerHTML = highlights
      .map((h) => `<span class="badge badge-gold">${h}</span>`)
      .join("");
  }

  const cuisineContainer = el("localCuisine");
  if (cuisineContainer) {
    const cuisine = itin.localCuisine || itin.local_cuisine || [];
    cuisineContainer.innerHTML = cuisine
      .map((c) => `<span class="badge">🍽️ ${c}</span>`)
      .join("");
  }

  if (itin.weather && typeof itin.weather === "object") {
    if (el("weatherTypical"))
      el("weatherTypical").textContent = itin.weather.typical || "";
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
    if (el("weatherExtras"))
      el("weatherExtras").textContent =
        `Feels like ${w.feelsLike}°C · ${w.humidity}% humidity`;
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

// ── Departure Route ───────────────────────────────────────────
function fetchDepartureRoute(destination) {
  const card = document.getElementById("departureCard");
  const container = document.getElementById("departureRoute");
  if (!card || !container || !destination) return;

  const routes = getRouteFromIndia(destination);
  if (!routes) return;

  card.style.display = "block";
  container.innerHTML = `
    <p style="color:var(--muted);font-size:0.85rem;margin-bottom:1.2rem;">
      Suggested travel route from <strong style="color:var(--gold);">Mumbai / Thane, India</strong>
      to <strong style="color:var(--gold);">${destination}</strong>
    </p>
    <div style="display:flex;flex-direction:column;gap:0.6rem;">
      ${routes
        .map(
          (step, i) => `
        <div style="display:flex;align-items:center;gap:1rem;padding:0.9rem 1.2rem;
          background:var(--glass);border:1px solid var(--border);border-radius:var(--radius-md);">
          <div style="font-size:1.8rem;flex-shrink:0;">${step.icon}</div>
          <div style="flex:1;">
            <div style="font-size:0.9rem;font-weight:600;color:var(--cream);">
              ${step.from} → ${step.to}
            </div>
            <div style="font-size:0.78rem;color:var(--muted);margin-top:0.2rem;">
              ${step.mode} &nbsp;·&nbsp; ${step.duration}
            </div>
            <div style="font-size:0.75rem;color:var(--gold);margin-top:0.2rem;font-style:italic;">
              💡 ${step.note}
            </div>
          </div>
          <div style="font-family:var(--font-stamp);color:var(--gold);font-size:1.1rem;flex-shrink:0;">
            Step ${i + 1}
          </div>
        </div>
        ${i < routes.length - 1 ? '<div style="text-align:center;color:var(--muted);font-size:1rem;line-height:1;">↓</div>' : ""}
      `,
        )
        .join("")}
    </div>
    <div style="font-size:0.73rem;color:var(--muted);padding:0.8rem 0 0;
      border-top:1px solid var(--border);margin-top:1rem;text-align:center;">
      ⚠️ Routes are approximate. Check MakeMyTrip, IRCTC, or Google Flights for live prices and schedules.
    </div>`;
}

function getRouteFromIndia(destination) {
  const dest = destination.toLowerCase().split(",")[0].trim();

  const routes = {
    dubai: [
      {
        icon: "🚗",
        from: "Thane",
        to: "Mumbai Airport (BOM)",
        mode: "Cab / Auto",
        duration: "45–60 min",
        note: "Book Uber/Ola in advance — allow extra time for traffic",
      },
      {
        icon: "✈️",
        from: "Mumbai (BOM)",
        to: "Dubai (DXB)",
        mode: "Direct Flight",
        duration: "~3h 15min",
        note: "IndiGo, Air India, Emirates — 10+ daily flights, often under ₹8000 return",
      },
    ],
    paris: [
      {
        icon: "🚗",
        from: "Thane",
        to: "Mumbai Airport (BOM)",
        mode: "Cab",
        duration: "45–60 min",
        note: "Book cab in advance — allow 3h before departure",
      },
      {
        icon: "✈️",
        from: "Mumbai (BOM)",
        to: "Paris (CDG)",
        mode: "Direct / 1-stop Flight",
        duration: "9–13h",
        note: "Air France direct ~9h, or via Dubai/Doha cheaper",
      },
    ],
    london: [
      {
        icon: "🚗",
        from: "Thane",
        to: "Mumbai Airport (BOM)",
        mode: "Cab",
        duration: "45–60 min",
        note: "Book cab in advance",
      },
      {
        icon: "✈️",
        from: "Mumbai (BOM)",
        to: "London Heathrow (LHR)",
        mode: "Direct Flight",
        duration: "~9h 30min",
        note: "Air India direct is cheapest — book 2–3 months ahead",
      },
    ],
    tokyo: [
      {
        icon: "🚗",
        from: "Thane",
        to: "Mumbai Airport (BOM)",
        mode: "Cab",
        duration: "45–60 min",
        note: "Book cab in advance",
      },
      {
        icon: "✈️",
        from: "Mumbai (BOM)",
        to: "Tokyo Narita (NRT)",
        mode: "1-stop Flight",
        duration: "10–14h",
        note: "Via Singapore (SIA) or Bangkok (Thai Airways) — no direct",
      },
    ],
    bali: [
      {
        icon: "🚗",
        from: "Thane",
        to: "Mumbai Airport (BOM)",
        mode: "Cab",
        duration: "45–60 min",
        note: "Book cab in advance",
      },
      {
        icon: "✈️",
        from: "Mumbai (BOM)",
        to: "Bali Ngurah Rai (DPS)",
        mode: "1-stop Flight",
        duration: "8–12h",
        note: "Via Singapore, Kuala Lumpur or Jakarta — IndiGo/Air Asia good options",
      },
    ],
    singapore: [
      {
        icon: "🚗",
        from: "Thane",
        to: "Mumbai Airport (BOM)",
        mode: "Cab",
        duration: "45–60 min",
        note: "Book cab in advance",
      },
      {
        icon: "✈️",
        from: "Mumbai (BOM)",
        to: "Singapore Changi (SIN)",
        mode: "Direct Flight",
        duration: "~5h 30min",
        note: "IndiGo, Air India, Singapore Airlines — great connectivity",
      },
    ],
    bangkok: [
      {
        icon: "🚗",
        from: "Thane",
        to: "Mumbai Airport (BOM)",
        mode: "Cab",
        duration: "45–60 min",
        note: "Book cab in advance",
      },
      {
        icon: "✈️",
        from: "Mumbai (BOM)",
        to: "Bangkok Suvarnabhumi (BKK)",
        mode: "Direct Flight",
        duration: "~4h 30min",
        note: "Thai Airways, IndiGo, Air Asia — often very affordable",
      },
    ],
    goa: [
      {
        icon: "🚉",
        from: "Thane Station",
        to: "Madgaon / Goa",
        mode: "Train (Konkan Railway)",
        duration: "8–10h overnight",
        note: "Mandovi Express or Jan Shatabdi — book IRCTC 2 months ahead for Tatkal",
      },
    ],
    rajasthan: [
      {
        icon: "🚇",
        from: "Thane",
        to: "Mumbai Central",
        mode: "Local Train (Western Line)",
        duration: "~35 min",
        note: "Board Western line from Thane going towards Churchgate",
      },
      {
        icon: "🚉",
        from: "Mumbai Central",
        to: "Jaipur / Jodhpur / Udaipur",
        mode: "Train (Rajdhani / Express)",
        duration: "12–18h overnight",
        note: "Rajdhani Express is fastest — book IRCTC 60 days in advance",
      },
    ],
    jaipur: [
      {
        icon: "🚇",
        from: "Thane",
        to: "Mumbai Central",
        mode: "Local Train (Western Line)",
        duration: "~35 min",
        note: "Board Western line from Thane",
      },
      {
        icon: "🚉",
        from: "Mumbai Central",
        to: "Jaipur Junction",
        mode: "Train (Rajdhani Express)",
        duration: "~18h",
        note: "Mumbai-Jaipur Rajdhani or Aravali Express — sleeper or 3AC recommended",
      },
    ],
    delhi: [
      {
        icon: "🚗",
        from: "Thane",
        to: "Mumbai Airport (BOM)",
        mode: "Cab",
        duration: "45–60 min",
        note: "Or take local train to CSMT then cab to T2",
      },
      {
        icon: "✈️",
        from: "Mumbai (BOM)",
        to: "Delhi (DEL)",
        mode: "Direct Flight",
        duration: "~2h",
        note: "IndiGo/Air India cheapest — 50+ flights daily, book 3 weeks ahead for best prices",
      },
    ],
    kerala: [
      {
        icon: "🚉",
        from: "Thane Station",
        to: "Ernakulam / Thiruvananthapuram",
        mode: "Train (Netravati / Konkan Kanya Express)",
        duration: "20–28h",
        note: "Book 3AC or 2AC on IRCTC — scenic Konkan coastal route",
      },
    ],
    agra: [
      {
        icon: "🚗",
        from: "Thane",
        to: "Mumbai Airport (BOM)",
        mode: "Cab",
        duration: "45–60 min",
        note: "Fly to Delhi first",
      },
      {
        icon: "✈️",
        from: "Mumbai (BOM)",
        to: "Delhi (DEL)",
        mode: "Flight",
        duration: "~2h",
        note: "IndiGo or Air India",
      },
      {
        icon: "🚉",
        from: "Delhi (Hazrat Nizamuddin)",
        to: "Agra Cantonment",
        mode: "Train (Gatimaan / Taj Express)",
        duration: "~1h 40min",
        note: "Gatimaan Express is fastest at 160km/h — book IRCTC",
      },
    ],
    maldives: [
      {
        icon: "🚗",
        from: "Thane",
        to: "Mumbai Airport (BOM)",
        mode: "Cab",
        duration: "45–60 min",
        note: "Book cab in advance",
      },
      {
        icon: "✈️",
        from: "Mumbai (BOM)",
        to: "Malé (MLE)",
        mode: "Direct Flight",
        duration: "~3h",
        note: "IndiGo, Air India direct — then resort speedboat transfer",
      },
    ],
    iceland: [
      {
        icon: "🚗",
        from: "Thane",
        to: "Mumbai Airport (BOM)",
        mode: "Cab",
        duration: "45–60 min",
        note: "Book cab in advance",
      },
      {
        icon: "✈️",
        from: "Mumbai (BOM)",
        to: "London / Amsterdam / Frankfurt",
        mode: "1-stop Flight",
        duration: "9–11h",
        note: "No direct India–Iceland flights — connect via Europe",
      },
      {
        icon: "✈️",
        from: "London / Amsterdam",
        to: "Reykjavik Keflavik (KEF)",
        mode: "Short Flight",
        duration: "~3h",
        note: "Icelandair, EasyJet — book as a separate ticket for best prices",
      },
    ],
    santorini: [
      {
        icon: "🚗",
        from: "Thane",
        to: "Mumbai Airport (BOM)",
        mode: "Cab",
        duration: "45–60 min",
        note: "Book cab in advance",
      },
      {
        icon: "✈️",
        from: "Mumbai (BOM)",
        to: "Athens (ATH)",
        mode: "1-stop Flight",
        duration: "10–14h",
        note: "Via Dubai, Doha or Frankfurt",
      },
      {
        icon: "✈️",
        from: "Athens (ATH)",
        to: "Santorini (JTR)",
        mode: "Short Flight or Ferry",
        duration: "45 min flight / 8h ferry",
        note: "Olympic Air flight is fastest — ferry is scenic and cheaper",
      },
    ],
    rome: [
      {
        icon: "🚗",
        from: "Thane",
        to: "Mumbai Airport (BOM)",
        mode: "Cab",
        duration: "45–60 min",
        note: "Book cab in advance",
      },
      {
        icon: "✈️",
        from: "Mumbai (BOM)",
        to: "Rome Fiumicino (FCO)",
        mode: "1-stop Flight",
        duration: "11–14h",
        note: "Via Dubai or Qatar — Air India sometimes runs seasonal directs",
      },
    ],
    barcelona: [
      {
        icon: "🚗",
        from: "Thane",
        to: "Mumbai Airport (BOM)",
        mode: "Cab",
        duration: "45–60 min",
        note: "Book cab in advance",
      },
      {
        icon: "✈️",
        from: "Mumbai (BOM)",
        to: "Barcelona (BCN)",
        mode: "1-stop Flight",
        duration: "11–15h",
        note: "Via Dubai, Doha or Frankfurt — Qatar Airways highly rated",
      },
    ],
    new_york: [
      {
        icon: "🚗",
        from: "Thane",
        to: "Mumbai Airport (BOM)",
        mode: "Cab",
        duration: "45–60 min",
        note: "Book cab in advance",
      },
      {
        icon: "✈️",
        from: "Mumbai (BOM)",
        to: "New York JFK / Newark (EWR)",
        mode: "Direct / 1-stop Flight",
        duration: "14–17h",
        note: "Air India direct ~16h, or via London/Frankfurt",
      },
    ],
    amsterdam: [
      {
        icon: "🚗",
        from: "Thane",
        to: "Mumbai Airport (BOM)",
        mode: "Cab",
        duration: "45–60 min",
        note: "Book cab in advance",
      },
      {
        icon: "✈️",
        from: "Mumbai (BOM)",
        to: "Amsterdam (AMS)",
        mode: "Direct Flight",
        duration: "~9h",
        note: "KLM direct — or via Dubai, cheaper but longer",
      },
    ],
  };

  // Match by keyword
  for (const [key, route] of Object.entries(routes)) {
    const k = key.replace("_", " ");
    if (dest.includes(k) || k.includes(dest)) return route;
  }

  // Generic international fallback
  return [
    {
      icon: "🚗",
      from: "Thane",
      to: "Mumbai Airport (BOM)",
      mode: "Cab / Auto",
      duration: "45–60 min",
      note: "Book cab 1 day in advance — allow 3h before departure",
    },
    {
      icon: "✈️",
      from: "Mumbai (BOM)",
      to: destination,
      mode: "Flight (may need 1 stop)",
      duration: "Check airline sites",
      note: "Search Google Flights, MakeMyTrip or Skyscanner for best prices",
    },
  ];
}

// ── Export PDF ────────────────────────────────────────────────
function exportPDF() {
  window.print();
}
