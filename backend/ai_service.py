# ============================================================
#   ai_service.py — OpenRouter AI with Retry & Fallback
# ============================================================

import json, re, requests, time
import settings

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

FALLBACK_MODELS = [
    "google/gemma-3-27b-it:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "qwen/qwen3-8b:free",
    "mistralai/mistral-7b-instruct:free",
]

def _get_headers():
    return {
        "Authorization": f"Bearer {settings.GEMINI_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "Voyage Canvas"
    }

def _call_ai(prompt: str) -> str:
    models = [settings.GEMINI_MODEL] + [m for m in FALLBACK_MODELS if m != settings.GEMINI_MODEL]
    last_error = None
    for model in models:
        for attempt in range(2):
            try:
                print(f"   Trying: {model} (attempt {attempt+1})")
                payload = {
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7,
                    "max_tokens": 6000
                }
                response = requests.post(OPENROUTER_URL, headers=_get_headers(),
                                         json=payload, timeout=90)
                if response.status_code == 429:
                    wait = int(response.headers.get("Retry-After", 15))
                    print(f"   Rate limited, waiting {min(wait,20)}s...")
                    time.sleep(min(wait, 20))
                    continue
                response.raise_for_status()
                raw = response.json()["choices"][0]["message"]["content"].strip()
                raw = re.sub(r'```json', '', raw)
                raw = re.sub(r'```',    '', raw)
                raw = raw.strip()
                print(f"   Success: {model}")
                return raw
            except requests.exceptions.HTTPError as e:
                if response.status_code in (429, 503, 502):
                    last_error = e; break
                raise
            except Exception as e:
                last_error = e; time.sleep(3)
    raise Exception(f"All models failed. Last: {last_error}")


