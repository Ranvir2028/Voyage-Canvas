# ============================================================
#   app.py — Voyage Canvas Flask Backend Server
# ============================================================

import os, sys, json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import settings
from ai_service import generate_itinerary, get_destination_info
from weather_service import get_weather, get_forecast
from budget_service import allocate_budget, estimate_trip_cost

# ── Absolute Paths (Windows-safe) ─────────────────────────────
BACKEND_DIR  = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR     = os.path.dirname(BACKEND_DIR)
FRONTEND_DIR = os.path.join(ROOT_DIR, 'frontend')
PAGES_DIR    = os.path.join(FRONTEND_DIR, 'pages')
CSS_DIR      = os.path.join(FRONTEND_DIR, 'css')
JS_DIR       = os.path.join(FRONTEND_DIR, 'js')
ASSETS_DIR   = os.path.join(FRONTEND_DIR, 'assets')

app = Flask(__name__)
CORS(app, origins=["*"])

# ── Debug: print paths on startup ─────────────────────────────
print(f"   Frontend : {FRONTEND_DIR}")
print(f"   Pages    : {PAGES_DIR}")
print(f"   CSS      : {CSS_DIR}")
print(f"   JS       : {JS_DIR}")

# ── Serve Pages ───────────────────────────────────────────────
@app.route('/')
def index():
    return send_from_directory(PAGES_DIR, 'index.html')

@app.route('/planner')
def planner():
    return send_from_directory(PAGES_DIR, 'planner.html')

@app.route('/itinerary')
def itinerary():
    return send_from_directory(PAGES_DIR, 'itinerary.html')

@app.route('/explore')
def explore():
    return send_from_directory(PAGES_DIR, 'explore.html')

# ── Serve Static Assets ───────────────────────────────────────
@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory(CSS_DIR, filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory(JS_DIR, filename)

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory(ASSETS_DIR, filename)

# ── API: Health ───────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "online", "version": "1.0.0"})

# ── API: Generate Itinerary ───────────────────────────────────
@app.route("/api/generate-itinerary", methods=["POST"])
def generate():
    try:
        data = request.get_json()
        if not data or not data.get("destination"):
            return jsonify({"error": "Destination is required"}), 400
        result = generate_itinerary(data)
        return jsonify({"success": True, "itinerary": result})
    except json.JSONDecodeError as e:
        return jsonify({"error": f"AI returned invalid JSON: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── API: Destination Info ─────────────────────────────────────
@app.route("/api/destination-info", methods=["GET"])
def destination_info():
    destination = request.args.get("destination", "")
    if not destination:
        return jsonify({"error": "Destination required"}), 400
    try:
        info = get_destination_info(destination)
        return jsonify({"success": True, "info": info})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── API: Weather ──────────────────────────────────────────────
@app.route("/api/weather", methods=["GET"])
def weather():
    city = request.args.get("city", "")
    if not city:
        return jsonify({"error": "City required"}), 400
    current  = get_weather(city)
    forecast = get_forecast(city)
    return jsonify({"success": True, "current": current, "forecast": forecast.get("forecast", [])})

# ── API: Budget ───────────────────────────────────────────────
@app.route("/api/budget", methods=["POST"])
def budget():
    try:
        data      = request.get_json()
        total     = float(data.get("budget", 1000))
        currency  = data.get("currency", "USD")
        days      = int(data.get("days", 3))
        group     = data.get("groupType", "Solo")
        interests = data.get("interests", [])
        result    = allocate_budget(total, currency, days, group, interests)
        estimates = estimate_trip_cost("mid-range", days, group, currency)
        return jsonify({"success": True, "breakdown": result, "estimates": estimates})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── API: Popular Destinations ─────────────────────────────────
@app.route("/api/popular-destinations", methods=["GET"])
def popular_destinations():
    destinations = [
        {"name": "Paris",     "country": "France",    "emoji": "🗼", "tag": "Romance",   "avgCostUSD": 180, "avgCostINR": 15120},
        {"name": "Tokyo",     "country": "Japan",     "emoji": "🗾", "tag": "Culture",   "avgCostUSD": 160, "avgCostINR": 13440},
        {"name": "Bali",      "country": "Indonesia", "emoji": "🌺", "tag": "Tropical",  "avgCostUSD": 80,  "avgCostINR": 6720},
        {"name": "New York",  "country": "USA",       "emoji": "🗽", "tag": "Urban",     "avgCostUSD": 250, "avgCostINR": 21000},
        {"name": "Santorini", "country": "Greece",    "emoji": "🏛️","tag": "Scenic",    "avgCostUSD": 200, "avgCostINR": 16800},
        {"name": "Dubai",     "country": "UAE",       "emoji": "🏙️","tag": "Luxury",    "avgCostUSD": 300, "avgCostINR": 25200},
        {"name": "Goa",       "country": "India",     "emoji": "🏖️","tag": "Beach",     "avgCostUSD": 60,  "avgCostINR": 5040},
        {"name": "Rome",      "country": "Italy",     "emoji": "🏟️","tag": "History",   "avgCostUSD": 170, "avgCostINR": 14280},
        {"name": "Maldives",  "country": "Maldives",  "emoji": "🐠", "tag": "Paradise",  "avgCostUSD": 400, "avgCostINR": 33600},
        {"name": "Rajasthan", "country": "India",     "emoji": "🏰", "tag": "Heritage",  "avgCostUSD": 50,  "avgCostINR": 4200},
        {"name": "Singapore", "country": "Singapore", "emoji": "🦁", "tag": "Modern",    "avgCostUSD": 200, "avgCostINR": 16800},
        {"name": "Iceland",   "country": "Iceland",   "emoji": "🌋", "tag": "Adventure", "avgCostUSD": 300, "avgCostINR": 25200},
    ]
    return jsonify({"success": True, "destinations": destinations})

# ── Run ───────────────────────────────────────────────────────
if __name__ == "__main__":
    print("\n🌍 Voyage Canvas is LIVE")
    print(f"   Open: http://127.0.0.1:{settings.FLASK_PORT}")
    print(f"   Gemini: {settings.GEMINI_MODEL}\n")
    app.run(host=settings.FLASK_HOST, port=settings.FLASK_PORT, debug=settings.FLASK_DEBUG)