// =====================================================
//   VOYAGE CANVAS — Planner JS
// =====================================================

let currentStep = 1;
let selectedCurrency = "USD";
let selectedInterests = [];
let selectedGroup = "Solo";
let travelers = 1;

// ── Step Navigation ─────────────────────────────────

function nextStep(from) {
  if (!validateStep(from)) return;
  updateProgress(from, from + 1);
  showStep(from + 1);
  if (from + 1 === 4) buildSummary();
}

function prevStep(from) {
  updateProgress(from, from - 1);
  showStep(from - 1);
}

function showStep(n) {
  document
    .querySelectorAll(".form-step")
    .forEach((s) => s.classList.remove("active"));
  const step = document.getElementById(`step-${n}`);
  if (step) {
    step.classList.add("active");
    step.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  currentStep = n;
}

function updateProgress(from, to) {
  const steps = document.querySelectorAll(".progress-step");
  steps.forEach((s, i) => {
    const num = i + 1;
    s.classList.remove("active", "done");
    if (num < to) s.classList.add("done");
    if (num === to) s.classList.add("active");
  });

  for (let i = 1; i <= 3; i++) {
    const conn = document.getElementById(`conn-${i}`);
    if (conn) conn.classList.toggle("done", i < to);
  }
}

// ── Validation ───────────────────────────────────────

function validateStep(step) {
  if (step === 1) {
    const dest = document.getElementById("destination").value.trim();
    const start = document.getElementById("startDate").value;
    const end = document.getElementById("endDate").value;

    if (!dest) {
      showToast("Please enter a destination", "error");
      return false;
    }
    if (!start) {
      showToast("Please select a departure date", "error");
      return false;
    }
    if (!end) {
      showToast("Please select a return date", "error");
      return false;
    }
    if (new Date(end) <= new Date(start)) {
      showToast("Return date must be after departure date", "error");
      return false;
    }
  }
  if (step === 3) {
    if (selectedInterests.length === 0) {
      showToast("Please select at least one interest", "error");
      return false;
    }
  }
  return true;
}

// ── Date Auto-Duration ───────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  const startInput = document.getElementById("startDate");
  const endInput = document.getElementById("endDate");
  const today = new Date().toISOString().split("T")[0];
  if (startInput) startInput.min = today;

  function recalcDuration() {
    const s = startInput.value,
      e = endInput.value;
    if (s && e) {
      const days = daysBetween(s, e);
      const d = document.getElementById("durationDisplay");
      if (d) d.value = `${days} day${days !== 1 ? "s" : ""}`;
    }
  }

  if (startInput)
    startInput.addEventListener("change", () => {
      if (endInput) endInput.min = startInput.value;
      recalcDuration();
    });
  if (endInput) endInput.addEventListener("change", recalcDuration);

  // Init budget
  updateBudget(1000);
});

// ── Budget Slider ────────────────────────────────────

function setCurrency(currency) {
  selectedCurrency = currency;
  document
    .getElementById("usdBtn")
    .classList.toggle("active", currency === "USD");
  document
    .getElementById("inrBtn")
    .classList.toggle("active", currency === "INR");

  const slider = document.getElementById("budgetSlider");
  if (currency === "INR") {
    slider.min = 5000;
    slider.max = 800000;
    slider.step = 5000;
    slider.value = 80000;
    document.getElementById("budgetMin").textContent = "₹5,000";
    document.getElementById("budgetMax").textContent = "₹8,00,000";
  } else {
    slider.min = 100;
    slider.max = 10000;
    slider.step = 50;
    slider.value = 1000;
    document.getElementById("budgetMin").textContent = "$100";
    document.getElementById("budgetMax").textContent = "$10,000";
  }
  updateBudget(slider.value);
}

function updateBudget(value) {
  const v = parseInt(value);
  const sym = selectedCurrency === "INR" ? "₹" : "$";
  document.getElementById("budgetDisplay").textContent =
    `${sym}${v.toLocaleString()}`;

  const slider = document.getElementById("budgetSlider");
  const min = parseInt(slider.min),
    max = parseInt(slider.max);
  const pct = ((v - min) / (max - min)) * 100;
  slider.style.setProperty("--pct", `${pct}%`);

  // Allocation preview (mid-range: 35/25/20)
  const allocAccom = Math.round(v * 0.35);
  const allocFood = Math.round(v * 0.25);
  const allocAct = Math.round(v * 0.2);

  document.getElementById("allocAccom").textContent =
    `~${sym}${allocAccom.toLocaleString()}`;
  document.getElementById("allocFood").textContent =
    `~${sym}${allocFood.toLocaleString()}`;
  document.getElementById("allocAct").textContent =
    `~${sym}${allocAct.toLocaleString()}`;
}

// ── Interests ────────────────────────────────────────

function toggleInterest(el) {
  const interest = el.dataset.interest;
  if (el.classList.contains("selected")) {
    el.classList.remove("selected");
    selectedInterests = selectedInterests.filter((i) => i !== interest);
  } else {
    el.classList.add("selected");
    selectedInterests.push(interest);
  }
}

