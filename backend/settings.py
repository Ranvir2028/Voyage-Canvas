# ============================================================
#   VOYAGE CANVAS — Configuration File
#   API Keys will be in the .env file and are imported here
# ============================================================

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ──────────────────────────────────────────────
#  🔑 PASTE YOUR GEMINI API KEY HERE
# ──────────────────────────────────────────────
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# ──────────────────────────────────────────────
#  🌤️ OpenWeatherMap API Key (Free tier works)
#  Get one at: https://openweathermap.org/api
# ──────────────────────────────────────────────
OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY')

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

if not OPENWEATHER_API_KEY:
    raise ValueError("OPENWEATHER_API_KEY not found in environment variables")


# ──────────────────────────────────────────────
#  Flask Server Config
# ──────────────────────────────────────────────
FLASK_HOST = "127.0.0.1"
FLASK_PORT = 5000
FLASK_DEBUG = True

# ──────────────────────────────────────────────
#  Gemini Model
# ──────────────────────────────────────────────
GEMINI_MODEL = "google/gemma-3-27b-it:free"