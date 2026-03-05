# 🌍 Voyage Canvas — Design Your Journey
> AI-Powered Personalized Travel Itinerary Generator

---

## 🚀 Setup & Run

### Prerequisites
- Python 3.8+
- pip

---

### Step 1 — Add Your API Keys

Open `backend/.env` and paste your keys:

```python
GEMINI_API_KEY  = "your_gemini_key_here"      # https://aistudio.google.com/
WEATHER_API_KEY = "your_openweather_key_here"  # https://openweathermap.org/api (free)
```

---

### Step 2 — Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

---

### Step 3 — Start the Server

```bash
cd backend
python app.py
```

You'll see:
```
🌍  Voyage Canvas Server Starting...
🔗  Open: http://localhost:5000
```

---

### Step 4 — Open in Browser

Visit: **http://localhost:5000**

---

## 📁 Project Structure

```
voyage-canvas/
├── backend/
│   ├── app.py              ← Flask server & all API routes
│   ├── ai_service.py       ← Gemini AI itinerary generation
│   ├── weather_service.py  ← OpenWeatherMap integration
│   ├── budget_service.py   ← Budget allocation logic
│   ├── .env                ← Environment variables
│   ├── settings.py         ← API keys & server config
│   └── requirements.txt
│
├── frontend/
│   ├── pages/
│   │   ├── index.html      ← Landing page
│   │   ├── planner.html    ← Multi-step trip planner
│   │   ├── itinerary.html  ← Generated itinerary dashboard
│   │   └── explore.html    ← Destination explorer
│   │
│   ├── css/
│   │   ├── global.css      ← Fonts, variables, shared styles
│   │   ├── landing.css     ← Landing page styles
│   │   ├── planner.css     ← Form & planner styles
│   │   └── itinerary.css   ← Dashboard & explore styles
│   │
│   └── js/
│       ├── main.js         ← Global utilities, API helper, toast
│       ├── planner.js      ← Form logic, step navigation, validation
│       ├── itinerary.js    ← Dashboard render, weather, budget
│       └── explore.js      ← Destination cards, modal, AI search
│
├── README.md               ← Project overview, setup, usage instructions
│
├── .gitignore              ← Files to ignore during version control
│
└── START_WINDOWS.bat       ← Windows batch script to run the application
```

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 AI Itinerary | Gemini generates full day-by-day plans |
| 🌤️ Live Weather | Real-time weather at your destination |
| 💰 Budget Smart | Category-based budget allocation |
| 🗺️ Maps | Google Maps embedded for every destination |
| 🌍 Explore | Browse 9+ curated destinations + AI search any city |
| 📄 Export | Print/PDF export of your itinerary |
| 💱 Dual Currency | Switch between USD ($) and INR (₹) |

---

## 🔑 Getting API Keys (Free)

**Gemini API Key:**
1. Go to https://aistudio.google.com/
2. Sign in with Google
3. Click "Get API Key"
4. Copy and paste into `backend/.env`

**OpenWeatherMap API Key:**
1. Go to https://openweathermap.org/api
2. Sign up (free)
3. Go to "My API Keys"
4. Copy and paste into `backend/.env`

---

## 💡 Usage Flow

1. **Landing** → Click "Plan My Trip"
2. **Planner** → Enter destination, dates, budget, interests (4 steps)
3. **Generate** → AI creates your full itinerary in ~15 seconds
4. **Itinerary** → View day-by-day plan, budget breakdown, map, weather
5. **Explore** → Browse popular destinations or search any city

---

Built with Flask · Google Gemini AI · OpenWeatherMap · Vanilla JS