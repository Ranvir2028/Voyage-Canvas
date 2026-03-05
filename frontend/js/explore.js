// =====================================================
//   VOYAGE CANVAS — Explore JS
// =====================================================

const POPULAR_DESTINATIONS = [
  {
    name: "Paris",
    country: "France",
    emoji: "🗼",
    tagline: "The City of Light & Love",
    desc: "Iconic boulevards, world-class cuisine, and unmatched art. Paris is a dream destination for culture lovers and romantics alike.",
    highlights: [
      "Eiffel Tower",
      "Louvre Museum",
      "Seine River Cruise",
      "Montmartre",
    ],
    budget_usd: 150,
    budget_inr: 12500,
  },
  {
    name: "Tokyo",
    country: "Japan",
    emoji: "🏯",
    tagline: "Where Tradition Meets the Future",
    desc: "A sensory overload of neon lights, ancient temples, cutting-edge technology, and the best street food on the planet.",
    highlights: [
      "Shibuya Crossing",
      "Senso-ji Temple",
      "Akihabara",
      "Mount Fuji Day Trip",
    ],
    budget_usd: 120,
    budget_inr: 10000,
  },
  {
    name: "Bali",
    country: "Indonesia",
    emoji: "🌺",
    tagline: "Island of the Gods",
    desc: "Lush rice terraces, stunning temples, spiritual culture, and some of the world's best surf and sunsets.",
    highlights: [
      "Ubud Rice Terraces",
      "Tanah Lot Temple",
      "Seminyak Beach",
      "Mount Batur",
    ],
    budget_usd: 60,
    budget_inr: 5000,
  },
  {
    name: "New York",
    country: "United States",
    emoji: "🗽",
    tagline: "The City That Never Sleeps",
    desc: "Skyscrapers, world-famous food, Broadway shows, and neighborhoods that feel like different countries.",
    highlights: ["Central Park", "Times Square", "Brooklyn Bridge", "MoMA"],
    budget_usd: 200,
    budget_inr: 16700,
  },
  {
    name: "Santorini",
    country: "Greece",
    emoji: "🌅",
    tagline: "Cliffside Views & Azure Waters",
    desc: "Iconic whitewashed buildings, spectacular sunsets over the caldera, and crystal-clear Aegean waters.",
    highlights: ["Oia Sunset", "Fira Town", "Red Beach", "Wine Tasting"],
    budget_usd: 180,
    budget_inr: 15000,
  },
  {
    name: "Dubai",
    country: "UAE",
    emoji: "🏙️",
    tagline: "Where Luxury Knows No Limits",
    desc: "Record-breaking skyscrapers, desert safaris, luxury shopping, and a melting pot of global cultures.",
    highlights: [
      "Burj Khalifa",
      "Desert Safari",
      "Dubai Mall",
      "Palm Jumeirah",
    ],
    budget_usd: 250,
    budget_inr: 20900,
  },
  {
    name: "Goa",
    country: "India",
    emoji: "🌴",
    tagline: "Sun, Sand & Spice",
    desc: "Pristine beaches, Portuguese heritage, vibrant nightlife, and the freshest seafood in India.",
    highlights: [
      "Baga Beach",
      "Old Goa Churches",
      "Spice Plantations",
      "Dudhsagar Falls",
    ],
    budget_usd: 40,
    budget_inr: 3300,
  },
  {
    name: "Rome",
    country: "Italy",
    emoji: "🏛️",
    tagline: "The Eternal City",
    desc: "Walk through millennia of history — from the Colosseum to Vatican City — while eating the world's best pasta.",
    highlights: [
      "Colosseum",
      "Vatican Museums",
      "Trevi Fountain",
      "Trastevere",
    ],
    budget_usd: 140,
    budget_inr: 11700,
  },
  {
    name: "Bangkok",
    country: "Thailand",
    emoji: "🛕",
    tagline: "Street Food Capital of the World",
    desc: "Ornate temples, floating markets, legendary street food, vibrant nightlife, and incredible value for money.",
    highlights: [
      "Grand Palace",
      "Wat Pho",
      "Chatuchak Market",
      "Chao Phraya River",
    ],
    budget_usd: 50,
    budget_inr: 4200,
  },
];

let currentModalDestination = null;

// ── Init ─────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  renderDestinationCards(POPULAR_DESTINATIONS);
});

// ── Render Cards ──────────────────────────────────────

