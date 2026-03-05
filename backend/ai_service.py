# ============================================================
#   ai_service.py — Gemini AI Itinerary Generation Engine
# ============================================================

import sys, os, json, re
import settings
import google.generativeai as genai

# Use the OLD SDK which has better free tier support
genai.configure(api_key=settings.GEMINI_API_KEY)

def _get_model():
    """Try models in order until one works."""
    models_to_try = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-2.0-flash-exp",
        "gemini-2.0-flash",
    ]
    for model_name in models_to_try:
        try:
            m = genai.GenerativeModel(model_name)
            # Quick test
            m.generate_content("Hi")
            print(f"   Using model: {model_name}")
            return m
        except Exception as e:
            print(f"   Model {model_name} failed: {e}")
            continue
    raise Exception("No working Gemini model found. Check your API key.")

def _call_gemini(prompt: str) -> str:
    model = genai.GenerativeModel(settings.GEMINI_MODEL)
    response = model.generate_content(prompt)
    raw = response.text.strip()
    raw = re.sub(r'^```json\s*', '', raw, flags=re.MULTILINE)
    raw = re.sub(r'^```\s*', '', raw, flags=re.MULTILINE)
    raw = re.sub(r'\s*```$', '', raw, flags=re.MULTILINE)
    return raw.strip()


def generate_itinerary(trip_data: dict) -> dict:
    destination  = trip_data.get("destination", "Paris")
    days         = int(trip_data.get("days", 3))
    budget       = trip_data.get("budget", 1000)
    currency     = trip_data.get("currency", "USD")
    interests    = ", ".join(trip_data.get("interests", ["Culture", "Food"]))
    group_type   = trip_data.get("groupType", "Solo")
    start_date   = trip_data.get("startDate", "")
    currency_sym = "₹" if currency == "INR" else "$"

    prompt = f"""
You are an expert travel planner. Create a detailed, personalized {days}-day travel itinerary.

Trip Details:
- Destination: {destination}
- Duration: {days} days
- Budget: {currency_sym}{budget} ({currency}) total for the trip
- Interests: {interests}
- Group Type: {group_type}
- Start Date: {start_date}

Return ONLY a valid JSON object (no markdown, no code blocks, no extra text) with this EXACT structure:
{{
  "destination": "{destination}",
  "totalDays": {days},
  "totalBudget": {budget},
  "currency": "{currency}",
  "currencySymbol": "{currency_sym}",
  "groupType": "{group_type}",
  "summary": "2-3 sentence trip overview",
  "highlights": ["highlight1", "highlight2", "highlight3"],
  "budgetBreakdown": {{
    "accommodation": 0,
    "food": 0,
    "transport": 0,
    "activities": 0,
    "shopping": 0,
    "misc": 0
  }},
  "days": [
    {{
      "day": 1,
      "date": "Day 1 date label",
      "theme": "Day theme title",
      "weather": "Expected weather",
      "morning": {{
        "time": "8:00 AM - 12:00 PM",
        "title": "Activity name",
        "description": "What to do and why",
        "location": "Specific place name",
        "cost": 0,
        "tips": "Insider tip"
      }},
      "afternoon": {{
        "time": "12:00 PM - 6:00 PM",
        "title": "Activity name",
        "description": "What to do and why",
        "location": "Specific place name",
        "cost": 0,
        "tips": "Insider tip"
      }},
      "evening": {{
        "time": "6:00 PM - 10:00 PM",
        "title": "Activity name",
        "description": "What to do and why",
        "location": "Specific place name",
        "cost": 0,
        "tips": "Insider tip"
      }},
      "accommodation": {{
        "name": "Hotel/Hostel name",
        "type": "Hotel/Hostel/Airbnb",
        "cost": 0,
        "rating": "4.2/5"
      }},
      "dailyTotal": 0
    }}
  ],
  "packingList": ["item1", "item2", "item3", "item4", "item5"],
  "travelTips": ["tip1", "tip2", "tip3"],
  "bestTimeToVisit": "Season/month recommendation",
  "localCuisine": ["dish1", "dish2", "dish3"]
}}

Generate EXACTLY {days} day objects. Be specific to {destination} and realistic for {currency_sym}{budget} budget.
"""
    raw = _call_gemini(prompt)
    return json.loads(raw)


def get_destination_info(destination: str) -> dict:
    prompt = f"""
Give me quick travel info about {destination}.
Return ONLY a valid JSON object (no markdown, no code blocks):
{{
  "destination": "{destination}",
  "country": "country name",
  "continent": "continent name",
  "description": "2 sentence description",
  "bestFor": ["type1", "type2", "type3"],
  "avgBudgetUSD": 100,
  "avgBudgetINR": 8350,
  "language": "main language",
  "currency": "local currency name",
  "timezone": "timezone",
  "mustSee": ["place1", "place2", "place3"],
  "bestMonths": ["Month1", "Month2", "Month3"],
  "visaInfo": "brief visa info",
  "emoji": "one relevant emoji"
}}
"""
    raw = _call_gemini(prompt)
    return json.loads(raw)