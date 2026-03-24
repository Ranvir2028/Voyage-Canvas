# ============================================================
#   settings.py — Voyage Canvas Configuration
# ============================================================

import os
from dotenv import load_dotenv

load_dotenv()

# ── API Keys ──────────────────────────────────────────────────
# NOTE: VISION_KEY is your Groq API key
VISION_API_KEY      = os.getenv('VISION_KEY')
OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY')

# ── Supabase (DBaaS) ──────────────────────────────────────────
DATABASE_URL    = os.getenv('DATABASE_URL')
SUPABASE_URL    = os.getenv('SUPABASE_URL')
SUPABASE_KEY    = os.getenv('SUPABASE_SERVICE_KEY')

# ── Validation ────────────────────────────────────────────────
if not VISION_API_KEY:
    raise ValueError("VISION_API_KEY not found in environment variables")

if not OPENWEATHER_API_KEY:
    raise ValueError("OPENWEATHER_API_KEY not found in environment variables")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found — add your Supabase connection string")

# ── Flask Server Config ───────────────────────────────────────
# 0.0.0.0 is REQUIRED for Render — 127.0.0.1 will make the app unreachable
FLASK_HOST  = os.getenv('FLASK_HOST', '0.0.0.0')
FLASK_PORT  = int(os.getenv('PORT', 5000))       # Render injects $PORT automatically
FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'  # Off in production

# ── AI Model ─────────────────────────────────────────────────
VISION_MODEL = os.getenv('VISION_MODEL', 'llama-3.3-70b-versatile')