function renderDestinationCards(destinations) {
  const grid = document.getElementById("destinationsGrid");
  if (!grid) return;

  grid.innerHTML = destinations
    .map(
      (dest) => `
    <div class="destination-card" onclick="openDestinationModal('${dest.name}', ${JSON.stringify(dest).replace(/'/g, "&#39;")})">
      <div class="destination-card-img">
        <span style="z-index:1; position:relative;">${dest.emoji}</span>
      </div>
      <div class="destination-card-body">
        <div class="destination-name">${dest.name}</div>
        <div class="destination-country">${dest.country}</div>
        <div class="destination-desc">${dest.tagline}</div>
        <div class="destination-highlights">
          ${dest.highlights
            .slice(0, 3)
            .map((h) => `<span class="destination-highlight-tag">${h}</span>`)
            .join("")}
        </div>
        <div class="destination-budget">
          <span class="dest-budget-label">Avg. Daily Budget</span>
          <span class="dest-budget-value">$${dest.budget_usd} / ₹${dest.budget_inr.toLocaleString()}</span>
        </div>
      </div>
    </div>
  `,
    )
    .join("");
}

// ── Search ───────────────────────────────────────────

async function searchDestination() {
  const query = document.getElementById("exploreSearchInput").value.trim();
  if (!query) {
    showToast("Enter a destination to search", "error");
    return;
  }

  // Check local first
  const local = POPULAR_DESTINATIONS.find(
    (d) =>
      d.name.toLowerCase().includes(query.toLowerCase()) ||
      d.country.toLowerCase().includes(query.toLowerCase()),
  );

  if (local) {
    openDestinationModal(local.name, local);
    return;
  }

  // Fetch from AI
  showLoading("Researching destination...", "Powered by Google Gemini");
  try {
    const result = await apiCall(
      `/api/destination-info?destination=${encodeURIComponent(query)}`,
    );
    hideLoading();
    if (result.success && result.info) {
      openDestinationModalFromAPI(result.info);
    } else {
      showToast("Could not find info for that destination", "error");
    }
  } catch (err) {
    hideLoading();
    showToast("Search failed. Check your connection.", "error");
  }
}

// ── Modal ─────────────────────────────────────────────

function openDestinationModal(name, data) {
  currentModalDestination = name;

  document.getElementById("modalTitle").textContent = data.name || name;
  document.getElementById("modalCountry").textContent = data.country || "";
  document.getElementById("modalTagline").textContent = data.tagline || "";
  document.getElementById("modalDesc").textContent =
    data.desc || data.description || "";
  document.getElementById("modalLang").textContent =
    `Language: ${data.language || "Varies"}`;
  document.getElementById("modalCurr").textContent =
    `Currency: ${data.currency_local || "USD"}`;
  document.getElementById("modalVisa").textContent =
    data.visa_info || "Check requirements for your country";
  document.getElementById("modalBudgetUSD").textContent =
    `$${data.budget_usd || data.avg_daily_budget_usd || "—"}`;
  document.getElementById("modalBudgetINR").textContent =
    `₹${(data.budget_inr || data.avg_daily_budget_inr || 0).toLocaleString()}`;

  // Best months
  const monthsEl = document.getElementById("modalMonths");
  const months = data.best_months || ["Year-round"];
  monthsEl.innerHTML = months
    .map((m) => `<span class="badge badge-gold">${m}</span>`)
    .join("");

  // Attractions
  const attrEl = document.getElementById("modalAttractions");
  const attractions =
    data.top_attractions ||
    data.highlights?.map((h) => ({ name: h, must_see: true })) ||
    [];
  attrEl.innerHTML = attractions
    .map(
      (a) => `
    <div class="attraction-item">
      <span class="${a.must_see ? "attraction-must" : ""}">${a.must_see ? "★" : "○"}</span>
      <div>
        <div style="color:var(--cream); font-weight:500; font-size:0.82rem;">${a.name}</div>
        ${a.type ? `<div style="color:var(--muted); font-size:0.72rem;">${a.type}</div>` : ""}
      </div>
    </div>
  `,
    )
    .join("");

  document.getElementById("destModal").classList.add("open");
  document.body.style.overflow = "hidden";
}

function openDestinationModalFromAPI(info) {
  openDestinationModal(info.name, {
    ...info,
    budget_usd: info.avg_daily_budget_usd,
    budget_inr: info.avg_daily_budget_inr,
    desc: info.description,
  });
}

function closeModal() {
  document.getElementById("destModal").classList.remove("open");
  document.body.style.overflow = "";
}

function planThisDestination() {
  if (currentModalDestination) {
    // Pre-fill destination in planner
    sessionStorage.setItem("vc_prefill_dest", currentModalDestination);
  }
  window.location.href = "/planner";
}

// ── Close modal on overlay click ──────────────────────
document.getElementById("destModal")?.addEventListener("click", (e) => {
  if (e.target === document.getElementById("destModal")) closeModal();
});

// ── Prefill destination from explore ─────────────────
// (In planner.js it reads sessionStorage on load)
document.addEventListener("DOMContentLoaded", () => {
  const prefill = sessionStorage.getItem("vc_prefill_dest");
  const destInput = document.getElementById("destination");
  if (prefill && destInput) {
    destInput.value = prefill;
    sessionStorage.removeItem("vc_prefill_dest");
  }
});
