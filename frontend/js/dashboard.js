// =====================================================
//   VOYAGE CANVAS — Dashboard JS
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {
  const token = requireAuth();
  if (!token) return;

  const user = JSON.parse(localStorage.getItem("vc_user") || "{}");

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  document.getElementById("timeGreeting").textContent = greeting;

  // User info
  const firstName = (user.full_name || user.username || "Traveler").split(
    " ",
  )[0];
  document.getElementById("userName").textContent = firstName;

  const initial = firstName.charAt(0).toUpperCase();
  document.getElementById("headerAvatar").textContent = initial;
  document.getElementById("profileAvatar").textContent = initial;
  document.getElementById("profileName").textContent = user.full_name || "—";
  document.getElementById("profileUsername").textContent =
    `@${user.username || "—"}`;
  document.getElementById("profileEmail").textContent = user.email || "—";

  const joined = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "—";
  document.getElementById("profileJoined").textContent =
    `Member since ${joined}`;

  // Load stats and itineraries in parallel
  await Promise.all([loadStats(token), loadItineraries(token)]);
});

// ── Stats ─────────────────────────────────────────────
async function loadStats(token) {
  try {
    const res = await fetch("/api/user/stats", { headers: authHeaders() });
    const data = await res.json();
    if (!data.success) return;
    const s = data.stats;

    animateCount("statTrips", s.totalTrips);
    animateCount("statDests", s.uniqueDestinations);
    animateCount("statDays", s.totalDaysPlanned);
    document.getElementById("statBudget").textContent =
      `$${Math.round(s.totalBudgetSpent).toLocaleString()}`;
  } catch (e) {
    console.error("Stats error:", e);
  }
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el || !target) return;
  let current = 0;
  const step = Math.max(1, Math.floor(target / 40));
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 30);
}

// ── Itineraries ───────────────────────────────────────
async function loadItineraries(token) {
  const grid = document.getElementById("itineraryGrid");
  try {
    const res = await fetch("/api/user/itineraries", {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!data.success) return;

    const itins = data.itineraries;
    if (itins.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <span class="empty-state-icon">🗺️</span>
          <h3>No trips planned yet</h3>
          <p style="color:var(--muted); margin-bottom:2rem;">
            Your saved itineraries will appear here after you generate them
          </p>
          <a href="/planner" class="btn btn-primary btn-lg">✦ &nbsp;Plan Your First Trip</a>
        </div>`;
      return;
    }

    grid.innerHTML = itins
      .map(
        (itin) => `
      <div class="saved-itin-card" id="itin-${itin.id}">
        <div class="saved-itin-dest">📍 ${itin.destination}</div>
        <div style="font-size:0.8rem; color:var(--muted); margin-bottom:0.8rem; font-style:italic;">
          ${truncate(itin.title, 55)}
        </div>
        <div class="saved-itin-meta">
          <span class="saved-itin-meta-item">⏱️ ${itin.duration} days</span>
          <span class="saved-itin-meta-item">💰 ${itin.currency === "INR" ? "₹" : "$"}${Number(itin.budget).toLocaleString()}</span>
          <span class="saved-itin-meta-item">📅 ${formatDate(itin.created_at)}</span>
        </div>
        <div class="saved-itin-actions">
          <button class="btn btn-outline btn-sm" onclick="loadItinerary(${itin.id})">
            View Itinerary
          </button>
          <button class="btn btn-ghost btn-sm" onclick="deleteItinerary(${itin.id})">
            🗑️ Delete
          </button>
        </div>
      </div>
    `,
      )
      .join("");
  } catch (e) {
    grid.innerHTML = `<p style="color:var(--muted);">Could not load itineraries.</p>`;
    console.error("Itineraries error:", e);
  }
}

async function loadItinerary(id) {
  try {
    const res = await fetch(`/api/user/itineraries/${id}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (data.success) {
      const itin = JSON.parse(data.itinerary.data);
      localStorage.setItem("vc_itinerary", JSON.stringify(itin));
      localStorage.setItem(
        "vc_trip_data",
        JSON.stringify({
          destination: data.itinerary.destination,
          duration: data.itinerary.duration,
          budget: data.itinerary.budget,
          currency: data.itinerary.currency,
        }),
      );
      window.location.href = "/itinerary";
    }
  } catch (e) {
    showToast("Could not load itinerary", "error");
  }
}

async function deleteItinerary(id) {
  if (!confirm("Delete this itinerary? This cannot be undone.")) return;
  try {
    const res = await fetch(`/api/user/itineraries/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById(`itin-${id}`)?.remove();
      showToast("Itinerary deleted", "info");
      await loadStats(localStorage.getItem("vc_token"));
    }
  } catch (e) {
    showToast("Could not delete itinerary", "error");
  }
}

function truncate(str, len) {
  return str && str.length > len ? str.slice(0, len) + "…" : str;
}