// ── Group Type ───────────────────────────────────────

function selectGroup(el) {
  document
    .querySelectorAll(".group-card")
    .forEach((c) => c.classList.remove("selected"));
  el.classList.add("selected");
  selectedGroup = el.dataset.group;

  // Auto-set traveler count
  const defaults = { Solo: 1, Couple: 2, Family: 4, Friends: 3 };
  travelers = defaults[selectedGroup] || 1;
  document.getElementById("travelerCount").textContent = travelers;
}

function adjustTravelers(delta) {
  travelers = Math.max(1, Math.min(20, travelers + delta));
  document.getElementById("travelerCount").textContent = travelers;
}

// ── Summary Builder ──────────────────────────────────

function buildSummary() {
  const dest = document.getElementById("destination").value.trim();
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;
  const accom = document.getElementById("accommodation").value;
  const budget = document.getElementById("budgetSlider").value;
  const sym = selectedCurrency === "INR" ? "₹" : "$";
  const days = daysBetween(start, end);

  const grid = document.getElementById("summaryGrid");
  grid.innerHTML = `
    <div class="summary-item">
      <div class="summary-item-label">Destination</div>
      <div class="summary-item-value">📍 ${dest}</div>
    </div>
    <div class="summary-item">
      <div class="summary-item-label">Travel Dates</div>
      <div class="summary-item-value">📅 ${formatDate(start)} → ${formatDate(end)}</div>
    </div>
    <div class="summary-item">
      <div class="summary-item-label">Duration</div>
      <div class="summary-item-value">⏱️ ${days} Day${days !== 1 ? "s" : ""}</div>
    </div>
    <div class="summary-item">
      <div class="summary-item-label">Total Budget</div>
      <div class="summary-item-value">💰 ${sym}${parseInt(budget).toLocaleString()} ${selectedCurrency}</div>
    </div>
    <div class="summary-item">
      <div class="summary-item-label">Group</div>
      <div class="summary-item-value">👥 ${selectedGroup} · ${travelers} traveler${travelers !== 1 ? "s" : ""}</div>
    </div>
    <div class="summary-item">
      <div class="summary-item-label">Accommodation</div>
      <div class="summary-item-value">🏨 ${accom}</div>
    </div>
  `;

  const pills = document.getElementById("interestPills");
  pills.innerHTML =
    selectedInterests
      .map((i) => `<span class="interest-pill">${i}</span>`)
      .join("") ||
    '<span style="color:var(--muted); font-size:0.85rem;">No interests selected</span>';
}

// ── Generate Itinerary ───────────────────────────────

async function generateItinerary() {
  const dest = document.getElementById("destination").value.trim();
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;
  const budget = parseInt(document.getElementById("budgetSlider").value);
  const accom = document.getElementById("accommodation").value;
  const days = daysBetween(start, end);

  const tripData = {
    destination: dest,
    startDate: start,
    endDate: end,
    days: days, // backend reads 'days'
    duration: days, // keep both for compatibility
    budget: budget,
    currency: selectedCurrency,
    interests: selectedInterests,
    groupType: selectedGroup, // backend reads 'groupType'
    group_type: selectedGroup, // keep both for compatibility
    travelers: travelers,
    accommodation: accom,
  };

  saveTripData(tripData);

  const loadingMessages = [
    "✈️  Bribing local tour guides...",
    "🗺️  Charting the perfect route...",
    "🍜  Taste-testing local cuisine (virtually)...",
    "📸  Scouting the best photography spots...",
    "🏨  Negotiating hotel prices...",
    "🌤️  Checking the weather forecast...",
    "💰  Optimizing your budget allocation...",
    "🎯  Finding hidden gems off the beaten path...",
    "🧳  Packing your virtual suitcase...",
    "✦  Almost ready — this will be epic...",
  ];

  showLoading(loadingMessages[0], "Powered by Google Gemini AI");

  let msgIdx = 0;
  const msgTimer = setInterval(() => {
    msgIdx = (msgIdx + 1) % loadingMessages.length;
    const el = document.getElementById("loadingText");
    if (el) el.textContent = loadingMessages[msgIdx];
  }, 2500);

  try {
    const result = await apiCall("/api/generate-itinerary", "POST", tripData);

    clearInterval(msgTimer);

    if (result.success && result.itinerary) {
      saveItinerary(result.itinerary);
      hideLoading();
      showToast("Itinerary generated successfully!", "success");
      setTimeout(() => {
        window.location.href = "/itinerary";
      }, 800);
    } else {
      throw new Error(result.error || "Failed to generate itinerary");
    }
  } catch (err) {
    clearInterval(msgTimer);
    hideLoading();
    showToast(`Error: ${err.message}`, "error", 5000);
    console.error("Generation error:", err);
  }
}

// ── Star Rating Selector ──────────────────────────────────────
function selectStarRating(el) {
  document
    .querySelectorAll(".star-option")
    .forEach((o) => o.classList.remove("selected"));
  el.classList.add("selected");
  document.getElementById("accommodation").value = el.dataset.value;
}

