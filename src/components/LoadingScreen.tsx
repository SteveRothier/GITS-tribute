import { useEffect, useState, useRef, useMemo, useCallback } from 'react'

/**
 * Props du composant LoadingScreen
 */
interface LoadingScreenProps {
  onComplete?: () => void
}

/**
 * Constantes de configuration du loading screen
 */
const TOTAL_DURATION = 13000 // Durée totale de la séquence de boot (ms)
const UPDATE_INTERVAL = 100 // Intervalle de mise à jour de la progression (ms)
const GLITCH_INTERVAL_MIN = 5000 // Intervalle minimum pour l'effet glitch (ms)
const GLITCH_INTERVAL_MAX = 8000 // Intervalle maximum pour l'effet glitch (ms)
const GLITCH_DURATION = 80 // Durée de l'effet glitch (ms)
const SCROLL_RESET_TIMEOUT = 3000 // Timeout pour réactiver l'auto-scroll (ms)
const SCROLL_THRESHOLD = 10 // Seuil pour détecter si on est en bas du scroll (px)
const FADE_OUT_DELAY = 500 // Délai avant le fade out (ms)
const COMPLETE_CALLBACK_DELAY = 1000 // Délai avant d'appeler onComplete (ms)

/**
 * Styles CSS pour la barre de défilement personnalisée
 * Utilise la couleur cyan (#00ffff) pour correspondre au thème du loading screen
 */
const SCROLLBAR_STYLES = `
  .loading-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .loading-scrollbar::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 4px;
  }
  .loading-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 255, 0.2);
    border-radius: 4px;
  }
  .loading-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 255, 255, 0.4);
  }
  .loading-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 255, 255, 0.2) transparent;
  }
`

const bootSequence = [
  { delay: 0, text: '> INITIATING SYSTEM BOOT...', type: 'system' },
  { delay: 400, text: '> Loading kernel modules... OK', type: 'success' },
  { delay: 700, text: '> Mounting file systems... OK', type: 'success' },
  { delay: 1000, text: '> Starting network services... OK', type: 'success' },
  { delay: 1400, text: '', type: 'separator' },
  { delay: 1600, text: '> CONNECTING TO PUBLIC SECURITY SECTION 9', type: 'warning' },
  { delay: 2000, text: '> Establishing secure quantum tunnel...', type: 'system' },
  { delay: 2600, text: '> Encrypting data stream... [256-BIT AES]', type: 'system' },
  { delay: 3200, text: '> Connection established... OK', type: 'success' },
  { delay: 3600, text: '', type: 'separator' },
  { delay: 3800, text: '> AUTHENTICATION REQUIRED', type: 'warning' },
  { delay: 4200, text: '> User: KUSANAGI, MOTOKO', type: 'info' },
  { delay: 4500, text: '> Rank: MAJOR', type: 'info' },
  { delay: 4800, text: '> Clearance Level: 9', type: 'info' },
  { delay: 5300, text: '> Scanning biometric data...', type: 'system' },
  { delay: 5900, text: '> Verifying cyberbrain signature...', type: 'system' },
  { delay: 6700, text: '> Ghost authentication... OK', type: 'success' },
  { delay: 7200, text: '', type: 'separator' },
  { delay: 7400, text: '> ACCESS GRANTED', type: 'success' },
  { delay: 7800, text: '> Loading tactical database...', type: 'system' },
  { delay: 8200, text: '> Initializing thermoptic camouflage...', type: 'system' },
  { delay: 9000, text: '> Calibrating combat protocols...', type: 'system' },
  { delay: 9400, text: '> Loading archived operations...', type: 'system' },
  { delay: 9900, text: '> Establishing neural network connection...', type: 'system' },
  { delay: 11500, text: '> Neural link established... OK', type: 'success' },
  { delay: 12000, text: '', type: 'separator' },
  { delay: 12200, text: '> SYSTEM READY', type: 'success' },
  { delay: 12600, text: '> Welcome, Major Kusanagi', type: 'info' },
  { delay: 13000, text: '> Entering network...', type: 'system' },
]

/**
 * Composant LoadingScreen - Écran de chargement avec séquence de boot
 * Affiche une séquence de messages de boot style terminal avec animations
 * Gère le scroll automatique et la progression du chargement
 * 
 * @param onComplete - Callback appelé lorsque le chargement est terminé
 */
