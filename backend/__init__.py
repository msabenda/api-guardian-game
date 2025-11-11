# backend/__init__.py
import re
from collections import Counter
import math

EVIL_IPS = ["185.23.45.67", "45.79.123.45"]
MALICIOUS_AGENTS = ["BotNet", "Python-urllib", "Go-http-client", "curl/7.68.0"]
SKETCHY_PATHS = [
    "999999", "inject", "admin/debug", "sqlmap", "union select", "1=1", "';--", "drop table",
    "brute", "debug", "config", "backup", "test", "internal", "sql", "shell"
]

def _has_sketchy_path(path):
    path_lower = path.lower()
    return any(keyword in path_lower for keyword in SKETCHY_PATHS)

def is_anomaly(log):
    freq = log.get("freq", 0)
    ip = log.get("ip", "")
    user_agent = log.get("user_agent", "")
    path = log.get("path", "")
    score = log.get("score", 0.0)

    if freq > 600:
        return True, 2.8, "DDoS Flood (>600 RPM)"
    if ip in EVIL_IPS:
        return True, 2.9, "Known Malicious IP"
    if any(agent in user_agent for agent in ["BotNet", "Python-urllib"]):
        return True, 2.7, "Malicious Bot Detected"
    if _has_sketchy_path(path):
        return True, 2.5, "Suspicious Path Pattern"
    if score > 1.0:
        return True, score, "AI Threat Detection"

    if ip.startswith("192.168.") or ip == "127.0.0.1":
        return False, 0.1, "Internal Trusted Source"
    if "Mozilla/5.0" in user_agent or "Chrome/" in user_agent or "Safari/" in user_agent:
        if freq <= 300:
            return False, 0.05, "Legitimate Browser Traffic"
    if freq <= 300 and not _has_sketchy_path(path):
        return False, 0.08, "Normal Traffic Pattern"

    return True, 1.2, "Unclassified Suspicious Activity"

def get_threat_description(log):
    _, _, desc = is_anomaly(log)
    return desc