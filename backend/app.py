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
from database import (init_db, create_user, login_user, get_user_by_token,
                      logout_user, save_itinerary, get_user_itineraries,
                      get_itinerary_by_id, delete_itinerary, get_user_stats)

# ── Absolute Paths ────────────────────────────────────────────
BACKEND_DIR  = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR     = os.path.dirname(BACKEND_DIR)
FRONTEND_DIR = os.path.join(ROOT_DIR, 'frontend')
PAGES_DIR    = os.path.join(FRONTEND_DIR, 'pages')
CSS_DIR      = os.path.join(FRONTEND_DIR, 'css')
JS_DIR       = os.path.join(FRONTEND_DIR, 'js')
ASSETS_DIR   = os.path.join(FRONTEND_DIR, 'assets')

app = Flask(__name__)
CORS(app, origins=["*"])

# Initialize DB on startup
init_db()

# ── Auth Helper ───────────────────────────────────────────────
def get_current_user():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return None
    return get_user_by_token(token)

def require_auth():
    user = get_current_user()
    if not user:
        return None, jsonify({"error": "Unauthorized"}), 401
    return user, None, None

# ── Serve Pages ───────────────────────────────────────────────
@app.route('/')
def root():
    return send_from_directory(PAGES_DIR, 'login.html')

@app.route('/login')
def login_page():
    return send_from_directory(PAGES_DIR, 'login.html')

@app.route('/dashboard')
def dashboard():
    return send_from_directory(PAGES_DIR, 'dashboard.html')

@app.route('/home')
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

# ── AUTH ROUTES ───────────────────────────────────────────────

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username  = data.get('username', '').strip()
    email     = data.get('email', '').strip()
    password  = data.get('password', '')
    full_name = data.get('fullName', '').strip()
    if not all([username, email, password, full_name]):
        return jsonify({"error": "All fields are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    result = create_user(username, email, password, full_name)
    if not result['success']:
        return jsonify({"error": result['error']}), 409
    # Auto-login after register
    login_result = login_user(username, password)
    return jsonify({"success": True, "token": login_result['token'],
                    "user": _safe_user(login_result['user'])})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    identifier = data.get('username', '').strip()
    password   = data.get('password', '')
    if not identifier or not password:
        return jsonify({"error": "Username and password required"}), 400
    result = login_user(identifier, password)
    if not result['success']:
        return jsonify({"error": result['error']}), 401
    return jsonify({"success": True, "token": result['token'],
                    "user": _safe_user(result['user'])})

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if token:
        logout_user(token)
    return jsonify({"success": True})

@app.route('/api/auth/me', methods=['GET'])
def me():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify({"success": True, "user": _safe_user(user)})

def _safe_user(user: dict) -> dict:
    """Return user without password."""
    return {k: v for k, v in user.items() if k != 'password'}

# ── USER ROUTES ───────────────────────────────────────────────

@app.route('/api/user/stats', methods=['GET'])
def user_stats():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    stats = get_user_stats(user['id'])
    return jsonify({"success": True, "stats": stats})

@app.route('/api/user/itineraries', methods=['GET'])
def user_itineraries():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    itins = get_user_itineraries(user['id'])
    return jsonify({"success": True, "itineraries": itins})

@app.route('/api/user/itineraries/<int:itin_id>', methods=['GET'])
def get_itinerary(itin_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    itin = get_itinerary_by_id(itin_id, user['id'])
    if not itin:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"success": True, "itinerary": itin})

@app.route('/api/user/itineraries/<int:itin_id>', methods=['DELETE'])
def delete_user_itinerary(itin_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    result = delete_itinerary(itin_id, user['id'])
    return jsonify(result)

# ── TRIP ROUTES ───────────────────────────────────────────────

@app.route("/api/generate-itinerary", methods=["POST"])
def generate():
    try:
        data = request.get_json()
        if not data or not data.get("destination"):
            return jsonify({"error": "Destination is required"}), 400
        result = generate_itinerary(data)
        # Auto-save if user is logged in
        user = get_current_user()
        if user:
            save_itinerary(
                user_id=user['id'],
                title=result.get('summary', data['destination'])[:60],
                destination=data['destination'],
                duration=int(data.get('days', 3)),
                budget=float(data.get('budget', 0)),
                currency=data.get('currency', 'USD'),
                data=json.dumps(result)
            )
        return jsonify({"success": True, "itinerary": result})
    except json.JSONDecodeError as e:
        return jsonify({"error": f"AI returned invalid JSON: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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

@app.route("/api/weather", methods=["GET"])
def weather():
    city = request.args.get("city", "")
    if not city:
        return jsonify({"error": "City required"}), 400
    current  = get_weather(city)
    forecast = get_forecast(city)
    return jsonify({"success": True, "current": current,
                    "forecast": forecast.get("forecast", [])})

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

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "online", "version": "2.0.0"})


# ── Currency Routes ───────────────────────────────────────────
from currency_service import get_currency, convert_to_local, get_all_currencies

@app.route("/api/currency/detect", methods=["GET"])
def detect_currency():
    destination = request.args.get("destination", "")
    if not destination:
        return jsonify({"error": "Destination required"}), 400
    currency = get_currency(destination)
    return jsonify({"success": True, "currency": currency})

@app.route("/api/currency/convert", methods=["GET"])
def currency_convert():
    try:
        amount = float(request.args.get("amount", 0))
        destination = request.args.get("destination", "")
        result = convert_to_local(amount, destination)
        return jsonify({"success": True, "conversion": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/currency/list", methods=["GET"])
def currency_list():
    return jsonify({"success": True, "currencies": get_all_currencies()})

# ── Run ───────────────────────────────────────────────────────
if __name__ == "__main__":
    print("\n🌍 Voyage Canvas is LIVE")
    print(f"   Open: http://127.0.0.1:{settings.FLASK_PORT}")
    print(f"   Vision AI: {settings.VISION_MODEL}\n")
    app.run(host=settings.FLASK_HOST, port=settings.FLASK_PORT, debug=settings.FLASK_DEBUG)