export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [displayedLines, setDisplayedLines] = useState<typeof bootSequence>([])
  const [glitchActive, setGlitchActive] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  const [startTime] = useState(() => Date.now()) // Initialisé une seule fois
  const [calculatedProgress, setCalculatedProgress] = useState(0)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<number | undefined>(undefined)
  
  /**
   * Mémoriser la fonction getLineColor pour éviter les recréations
   * Retourne la couleur selon le type de ligne
   */
  const getLineColor = useCallback((type: string): string => {
    switch (type) {
      case 'success': return '#00ff00'
      case 'warning': return '#ffaa00'
      case 'error': return '#ff0000'
      case 'info': return '#00ffff'
      case 'system': return '#88ccff'
      default: return '#ffffff'
    }
  }, [])

  /**
   * Animation glitch aléatoire pour l'effet cyberpunk
   * Se déclenche à intervalles aléatoires
   */
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setGlitchActive(true)
      setTimeout(() => setGlitchActive(false), GLITCH_DURATION)
    }, GLITCH_INTERVAL_MIN + Math.random() * (GLITCH_INTERVAL_MAX - GLITCH_INTERVAL_MIN))

    return () => {
      clearInterval(glitchInterval)
    }
  }, [])

  /**
   * Afficher les lignes de boot et calculer la progression
   * Mise à jour à intervalles réguliers pour une animation fluide
   */
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      
      // Filtrer les lignes à afficher selon le temps écoulé
      const linesToShow = bootSequence.filter(line => line.delay <= elapsed)
      setDisplayedLines(linesToShow)
      
      // Calculer le pourcentage de progression (0-100%)
      const progressPercent = Math.min((elapsed / TOTAL_DURATION) * 100, 100)
      setCalculatedProgress(progressPercent)
    }, UPDATE_INTERVAL)

    return () => clearInterval(interval)
  }, [startTime])

  useEffect(() => {
    // Auto-scroll vers le bas seulement si l'utilisateur ne scrolle pas manuellement
    if (terminalRef.current && !isUserScrolling) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [displayedLines, isUserScrolling])

  /**
   * Gère le scroll manuel de l'utilisateur
   * Désactive l'auto-scroll si l'utilisateur scrolle vers le haut
   * Réactive l'auto-scroll après un timeout si l'utilisateur revient en bas
   */
  const handleScroll = useCallback(() => {
    if (!terminalRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = terminalRef.current
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < SCROLL_THRESHOLD
    
    // Si l'utilisateur scrolle vers le haut, désactiver l'auto-scroll
    if (!isAtBottom) {
      setIsUserScrolling(true)
    } else {
      setIsUserScrolling(false)
    }
    
    // Réactiver l'auto-scroll après un timeout d'inactivité
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    scrollTimeoutRef.current = window.setTimeout(() => {
      setIsUserScrolling(false)
    }, SCROLL_RESET_TIMEOUT)
  }, [])

  /**
   * Animation de sortie quand le chargement est terminé
   * Déclenche le fade out puis appelle le callback onComplete
   */
  useEffect(() => {
    if (calculatedProgress >= 100) {
      const fadeOutTimer = setTimeout(() => {
        setFadeOut(true)
        if (onComplete) {
          setTimeout(() => onComplete(), COMPLETE_CALLBACK_DELAY)
        }
      }, FADE_OUT_DELAY)
      
      return () => clearTimeout(fadeOutTimer)
    }
  }, [calculatedProgress, onComplete])

  /**
   * Mémoriser les valeurs calculées pour les indicateurs de statut
   * Évite les recalculs à chaque render
   */
  const statusIndicators = useMemo(() => {
    const getStatusColor = (threshold1: number, threshold2: number) => {
      if (calculatedProgress < threshold1) return { color: '#ff0000', shadow: 'rgba(255, 0, 0, 0.8)' }
      if (calculatedProgress < threshold2) return { color: '#ffaa00', shadow: 'rgba(255, 170, 0, 0.8)' }
      return { color: '#00ff00', shadow: 'rgba(0, 255, 0, 0.8)' }
    }

    return {
      network: getStatusColor(20, 40),
      security: getStatusColor(35, 55),
      auth: getStatusColor(50, 85),
      cpu: Math.min(40 + Math.round(calculatedProgress * 0.5), 90),
      mem: Math.min(30 + Math.round(calculatedProgress * 0.4), 85),
      latency: Math.max(120 - Math.round(calculatedProgress * 1.1), 10)
    }
  }, [calculatedProgress])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        overflow: 'hidden',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 1s ease-out',
      }}
    >
      {/* Background image */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/images/ui/background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: fadeOut ? 0 : 0.35,
          filter: 'blur(1.5px) brightness(0.5)',
          transition: 'opacity 1s ease-out',
        }}
      />

      {/* Logo Section 9 en haut */}
      <div
        style={{
          position: 'absolute',
          top: 30,
          left: '50%',
          transform: fadeOut ? 'translate(-50%, -20px)' : 'translateX(-50%)',
          opacity: fadeOut ? 0 : 1,
          transition: 'all 1s ease-out',
        }}
      >
        <img 
          src="/images/ui/title.png" 
          alt="Ghost in the Shell"
          draggable={false}
          style={{
            maxWidth: '300px',
            height: 'auto',
            filter: glitchActive ? 'blur(1px) brightness(1.3)' : 'drop-shadow(0 0 20px rgba(0, 255, 255, 0.4))',
            transform: glitchActive ? 'translate(1px, -1px)' : 'none',
            transition: 'filter 0.05s, transform 0.05s',
            opacity: 0.9,
          }}
        />
      </div>

      {/* Tribute text */}
      <div
        style={{
          position: 'absolute',
          top: '8rem',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'monospace',
          fontSize: '0.75rem',
          color: 'rgba(136, 204, 255, 0.5)',
          textAlign: 'center',
          letterSpacing: '0.15em',
        }}
      >
        A TRIBUTE TO GITS:SAC - FIRST ASSAULT ONLINE
      </div>

      {/* Terminal de boot */}
      <div
        style={{
          position: 'relative',
          width: 'min(800px, 90vw)',
          height: 'min(400px, 65vh)',
          background: 'rgba(0, 0, 0, 0.9)',
          border: '2px solid rgba(0, 255, 255, 0.4)',
          borderRadius: '4px',
          padding: '1.5rem',
          fontFamily: 'monospace',
          fontSize: '0.9rem',
          color: '#00ff00',
          overflow: 'hidden',
          boxShadow: '0 0 50px rgba(0, 255, 255, 0.4), inset 0 0 40px rgba(0, 255, 255, 0.05)',
          opacity: fadeOut ? 0 : 1,
          transform: fadeOut ? 'scale(0.95)' : 'scale(1)',
          transition: 'all 1s ease-out',
        }}
      >

        {/* Header du terminal */}
        <div
          style={{
            borderBottom: '1px solid rgba(0, 255, 255, 0.3)',
            paddingBottom: '0.5rem',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{
            color: '#00ffff',
            fontSize: '0.85rem',
            letterSpacing: '0.1em',
          }}>
            PUBLIC SECURITY SECTION 9
          </div>
          <div style={{
            color: 'rgba(0, 255, 255, 0.6)',
            fontSize: '0.7rem',
            letterSpacing: '0.05em',
          }}>
            SECURE TERMINAL v3.7.2
          </div>
        </div>

        {/* Contenu scrollable du terminal */}
        <div
          ref={terminalRef}
          onScroll={handleScroll}
          className="loading-scrollbar"
          style={{
            height: 'calc(100% - 100px)',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {displayedLines.map((line, index) => {
            const lineColor = getLineColor(line.type)
            const hasGlow = line.type === 'success' || line.type === 'warning'
            
            return (
              <div
                key={`${line.delay}-${index}`} // Clé plus stable basée sur le delay
                style={{
                  color: lineColor,
                  marginBottom: line.type === 'separator' ? '0.8rem' : '0.3rem',
                  opacity: line.type === 'separator' ? 0 : 1,
                  textShadow: hasGlow ? `0 0 8px ${lineColor}` : 'none',
                  letterSpacing: '0.05em',
                  animation: 'fadeIn 0.2s ease-in',
                }}
              >
                {line.text}
              </div>
            )
          })}
          
          {/* Curseur clignotant */}
          {displayedLines.length > 0 && displayedLines.length < bootSequence.length && (
            <span
              style={{
                color: '#00ffff',
                animation: 'blink 1s step-end infinite',
              }}
            >
              ▋
            </span>
          )}
        </div>

        {/* Barre de progression en bas du terminal */}
        <div
          style={{
            position: 'absolute',
            bottom: '1.5rem',
            left: '1.5rem',
            right: '1.5rem',
            borderTop: '1px solid rgba(0, 255, 255, 0.2)',
            paddingTop: '1rem',
          }}
        >
          {/* Barre */}
          <div
            style={{
              position: 'relative',
              height: '20px',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(0, 255, 255, 0.4)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${calculatedProgress}%`,
                background: 'linear-gradient(90deg, rgba(0, 255, 0, 0.3), rgba(0, 255, 255, 0.6))',
                boxShadow: '0 0 15px rgba(0, 255, 255, 0.6)',
                transition: 'width 0.3s ease',
              }}
            >
              {/* Animation de balayage */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                  animation: 'sweep 2s linear infinite',
                }}
              />
            </div>
          </div>
          
          {/* Status */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '0.5rem',
              fontSize: '0.75rem',
              color: '#00ffff',
            }}
          >
            <span>[{Math.round(calculatedProgress)}%]</span>
            <span>
              {calculatedProgress < 100 ? 'LOADING...' : 'READY'}
            </span>
          </div>
        </div>
      </div>

      {/* Indicateurs de statut en haut à gauche */}
      <div
        style={{
          position: 'absolute',
          top: 120,
          left: 30,
          fontFamily: 'monospace',
          fontSize: '0.7rem',
          color: 'rgba(0, 255, 255, 0.6)',
          opacity: fadeOut ? 0 : 1,
          transition: 'opacity 1s ease-out',
        }}
      >
        <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ 
            width: 6, 
            height: 6, 
            borderRadius: '50%', 
            background: calculatedProgress < 20 ? '#ff0000' : calculatedProgress < 40 ? '#ffaa00' : '#00ff00', 
            boxShadow: `0 0 8px ${calculatedProgress < 20 ? 'rgba(255, 0, 0, 0.8)' : calculatedProgress < 40 ? 'rgba(255, 170, 0, 0.8)' : 'rgba(0, 255, 0, 0.8)'}`, 
            animation: 'pulse 2s ease-in-out infinite' 
          }} />
          <span>NETWORK</span>
        </div>
        <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ 
            width: 6, 
            height: 6, 
            borderRadius: '50%', 
            background: calculatedProgress < 35 ? '#ff0000' : calculatedProgress < 55 ? '#ffaa00' : '#00ff00', 
            boxShadow: `0 0 8px ${calculatedProgress < 35 ? 'rgba(255, 0, 0, 0.8)' : calculatedProgress < 55 ? 'rgba(255, 170, 0, 0.8)' : 'rgba(0, 255, 0, 0.8)'}`, 
            animation: 'pulse 2s ease-in-out infinite 0.3s' 
          }} />
          <span>SECURITY</span>
        </div>
        <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ 
            width: 6, 
            height: 6, 
            borderRadius: '50%', 
            background: calculatedProgress < 50 ? '#ff0000' : calculatedProgress < 85 ? '#ffaa00' : '#00ff00', 
            boxShadow: `0 0 8px ${calculatedProgress < 50 ? 'rgba(255, 0, 0, 0.8)' : calculatedProgress < 70 ? 'rgba(255, 170, 0, 0.8)' : 'rgba(0, 255, 0, 0.8)'}`, 
            animation: 'pulse 2s ease-in-out infinite 0.6s' 
          }} />
          <span>AUTH</span>
        </div>
      </div>

      {/* Indicateurs techniques en haut à droite */}
      <div
        style={{
          position: 'absolute',
          top: 120,
          right: 30,
          fontFamily: 'monospace',
          fontSize: '0.7rem',
          color: 'rgba(0, 255, 255, 0.6)',
          textAlign: 'right',
          opacity: fadeOut ? 0 : 1,
          transition: 'opacity 1s ease-out',
        }}
      >
        <div style={{ marginBottom: '0.5rem' }}>CPU: {statusIndicators.cpu}%</div>
        <div style={{ marginBottom: '0.5rem' }}>MEM: {statusIndicators.mem}%</div>
        <div style={{ marginBottom: '0.5rem' }}>LATENCY: {statusIndicators.latency}ms</div>
      </div>

      {/* Warning en bas */}
      <div
        style={{
          position: 'absolute',
          bottom: 30,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'monospace',
          fontSize: '0.7rem',
          color: 'rgba(255, 170, 0, 0.6)',
          letterSpacing: '0.1em',
          textAlign: 'center',
          opacity: fadeOut ? 0 : 1,
          transition: 'opacity 1s ease-out',
        }}
      >
        ⚠ CLASSIFIED SYSTEM - AUTHORIZED PERSONNEL ONLY ⚠
        <br />
        <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>
          All activities are monitored and logged
        </span>
      </div>

      {/* Styles d'animation et scrollbar */}
      <style>{`
        ${SCROLLBAR_STYLES}
        
        @keyframes sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-5px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        
        @keyframes pulse-border {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
