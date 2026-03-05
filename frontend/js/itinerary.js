// =====================================================
//   VOYAGE CANVAS — Itinerary JS
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {
  const itinerary = loadItinerary();
  const tripData = loadTripData();

  if (!itinerary || !tripData) {
    document.getElementById("noItineraryState").style.display = "flex";
    document.getElementById("itineraryContent").style.display = "none";
    return;
  }

  document.getElementById("noItineraryState").style.display = "none";
  document.getElementById("itineraryContent").style.display = "block";

  renderBanner(itinerary, tripData);
  renderOverview(itinerary);
  renderDayNav(itinerary);
  renderBudget(itinerary);
  renderPackingList(itinerary);
  renderDayCards(itinerary);
  updateMap(tripData.destination);
  fetchWeather(tripData.destination);
});

// ── Banner ───────────────────────────────────────────

function renderBanner(it, trip) {
  document.getElementById("itinLabel").textContent =
    "Your Personalized Journey";
  document.getElementById("itinTitle").textContent =
    it.trip_title || `${trip.destination} Adventure`;
  document.getElementById("itinDestination").textContent =
    it.destination || trip.destination;
  document.getElementById("itinDates").textContent =
    `${formatDate(trip.start_date)} → ${formatDate(trip.end_date)}`;
  document.getElementById("itinDuration").textContent =
    `${it.duration || trip.duration} Days`;
  document.getElementById("itinBudget").textContent = formatCurrency(
    trip.budget,
    trip.currency,
  );
  document.getElementById("mapLabel").textContent =
    it.destination || trip.destination;
}

// ── Overview ─────────────────────────────────────────

function renderOverview(it) {
  const overviewEl = document.getElementById("overviewText");
  const bestEl = document.getElementById("bestTime");
  const tipsEl = document.getElementById("localTips");

  if (overviewEl) overviewEl.textContent = it.overview || "";
  if (bestEl) bestEl.textContent = it.best_time_to_visit || "";

  if (tipsEl && it.local_tips) {
    tipsEl.innerHTML = it.local_tips.map((t) => `<li>${t}</li>`).join("");
  }
}

// ── Day Navigation ────────────────────────────────────

function renderDayNav(it) {
  const list = document.getElementById("dayNavList");
  if (!list || !it.days) return;

  list.innerHTML = it.days
    .map(
      (day, i) => `
    <li class="day-nav-item ${i === 0 ? "active" : ""}"
        onclick="scrollToDay(${day.day}, this)">
      <div class="day-nav-dot"></div>
      <div>
        <div style="font-weight:500; color:${i === 0 ? "var(--gold)" : "var(--cream)"}">
          Day ${day.day}
        </div>
        <div style="font-size:0.72rem; color:var(--muted); margin-top:0.15rem;">
          ${truncate(day.theme, 24)}
        </div>
      </div>
    </li>
  `,
    )
    .join("");
}

