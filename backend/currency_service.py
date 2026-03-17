# ============================================================
#   currency_service.py — Local Currency Auto-Detection
# ============================================================

CURRENCY_MAP = {
    # Asia
    "japan": {"code": "JPY", "symbol": "¥", "name": "Japanese Yen", "rate": 149.5},
    "tokyo": {"code": "JPY", "symbol": "¥", "name": "Japanese Yen", "rate": 149.5},
    "kyoto": {"code": "JPY", "symbol": "¥", "name": "Japanese Yen", "rate": 149.5},
    "osaka": {"code": "JPY", "symbol": "¥", "name": "Japanese Yen", "rate": 149.5},
    "china": {"code": "CNY", "symbol": "¥", "name": "Chinese Yuan", "rate": 7.24},
    "beijing": {"code": "CNY", "symbol": "¥", "name": "Chinese Yuan", "rate": 7.24},
    "shanghai": {"code": "CNY", "symbol": "¥", "name": "Chinese Yuan", "rate": 7.24},
    "south korea": {"code": "KRW", "symbol": "₩", "name": "Korean Won", "rate": 1325},
    "korea": {"code": "KRW", "symbol": "₩", "name": "Korean Won", "rate": 1325},
    "seoul": {"code": "KRW", "symbol": "₩", "name": "Korean Won", "rate": 1325},
    "thailand": {"code": "THB", "symbol": "฿", "name": "Thai Baht", "rate": 35.5},
    "bangkok": {"code": "THB", "symbol": "฿", "name": "Thai Baht", "rate": 35.5},
    "phuket": {"code": "THB", "symbol": "฿", "name": "Thai Baht", "rate": 35.5},
    "chiang mai": {"code": "THB", "symbol": "฿", "name": "Thai Baht", "rate": 35.5},
    "indonesia": {"code": "IDR", "symbol": "Rp", "name": "Indonesian Rupiah", "rate": 15750},
    "bali": {"code": "IDR", "symbol": "Rp", "name": "Indonesian Rupiah", "rate": 15750},
    "jakarta": {"code": "IDR", "symbol": "Rp", "name": "Indonesian Rupiah", "rate": 15750},
    "india": {"code": "INR", "symbol": "₹", "name": "Indian Rupee", "rate": 83.5},
    "goa": {"code": "INR", "symbol": "₹", "name": "Indian Rupee", "rate": 83.5},
    "mumbai": {"code": "INR", "symbol": "₹", "name": "Indian Rupee", "rate": 83.5},
    "delhi": {"code": "INR", "symbol": "₹", "name": "Indian Rupee", "rate": 83.5},
    "rajasthan": {"code": "INR", "symbol": "₹", "name": "Indian Rupee", "rate": 83.5},
    "jaipur": {"code": "INR", "symbol": "₹", "name": "Indian Rupee", "rate": 83.5},
    "agra": {"code": "INR", "symbol": "₹", "name": "Indian Rupee", "rate": 83.5},
    "kerala": {"code": "INR", "symbol": "₹", "name": "Indian Rupee", "rate": 83.5},
    "singapore": {"code": "SGD", "symbol": "S$", "name": "Singapore Dollar", "rate": 1.35},
    "malaysia": {"code": "MYR", "symbol": "RM", "name": "Malaysian Ringgit", "rate": 4.72},
    "kuala lumpur": {"code": "MYR", "symbol": "RM", "name": "Malaysian Ringgit", "rate": 4.72},
    "vietnam": {"code": "VND", "symbol": "₫", "name": "Vietnamese Dong", "rate": 24500},
    "hanoi": {"code": "VND", "symbol": "₫", "name": "Vietnamese Dong", "rate": 24500},
    "ho chi minh": {"code": "VND", "symbol": "₫", "name": "Vietnamese Dong", "rate": 24500},
    "philippines": {"code": "PHP", "symbol": "₱", "name": "Philippine Peso", "rate": 56.5},
    "manila": {"code": "PHP", "symbol": "₱", "name": "Philippine Peso", "rate": 56.5},
    "nepal": {"code": "NPR", "symbol": "Rs", "name": "Nepalese Rupee", "rate": 133},
    "kathmandu": {"code": "NPR", "symbol": "Rs", "name": "Nepalese Rupee", "rate": 133},
    "sri lanka": {"code": "LKR", "symbol": "Rs", "name": "Sri Lankan Rupee", "rate": 305},
    "maldives": {"code": "MVR", "symbol": "Rf", "name": "Maldivian Rufiyaa", "rate": 15.4},
    "uae": {"code": "AED", "symbol": "د.إ", "name": "UAE Dirham", "rate": 3.67},
    "dubai": {"code": "AED", "symbol": "د.إ", "name": "UAE Dirham", "rate": 3.67},
    "abu dhabi": {"code": "AED", "symbol": "د.إ", "name": "UAE Dirham", "rate": 3.67},
    "turkey": {"code": "TRY", "symbol": "₺", "name": "Turkish Lira", "rate": 32.5},
    "istanbul": {"code": "TRY", "symbol": "₺", "name": "Turkish Lira", "rate": 32.5},
    # Europe
    "france": {"code": "EUR", "symbol": "€", "name": "Euro", "rate": 0.92},
    "paris": {"code": "EUR", "symbol": "€", "name": "Euro", "rate": 0.92},
    "germany": {"code": "EUR", "symbol": "€", "name": "Euro", "rate": 0.92},
    "berlin": {"code": "EUR", "symbol": "€", "name": "Euro", "rate": 0.92},
    "italy": {"code": "EUR", "symbol": "€", "name": "Euro", "rate": 0.92},
    "rome": {"code": "EUR", "symbol": "€", "name": "Euro", "rate": 0.92},
    "venice": {"code": "EUR", "symbol": "€", "name": "Euro", "rate": 0.92},
    "milan": {"code": "EUR", "symbol": "€", "name": "Euro", "rate": 0.92},
    "spain": {"code": "EUR", "symbol": "€", "name": "Euro", "rate": 0.92},
    "barcelona": {"code": "EUR", "symbol": "€", "name": "Euro", "rate": 0.92},
    "madrid": {"code": "EUR", "symbol": "€", "name": "Euro", "rate": 0.92},
    "greece": {"code": "EUR", "symbol": "€", "name": "Euro", "rate": 0.92},
    "santorini": {"code": "EUR", "symbol": "€", "name": "Euro", "rate": 0.92},
    "athens": {"code": "EUR", "symbol": "€", "name": "Euro", "rate": 0.92},
    "netherlands": {"code": "EUR", "symbol": "€", "name": "Euro", "rate": 0.92},
    "amsterdam": {"code": "EUR", "symbol": "€", "name": "Euro", "rate": 0.92},
    "portugal": {"code": "EUR", "symbol": "€", "name": "Euro", "rate": 0.92},
    "lisbon": {"code": "EUR", "symbol": "€", "name": "Euro", "rate": 0.92},
    "austria": {"code": "EUR", "symbol": "€", "name": "Euro", "rate": 0.92},
    "vienna": {"code": "EUR", "symbol": "€", "name": "Euro", "rate": 0.92},
    "uk": {"code": "GBP", "symbol": "£", "name": "British Pound", "rate": 0.79},
    "london": {"code": "GBP", "symbol": "£", "name": "British Pound", "rate": 0.79},
    "england": {"code": "GBP", "symbol": "£", "name": "British Pound", "rate": 0.79},
    "switzerland": {"code": "CHF", "symbol": "Fr", "name": "Swiss Franc", "rate": 0.89},
    "zurich": {"code": "CHF", "symbol": "Fr", "name": "Swiss Franc", "rate": 0.89},
    "norway": {"code": "NOK", "symbol": "kr", "name": "Norwegian Krone", "rate": 10.6},
    "sweden": {"code": "SEK", "symbol": "kr", "name": "Swedish Krona", "rate": 10.4},
    "denmark": {"code": "DKK", "symbol": "kr", "name": "Danish Krone", "rate": 6.9},
    "iceland": {"code": "ISK", "symbol": "kr", "name": "Icelandic Krona", "rate": 138},
    "czech republic": {"code": "CZK", "symbol": "Kč", "name": "Czech Koruna", "rate": 23.2},
    "prague": {"code": "CZK", "symbol": "Kč", "name": "Czech Koruna", "rate": 23.2},
    "hungary": {"code": "HUF", "symbol": "Ft", "name": "Hungarian Forint", "rate": 357},
    "budapest": {"code": "HUF", "symbol": "Ft", "name": "Hungarian Forint", "rate": 357},
    "poland": {"code": "PLN", "symbol": "zł", "name": "Polish Zloty", "rate": 4.0},
    "russia": {"code": "RUB", "symbol": "₽", "name": "Russian Ruble", "rate": 90},
    # Americas
    "usa": {"code": "USD", "symbol": "$", "name": "US Dollar", "rate": 1.0},
    "united states": {"code": "USD", "symbol": "$", "name": "US Dollar", "rate": 1.0},
    "new york": {"code": "USD", "symbol": "$", "name": "US Dollar", "rate": 1.0},
    "los angeles": {"code": "USD", "symbol": "$", "name": "US Dollar", "rate": 1.0},
    "las vegas": {"code": "USD", "symbol": "$", "name": "US Dollar", "rate": 1.0},
    "miami": {"code": "USD", "symbol": "$", "name": "US Dollar", "rate": 1.0},
    "chicago": {"code": "USD", "symbol": "$", "name": "US Dollar", "rate": 1.0},
    "canada": {"code": "CAD", "symbol": "C$", "name": "Canadian Dollar", "rate": 1.36},
    "toronto": {"code": "CAD", "symbol": "C$", "name": "Canadian Dollar", "rate": 1.36},
    "vancouver": {"code": "CAD", "symbol": "C$", "name": "Canadian Dollar", "rate": 1.36},
    "mexico": {"code": "MXN", "symbol": "Mex$", "name": "Mexican Peso", "rate": 17.2},
    "cancun": {"code": "MXN", "symbol": "Mex$", "name": "Mexican Peso", "rate": 17.2},
    "brazil": {"code": "BRL", "symbol": "R$", "name": "Brazilian Real", "rate": 5.0},
    "rio de janeiro": {"code": "BRL", "symbol": "R$", "name": "Brazilian Real", "rate": 5.0},
    "argentina": {"code": "ARS", "symbol": "AR$", "name": "Argentine Peso", "rate": 870},
    "peru": {"code": "PEN", "symbol": "S/", "name": "Peruvian Sol", "rate": 3.7},
    # Africa & Middle East
    "morocco": {"code": "MAD", "symbol": "د.م.", "name": "Moroccan Dirham", "rate": 10.0},
    "marrakech": {"code": "MAD", "symbol": "د.م.", "name": "Moroccan Dirham", "rate": 10.0},
    "egypt": {"code": "EGP", "symbol": "E£", "name": "Egyptian Pound", "rate": 48.5},
    "cairo": {"code": "EGP", "symbol": "E£", "name": "Egyptian Pound", "rate": 48.5},
    "south africa": {"code": "ZAR", "symbol": "R", "name": "South African Rand", "rate": 18.6},
    "cape town": {"code": "ZAR", "symbol": "R", "name": "South African Rand", "rate": 18.6},
    "kenya": {"code": "KES", "symbol": "KSh", "name": "Kenyan Shilling", "rate": 129},
    "tanzania": {"code": "TZS", "symbol": "TSh", "name": "Tanzanian Shilling", "rate": 2560},
    "saudi arabia": {"code": "SAR", "symbol": "﷼", "name": "Saudi Riyal", "rate": 3.75},
    "israel": {"code": "ILS", "symbol": "₪", "name": "Israeli Shekel", "rate": 3.7},
    # Oceania
    "australia": {"code": "AUD", "symbol": "A$", "name": "Australian Dollar", "rate": 1.53},
    "sydney": {"code": "AUD", "symbol": "A$", "name": "Australian Dollar", "rate": 1.53},
    "melbourne": {"code": "AUD", "symbol": "A$", "name": "Australian Dollar", "rate": 1.53},
    "new zealand": {"code": "NZD", "symbol": "NZ$", "name": "New Zealand Dollar", "rate": 1.63},
}

