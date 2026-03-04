# ============================================================
#   budget_service.py — Budget Allocation Logic
# ============================================================

def allocate_budget(total: float, currency: str, days: int, group_type: str, interests: list) -> dict:
    """Split total budget across categories based on trip style."""
    sym = "₹" if currency == "INR" else "$"

    # Base percentages
    pct = {"accommodation": 0.35, "food": 0.25, "transport": 0.15,
           "activities": 0.15, "shopping": 0.05, "misc": 0.05}

    # Adjust for interests
    if "Shopping" in interests:
        pct["shopping"] += 0.05; pct["misc"] -= 0.05
    if "Adventure & Outdoors" in interests or "Sports & Activities" in interests:
        pct["activities"] += 0.05; pct["food"] -= 0.05

    breakdown = {}
    for cat, p in pct.items():
        amount = round(total * p)
        breakdown[cat] = {
            "amount": amount,
            "perDay": round(amount / days) if days else amount,
            "percentage": round(p * 100),
            "formatted": f"{sym}{amount:,}"
        }

    return {
        "total": total,
        "currency": currency,
        "symbol": sym,
        "days": days,
        "perDayTotal": round(total / days) if days else total,
        "categories": breakdown
    }


def estimate_trip_cost(style: str, days: int, group_type: str, currency: str) -> dict:
    """Return rough cost ranges for a trip style."""
    sym = "₹" if currency == "INR" else "$"
    mult = 83.5 if currency == "INR" else 1.0
    travelers = {"Solo": 1, "Couple": 2, "Family": 4, "Friends": 3}.get(group_type, 1)

    ranges = {
        "budget":    {"min": 30,  "max": 60},
        "mid-range": {"min": 80,  "max": 150},
        "luxury":    {"min": 200, "max": 500},
    }
    r = ranges.get(style, ranges["mid-range"])
    return {
        "style": style,
        "perPersonPerDay": {"min": round(r["min"] * mult), "max": round(r["max"] * mult)},
        "totalEstimate": {
            "min": round(r["min"] * mult * days * travelers),
            "max": round(r["max"] * mult * days * travelers)
        },
        "symbol": sym
    }