function scrollToDay(dayNum, el) {
  document.querySelectorAll(".day-nav-item").forEach((i) => {
    i.classList.remove("active");
    i.querySelector("div > div").style.color = "var(--cream)";
    i.querySelector(".day-nav-dot").style.background = "var(--border)";
  });
  el.classList.add("active");
  el.querySelector("div > div").style.color = "var(--gold)";
  el.querySelector(".day-nav-dot").style.background = "var(--gold)";

  const card = document.getElementById(`day-card-${dayNum}`);
  if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── Budget Breakdown ──────────────────────────────────

function renderBudget(it) {
  const barsEl = document.getElementById("budgetBars");
  const totalEl = document.getElementById("totalBudgetDisplay");
  if (!barsEl || !it.budget_breakdown) return;

  const bd = it.budget_breakdown;
  const sym = bd.currency_symbol || "$";
  const categories = [
    { key: "accommodation", label: "Accommodation", icon: "🏨" },
    { key: "food", label: "Food & Dining", icon: "🍽️" },
    { key: "activities", label: "Activities", icon: "🎯" },
    { key: "transport", label: "Transport", icon: "🚌" },
    { key: "shopping_misc", label: "Shopping & Misc", icon: "🛍️" },
  ];

  barsEl.innerHTML = categories
    .map((cat) => {
      const data = bd[cat.key];
      if (!data) return "";
      return `
      <div class="budget-bar-item">
        <div class="budget-bar-header">
          <span class="budget-bar-label">${cat.icon} ${cat.label}</span>
          <span class="budget-bar-value">${sym}${data.amount?.toLocaleString() || "—"}</span>
        </div>
        <div class="budget-bar-track">
          <div class="budget-bar-fill" style="width:0%"
               data-pct="${data.percentage || 0}"></div>
        </div>
      </div>
    `;
    })
    .join("");

  if (totalEl && bd.total) {
    totalEl.textContent = `${sym}${bd.total.toLocaleString()}`;
  }

  // Animate bars
  requestAnimationFrame(() => {
    setTimeout(() => {
      document.querySelectorAll(".budget-bar-fill").forEach((bar) => {
        bar.style.width = `${bar.dataset.pct}%`;
      });
    }, 300);
  });
}

// ── Packing List ──────────────────────────────────────

function renderPackingList(it) {
  const grid = document.getElementById("packingGrid");
  if (!grid || !it.packing_list) return;

  grid.innerHTML = it.packing_list
    .map((item) => `<span class="pack-item">📦 ${item}</span>`)
    .join("");
}

// ── Day Cards ─────────────────────────────────────────

function renderDayCards(it) {
  const container = document.getElementById("dayCards");
  if (!container || !it.days) return;

  container.innerHTML = it.days
    .map(
      (day, idx) => `
    <div class="day-card" id="day-card-${day.day}"
         style="animation-delay:${idx * 0.1}s">

      <!-- Day Header -->
      <div class="day-header">
        <div class="day-header-left">
          <span class="day-number-badge">DAY ${day.day}</span>
          <div>
            <div class="day-theme">${day.theme || `Day ${day.day}`}</div>
            <div class="day-date">${formatDate(day.date)}</div>
          </div>
        </div>
        ${day.transport ? `<span class="day-transport">🚌 ${day.transport}</span>` : ""}
      </div>

      <!-- Time Slots -->
      <div class="time-slots">
        ${renderSlot(day.morning, "Morning", "🌅")}
        ${renderSlot(day.afternoon, "Afternoon", "☀️")}
        ${renderSlot(day.evening, "Evening", "🌙")}
      </div>

      <!-- Meals -->
      ${renderMeals(day.meals)}

      <!-- Tips / Budget -->
      <div class="day-tips">
        <span style="color:var(--gold);">💡</span>
        <span>
          Daily estimate: <strong style="color:var(--cream);">${day.daily_budget_estimate || "—"}</strong>
          ${day.morning?.tips ? " · " + day.morning.tips : ""}
        </span>
      </div>

    </div>
  `,
    )
    .join("");
}

function renderSlot(slot, period, icon) {
  if (!slot) return "";
  return `
    <div class="time-slot">
      <div class="slot-time">
        <div class="slot-time-value">${slot.time || "—"}</div>
        <div class="slot-time-period">${icon} ${period}</div>
      </div>
      <div class="slot-line">
        <div class="slot-dot"></div>
        <div class="slot-connector"></div>
      </div>
      <div class="slot-content">
        <div class="slot-activity">
          <div class="slot-activity-name">${slot.activity || "—"}</div>
          <div class="slot-activity-desc">${slot.description || ""}</div>
          <div class="slot-activity-meta">
            ${slot.location ? `<div class="slot-meta-item"><span class="meta-icon">📍</span>${slot.location}</div>` : ""}
            ${slot.duration ? `<div class="slot-meta-item"><span class="meta-icon">⏱️</span>${slot.duration}</div>` : ""}
            ${slot.cost ? `<div class="slot-meta-item"><span class="meta-icon">💰</span>${slot.cost}</div>` : ""}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderMeals(meals) {
  if (!meals) return "";
  return `
    <div class="meals-row">
      ${
        meals.breakfast
          ? `
        <div class="meal-item">
          <div class="meal-label">☕ Breakfast</div>
          <div class="meal-name">${meals.breakfast.name}</div>
          <div class="meal-meta">${meals.breakfast.cuisine} · ${meals.breakfast.cost}</div>
        </div>`
          : '<div class="meal-item"></div>'
      }
      ${
        meals.lunch
          ? `
        <div class="meal-item">
          <div class="meal-label">🍱 Lunch</div>
          <div class="meal-name">${meals.lunch.name}</div>
          <div class="meal-meta">${meals.lunch.cuisine} · ${meals.lunch.cost}</div>
        </div>`
          : '<div class="meal-item"></div>'
      }
      ${
        meals.dinner
          ? `
        <div class="meal-item">
          <div class="meal-label">🍷 Dinner</div>
          <div class="meal-name">${meals.dinner.name}</div>
          <div class="meal-meta">${meals.dinner.cuisine} · ${meals.dinner.cost}</div>
        </div>`
          : '<div class="meal-item"></div>'
      }
    </div>
  `;
}

// ── Map ───────────────────────────────────────────────

function updateMap(destination) {
  const frame = document.getElementById("mapFrame");
  if (frame && destination) {
    const encoded = encodeURIComponent(destination);
    frame.src = `https://maps.google.com/maps?q=${encoded}&output=embed&z=11`;
  }
}

// ── Weather ───────────────────────────────────────────

async function fetchWeather(city) {
  try {
    const data = await apiCall(`/api/weather?city=${encodeURIComponent(city)}`);
    if (data.success) {
      document.getElementById("weatherTemp").textContent =
        `${data.temperature}°C`;
      document.getElementById("weatherDesc").textContent = data.description;
      document.getElementById("weatherExtras").textContent =
        `💧 ${data.humidity}% · 💨 ${data.wind_speed} m/s`;
      const iconEl = document.querySelector(".weather-icon");
      if (iconEl && data.icon_url) {
        iconEl.innerHTML = `<img src="${data.icon_url}" style="width:50px;" alt="weather" />`;
      }
    }
  } catch (e) {
    document.getElementById("weatherDesc").textContent = "Weather unavailable";
    console.log("Weather fetch failed:", e);
  }
}

// ── Export PDF ────────────────────────────────────────

function exportPDF() {
  showToast("Opening print dialog — save as PDF", "info");
  setTimeout(() => window.print(), 800);
}

// ── Utilities ─────────────────────────────────────────

function truncate(str, len) {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "…" : str;
}
