# ============================================================
#   database.py — SQLite Database Setup & Queries
# ============================================================

import sqlite3
import os
import hashlib
import secrets
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'voyage_canvas.db')


def get_db():
    """Get a database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize all database tables."""
    conn = get_db()
    c = conn.cursor()

    # Users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            username    TEXT UNIQUE NOT NULL,
            email       TEXT UNIQUE NOT NULL,
            password    TEXT NOT NULL,
            full_name   TEXT NOT NULL,
            created_at  TEXT DEFAULT CURRENT_TIMESTAMP,
            avatar_color TEXT DEFAULT '#c9a84c'
        )
    ''')

    # Sessions table
    c.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            token       TEXT PRIMARY KEY,
            user_id     INTEGER NOT NULL,
            created_at  TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    # Saved itineraries table
    c.execute('''
        CREATE TABLE IF NOT EXISTS itineraries (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id      INTEGER NOT NULL,
            title        TEXT NOT NULL,
            destination  TEXT NOT NULL,
            duration     INTEGER NOT NULL,
            budget       REAL NOT NULL,
            currency     TEXT DEFAULT 'USD',
            data         TEXT NOT NULL,
            created_at   TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    conn.commit()
    conn.close()
    print("   Database initialized ✓")


def hash_password(password: str) -> str:
    salt = "voyage_canvas_salt_2025"
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()


def create_user(username: str, email: str, password: str, full_name: str) -> dict:
    conn = get_db()
    try:
        conn.execute(
            'INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)',
            (username.lower(), email.lower(), hash_password(password), full_name)
        )
        conn.commit()
        user = conn.execute(
            'SELECT * FROM users WHERE username = ?', (username.lower(),)
        ).fetchone()
        return {"success": True, "user": dict(user)}
    except sqlite3.IntegrityError as e:
        if "username" in str(e):
            return {"success": False, "error": "Username already taken"}
        return {"success": False, "error": "Email already registered"}
    finally:
        conn.close()


def login_user(username_or_email: str, password: str) -> dict:
    conn = get_db()
    try:
        user = conn.execute(
            'SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?',
            (username_or_email.lower(), username_or_email.lower(), hash_password(password))
        ).fetchone()
        if not user:
            return {"success": False, "error": "Invalid username or password"}
        # Create session token
        token = secrets.token_hex(32)
        conn.execute(
            'INSERT INTO sessions (token, user_id) VALUES (?, ?)',
            (token, user["id"])
        )
        conn.commit()
        return {"success": True, "token": token, "user": dict(user)}
    finally:
        conn.close()


def get_user_by_token(token: str) -> dict | None:
    conn = get_db()
    try:
        row = conn.execute('''
            SELECT u.* FROM users u
            JOIN sessions s ON s.user_id = u.id
            WHERE s.token = ?
        ''', (token,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def logout_user(token: str):
    conn = get_db()
    conn.execute('DELETE FROM sessions WHERE token = ?', (token,))
    conn.commit()
    conn.close()


def save_itinerary(user_id: int, title: str, destination: str,
                   duration: int, budget: float, currency: str, data: str) -> dict:
    conn = get_db()
    try:
        conn.execute('''
            INSERT INTO itineraries (user_id, title, destination, duration, budget, currency, data)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, title, destination, duration, budget, currency, data))
        conn.commit()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        conn.close()


def get_user_itineraries(user_id: int) -> list:
    conn = get_db()
    try:
        rows = conn.execute('''
            SELECT id, title, destination, duration, budget, currency, created_at
            FROM itineraries WHERE user_id = ?
            ORDER BY created_at DESC
        ''', (user_id,)).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def get_itinerary_by_id(itin_id: int, user_id: int) -> dict | None:
    conn = get_db()
    try:
        row = conn.execute(
            'SELECT * FROM itineraries WHERE id = ? AND user_id = ?',
            (itin_id, user_id)
        ).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def delete_itinerary(itin_id: int, user_id: int) -> dict:
    conn = get_db()
    try:
        conn.execute(
            'DELETE FROM itineraries WHERE id = ? AND user_id = ?',
            (itin_id, user_id)
        )
        conn.commit()
        return {"success": True}
    finally:
        conn.close()


def get_user_stats(user_id: int) -> dict:
    conn = get_db()
    try:
        rows = conn.execute(
            'SELECT destination, budget, currency, duration FROM itineraries WHERE user_id = ?',
            (user_id,)
        ).fetchall()
        total_trips = len(rows)
        destinations = list(set(r["destination"] for r in rows))
        total_budget = sum(r["budget"] for r in rows)
        total_days   = sum(r["duration"] for r in rows)
        return {
            "totalTrips": total_trips,
            "uniqueDestinations": len(destinations),
            "totalBudgetSpent": round(total_budget, 2),
            "totalDaysPlanned": total_days,
            "topDestinations": destinations[:3]
        }
    finally:
        conn.close()