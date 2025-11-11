# API GUARDIAN – BEGINNER CHEAT SHEET

## BLOCK IT vs PASS IT

| GOOD → PASS IT (Safe)               | BAD → BLOCK IT (Attack!)                     |
|-------------------------------------|----------------------------------------------|
| RPM ≤ 300 (low traffic)             | RPM > 600 (flood!)                           |
| Normal browser (Mozilla/5.0...)     | BotNet / Python-urllib                       |
| Trusted IP (192.168.x.x)            | Evil IP:: 185.23.45.67, 45.79.123.45      |
| Normal paths: /balance, /products/123 | Sketchy paths: /999999/inject, /admin/debug |
| AI Score < 1.0                      | AI Score > 1.0 (red card)                    |

**90% Win Rule:**  
Red card OR RPM > 600 OR Bot agent → **BLOCK IT**

**Demo Mode** → Learn 6 examples → Live Mode → Become LEGEND!