def generate_itinerary(trip_data: dict) -> dict:
    destination   = trip_data.get("destination", "Paris")
    days          = int(trip_data.get("days", 3))
    budget        = float(trip_data.get("budget", 1000))
    currency      = trip_data.get("currency", "USD")
    interests     = ", ".join(trip_data.get("interests", ["Culture", "Food"]))
    group_type    = trip_data.get("groupType", "Solo")
    start_date    = trip_data.get("startDate", "")
    accommodation = trip_data.get("accommodation", "3-star")
    currency_sym  = "₹" if currency == "INR" else "$"

    star_map = {
        "1-star": "1-star basic hostel/dormitory (very budget)",
        "2-star": "2-star budget hotel/guesthouse",
        "3-star": "3-star mid-range comfortable hotel",
        "4-star": "4-star superior/boutique hotel",
        "5-star": "5-star luxury resort",
        "airbnb": "Airbnb/private apartment"
    }
    accom_desc = star_map.get(accommodation, "3-star mid-range hotel")

    # Build example day JSON for clarity
    example_day = '''{
      "day": 1,
      "date": "Day 1 — [Month Date]",
      "theme": "Arrival & First Impressions",
      "weather": "Sunny, 24°C",
      "morning": {
        "time": "8:00 AM – 12:00 PM",
        "title": "Activity Name",
        "description": "Detailed description of what to do and why it is great",
        "location": "Specific landmark or area name",
        "cost": 25,
        "tips": "Practical insider tip for this activity"
      },
      "afternoon": {
        "time": "12:00 PM – 6:00 PM",
        "title": "Activity Name",
        "description": "Detailed description",
        "location": "Specific place",
        "cost": 40,
        "tips": "Insider tip"
      },
      "evening": {
        "time": "6:00 PM – 10:00 PM",
        "title": "Evening Activity",
        "description": "Detailed description",
        "location": "Specific venue",
        "cost": 30,
        "tips": "Tip for the evening"
      },
      "accommodation": {
        "name": "Specific Hotel Name matching ''' + accom_desc + '''",
        "type": "''' + accom_desc + '''",
        "cost": 80,
        "rating": "4.2/5"
      },
      "dailyTotal": 175
    }'''

    prompt = f"""You are a professional travel planner. Generate a complete {days}-day itinerary for {destination}.

CRITICAL RULES:
1. You MUST generate EXACTLY {days} day objects in the "days" array — not 3, not 5, exactly {days}
2. Return ONLY valid JSON — no markdown, no explanation, no extra text
3. Every field must have a real value — no nulls, no empty strings
4. Budget numbers must be realistic for {currency_sym}{budget} total over {days} days
5. Accommodation must match: {accom_desc}

Trip details:
- Destination: {destination}
- Duration: {days} days (YOU MUST HAVE EXACTLY {days} DAYS)
- Total Budget: {currency_sym}{budget} {currency}
- Interests: {interests}
- Group: {group_type}
- Start Date: {start_date}
- Accommodation: {accom_desc}

Return this exact JSON structure:
{{
  "destination": "{destination}",
  "totalDays": {days},
  "totalBudget": {budget},
  "currency": "{currency}",
  "currencySymbol": "{currency_sym}",
  "groupType": "{group_type}",
  "accommodation": "{accom_desc}",
  "summary": "Write 3 full sentences describing this trip and why it suits the traveler.",
  "bestTimeToVisit": "Write the best season and months to visit {destination} with reason.",
  "localTips": ["Cultural tip specific to {destination}", "Transport tip", "Money saving tip", "Safety tip", "Food tip"],
  "highlights": ["Top highlight 1", "Top highlight 2", "Top highlight 3", "Top highlight 4"],
  "budgetBreakdown": {{
    "accommodation": {round(budget * 0.35)},
    "food": {round(budget * 0.25)},
    "transport": {round(budget * 0.15)},
    "activities": {round(budget * 0.15)},
    "shopping": {round(budget * 0.05)},
    "misc": {round(budget * 0.05)}
  }},
  "days": [
    {example_day},
    ... repeat for ALL {days} days
  ],
  "packingList": [
    "Passport and travel documents",
    "Travel insurance documents",
    "Comfortable walking shoes",
    "Weather-appropriate clothing for {destination}",
    "Universal power adapter",
    "Portable phone charger/power bank",
    "Sunscreen and sunglasses",
    "Basic first aid kit",
    "Local currency ({currency})",
    "Reusable water bottle"
  ],
  "travelTips": [
    "Book accommodations at {accom_desc} level in advance especially in peak season",
    "Learn 5-10 basic phrases in the local language",
    "Always carry a printed copy of your hotel address"
  ],
  "localCuisine": ["Must-try dish 1 specific to {destination}", "Must-try dish 2", "Must-try dish 3", "Must-try drink"],
  "weather": {{
    "typical": "Typical weather pattern for {destination}",
    "temperature": "Average temperature range",
    "what_to_wear": "Clothing recommendation"
  }}
}}

REMEMBER: The "days" array MUST contain exactly {days} complete day objects. Generate ALL {days} days now."""

    raw = _call_ai(prompt)
    
    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        # Try to extract JSON if there's extra text
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            result = json.loads(match.group())
        else:
            raise

    # ── Guarantee correct day count ───────────────────────────
    existing_days = result.get("days", [])
    if len(existing_days) < days:
        print(f"   AI returned {len(existing_days)} days, expected {days}. Filling missing days...")
        for i in range(len(existing_days) + 1, days + 1):
            base = existing_days[-1].copy() if existing_days else {}
            base.update({
                "day": i,
                "date": f"Day {i}",
                "theme": f"Day {i} — Exploration",
                "weather": base.get("weather", "Check local forecast"),
                "morning":   base.get("morning",   {"time": "8:00 AM – 12:00 PM", "title": "Morning Exploration", "description": f"Explore more of {destination}", "location": destination, "cost": 20, "tips": "Start early to avoid crowds"}),
                "afternoon": base.get("afternoon", {"time": "12:00 PM – 6:00 PM", "title": "Afternoon Activities", "description": f"Discover local culture in {destination}", "location": destination, "cost": 30, "tips": "Take a lunch break at a local restaurant"}),
                "evening":   base.get("evening",   {"time": "6:00 PM – 10:00 PM", "title": "Evening Leisure", "description": f"Enjoy the evening atmosphere of {destination}", "location": destination, "cost": 25, "tips": "Try a local restaurant for dinner"}),
                "accommodation": base.get("accommodation", {"name": f"{accom_desc} in {destination}", "type": accom_desc, "cost": round(budget * 0.35 / days), "rating": "4.0/5"}),
                "dailyTotal": base.get("dailyTotal", round(budget / days))
            })
            existing_days.append(base)
        result["days"] = existing_days[:days]

    # ── Guarantee all top-level fields exist ──────────────────
    result.setdefault("summary",         f"An amazing {days}-day journey through {destination} tailored for {group_type} travelers interested in {interests}. Experience the best this destination has to offer within a {currency_sym}{budget} budget.")
    result.setdefault("bestTimeToVisit", f"Research the best season to visit {destination} based on your preferred weather and crowd levels.")
    result.setdefault("localTips",       [f"Respect local customs in {destination}", "Carry cash for small vendors", "Use public transport to save money", "Book popular attractions in advance", "Stay hydrated and carry water"])
    result.setdefault("highlights",      [f"Explore {destination}'s top landmarks", "Taste authentic local cuisine", "Experience local culture and traditions", "Visit hidden gems off the tourist trail"])
    result.setdefault("packingList",     ["Passport", "Travel insurance", "Comfortable shoes", "Weather-appropriate clothes", "Power adapter", "Power bank", "Sunscreen", "First aid kit", f"{currency} cash", "Water bottle"])
    result.setdefault("travelTips",      ["Book accommodation in advance", "Learn basic local phrases", "Carry printed hotel address"])
    result.setdefault("localCuisine",    [f"Local specialty of {destination}", "Street food", "Traditional dessert", "Local beverage"])
    result.setdefault("weather",         {"typical": "Varies by season", "temperature": "Check before travel", "what_to_wear": "Layer clothing for flexibility"})

    # ── Fix budget breakdown total ────────────────────────────
    bd = result.get("budgetBreakdown", {})
    if not bd or sum(bd.values()) == 0:
        result["budgetBreakdown"] = {
            "accommodation": round(budget * 0.35),
            "food":          round(budget * 0.25),
            "transport":     round(budget * 0.15),
            "activities":    round(budget * 0.15),
            "shopping":      round(budget * 0.05),
            "misc":          round(budget * 0.05)
        }

    result["totalDays"]   = days
    result["totalBudget"] = budget
    result["currency"]    = currency
    result["currencySymbol"] = currency_sym

    return result


def get_destination_info(destination: str) -> dict:
    prompt = f"""Give travel info about {destination}. Return ONLY valid JSON, no markdown:
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
}}"""
    raw = _call_ai(prompt)
    try:
        return json.loads(raw)
    except Exception:
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise