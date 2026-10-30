#!/usr/bin/env python3
"""
Lightweight Zero-Dependency Portfolio & Dynamic Dashboard Server
Uses Python 3 standard library (http.server, sqlite3, json)
Persists projects with timeline/duration, skills with completion duration,
bio, to-do topics/concepts linked to skills, and LeetCode problems solved per day/week/month.
"""

import sys
import os
import json
import sqlite3
import datetime
from urllib.parse import urlparse, parse_qs
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 8000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "data", "portfolio.db")
INITIAL_DATA_PATH = os.path.join(BASE_DIR, "data", "initial-data.json")

def init_database():
    """Initializes SQLite database with default structure and seed data if missing keys."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS store (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT,
            message TEXT NOT NULL,
            date TEXT NOT NULL,
            status TEXT DEFAULT 'New'
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS page_views (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            path TEXT,
            user_agent TEXT
        )
    """)
    conn.commit()

    # Load initial seed data to populate missing keys
    if os.path.exists(INITIAL_DATA_PATH):
        try:
            with open(INITIAL_DATA_PATH, "r", encoding="utf-8") as f:
                seed = json.load(f)

            # Check and populate each essential key if not present
            keys_to_seed = ["profile", "skills", "projects", "topics", "leetcode", "stats"]
            for key in keys_to_seed:
                cursor.execute("SELECT COUNT(*) FROM store WHERE key = ?", (key,))
                exists = cursor.fetchone()[0] > 0
                if not exists and key in seed:
                    cursor.execute("INSERT OR REPLACE INTO store (key, value) VALUES (?, ?)", (key, json.dumps(seed[key])))
                    print(f"[+] Initialized store key '{key}' from seed data.")

            # Check messages count
            cursor.execute("SELECT COUNT(*) FROM messages")
            msg_count = cursor.fetchone()[0]
            if msg_count == 0:
                for msg in seed.get("messages", []):
                    cursor.execute("""
                        INSERT OR REPLACE INTO messages (id, name, email, subject, message, date, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (msg.get("id"), msg.get("name"), msg.get("email"), msg.get("subject", ""), msg.get("message"), msg.get("date"), msg.get("status", "New")))

            conn.commit()
        except Exception as e:
            print(f"[-] Warning: Failed to load seed data: {e}")

    conn.close()


def get_all_data():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    data = {
        "profile": {},
        "skills": [],
        "projects": [],
        "topics": [],
        "leetcode": {"goals": {}, "problems": []},
        "stats": {},
        "messages": []
    }

    cursor.execute("SELECT key, value FROM store")
    for row in cursor.fetchall():
        key, val = row["key"], row["value"]
        try:
            data[key] = json.loads(val)
        except Exception:
            data[key] = val

    cursor.execute("SELECT * FROM messages ORDER BY date DESC")
    data["messages"] = [dict(row) for row in cursor.fetchall()]

    # Real page views count
    cursor.execute("SELECT COUNT(*) FROM page_views")
    db_views = cursor.fetchone()[0]
    if isinstance(data.get("stats"), dict):
        base_views = data["stats"].get("totalVisitors", 1400)
        data["stats"]["totalVisitors"] = max(base_views, 1400 + db_views)

    conn.close()
    return data


class PortfolioAPIHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def _send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/status":
            self._send_json(200, {"status": "ok", "mode": "sqlite", "server": "Python standard library"})
            return

        if parsed.path == "/api/data":
            data = get_all_data()
            self._send_json(200, data)
            return

        if parsed.path == "/api/topics":
            data = get_all_data()
            self._send_json(200, {"topics": data.get("topics", [])})
            return

        if parsed.path == "/api/leetcode":
            data = get_all_data()
            self._send_json(200, {"leetcode": data.get("leetcode", {})})
            return

        # Suppress 404 noise for browser default favicon request if file doesn't exist
        if parsed.path == "/favicon.ico" and not os.path.exists(os.path.join(BASE_DIR, "favicon.ico")):
            self.send_response(204)  # No Content
            self.end_headers()
            return

        # Fallback to standard file serving
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip('/')
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length)

        try:
            payload = json.loads(post_data.decode("utf-8")) if post_data else {}
        except Exception:
            payload = {}

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        if path == "/api/visit":
            cursor.execute("INSERT INTO page_views (path, user_agent) VALUES (?, ?)", 
                           (payload.get("path", "/"), self.headers.get("User-Agent", "Unknown")))
            conn.commit()
            conn.close()
            self._send_json(200, {"success": True, "message": "Visit logged"})
            return

        if path == "/api/contact":
            msg_id = payload.get("id") or f"msg-{int(datetime.datetime.now().timestamp())}"
            now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
            cursor.execute("""
                INSERT INTO messages (id, name, email, subject, message, date, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                msg_id,
                payload.get("name", "Anonymous"),
                payload.get("email", ""),
                payload.get("subject", "General Inquiry"),
                payload.get("message", ""),
                now_str,
                "New"
            ))
            conn.commit()
            conn.close()
            print(f"[+] API: Received contact inquiry from {payload.get('name')}")
            self._send_json(201, {"success": True, "message": "Message received", "id": msg_id})
            return

        if path == "/api/projects":
            projects_data = payload.get("projects", [])
            cursor.execute("INSERT OR REPLACE INTO store (key, value) VALUES (?, ?)", 
                           ("projects", json.dumps(projects_data)))
            conn.commit()
            conn.close()
            print(f"[+] API: Saved {len(projects_data)} projects to database.")
            self._send_json(200, {"success": True, "message": "Projects updated", "count": len(projects_data)})
            return

        if path == "/api/skills":
            skills_data = payload.get("skills", [])
            cursor.execute("INSERT OR REPLACE INTO store (key, value) VALUES (?, ?)", 
                           ("skills", json.dumps(skills_data)))
            conn.commit()
            conn.close()
            print(f"[+] API: Saved {len(skills_data)} skills to database.")
            self._send_json(200, {"success": True, "message": "Skills updated", "count": len(skills_data)})
            return

        if path == "/api/topics":
            topics_data = payload.get("topics", [])
            cursor.execute("INSERT OR REPLACE INTO store (key, value) VALUES (?, ?)", 
                           ("topics", json.dumps(topics_data)))
            conn.commit()
            conn.close()
            print(f"[+] API: Saved {len(topics_data)} to-do topics to database.")
            self._send_json(200, {"success": True, "message": "Topics updated", "count": len(topics_data)})
            return

        if path == "/api/leetcode":
            leetcode_data = payload.get("leetcode", {})
            cursor.execute("INSERT OR REPLACE INTO store (key, value) VALUES (?, ?)", 
                           ("leetcode", json.dumps(leetcode_data)))
            conn.commit()
            conn.close()
            print(f"[+] API: Saved LeetCode state to database.")
            self._send_json(200, {"success": True, "message": "LeetCode updated"})
            return

        if path == "/api/settings":
            cursor.execute("INSERT OR REPLACE INTO store (key, value) VALUES (?, ?)", 
                           ("profile", json.dumps(payload.get("profile", {}))))
            conn.commit()
            conn.close()
            print(f"[+] API: Profile settings updated.")
            self._send_json(200, {"success": True, "message": "Settings updated"})
            return

        if path == "/api/messages/update":
            action = payload.get("action")
            msg_id = payload.get("id")
            if action == "delete":
                cursor.execute("DELETE FROM messages WHERE id = ?", (msg_id,))
            elif action == "status":
                new_status = payload.get("status", "Replied")
                cursor.execute("UPDATE messages SET status = ? WHERE id = ?", (new_status, msg_id))
            conn.commit()
            conn.close()
            self._send_json(200, {"success": True, "message": f"Message {action} successful"})
            return

        if path == "/api/reset":
            conn.close()
            if os.path.exists(DB_PATH):
                try:
                    os.remove(DB_PATH)
                except Exception:
                    pass
            init_database()
            self._send_json(200, {"success": True, "message": "Data reset to defaults"})
            return

        conn.close()
        self._send_json(404, {"error": "Endpoint not found"})


def run_server():
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        except Exception:
            pass

    init_database()
    server_address = ("", PORT)
    httpd = HTTPServer(server_address, PortfolioAPIHandler)
    print("=" * 60)
    print(f"[*] Ravi Ardhana Portfolio & Dynamic Dashboard Server is Running!")
    print(f"[>] Public Portfolio:   http://localhost:{PORT}/index.html")
    print(f"[>] Dynamic Dashboard:  http://localhost:{PORT}/dashboard.html")
    print(f"[>] REST API Endpoint:  http://localhost:{PORT}/api/data")
    print(f"[>] Root Directory:     {BASE_DIR}")
    print("=" * 60)
    print("Press Ctrl+C to stop the server.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server gracefully...")
        httpd.server_close()


if __name__ == "__main__":
    run_server()
