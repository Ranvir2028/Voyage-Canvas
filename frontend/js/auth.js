// =====================================================
//   VOYAGE CANVAS — Auth JS
// =====================================================

// ── Tab Switching ─────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll(".auth-tab").forEach((t, i) => {
    t.classList.toggle(
      "active",
      (i === 0 && tab === "login") || (i === 1 && tab === "register"),
    );
  });
  document
    .getElementById("loginForm")
    .classList.toggle("active", tab === "login");
  document
    .getElementById("registerForm")
    .classList.toggle("active", tab === "register");
  hideAuthError();
}

// ── Error Display ─────────────────────────────────────
function showAuthError(msg) {
  const el = document.getElementById("authError");
  if (el) {
    el.textContent = msg;
    el.style.display = "block";
  }
}
function hideAuthError() {
  const el = document.getElementById("authError");
  if (el) el.style.display = "none";
}

// ── Login ─────────────────────────────────────────────
async function submitLogin() {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;
  if (!username || !password) {
    showAuthError("Please fill in all fields");
    return;
  }

  const btn = document.getElementById("loginBtn");
  btn.disabled = true;
  btn.textContent = "Signing in...";
  hideAuthError();

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem("vc_token", data.token);
      localStorage.setItem("vc_user", JSON.stringify(data.user));
      window.location.href = "/dashboard";
    } else {
      showAuthError(data.error || "Login failed");
      btn.disabled = false;
      btn.textContent = "Sign In →";
    }
  } catch (e) {
    showAuthError("Connection error. Is the server running?");
    btn.disabled = false;
    btn.textContent = "Sign In →";
  }
}

// ── Register ──────────────────────────────────────────
async function submitRegister() {
  const fullName = document.getElementById("regFullName").value.trim();
  const username = document.getElementById("regUsername").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;

  if (!fullName || !username || !email || !password) {
    showAuthError("Please fill in all fields");
    return;
  }
  if (password.length < 6) {
    showAuthError("Password must be at least 6 characters");
    return;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    showAuthError(
      "Username can only contain letters, numbers, and underscores",
    );
    return;
  }

  const btn = document.getElementById("registerBtn");
  btn.disabled = true;
  btn.textContent = "Creating account...";
  hideAuthError();

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, username, email, password }),
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem("vc_token", data.token);
      localStorage.setItem("vc_user", JSON.stringify(data.user));
      window.location.href = "/dashboard";
    } else {
      showAuthError(data.error || "Registration failed");
      btn.disabled = false;
      btn.textContent = "Create Account →";
    }
  } catch (e) {
    showAuthError("Connection error. Is the server running?");
    btn.disabled = false;
    btn.textContent = "Create Account →";
  }
}

// ── Logout ────────────────────────────────────────────
async function logout() {
  const token = localStorage.getItem("vc_token");
  if (token) {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
  localStorage.removeItem("vc_token");
  localStorage.removeItem("vc_user");
  window.location.href = "/login";
}

// ── Auth Guard ────────────────────────────────────────
// Call this on protected pages to redirect if not logged in
function requireAuth() {
  const token = localStorage.getItem("vc_token");
  if (!token) {
    window.location.href = "/login";
    return null;
  }
  return token;
}

// Redirect logged-in users away from login page
document.addEventListener("DOMContentLoaded", () => {
  const isLoginPage = document.getElementById("loginForm") !== null;
  if (isLoginPage) {
    const token = localStorage.getItem("vc_token");
    if (token) window.location.href = "/dashboard";
  }
});

// ── API call with auth token ──────────────────────────
function authHeaders() {
  const token = localStorage.getItem("vc_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}
