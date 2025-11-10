import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const canvasRef = useRef(null)
  const ballsRef = useRef([])
  const [score, setScore] = useState(0)
  const ballIdRef = useRef(0)
  const pinsRef = useRef([])
  const animationRef = useRef(null)

  // Configuration du jeu
  const config = {
    rows: 12,
    ballRadius: 8,
    pinRadius: 4,
    canvasWidth: 600,
    canvasHeight: 700,
    gravity: 0.5,
    bounce: 0.7,
    multipliers: [10, 5, 2, 1, 0.5, 0.3, 0.5, 1, 2, 5, 10]
  }

  // Initialiser les pins
  useEffect(() => {
    const pins = []
    const startX = 100
    const startY = 100
    const horizontalSpacing = 40
    const verticalSpacing = 50

    for (let row = 0; row < config.rows; row++) {
      const pinsInRow = row + 3
      const rowWidth = (pinsInRow - 1) * horizontalSpacing
      const offsetX = startX + (config.canvasWidth - 2 * startX - rowWidth) / 2

      for (let col = 0; col < pinsInRow; col++) {
        pins.push({
          x: offsetX + col * horizontalSpacing,
          y: startY + row * verticalSpacing
        })
      }
    }
    pinsRef.current = pins
  }, [])

  // Animation des balles
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')

    const animate = () => {
      ctx.clearRect(0, 0, config.canvasWidth, config.canvasHeight)

      // Dessiner les pins
      ctx.fillStyle = '#FFD700'
      pinsRef.current.forEach(pin => {
        ctx.beginPath()
        ctx.arc(pin.x, pin.y, config.pinRadius, 0, Math.PI * 2)
        ctx.fill()
      })

      // Dessiner les multiplicateurs en bas
      const multiplierY = config.canvasHeight - 40
      const multiplierWidth = config.canvasWidth / config.multipliers.length
      
      config.multipliers.forEach((mult, index) => {
        const x = index * multiplierWidth
        ctx.fillStyle = mult >= 5 ? '#4CAF50' : mult >= 2 ? '#2196F3' : '#FF9800'
        ctx.fillRect(x, multiplierY, multiplierWidth - 2, 35)
        
        ctx.fillStyle = '#FFF'
        ctx.font = 'bold 14px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(`${mult}x`, x + multiplierWidth / 2, multiplierY + 22)
      })

      // Mettre à jour et dessiner les balles
      ballsRef.current = ballsRef.current.filter(ball => {
        if (ball.settled && ball.age++ > 60) {
          return false // Retirer la balle
        }

        if (!ball.settled) {
          // Appliquer la gravité
          ball.vy += config.gravity
          ball.x += ball.vx
          ball.y += ball.vy

          // Collision avec les pins
          pinsRef.current.forEach(pin => {
            const dx = ball.x - pin.x
            const dy = ball.y - pin.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < config.ballRadius + config.pinRadius) {
              const angle = Math.atan2(dy, dx)
              const targetX = pin.x + Math.cos(angle) * (config.ballRadius + config.pinRadius)
              const targetY = pin.y + Math.sin(angle) * (config.ballRadius + config.pinRadius)

              ball.x = targetX
              ball.y = targetY

              // Rebond avec un peu d'aléatoire
              ball.vx = Math.cos(angle) * 3 + (Math.random() - 0.5) * 2
              ball.vy = Math.sin(angle) * 3 * config.bounce
            }
          })

          // Limites horizontales
          if (ball.x < config.ballRadius) {
            ball.x = config.ballRadius
            ball.vx *= -config.bounce
          }
          if (ball.x > config.canvasWidth - config.ballRadius) {
            ball.x = config.canvasWidth - config.ballRadius
            ball.vx *= -config.bounce
          }

          // Vérifier si la balle atteint le bas
          if (ball.y >= multiplierY - config.ballRadius) {
            ball.settled = true
            ball.vy = 0
            ball.vx = 0
            ball.age = 0

            // Calculer le multiplicateur
            const slotIndex = Math.floor(ball.x / multiplierWidth)
            const finalIndex = Math.max(0, Math.min(config.multipliers.length - 1, slotIndex))
            const multiplier = config.multipliers[finalIndex]
            
            setScore(prev => prev + multiplier)
          }
        }

        // Dessiner la balle
        ctx.fillStyle = ball.color
        ctx.beginPath()
        ctx.arc(ball.x, ball.y, config.ballRadius, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#FFF'
        ctx.lineWidth = 2
        ctx.stroke()

        return true // Garder la balle
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Ajouter une balle
  const dropBall = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8']
    const newBall = {
      id: ballIdRef.current++,
      x: config.canvasWidth / 2 + (Math.random() - 0.5) * 20,
      y: 20,
      vx: (Math.random() - 0.5) * 2,
      vy: 0,
      color: colors[Math.floor(Math.random() * colors.length)],
      settled: false,
      age: 0
    }
    ballsRef.current.push(newBall)
  }

  return (
    <div className="app">
      <h1>🎰 Jeu de Plinko 🎰</h1>
      <div className="score">Score: {score.toFixed(1)}</div>
      <canvas
        ref={canvasRef}
        width={config.canvasWidth}
        height={config.canvasHeight}
        className="plinko-canvas"
      />
      <button onClick={dropBall} className="drop-button">
        Lancer une balle
      </button>
    </div>
  )
}

export default App
