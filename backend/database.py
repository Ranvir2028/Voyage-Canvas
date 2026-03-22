# ============================================================
#   database.py — PostgreSQL (Supabase) Database Setup
#   REPLACES the SQLite version for cloud deployment
# ============================================================

import os
import hashlib
import secrets
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.getenv('DATABASE_URL')


def get_db():
    """Get a PostgreSQL database connection."""
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    return conn


def init_db():
    """Initialize all database tables on Supabase PostgreSQL."""
    conn = get_db()
    c = conn.cursor()

    # Users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id           SERIAL PRIMARY KEY,
            username     TEXT UNIQUE NOT NULL,
            email        TEXT UNIQUE NOT NULL,
            password     TEXT NOT NULL,
            full_name    TEXT NOT NULL,
            created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            avatar_color TEXT DEFAULT '#c9a84c'
        )
    ''')

    # Sessions table
    c.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            token      TEXT PRIMARY KEY,
            user_id    INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    # Saved itineraries table
    c.execute('''
        CREATE TABLE IF NOT EXISTS itineraries (
            id          SERIAL PRIMARY KEY,
            user_id     INTEGER NOT NULL,
            title       TEXT NOT NULL,
            destination TEXT NOT NULL,
            duration    INTEGER NOT NULL,
            budget      REAL NOT NULL,
            currency    TEXT DEFAULT 'USD',
            data        TEXT NOT NULL,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    conn.commit()
    conn.close()
    print("   Database initialized on Supabase PostgreSQL ✓")


def hash_password(password: str) -> str:
    salt = "voyage_canvas_salt_2025"
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()


def create_user(username: str, email: str, password: str, full_name: str) -> dict:
    conn = get_db()
    try:
        c = conn.cursor()
        c.execute(
            'INSERT INTO users (username, email, password, full_name) VALUES (%s, %s, %s, %s)',
            (username.lower(), email.lower(), hash_password(password), full_name)
        )
        conn.commit()
        c.execute('SELECT * FROM users WHERE username = %s', (username.lower(),))
        user = c.fetchone()
        return {"success": True, "user": dict(user)}
    except psycopg2.errors.UniqueViolation as e:
        conn.rollback()
        if "username" in str(e):
            return {"success": False, "error": "Username already taken"}
        return {"success": False, "error": "Email already registered"}
    except Exception as e:
        conn.rollback()
        return {"success": False, "error": str(e)}
    finally:
        conn.close()


def login_user(username_or_email: str, password: str) -> dict:
    conn = get_db()
    try:
        c = conn.cursor()
        c.execute(
            'SELECT * FROM users WHERE (username = %s OR email = %s) AND password = %s',
            (username_or_email.lower(), username_or_email.lower(), hash_password(password))
        )
        user = c.fetchone()
        if not user:
            return {"success": False, "error": "Invalid username or password"}
        token = secrets.token_hex(32)
        c.execute(
            'INSERT INTO sessions (token, user_id) VALUES (%s, %s)',
            (token, user["id"])
        )
        conn.commit()
        return {"success": True, "token": token, "user": dict(user)}
    finally:
        conn.close()


def get_user_by_token(token: str):
    conn = get_db()
    try:
        c = conn.cursor()
        c.execute('''
            SELECT u.* FROM users u
            JOIN sessions s ON s.user_id = u.id
            WHERE s.token = %s
        ''', (token,))
        row = c.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def logout_user(token: str):
    conn = get_db()
    try:
        c = conn.cursor()
        c.execute('DELETE FROM sessions WHERE token = %s', (token,))
        conn.commit()
    finally:
        conn.close()


def save_itinerary(user_id: int, title: str, destination: str,
                   duration: int, budget: float, currency: str, data: str) -> dict:
    conn = get_db()
    try:
        c = conn.cursor()
        c.execute('''
            INSERT INTO itineraries (user_id, title, destination, duration, budget, currency, data)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        ''', (user_id, title, destination, duration, budget, currency, data))
        conn.commit()
        return {"success": True}
    except Exception as e:
        conn.rollback()
        return {"success": False, "error": str(e)}
    finally:
        conn.close()


def get_user_itineraries(user_id: int) -> list:
    conn = get_db()
    try:
        c = conn.cursor()
        c.execute('''
            SELECT id, title, destination, duration, budget, currency, created_at
            FROM itineraries WHERE user_id = %s
            ORDER BY created_at DESC
        ''', (user_id,))
        return [dict(r) for r in c.fetchall()]
    finally:
        conn.close()


def get_itinerary_by_id(itin_id: int, user_id: int):
    conn = get_db()
    try:
        c = conn.cursor()
        c.execute(
            'SELECT * FROM itineraries WHERE id = %s AND user_id = %s',
            (itin_id, user_id)
        )
        row = c.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def delete_itinerary(itin_id: int, user_id: int) -> dict:
    conn = get_db()
    try:
        c = conn.cursor()
        c.execute(
            'DELETE FROM itineraries WHERE id = %s AND user_id = %s',
            (itin_id, user_id)
        )
        conn.commit()
        return {"success": True}
    finally:
        conn.close()


def get_user_stats(user_id: int) -> dict:
    conn = get_db()
    try:
        c = conn.cursor()
        c.execute(
            'SELECT destination, budget, currency, duration FROM itineraries WHERE user_id = %s',
            (user_id,)
        )
        rows = c.fetchall()
        total_trips  = len(rows)
        destinations = list(set(r["destination"] for r in rows))
        total_budget = sum(r["budget"] for r in rows)
        total_days   = sum(r["duration"] for r in rows)
        return {
            "totalTrips":          total_trips,
            "uniqueDestinations":  len(destinations),
            "totalBudgetSpent":    round(total_budget, 2),
            "totalDaysPlanned":    total_days,
            "topDestinations":     destinations[:3]
        }
    finally:
        conn.close()