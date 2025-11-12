# backend/main.py
import asyncio
import json
import random
import os
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

# Import your anomaly logic
from . import is_anomaly, get_threat_description

app = FastAPI()

# === CORS ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# === SERVE FRONTEND (FIXED FOR RENDER - NO STATICFILES MOUNT ON ROOT!) ===
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

# Serve index.html
@app.get("/", response_class=HTMLResponse)
async def serve_spa():
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return HTMLResponse(open(index_path, "r", encoding="utf-8").read())
    return HTMLResponse("<h1>API Guardian: Building... Please wait</h1>", status_code=200)

# Serve static assets (JS, CSS, sounds)
@app.get("/{filepath:path}")
async def serve_static(filepath: str):
    if filepath.startswith("api") or filepath in ["ws", "action", "health"]:
        return {"error": "not found"}, 404
    
    file_path = os.path.join(FRONTEND_DIR, filepath)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # Fallback to index.html for SPA routing
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return HTMLResponse(open(index_path, "r", encoding="utf-8").read())
    return HTMLResponse("Not Found", status_code=404)

# === YOUR INDUSTRIES & ATTACKS (UNCHANGED) ===
INDUSTRIES = {
    "Financial Services": { "paths": ["/v1/accounts/{}/balance", "/v1/auth/login"], "normal_ips": ["192.168.1.100"], "normal_rpm": (20, 120) },
    "E-commerce & Retail": { "paths": ["/api/v2/cart/add", "/api/v2/products/{}"], "normal_ips": ["203.0.113.45"], "normal_rpm": (30, 300) },
    "Transportation & Logistics": { "paths": ["/tracking/{}"], "normal_ips": ["8.8.8.8"], "normal_rpm": (15, 80) },
    "Social Media": { "paths": ["/api/v3/feed"], "normal_ips": ["192.168.1.100"], "normal_rpm": (60, 400) },
    "Entertainment & Media": { "paths": ["/api/v1/stream/start"], "normal_ips": ["8.8.8.8"], "normal_rpm": (50, 200) },
    "Healthcare & Science": { "paths": ["/api/v1/patients/{}/record"], "normal_ips": ["10.0.0.20"], "normal_rpm": (10, 60) },
    "Cloud Computing": { "paths": ["/api/v1/instances/start"], "normal_ips": ["10.0.0.5"], "normal_rpm": (40, 300) },
    "Artificial Intelligence": { "paths": ["/api/v1/models/predict"], "normal_ips": ["10.0.0.30"], "normal_rpm": (30, 180) },
    "Government & Public Services": { "paths": ["/api/v1/citizen/verify"], "normal_ips": ["203.0.113.45"], "normal_rpm": (10, 50) },
    "Travel & Hospitality": { "paths": ["/api/v1/bookings/flight"], "normal_ips": ["192.168.1.100"], "normal_rpm": (20, 150) },
    "Telecommunications": { "paths": ["/api/v1/billing/invoice"], "normal_ips": ["10.0.0.15"], "normal_rpm": (15, 100) },
    "Internal Operations": { "paths": ["/api/v1/employees/directory"], "normal_ips": ["10.0.0.25"], "normal_rpm": (5, 40) }
}

ATTACK_PATTERNS = [
    {"type": "SQL_INJECTION", "paths": ["/v1/users/999999/inject", "/v1/users/union select 1"], "ip": "185.23.45.67", "user_agent": "BotNet/2.1", "rpm_range": (600, 1800)},
    {"type": "DDOS", "paths": ["/api/v2/cart/add", "/api/v3/feed"], "ip": "203.0.113.45", "user_agent": "Python-urllib/3.9", "rpm_range": (1800, 5000)},
    {"type": "BRUTE_FORCE", "paths": ["/v1/auth/login"], "ip": "185.23.45.67", "user_agent": "BotNet/2.1", "rpm_range": (1200, 3600)},
    {"type": "ADMIN_BYPASS", "paths": ["/admin/debug", "/__debug/info"], "ip": "45.79.123.45", "user_agent": "Go-http-client/1.1", "rpm_range": (800, 2000)},
    {"type": "DEBUG_EXPLOIT", "paths": ["/debug/config", "/internal/test"], "ip": "45.79.123.45", "user_agent": "Python-urllib/3.9", "rpm_range": (700, 1500)}
]

NORMAL_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    "curl/7.68.0"
]

ws_clients = []
action_clients = []
processed_logs = set()

# === LOG GENERATOR (UNCHANGED) ===
async def generate_log():
    is_attack = random.random() < 0.15
    if is_attack:
        attack = random.choice(ATTACK_PATTERNS)
        path_template = random.choice(attack["paths"])
        path = path_template.format(random.randint(10000, 99999)) if "{}" in path_template else path_template
        rpm = random.randint(*attack["rpm_range"])
        log_data = {
            "method": "POST" if any(x in path.lower() for x in ["login", "add", "inject"]) else "GET",
            "path": path,
            "ip": attack["ip"],
            "user_agent": attack["user_agent"],
            "freq": rpm,
            "sector": "attack"
        }
    else:
        sector = random.choice(list(INDUSTRIES.keys()))
        data = INDUSTRIES[sector]
        path_template = random.choice(data["paths"])
        path = path_template.format(random.randint(1000, 99999)) if "{}" in path_template else path_template
        rpm = random.randint(*data["normal_rpm"])
        log_data = {
            "method": "GET",
            "path": path,
            "ip": random.choice(data["normal_ips"]),
            "user_agent": random.choice(NORMAL_USER_AGENTS),
            "freq": rpm,
            "sector": sector
        }

    log_id = abs(hash(str(datetime.now().timestamp()) + path + str(rpm)))
    return {"id": log_id, "log": log_data}

# === SEND LOG ===
async def send_next_log():
    await asyncio.sleep(random.uniform(0.8, 2.2))
    log_entry = await generate_log()
    log_data = log_entry["log"]

    is_bad, score, description = is_anomaly(log_data)

    payload = {
        "id": log_entry["id"],
        "log": log_data,
        "anomaly": is_bad,
        "score": round(float(score), 3),
        "threat": description
    }

    payload_json = json.dumps(payload)
    for client in ws_clients[:]:
        try:
            await client.send_text(payload_json)
        except:
            ws_clients.remove(client)

# === WEBSOCKETS ===
@app.websocket("/ws")
async def ws_logs(websocket: WebSocket):
    await websocket.accept()
    ws_clients.append(websocket)
    await send_next_log()
    try:
        async for _ in websocket.iter_text():
            pass
    except WebSocketDisconnect:
        ws_clients.remove(websocket)

@app.websocket("/action")
async def ws_action(websocket: WebSocket):
    await websocket.accept()
    action_clients.append(websocket)
    try:
        async for message in websocket.iter_text():
            data = json.loads(message)
            log_id = data["id"]
            user_action = data["action"]
            real_anomaly = data["real_anomaly"]

            if log_id in processed_logs:
                continue
            processed_logs.add(log_id)

            is_correct = (user_action == "attack") == real_anomaly
            points = 100 if is_correct else -50

            await websocket.send_text(json.dumps({"points": points}))
            asyncio.create_task(send_next_log())
    except WebSocketDisconnect:
        action_clients.remove(websocket)
    except Exception as e:
        print(f"Action WS error: {e}")

# === HEALTH ===
@app.get("/health")
async def health():
    return {"status": "API Guardian is LIVE", "tanzania": "PROUD"}