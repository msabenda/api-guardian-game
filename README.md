# 🛡️ API Guardian


An interactive educational game designed to teach API security fundamentals through hands-on traffic analysis. Learn to identify and block malicious requests while allowing legitimate traffic to pass through.

## 🎯 Overview

API Guardian Game is a beginner-friendly simulation created by remnant(Msambili Ndaga) that helps developers understand the basics of API security by identifying safe versus malicious traffic patterns. Through interactive gameplay, users learn to recognize common attack vectors and security threats in real-world API scenarios.

### Key Learning Objectives

- **Traffic Analysis**: Understand request patterns and identify anomalies
- **Threat Detection**: Recognize common attack signatures (DDoS, bot traffic, path traversal)
- **Security Metrics**: Learn about RPM limits, AI threat scoring, and IP reputation
- **Decision Making**: Practice making quick security decisions under pressure

## 🎮 Game Mechanics

### Pass or Block?

Analyze incoming API traffic and decide whether to **PASS** (safe) or **BLOCK** (malicious) each request.

#### ✅ PASS IT (Safe Traffic)
- **RPM**: ≤ 300 requests per minute
- **User Agent**: Normal browsers (Mozilla/5.0...)
- **IP Address**: Trusted ranges (192.168.x.x)
- **Paths**: Standard endpoints (/balance, /products/123)
- **AI Score**: < 1.0

#### 🚫 BLOCK IT (Malicious Traffic)
- **RPM**: > 600 (traffic flood/DDoS)
- **User Agent**: Bots (BotNet, Python-urllib)
- **IP Address**: Known malicious IPs (185.23.45.67, 45.79.123.45)
- **Paths**: Suspicious patterns (/999999/inject, /admin/debug)
- **AI Score**: > 1.0 (high threat level)

### The 90% Rule

**Instant BLOCK** if any of these conditions are met:
- 🔴 Red card (AI Score > 1.0)
- 📈 RPM > 600
- 🤖 Bot user agent detected

### Game Modes

1. **Demo Mode**: Learn through 6 guided examples
2. **Live Mode**: Test your skills and become a LEGEND!

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Python](https://www.python.org/) (v3.8 or higher)
- npm (comes with Node.js)
- pip (comes with Python)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/msabenda/api-guardian-game.git
   cd api-guardian-game
   ```

2. **Set up the Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`

3. **Set up the Backend** (in a new terminal)
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\Activate
   pip install -r requirements.txt
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   The backend API will be available at `http://localhost:8000`

### Quick Start

Once both servers are running:

1. Open your browser and navigate to `http://localhost:5173`
2. Start with **Demo Mode** to learn the basics
3. Progress to **Start Game Mode** to test your skills
4. Track your score and aim for LEGEND status!

## 📁 Project Structure

```
api-guardian-game/
├── frontend/          # React/Node.js frontend application
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/           # Python/FastAPI backend server
│   ├── main.py
│   ├── requirements.txt
│   └── ...
└── README.md
```

## 🛠️ Tech Stack

**Frontend**
- Node.js
- React (assumed)
- Modern JavaScript/TypeScript

**Backend**
- Python 3.8+
- FastAPI
- Uvicorn (ASGI server)

## 🤝 Contributing

I welcome contributions from the community! Whether you want to add new features, fix bugs, improve documentation, or create new traffic scenarios, your help is appreciated.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Ideas

- Add new attack scenarios and patterns
- Improve AI threat detection algorithms
- Create additional game modes or difficulty levels
- Enhance UI/UX design
- Write comprehensive tests
- Improve documentation and tutorials


## 🙏 Acknowledgments

Created as an educational tool to make API security accessible and engaging for developers of all skill levels.

## 📧 Contact

Project Link: [https://github.com/msabenda/api-guardian-game](https://github.com/msabenda/api-guardian-game)

Live Project Game: [https://api-guardian-game.onrender.com/](https://api-guardian-game.onrender.com/)

---

**Made by remnant(Msambili Ndaga) ❤️ for the API Security community**