// ── Currency Auto-Detect ──────────────────────────────────────
let detectedCurrency = null;

async function detectCurrencyForDestination(destination) {
  if (!destination || destination.length < 2) return;
  try {
    const res = await fetch(
      `/api/currency/detect?destination=${encodeURIComponent(destination)}`,
    );
    const data = await res.json();
    if (data.success && data.currency.detected) {
      detectedCurrency = data.currency;
      showCurrencyBadge(data.currency);
    }
  } catch (e) {
    /* silent fail */
  }
}

function showCurrencyBadge(currency) {
  let badge = document.getElementById("currencyBadge");
  if (!badge) {
    badge = document.createElement("div");
    badge.id = "currencyBadge";
    badge.className = "currency-badge";
    const destField = document.getElementById("destination").parentElement;
    destField.appendChild(badge);
  }
  badge.innerHTML = `🌍 Local currency detected: <strong>${currency.symbol} ${currency.code}</strong> — ${currency.name}`;
  badge.style.display = "flex";
}

// Hook into destination input
document.addEventListener("DOMContentLoaded", () => {
  const destInput = document.getElementById("destination");
  if (destInput) {
    let debounceTimer;
    destInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        detectCurrencyForDestination(destInput.value.trim());
      }, 600);
    });
  }
});

// ── Surprise Me Button ────────────────────────────────────────
const SURPRISE_DESTINATIONS = [
  {
    dest: "Kyoto, Japan",
    interests: ["Culture & History", "Food & Cuisine", "Art & Museums"],
  },
  {
    dest: "Santorini, Greece",
    interests: [
      "Beaches & Relaxation",
      "Photography & Sightseeing",
      "Food & Cuisine",
    ],
  },
  {
    dest: "Bali, Indonesia",
    interests: ["Nature & Wildlife", "Wellness & Spa", "Adventure & Outdoors"],
  },
  {
    dest: "Marrakech, Morocco",
    interests: ["Culture & History", "Shopping", "Food & Cuisine"],
  },
  {
    dest: "Iceland",
    interests: [
      "Adventure & Outdoors",
      "Photography & Sightseeing",
      "Nature & Wildlife",
    ],
  },
  {
    dest: "Tokyo, Japan",
    interests: ["Food & Cuisine", "Shopping", "Nightlife & Entertainment"],
  },
  {
    dest: "Maldives",
    interests: [
      "Beaches & Relaxation",
      "Wellness & Spa",
      "Photography & Sightseeing",
    ],
  },
  {
    dest: "Prague, Czech Republic",
    interests: [
      "Culture & History",
      "Nightlife & Entertainment",
      "Art & Museums",
    ],
  },
  {
    dest: "Cape Town, South Africa",
    interests: ["Adventure & Outdoors", "Nature & Wildlife", "Food & Cuisine"],
  },
  {
    dest: "Rajasthan, India",
    interests: [
      "Culture & History",
      "Photography & Sightseeing",
      "Local Experiences",
    ],
  },
];

function surpriseMe() {
  const pick =
    SURPRISE_DESTINATIONS[
      Math.floor(Math.random() * SURPRISE_DESTINATIONS.length)
    ];

  // Fill destination
  const destInput = document.getElementById("destination");
  if (destInput) {
    destInput.value = pick.dest;
    destInput.style.borderColor = "var(--gold)";
    detectCurrencyForDestination(pick.dest);
    setTimeout(() => (destInput.style.borderColor = ""), 1500);
  }

  // Set dates (2 weeks from now, 5 days)
  const start = new Date();
  start.setDate(start.getDate() + 14);
  const end = new Date(start);
  end.setDate(end.getDate() + 4);

  const fmt = (d) => d.toISOString().split("T")[0];
  document.getElementById("startDate").value = fmt(start);
  document.getElementById("endDate").value = fmt(end);

  const dur = document.getElementById("durationDisplay");
  if (dur) dur.value = "5 days";

  // Select interests
  document.querySelectorAll(".interest-tag").forEach((tag) => {
    const isMatch = pick.interests.includes(tag.dataset.interest);
    tag.classList.toggle("selected", isMatch);
  });
  selectedInterests = [...pick.interests];

  showToast(`✦ Destination chosen: ${pick.dest}`, "success", 3000);
  // Jump to step 1 if not there
  if (currentStep !== 1) {
    showStep(1);
    updateProgress(currentStep, 1);
  }
}

// ── Fun Loading Messages ───────────────────────────────────────
const FUN_LOADING_MSGS = [
  "Bribing local tour guides...",
  "Checking if it's tourist season...",
  "Negotiating hotel prices...",
  "Consulting the travel oracle...",
  "Taste-testing local cuisine (virtually)...",
  "Finding hidden gems off the beaten path...",
  "Calculating optimal selfie spots...",
  "Packing your virtual suitcase...",
  "Checking visa requirements...",
  "Almost ready — booking the best table in town...",
];

// Override the generateItinerary loading messages
const _origGenerate = generateItinerary;
// Patch loading messages in generateItinerary (already uses FUN_LOADING_MSGS via override below)
