# ============================================================
#   weather_service.py — OpenWeatherMap Integration
# ============================================================

import sys, os, requests
import settings

BASE = "https://api.openweathermap.org/data/2.5"


def get_weather(city: str) -> dict:
    """Get current weather for a city."""
    try:
        r = requests.get(f"{BASE}/weather", params={
            "q": city,
            "appid": settings.OPENWEATHER_API_KEY,
            "units": "metric"
        }, timeout=8)
        if r.status_code != 200:
            return {"success": False, "error": f"City not found ({r.status_code})"}
        d = r.json()
        return {
            "success": True,
            "city": d["name"],
            "country": d["sys"]["country"],
            "temperature": round(d["main"]["temp"]),
            "feelsLike": round(d["main"]["feels_like"]),
            "humidity": d["main"]["humidity"],
            "description": d["weather"][0]["description"].title(),
            "icon": d["weather"][0]["icon"],
            "iconUrl": f"https://openweathermap.org/img/wn/{d['weather'][0]['icon']}@2x.png",
            "windSpeed": d["wind"]["speed"],
            "visibility": d.get("visibility", 0) // 1000
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def get_forecast(city: str, days: int = 5) -> dict:
    """Get 5-day weather forecast."""
    try:
        r = requests.get(f"{BASE}/forecast", params={
            "q": city,
            "appid": settings.OPENWEATHER_API_KEY,
            "units": "metric",
            "cnt": days * 8
        }, timeout=8)
        if r.status_code != 200:
            return {"success": False, "error": f"Forecast unavailable ({r.status_code})"}
        data = r.json()
        daily = {}
        for item in data["list"]:
            date = item["dt_txt"].split(" ")[0]
            if date not in daily:
                daily[date] = {"date": date, "temps": [], "icons": [], "descriptions": []}
            daily[date]["temps"].append(item["main"]["temp"])
            daily[date]["icons"].append(item["weather"][0]["icon"])
            daily[date]["descriptions"].append(item["weather"][0]["description"])

        forecast = []
        for date, info in list(daily.items())[:days]:
            forecast.append({
                "date": date,
                "tempMax": round(max(info["temps"])),
                "tempMin": round(min(info["temps"])),
                "description": info["descriptions"][0].title(),
                "iconUrl": f"https://openweathermap.org/img/wn/{info['icons'][0]}@2x.png"
            })
        return {"success": True, "forecast": forecast}
    except Exception as e:
        return {"success": False, "error": str(e)}