def get_currency(destination: str) -> dict:
    """Auto-detect local currency from destination name."""
    dest = destination.lower().strip()
    for key, currency in CURRENCY_MAP.items():
        if key in dest or dest in key:
            return {**currency, "detected": True}
    return {"code": "USD", "symbol": "$", "name": "US Dollar",
            "rate": 1.0, "detected": False}

def convert_to_local(amount_usd: float, destination: str) -> dict:
    """Convert USD amount to local currency."""
    currency = get_currency(destination)
    local_amount = round(amount_usd * currency["rate"])
    usd_amount   = round(amount_usd, 2)
    inr_amount   = round(amount_usd * 83.5)
    return {
        "local":    {"amount": local_amount, "symbol": currency["symbol"],
                     "code": currency["code"], "name": currency["name"]},
        "usd":      {"amount": usd_amount,   "symbol": "$",  "code": "USD"},
        "inr":      {"amount": inr_amount,   "symbol": "₹",  "code": "INR"},
        "detected": currency["detected"]
    }

def get_all_currencies() -> list:
    """Return unique currency list for frontend dropdown."""
    seen = set()
    result = []
    for c in CURRENCY_MAP.values():
        if c["code"] not in seen:
            seen.add(c["code"])
            result.append({"code": c["code"], "symbol": c["symbol"], "name": c["name"]})
    return sorted(result, key=lambda x: x["code"])