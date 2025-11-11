import { useState, useEffect, useRef } from 'react'
import { Shield, Zap, Trophy, Star, Play, X, Clock, Lightbulb, Target, Rocket, ArrowLeft, AlertCircle, Activity, Lock, Unlock } from 'lucide-react'

const attackSound = new Audio('/sounds/attack.mp3')
const backgroundMusic = new Audio('/sounds/background.mp3')
backgroundMusic.loop = true
backgroundMusic.volume = 0.25

function App() {
  const [gameState, setGameState] = useState('welcome')
  const [currentLog, setCurrentLog] = useState(null)
  const [score, setScore] = useState(0)
  const [attempts, setAttempts] = useState([])
  const [timeLeft, setTimeLeft] = useState(60)
  const [soundOn, setSoundOn] = useState(true)
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const [demoStep, setDemoStep] = useState(0)
  const [streak, setStreak] = useState(0)
  const ws = useRef(null)
  const actionWs = useRef(null)
  const timerRef = useRef(null)

  const unlockAudio = () => {
    if (!audioUnlocked) {
      const a = new Audio(); a.play().catch(() => {}); setAudioUnlocked(true)
    }
  }

  const playSound = (sound) => {
    if (soundOn && audioUnlocked) { sound.currentTime = 0; sound.play().catch(() => {}) }
  }

  useEffect(() => {
    if ((gameState === 'playing' || gameState === 'demo') && soundOn && audioUnlocked) {
      backgroundMusic.play().catch(() => {})
    } else {
      backgroundMusic.pause()
    }
  }, [gameState, soundOn, audioUnlocked])

  const demoLogs = [
    { id: 1, log: { method: "GET", path: "/v1/accounts/12345/balance", ip: "192.168.1.100", user_agent: "Mozilla/5.0...", freq: 1, sector: "Financial Services" }, anomaly: false, score: 0.12, hint: "Normal balance check. Safe.", action: "false" },
    { id: 2, log: { method: "POST", path: "/v1/users/999999/inject", ip: "185.23.45.67", user_agent: "BotNet/2.1", freq: 18, sector: "attack" }, anomaly: true, score: 1.92, hint: "Fake user ID + bot = SQL Injection attempt!", action: "attack" },
    { id: 3, log: { method: "POST", path: "/api/v2/cart/add", ip: "203.0.113.45", user_agent: "Python-urllib/3.9", freq: 25, sector: "E-commerce & Retail" }, anomaly: true, score: 1.45, hint: "DDoS in progress: 25 req/sec!", action: "attack" },
    { id: 4, log: { method: "GET", path: "/tracking/ABC123456789", ip: "8.8.8.8", user_agent: "curl/7.68.0", freq: 3, sector: "Transportation & Logistics" }, anomaly: false, score: 0.08, hint: "Legit tracking query. Safe.", action: "false" },
    { id: 5, log: { method: "POST", path: "/v1/auth/login", ip: "185.23.45.67", user_agent: "BotNet/2.1", freq: 30, sector: "Financial Services" }, anomaly: true, score: 2.10, hint: "Brute force login detected!", action: "attack" },
    { id: 6, log: { method: "GET", path: "/api/v2/products/98765", ip: "192.168.1.100", user_agent: "Mozilla/5.0...", freq: 2, sector: "E-commerce & Retail" }, anomaly: false, score: 0.15, hint: "User browsing product. Normal.", action: "false" }
  ]

  const startDemo = () => {
    setGameState('demo')
    setDemoStep(0)
    setCurrentLog(demoLogs[0])
    unlockAudio()
    playSound(attackSound)
    backgroundMusic.currentTime = 0
    backgroundMusic.play().catch(() => {})
  }

  const cancelGame = () => {
    ws.current?.close()
    actionWs.current?.close()
    clearInterval(timerRef.current)
    backgroundMusic.pause()
    setGameState('welcome')
  }

  const nextDemoStep = () => {
    if (demoStep < demoLogs.length - 1) {
      setDemoStep(s => s + 1)
      setCurrentLog(demoLogs[demoStep + 1])
    } else {
      setGameState('welcome')
    }
  }

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setAttempts([])
    setTimeLeft(60)
    setStreak(0)
    unlockAudio()
    playSound(attackSound)
    backgroundMusic.currentTime = 0
    backgroundMusic.play().catch(() => {})

    ws.current = new WebSocket('ws://127.0.0.1:8000/ws')
    actionWs.current = new WebSocket('ws://127.0.0.1:8000/action')

    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data)
      setCurrentLog(data)
    }

    actionWs.current.onmessage = (e) => {
      const { points } = JSON.parse(e.data)
      setScore(s => s + points)
      if (points > 0) setStreak(st => st + 1)
      else setStreak(0)
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) endGame()
        return t - 1
      })
    }, 1000)
  }

  const endGame = () => {
    clearInterval(timerRef.current)
    ws.current?.close()
    actionWs.current?.close()
    backgroundMusic.pause()
    setGameState('report')
  }

  const handleAction = (action, isDemo = false) => {
    if (!currentLog) return
    unlockAudio()

    const isCorrect = (action === 'attack') === currentLog.anomaly
    const points = isCorrect ? 100 : -50

    if (!isDemo) {
      setAttempts(prev => [...prev, { ...currentLog, userAction: action, correct: isCorrect, points }])
      setScore(s => s + points)
      actionWs.current?.send(JSON.stringify({
        id: currentLog.id,
        action,
        real_anomaly: currentLog.anomaly
      }))
    }

    setCurrentLog(null)
    if (isDemo) {
      setTimeout(nextDemoStep, 600)
    }
  }

  const getHint = (log) => {
    const { method, path, ip, user_agent, freq, sector } = log

    if (path.includes('999999') && user_agent.includes('BotNet')) {
      return "Fake user ID + bot = SQL Injection attempt!"
    }
    if (path.includes('admin') && !path.includes('users')) {
      return "Unauthorized access to admin panel!"
    }
    if (path.includes('brute') && freq > 20) {
      return "Brute force login detected!"
    }
    if (freq > 20 && method === 'POST') {
      return `DDoS in progress: ${freq} req/sec!`
    }
    if (user_agent === 'Python-urllib/3.9' && freq > 10) {
      return "Automated script spamming endpoint!"
    }
    if (path.includes('debug') && ip !== '192.168.1.100') {
      return "External access to debug endpoint!"
    }

    if (path.includes('balance') && freq <= 2) {
      return "Normal balance check. Safe."
    }
    if (path.includes('products') && method === 'GET') {
      return "User browsing product. Normal."
    }
    if (path.includes('tracking') && ip === '8.8.8.8') {
      return "Legit tracking query. Safe."
    }
    if (path.includes('feed') && freq <= 5) {
      return "User scrolling social feed. Normal."
    }
    if (path.includes('stream') && method === 'GET') {
      return "Video streaming request. Safe."
    }
    if (path.includes('predict') && freq <= 3) {
      return "AI model inference. Normal."
    }
    if (path.includes('login') && freq <= 3 && method === 'POST') {
      return "Standard login attempt. Safe."
    }
    if (path.includes('cart') && freq <= 5) {
      return "User adding to cart. Normal."
    }

    return "Suspicious pattern detected!"
  }

  // Animated Grid Background Component
  const AnimatedGrid = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
        animation: 'gridMove 20s linear infinite'
      }}></div>
      <style>{`
        @keyframes gridMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }
      `}</style>
    </div>
  )

  // Floating Particles Component
  const FloatingParticles = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-60"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`
          }}
        ></div>
      ))}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
      `}</style>
    </div>
  )

  // WELCOME SCREEN
  if (gameState === 'welcome') {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden" onClick={unlockAudio}>
        <AnimatedGrid />
        <FloatingParticles />
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-6xl">
            {/* Header */}
            <div className="text-center mb-16 space-y-6">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 blur-2xl opacity-50 animate-pulse"></div>
                <h1 className="relative text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter">
                  <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
                    API GUARDIAN
                  </span>
                </h1>
              </div>
              
              <div className="flex items-center justify-center gap-3">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-cyan-500"></div>
                <p className="text-cyan-300 text-xl sm:text-2xl font-mono tracking-wider">
                  <span className="text-purple-400">[</span>API SECURITY GAME <span className="text-purple-400">]</span>
                </p>
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-cyan-500"></div>
              </div>

              <div className="flex items-center justify-center gap-4 text-sm text-gray-400 font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>PLAY NOW</span>
                </div>
                <div className="w-px h-4 bg-gray-600"></div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>READY TO PLAY</span>
                </div>
              </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {/* Start Game Card */}
              <button
                onClick={startGame}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-2 border-cyan-500/30 p-8 transition-all duration-300 hover:border-cyan-400 hover:shadow-2xl hover:shadow-cyan-500/50 hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <Rocket className="w-12 h-12 text-cyan-400 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                    <div className="px-4 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono border border-cyan-500/30">
                      LIVE MODE
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-3xl font-black text-white mb-2">START GAME</h3>
                    <p className="text-gray-400 text-sm">Deploy into live environment. 60 seconds. Real threats.</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                    <span>ACTIVE DEFENSE REQUIRED</span>
                  </div>
                </div>
              </button>

              {/* Demo Card */}
              <button
                onClick={startDemo}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-2 border-purple-500/30 p-8 transition-all duration-300 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
                
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <Lightbulb className="w-12 h-12 text-purple-400 group-hover:scale-110 transition-transform" />
                    <div className="px-4 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono border border-purple-500/30">
                      TRAINING
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-3xl font-black text-white mb-2">DEMO MODE</h3>
                    <p className="text-gray-400 text-sm">6 guided examples. Learn threat patterns. No pressure.</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-purple-400 font-mono">
                    <Target className="w-4 h-4" />
                    <span>SKILL DEVELOPMENT</span>
                  </div>
                </div>
              </button>
            </div>

            {/* Info Panel */}
            <div className="relative rounded-2xl bg-black/40 backdrop-blur-xl border border-gray-800 overflow-hidden mb-12">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
              
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="w-8 h-8 text-cyan-400" />
                  <h2 className="text-2xl font-black text-white">MISSION BRIEFING</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-start gap-4 p-4 rounded-xl border border-green-500/20">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <div className="text-green-400 font-black text-lg mb-1">BLOCK IT</div>
                        <div className="text-gray-400 text-sm mb-2">Neutralize confirmed threats</div>
                        <div className="inline-block px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-mono">
                          +100 PTS
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-500/10 to-gray-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-start gap-4 p-4 rounded-xl border border-gray-500/20">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-500/20 flex items-center justify-center">
                        <X className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <div className="text-gray-400 font-black text-lg mb-1">PASS IT</div>
                        <div className="text-gray-400 text-sm mb-2">Allow legitimate traffic</div>
                        <div className="inline-block px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-mono">
                          -50 PTS FOR ERRORS
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* === BEGINNER CHEAT SHEET === */}
            <div className="relative rounded-2xl bg-black/60 backdrop-blur-2xl border border-cyan-500/40 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
              
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Lightbulb className="w-8 h-8 text-yellow-400" />
                  <h2 className="text-2xl font-black text-white">BEGINNER CHEAT SHEET</h2>
                </div>

                <div className="bg-black/60 rounded-xl p-6 border border-purple-500/30 font-mono text-sm leading-relaxed">
                  <div className="text-cyan-400 font-bold mb-4 text-lg">API GUARDIAN – BEGINNER CHEAT SHEET</div>
                  
                  <div className="text-purple-400 font-bold mb-3">BLOCK IT vs PASS IT</div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <div className="text-green-400 font-bold mb-2">GOOD → PASS IT (Safe)</div>
                      <ul className="text-gray-300 space-y-1 text-xs">
                        <li>• RPM ≤ 300 (low traffic)</li>
                        <li>• Normal browser (Mozilla/5.0...)</li>
                        <li>• Trusted IP (192.168.x.x)</li>
                        <li>• Normal paths: /balance, /products/123</li>
                        <li>• AI Score &lt; 1.0</li>
                      </ul>
                    </div>
                    
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <div className="text-red-400 font-bold mb-2">BAD → BLOCK IT (Attack!)</div>
                      <ul className="text-gray-300 space-y-1 text-xs">
                        <li>• RPM &gt; 600 (flood!)</li>
                        <li>• BotNet / Python-urllib</li>
                        <li>• Evil IP: 185.23.45.67, 45.79.123.45</li>
                        <li>• Sketchy paths: /999999/inject, /admin/debug</li>
                        <li>• AI Score &gt; 1.0</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-lg p-4 mb-4">
                    <div className="text-yellow-400 font-bold">90% Win Rule:</div>
                    <div className="text-white mt-1">
                      Red card OR RPM &gt; 600 OR Bot agent → <span className="text-red-400 font-bold">BLOCK IT</span>
                    </div>
                  </div>

                  <div className="text-cyan-300 text-center font-bold">
                    Demo Mode → Learn 6 examples → Live Mode → Become LEGEND!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes gradient {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          .animate-gradient {
            background-size: 200% 200%;
            animation: gradient 3s ease infinite;
          }
        `}</style>
      </div>
    )
  }

  // DEMO MODE
  if (gameState === 'demo') {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden" onClick={unlockAudio}>
        <AnimatedGrid />
        <FloatingParticles />

        <button
          onClick={cancelGame}
          className="fixed top-6 left-6 z-50 group flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 hover:border-red-400 transition-all"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-mono text-sm">EXIT</span>
        </button>

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
          <div className="text-center mb-8">
            <div className="inline-block px-6 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 mb-4">
              <span className="text-purple-400 font-mono text-sm">TRAINING MODE</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-black text-white mb-2">DEMO SESSION</h1>
            <p className="text-2xl text-purple-400 font-mono">
              <span className="text-cyan-400">EXAMPLE {demoStep + 1}</span> / 6
            </p>
          </div>

          {currentLog && (
            <div className="w-full max-w-3xl">
              <div className={`relative rounded-2xl border-2 p-8 backdrop-blur-xl transition-all duration-500 bg-gray-900/60 border-cyan-500/40 shadow-2xl shadow-cyan-500/20`}>
                <div className="absolute top-4 right-4 px-4 py-1 rounded-full bg-black/50 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
                  {currentLog.log.sector?.toUpperCase() || 'UNKNOWN'}
                </div>

                <div className="mb-6">
                  <div className="font-mono text-sm text-gray-500 mb-2">REQUEST INTERCEPTED</div>
                  <div className="font-mono text-lg sm:text-xl break-all">
                    <span className="text-cyan-400 font-bold">{currentLog.log.method}</span>
                    <span className="text-gray-400 mx-2">→</span>
                    <span className="text-white">{currentLog.log.path}</span>
                  </div>
                  <div className="font-mono text-sm text-gray-400 mt-2">
                    FROM: <span className="text-purple-400">{currentLog.log.ip}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="rounded-xl bg-black/40 border border-gray-700 p-3">
                    <div className="text-orange-400 text-xs font-mono mb-1">FREQUENCY</div>
                    <div className={`text-2xl font-bold ${currentLog.log.freq > 10 ? 'text-red-400' : 'text-gray-300'}`}>
                      {currentLog.log.freq}<span className="text-sm text-gray-500">/s</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-black/40 border border-gray-700 p-3">
                    <div className="text-yellow-400 text-xs font-mono mb-1">AI SCORE</div>
                    <div className={`text-2xl font-bold ${currentLog.score > 1.0 ? 'text-red-400' : 'text-gray-300'}`}>
                      {currentLog.score.toFixed(2)}
                    </div>
                  </div>
                  <div className="rounded-xl bg-black/40 border border-gray-700 p-3">
                    <div className="text-purple-400 text-xs font-mono mb-1">USER AGENT</div>
                    <div className="text-xs text-gray-300 truncate">{currentLog.log.user_agent}</div>
                  </div>
                </div>

                <div className="mb-8 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-yellow-400 font-bold text-sm mb-1">ANALYSIS</div>
                      <p className="text-white font-medium">{currentLog.hint}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => handleAction('attack', true)}
                    disabled={currentLog.action !== 'attack'}
                    className={`flex-1 relative overflow-hidden rounded-xl p-6 font-black text-xl transition-all ${
                      currentLog.action === 'attack'
                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/50 hover:scale-105'
                        : 'bg-gray-800/50 text-gray-600 border border-gray-700 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Zap className="w-8 h-8" />
                      <span>BLOCK IT</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleAction('false', true)}
                    disabled={currentLog.action !== 'false'}
                    className={`flex-1 relative overflow-hidden rounded-xl p-6 font-black text-xl-xl transition-all ${
                      currentLog.action === 'false'
                        ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow-lg shadow-green-500/50 hover:scale-105'
                        : 'bg-gray-800/50 text-gray-600 border border-gray-700 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Shield className="w-8 h-8" />
                      <span>PASS IT</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // PLAYING MODE
  if (gameState === 'playing') {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden" onClick={unlockAudio}>
        <AnimatedGrid />
        <FloatingParticles />

        <div className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-black/50 border-b border-cyan-500/30">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={cancelGame}
                  className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </button>
                
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-cyan-400" />
                  <div>
                    <div className="text-white font-black text-xl">API GUARDIAN</div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 font-mono">ACTIVE</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-black/50 border border-yellow-500/30">
                  <Clock className={`w-6 h-6 ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`} />
                  <div>
                    <div className="text-xs text-gray-400 font-mono">TIME</div>
                    <div className={`text-2xl font-bold font-mono ${timeLeft <= 10 ? 'text-red-400' : 'text-white'}`}>
                      {timeLeft}s
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-black/50 border border-cyan-500/30">
                  <Trophy className="w-6 h-6 text-cyan-400" />
                  <div>
                    <div className="text-xs text-gray-400 font-mono">SCORE</div>
                    <div className="text-2xl font-bold font-mono text-cyan-400">{score}</div>
                  </div>
                </div>

                {streak > 2 && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 animate-pulse">
                    <Star className="w-5 h-5 text-orange-400" fill="currentColor" />
                    <div className="text-orange-400 font-black">{streak}x</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4 pt-32">
          {currentLog ? (
            <div className="w-full max-w-4xl">
              <div className={`relative rounded-2xl border-2 p-8 backdrop-blur-xl transition-all duration-500 bg-gray-900/60 border-cyan-500/40 shadow-2xl shadow-cyan-500/20`}>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
                
                <div className="flex justify-between items-start mb-6">
                  <div className="px-4 py-2 rounded-xl bg-black/50 border border-cyan-500/30">
                    <div className="text-xs text-gray-400 font-mono mb-1">SECTOR</div>
                    <div className="text-cyan-400 font-bold text-sm">{currentLog.log.sector?.toUpperCase() || 'UNKNOWN'}</div>
                  </div>
                  
                  {currentLog.anomaly && (
                    <div className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500 animate-pulse">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <span className="text-red-400 font-black text-sm">THREAT DETECTED</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-6 p-6 rounded-xl bg-black/40 border border-gray-700">
                  <div className="text-xs text-gray-500 font-mono mb-3">INTERCEPTED REQUEST</div>
                  <div className="font-mono text-xl sm:text-2xl break-all mb-4">
                    <span className="px-3 py-1 rounded bg-cyan-500/20 text-cyan-400 font-bold mr-3">{currentLog.log.method}</span>
                    <span className="text-white">{currentLog.log.path}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">SOURCE:</span>
                      <span className="text-purple-400">{currentLog.log.ip}</span>
                    </div>
                    <div className="w-px h-4 bg-gray-700"></div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-green-400" />
                      <span className="text-gray-500">LIVE</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative rounded-xl bg-black/60 border border-orange-500/30 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-orange-400" />
                        <div className="text-orange-400 text-xs font-mono">FREQUENCY</div>
                      </div>
                      <div className={`text-3xl font-bold ${currentLog.log.freq > 10 ? 'text-red-400' : 'text-gray-300'}`}>
                        {currentLog.log.freq}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">req/sec</div>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative rounded-xl bg-black/60 border border-yellow-500/30 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-yellow-400" />
                        <div className="text-yellow-400 text-xs font-mono">AI SCORE</div>
                      </div>
                      <div className={`text-3xl font-bold ${currentLog.score > 1.0 ? 'text-red-400' : 'text-gray-300'}`}>
                        {currentLog.score.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">confidence</div>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative rounded-xl bg-black/60 border border-purple-500/30 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-purple-400" />
                        <div className="text-purple-400 text-xs font-mono">AGENT</div>
                      </div>
                      <div className="text-sm text-gray-300 truncate font-mono">{currentLog.log.user_agent}</div>
                    </div>
                  </div>
                </div>

                {currentLog.anomaly && (
                  <div className="mb-8 rounded-xl bg-gradient-to-r from-red-500/20 to-orange-500/20 border-2 border-red-500/50 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-500/30 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-red-400" />
                      </div>
                      <div>
                        <div className="text-red-400 font-black text-sm mb-2">THREAT ANALYSIS</div>
                        <p className="text-white font-bold text-lg">{getHint(currentLog.log)}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => handleAction('attack')}
                    className="group flex-1 relative overflow-hidden rounded-xl bg-gradient-to-r from-red-600 to-red-700 p-6 font-black text-2xl text-white transition-all hover:scale-105 hover:shadow-2xl hover:shadow-red-500/60"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <div className="relative flex items-center justify-center gap-3">
                      <Zap className="w-10 h-10 group-hover:rotate-12 transition-transform" />
                      <span>BLOCK IT</span>
                    </div>
                    <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/40 text-xs font-mono">+100</div>
                  </button>

                  <button
                    onClick={() => handleAction('false')}
                    className="group flex-1 relative overflow-hidden rounded-xl bg-gradient-to-r from-green-600 to-emerald-700 p-6 font-black text-2xl text-white transition-all hover:scale-105 hover:shadow-2xl hover:shadow-green-500/60"
                  >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <div className="relative flex items-center justify-center gap-3">
                      <Shield className="w-10 h-10 group-hover:scale-110 transition-transform" />
                      <span>PASS IT</span>
                    </div>
                    <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/40 text-xs font-mono text-red-400">-50</div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="inline-block p-8 rounded-2xl bg-black/50 backdrop-blur-xl border border-cyan-500/30">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
                <p className="text-gray-400 text-xl font-mono">Waiting for endpoints...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // REPORT SCREEN
  if (gameState === 'report') {
    const correct = attempts.filter(a => a.correct).length
    const total = attempts.length
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
    const rank = score >= 1500 ? 'LEGEND' : score >= 1200 ? 'ELITE GUARDIAN' : score >= 800 ? 'GUARDIAN' : score >= 300 ? 'HUNTER' : 'ROOKIE'
    const rankColor = score >= 1500 ? 'from-yellow-400 to-orange-500' : score >= 1200 ? 'from-cyan-400 to-purple-500' : score >= 800 ? 'from-green-400 to-emerald-500' : score >= 300 ? 'from-blue-400 to-cyan-500' : 'from-gray-400 to-gray-600'

    return (
      <div className="min-h-screen bg-black relative overflow-hidden" onClick={unlockAudio}>
        <AnimatedGrid />
        <FloatingParticles />

        {score >= 1200 && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
          </div>
        )}

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <div className="text-center mb-12">
              <div className="inline-block px-6 py-2 rounded-full bg-green-500/20 border border-green-500/30 mb-6">
                <span className="text-green-400 font-mono text-sm">MISSION COMPLETE</span>
              </div>
              
              <h1 className="text-6xl sm:text-7xl md:text-8xl font-black mb-6">
                <span className={`bg-gradient-to-r ${rankColor} bg-clip-text text-transparent`}>
                  {rank}
                </span>
              </h1>

              {score >= 1200 && (
                <div className="space-y-2">
                  <p className="text-3xl font-black text-yellow-400 animate-pulse">★ EXCEPTIONAL PERFORMANCE ★</p>
                  <p className="text-xl text-yellow-300">You are an API Security Master!</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/30 p-8 text-center">
                  <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                  <div className="text-6xl font-black text-white mb-2">{score}</div>
                  <div className="text-yellow-400 font-bold text-sm tracking-wider">TOTAL SCORE</div>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 p-8 text-center">
                  <Target className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <div className="text-6xl font-black text-white mb-2">{accuracy}%</div>
                  <div className="text-green-400 font-bold text-sm tracking-wider">ACCURACY</div>
                  <div className="text-gray-400 text-xs mt-2 font-mono">{correct}/{total} correct</div>
                </div>
              </div>

              <div className="relative group">
                <div className={`absolute inset-0 bg-gradient-to-br ${rankColor}/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                <div className={`relative rounded-2xl bg-gradient-to-br ${rankColor}/10 border-2 border-purple-500/30 p-8 text-center`}>
                  <Star className="w-16 h-16 text-purple-400 mx-auto mb-4" fill="currentColor" />
                  <div className="text-3xl font-black text-white mb-2 leading-tight">{rank}</div>
                  <div className="text-purple-400 font-bold text-sm tracking-wider">RANK ACHIEVED</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-black/50 backdrop-blur-xl border border-gray-700 p-8 mb-8">
              <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                <Activity className="w-8 h-8 text-cyan-400" />
                PERFORMANCE ANALYSIS
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                  <span className="text-gray-400 font-mono text-sm">Threats Blocked</span>
                  <span className="text-green-400 font-bold text-2xl">{attempts.filter(a => a.userAction === 'attack' && a.correct).length}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <span className="text-gray-400 font-mono text-sm">False Alarms</span>
                  <span className="text-blue-400 font-bold text-2xl">{attempts.filter(a => a.userAction === 'attack' && !a.correct).length}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                  <span className="text-gray-400 font-mono text-sm">Legitimate Passed</span>
                  <span className="text-cyan-400 font-bold text-2xl">{attempts.filter(a => a.userAction === 'false' && a.correct).length}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                  <span className="text-gray-400 font-mono text-sm">Missed Threats</span>
                  <span className="text-red-400 font-bold text-2xl">{attempts.filter(a => a.userAction === 'false' && !a.correct).length}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setGameState('welcome')}
              className="group w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 p-8 font-black text-3xl text-white transition-all hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
              <div className="relative flex items-center justify-center gap-4">
                <Rocket className="w-10 h-10 group-hover:rotate-12 transition-transform" />
                <span>PLAY AGAIN</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default App