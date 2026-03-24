# 🌍 Voyage Canvas — Design Your Journey
> AI-powered travel planning that builds you a full day-by-day itinerary in seconds.
> Powered by **Vision AI (via Grok)**.

---

## 🚀 Quick Start

```bash
git clone <your-repo>
cd voyage-canvas/backend
pip install -r requirements.txt
python app.py
```

---

## 🚀 Setup & Run

### Prerequisites
- Python 3.8+
- pip

---

### Step 1 — Add Your API Keys

Make and open `backend/.env` and paste your keys:

#### 1. Vision AI (Groq)
- Go to [console.groq.com](https://console.groq.com)
- Create API key → paste as `VISION_KEY`

### 2. OpenWeatherMap
- Sign up at [openweathermap.org](https://openweathermap.org/api)
- Copy key → paste as `OPENWEATHER_API_KEY`

#### 3. Supabase (Database)
- Create project at [supabase.com](https://supabase.com)
- Go to Project Settings → Database → Connection string → copy `DATABASE_URL`
- Go to Project Settings → API → copy `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`

#### `.env` Example
```env
VISION_KEY=gsk_xxxxx
OPENWEATHER_API_KEY=abc123
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...
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

Here is the content formatted as a proper table:

| Feature | Description |
| :--- | :--- |
| 🧠 Vision AI | Generates complete day-by-day itineraries with activity costs, locations, and insider tips |
| 🌤️ Live Weather | Real-time weather + 5-day forecast |
| 💰 Smart Budgeting | Auto-splits budget across categories |
| 🗺️ Maps | Embedded Google Maps |
| 🌍 Explore | 12+ curated destinations + AI search |
| 📄 Export | PDF / Print |
| 💱 Dual Currency | USD / INR with local currency detection |

---

## 📁 Project Structure

```
voyage-canvas/
├── backend/
│   ├── app.py              ← Flask server & all API routes
│   ├── ai_service.py       ← AI itinerary generation
│   ├── weather_service.py  ← OpenWeatherMap integration
│   ├── budget_service.py   ← Budget allocation logic
│   ├── currency_service.py ← Local currency detection & conversion
│   ├── settings.py         ← API keys & server config
│   ├── database.py         ← PostgreSQL (Supabase) — users, sessions, itineraries
│   ├── requirements.txt    ← Dependencies
│   └── .env                ← Environment variables (gitignored)
│
├── frontend/
│   ├── assets/
│   │    └── favicon.ico       ← logo
│   │ 
│   ├── pages/
│   │   ├── index.html      ← Landing page
│   │   ├── login.html     # Auth page — sign in / register
│   │   ├── planner.html    ← 4-step trip planner
│   │   ├── itinerary.html  ← Generated itinerary dashboard
│   │   ├── explore.html    ← Destination explorer
│   │   └── dashboard.html # User profile & saved trips
│   │
│   ├── css/
│   │   ├── global.css      ← Fonts, variables, shared styles
│   │   ├── auth.css       # Login & dashboard styles
│   │   ├── landing.css     ← Landing page styles
│   │   ├── planner.css     ← Form & planner styles
│   │   └── itinerary.css   ← Dashboard & explore styles
│   │
│   └── js/
│       ├── main.js         ← Global utilities, API helper, toast
│       ├── auth.js        # Login, register, logout, auth guard
│       ├── planner.js      ← Form logic, step navigation, validation
│       ├── itinerary.js    ← Dashboard render, weather, budget
│       ├── explore.js      ← Destination cards, modal, AI search
│       └── dashboard.js   # Stats, saved itineraries, profile
│
├── render.yaml             # Render.com deployment config
│
├── runtime.txt             # Python version (3.12)
│
├── .gitignore              ← Files to ignore during version control
│
└──  README.md               ← Project overview, setup, usage instructions
```

---

## 💡 Usage Flow

1. **Landing** → Click "Plan My Trip"
2. **Planner** → Enter destination, dates, budget, interests (4 steps)
3. **Generate** → AI creates your full itinerary in ~15 seconds
4. **Itinerary** → View day-by-day plan, budget breakdown, map, weather
5. **Explore** → Browse popular destinations or search any city

---
