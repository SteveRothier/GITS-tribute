import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useResponsive } from '../../hooks/useResponsive'

/**
 * Props du module MediaHub
 */
interface MediaHubModuleProps {
  onClose?: () => void
}

/**
 * Constantes de configuration du lecteur vidéo
 */
const INITIAL_VOLUME = 0.1 // Volume initial par défaut (10%)
const VOLUME_STORAGE_KEY = 'trailer-module-volume' // Clé localStorage pour sauvegarder le volume
const CONTROLS_HIDE_DELAY = 2000 // Délai avant de cacher les contrôles (ms)
const MOBILE_CONTROLS_HIDE_DELAY = 3000 // Délai spécifique pour mobile (ms)

/**
 * Module MediaHub - Lecteur vidéo pour le trailer officiel du jeu
 * Gère la lecture vidéo avec contrôles personnalisés adaptatifs (desktop/mobile)
 * 
 * @param onClose - Callback optionnel appelé pour fermer le module
 */
export default function MediaHubModule({ onClose }: MediaHubModuleProps = {}) {
  const { isMobile, isTablet } = useResponsive()
  
  // Référence vers l'élément vidéo HTML
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // États de lecture
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  
  // État du volume (récupéré depuis localStorage ou valeur par défaut)
  const [volume, setVolume] = useState(() => {
    const savedVolume = localStorage.getItem(VOLUME_STORAGE_KEY)
    return savedVolume ? parseFloat(savedVolume) : INITIAL_VOLUME
  })
  
  // États des contrôles
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isHoveringInfo, setIsHoveringInfo] = useState(false)
  
  // États de drag pour la barre de progression et le volume
  const [isDraggingProgress, setIsDraggingProgress] = useState(false)
  const [isDraggingVolume, setIsDraggingVolume] = useState(false)
  const [wasPlayingBeforeDrag, setWasPlayingBeforeDrag] = useState(false)

  /**
   * Initialise la vidéo au montage du composant
   * Configure les événements vidéo, restaure le volume sauvegardé et lance l'auto-play
   */
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Restaurer le volume sauvegardé ou utiliser la valeur par défaut
    const savedVolume = localStorage.getItem(VOLUME_STORAGE_KEY)
    const initialVolume = savedVolume ? parseFloat(savedVolume) : INITIAL_VOLUME
    video.volume = initialVolume
    setVolume(initialVolume)

    // Tenter l'auto-play (peut être bloqué par les politiques du navigateur)
    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Auto-play bloqué par les politiques du navigateur (comportement attendu)
        })
    }

    // Handlers pour les événements vidéo
    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleDurationChange = () => {
      if (video.duration && isFinite(video.duration)) {
        setDuration(video.duration)
      }
    }
    const handleEnded = () => setIsPlaying(false)

    if (video.duration && isFinite(video.duration)) {
      setDuration(video.duration)
    }

    const events = [
      ['timeupdate', handleTimeUpdate],
      ['loadedmetadata', handleDurationChange],
      ['durationchange', handleDurationChange],
      ['loadeddata', handleDurationChange],
      ['canplay', handleDurationChange],
      ['ended', handleEnded],
    ] as const

    events.forEach(([event, handler]) => {
      video.addEventListener(event, handler)
    })

    return () => {
      events.forEach(([event, handler]) => {
        video.removeEventListener(event, handler)
      })
    }
  }, [])

  /**
   * Handlers mémorisés pour optimiser les performances
   */
  
  /**
   * Bascule entre lecture et pause
   * Sur mobile, cache les contrôles après un délai si la vidéo joue
   */
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
      if (isMobile) setShowControls(true)
    } else {
      videoRef.current.play()
      setIsPlaying(true)
      if (isMobile) {
        setTimeout(() => setShowControls(false), CONTROLS_HIDE_DELAY)
      }
    }
  }, [isPlaying, isMobile])

  /**
   * Gère le clic sur la barre de progression pour naviguer dans la vidéo
   * Calcule la position en pourcentage selon la position du clic
   */
  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    videoRef.current.currentTime = percent * duration
  }, [duration])

  /**
   * Gère le début du drag sur la barre de progression
   * Met en pause la vidéo si elle joue pour permettre le drag fluide
   */
  const handleProgressMouseDown = useCallback(() => {
    if (videoRef.current && isPlaying) {
      setWasPlayingBeforeDrag(true)
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      setWasPlayingBeforeDrag(false)
    }
    setIsDraggingProgress(true)
  }, [isPlaying])

  /**
   * Gère le début du drag sur la barre de volume
   */
  const handleVolumeMouseDown = useCallback(() => {
    setIsDraggingVolume(true)
  }, [])

  /**
   * Bascule le mode muet de la vidéo
   */
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }, [isMuted])

  /**
   * Met à jour le volume et le sauvegarde dans localStorage
   * Désactive automatiquement le mode muet si le volume est augmenté
   */
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume)
    localStorage.setItem(VOLUME_STORAGE_KEY, newVolume.toString())
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      if (newVolume > 0 && isMuted) {
        setIsMuted(false)
        videoRef.current.muted = false
      }
    }
  }, [isMuted])

  /**
   * Gère le drag de la barre de progression et du volume
   * Écoute les événements mousemove et mouseup au niveau du document
   * Reprend la lecture si elle était active avant le drag
   */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingProgress && videoRef.current && duration) {
        const progressBar = document.getElementById('progress-bar')
        if (progressBar) {
          const rect = progressBar.getBoundingClientRect()
          const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
          videoRef.current.currentTime = percent * duration
        }
      }
      
      if (isDraggingVolume) {
        const volumeBar = document.getElementById('volume-bar')
        if (volumeBar && videoRef.current) {
          const rect = volumeBar.getBoundingClientRect()
          const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
          handleVolumeChange(percent)
        }
      }
    }

    const handleMouseUp = () => {
      if (isDraggingProgress && wasPlayingBeforeDrag && videoRef.current) {
        videoRef.current.play()
        setIsPlaying(true)
      }
      setIsDraggingProgress(false)
      setIsDraggingVolume(false)
      setWasPlayingBeforeDrag(false)
    }

    if (isDraggingProgress || isDraggingVolume) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDraggingProgress, isDraggingVolume, duration, wasPlayingBeforeDrag, handleVolumeChange])

  /**
   * Formate les secondes en format MM:SS
   * 
   * @param seconds - Nombre de secondes à formater
   * @returns Chaîne formatée (ex: "1:23")
   */
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  /**
   * Cache automatiquement les contrôles sur mobile après le démarrage de la lecture
   * Les contrôles restent toujours visibles si la vidéo est en pause
   */
  useEffect(() => {
    if (isMobile && isPlaying) {
      const timer = setTimeout(() => {
        if (isPlaying) setShowControls(false)
      }, CONTROLS_HIDE_DELAY)
      return () => clearTimeout(timer)
    } else if (isMobile && !isPlaying) {
      setShowControls(true)
    }
  }, [isMobile, isPlaying])

  /**
   * Écoute la touche Échap pour fermer le module
   * L'événement est capturé au niveau de la fenêtre avec capture phase
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        event.stopPropagation()
        event.preventDefault()
        onClose()
      }
    }

    if (onClose) {
      window.addEventListener('keydown', handleKeyDown, true)
      return () => window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [onClose])

  /**
   * Styles mémorisés pour optimiser les performances
   */
  
  /**
   * Style du conteneur principal mémorisé
   */
  const containerStyle = useMemo(() => ({
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    padding: isMobile ? '0.5rem' : (isTablet ? '1rem' : '1.5rem'),
    overflow: 'hidden' as const,
  }), [isMobile, isTablet])

  /**
   * Calcule le pourcentage de progression de la vidéo
   * Utilisé pour afficher la barre de progression
   */
  const progressPercent = useMemo(() => 
    duration ? (currentTime / duration) * 100 : 0,
    [currentTime, duration]
  )

  return (
    <div style={containerStyle}>
      <div
        style={{
          width: '100%',
          maxHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            background: 'rgba(0, 30, 15, 0.25)',
            borderRadius: '4px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
          onMouseEnter={() => !isMobile && setShowControls(true)}
          onMouseLeave={() => !isMobile && setShowControls(isPlaying ? false : true)}
          onTouchStart={() => {
            if (isMobile) {
              setShowControls(true)
              if (isPlaying) {
                setTimeout(() => {
                  if (isPlaying) setShowControls(false)
                }, MOBILE_CONTROLS_HIDE_DELAY)
              }
            }
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              flex: 1,
              borderRadius: '4px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onClick={togglePlay}
            >
              <source src="/media/trailer.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {isMobile && (
              <PlayButtonOverlay
                show={showControls && !isHoveringInfo}
                isPlaying={isPlaying}
                onToggle={togglePlay}
              />
            )}

            {!isMobile && (
              <DesktopControls
                show={showControls && !isHoveringInfo}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                progressPercent={progressPercent}
                volume={volume}
                isMuted={isMuted}
                onTogglePlay={togglePlay}
                onSeek={handleSeek}
                onProgressMouseDown={handleProgressMouseDown}
                onToggleMute={toggleMute}
                onVolumeChange={handleVolumeChange}
                onVolumeMouseDown={handleVolumeMouseDown}
                formatTime={formatTime}
              />
            )}

            {isMobile && (
              <MobileControls
                show={showControls && !isHoveringInfo}
                currentTime={currentTime}
                duration={duration}
                progressPercent={progressPercent}
                onSeek={handleSeek}
                onProgressMouseDown={handleProgressMouseDown}
                formatTime={formatTime}
              />
            )}
          </div>
          
          <VideoInfo
            isPlaying={isPlaying}
            onMouseEnter={() => setIsHoveringInfo(true)}
            onMouseLeave={() => setIsHoveringInfo(false)}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Overlay du bouton play/pause centré (affiché uniquement sur mobile)
 * S'affiche au centre de la vidéo lorsque les contrôles sont visibles
 * 
 * @param show - Indique si le bouton doit être visible
 * @param isPlaying - État de lecture de la vidéo
 * @param onToggle - Callback appelé lors du clic sur le bouton
 */
function PlayButtonOverlay({
  show,
  isPlaying,
  onToggle,
}: {
  show: boolean
  isPlaying: boolean
  onToggle: () => void
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: show ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: show ? 'auto' : 'none',
        zIndex: 10,
      }}
    >
      <button
        onClick={onToggle}
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          border: '2px solid #00ff00',
          color: '#00ff00',
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          transition: 'all 0.3s ease',
          boxShadow: '0 0 20px rgba(0, 255, 0, 0.8)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 255, 0, 0.2)'
          e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 255, 0, 1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)'
          e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.8)'
        }}
      >
        {isPlaying ? '❚❚' : '▶'}
      </button>
    </div>
  )
}

/**
 * Contrôles complets pour desktop
 * Affiche la barre de progression, le bouton play/pause, le temps et les contrôles de volume
 * Positionnés en bas de la vidéo avec un gradient de fond
 * 
 * @param show - Indique si les contrôles doivent être visibles
 * @param isPlaying - État de lecture de la vidéo
 * @param currentTime - Temps actuel de la vidéo en secondes
 * @param duration - Durée totale de la vidéo en secondes
 * @param progressPercent - Pourcentage de progression (0-100)
 * @param volume - Niveau de volume (0-1)
 * @param isMuted - État du mode muet
 * @param onTogglePlay - Callback pour basculer play/pause
 * @param onSeek - Callback pour naviguer dans la vidéo
 * @param onProgressMouseDown - Callback pour débuter le drag de progression
 * @param onToggleMute - Callback pour basculer le mode muet
 * @param onVolumeChange - Callback pour changer le volume
 * @param onVolumeMouseDown - Callback pour débuter le drag de volume
 * @param formatTime - Fonction pour formater le temps
 */
function DesktopControls({
  show,
  isPlaying,
  currentTime,
  duration,
  progressPercent,
  volume,
  isMuted,
  onTogglePlay,
  onSeek,
  onProgressMouseDown,
  onToggleMute,
  onVolumeChange,
  onVolumeMouseDown,
  formatTime,
}: {
  show: boolean
  isPlaying: boolean
  currentTime: number
  duration: number
  progressPercent: number
  volume: number
  isMuted: boolean
  onTogglePlay: () => void
  onSeek: (e: React.MouseEvent<HTMLDivElement>) => void
  onProgressMouseDown: () => void
  onToggleMute: () => void
  onVolumeChange: (volume: number) => void
  onVolumeMouseDown: () => void
  formatTime: (seconds: number) => string
}) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.9) 0%, transparent 100%)',
        padding: '1rem',
        opacity: show ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: show ? 'auto' : 'none',
      }}
    >
      <ProgressBar
        id="progress-bar"
        progressPercent={progressPercent}
        onSeek={onSeek}
        onMouseDown={onProgressMouseDown}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: '1rem',
          width: '100%',
        }}
      >
        <button
          onClick={onTogglePlay}
          style={{
            background: 'rgba(0, 255, 0, 0.1)',
            border: '1px solid #00ff00',
            color: '#00ff00',
            width: '40px',
            height: '40px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            transition: 'all 0.3s ease',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 255, 0, 0.2)'
            e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.6)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 255, 0, 0.1)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>

        <span
          style={{
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            color: '#00ff00',
            minWidth: '100px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <VolumeControls
          volume={volume}
          isMuted={isMuted}
          onToggleMute={onToggleMute}
          onVolumeChange={onVolumeChange}
          onVolumeMouseDown={onVolumeMouseDown}
        />
      </div>
    </div>
  )
}

/**
 * Contrôles simplifiés pour mobile
 * Affiche uniquement le temps et la barre de progression en bas de la vidéo
 * Le bouton play est géré séparément par PlayButtonOverlay
 * 
 * @param show - Indique si les contrôles doivent être visibles
 * @param currentTime - Temps actuel de la vidéo en secondes
 * @param duration - Durée totale de la vidéo en secondes
 * @param progressPercent - Pourcentage de progression (0-100)
 * @param onSeek - Callback pour naviguer dans la vidéo
 * @param onProgressMouseDown - Callback pour débuter le drag de progression
 * @param formatTime - Fonction pour formater le temps
 */
function MobileControls({
  show,
  currentTime,
  duration,
  progressPercent,
  onSeek,
  onProgressMouseDown,
  formatTime,
}: {
  show: boolean
  currentTime: number
  duration: number
  progressPercent: number
  onSeek: (e: React.MouseEvent<HTMLDivElement>) => void
  onProgressMouseDown: () => void
  formatTime: (seconds: number) => string
}) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '0.5rem',
        opacity: show ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: show ? 'auto' : 'none',
      }}
    >
      <div style={{ marginBottom: '0.5rem' }}>
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            color: '#00ff00',
            whiteSpace: 'nowrap',
          }}
        >
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
      <ProgressBar
        id="progress-bar"
        progressPercent={progressPercent}
        onSeek={onSeek}
        onMouseDown={onProgressMouseDown}
        height="8px"
      />
    </div>
  )
}

/**
 * Barre de progression interactive pour la vidéo
 * Permet de cliquer ou de drag pour naviguer dans la vidéo
 * 
 * @param id - Identifiant unique de la barre (pour le drag)
 * @param progressPercent - Pourcentage de progression (0-100)
 * @param onSeek - Callback appelé lors du clic sur la barre
 * @param onMouseDown - Callback appelé au début du drag
 * @param height - Hauteur de la barre (par défaut '6px')
 */
function ProgressBar({
  id,
  progressPercent,
  onSeek,
  onMouseDown,
  height = '6px',
}: {
  id: string
  progressPercent: number
  onSeek: (e: React.MouseEvent<HTMLDivElement>) => void
  onMouseDown: () => void
  height?: string
}) {
  return (
    <div
      id={id}
      onClick={onSeek}
      onMouseDown={onMouseDown}
      onTouchStart={onMouseDown}
      style={{
        width: '100%',
        height,
        background: 'rgba(0, 255, 0, 0.2)',
        borderRadius: '4px',
        cursor: 'pointer',
        marginBottom: id === 'progress-bar' && height === '6px' ? '1rem' : 0,
        position: 'relative',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: `${progressPercent}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #00ff00, #00ff88)',
          borderRadius: '4px',
          boxShadow: '0 0 10px rgba(0, 255, 0, 0.8)',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: '-6px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '12px',
            height: '12px',
            background: '#00ff00',
            borderRadius: '50%',
            boxShadow: '0 0 10px rgba(0, 255, 0, 1)',
          }}
        />
      </div>
    </div>
  )
}

/**
 * Contrôles de volume avec icône et barre interactive
 * Affiche l'icône de volume (adaptée selon le niveau), la barre de volume et le pourcentage
 * 
 * @param volume - Niveau de volume (0-1)
 * @param isMuted - État du mode muet
 * @param onToggleMute - Callback pour basculer le mode muet
 * @param onVolumeChange - Callback pour changer le volume
 * @param onVolumeMouseDown - Callback pour débuter le drag de volume
 */
function VolumeControls({
  volume,
  isMuted,
  onToggleMute,
  onVolumeChange,
  onVolumeMouseDown,
}: {
  volume: number
  isMuted: boolean
  onToggleMute: () => void
  onVolumeChange: (volume: number) => void
  onVolumeMouseDown: () => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
      <button
        onClick={onToggleMute}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          width: '24px',
          height: '24px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <VolumeIcon isMuted={isMuted} volume={volume} />
      </button>

      <div
        id="volume-bar"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
          onVolumeChange(percent)
        }}
        onMouseDown={onVolumeMouseDown}
        style={{
          width: '100px',
          height: '6px',
          background: 'rgba(0, 255, 0, 0.2)',
          borderRadius: '4px',
          cursor: 'pointer',
          position: 'relative',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: `${volume * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #00ff00, #00ff88)',
            borderRadius: '4px',
            boxShadow: '0 0 10px rgba(0, 255, 0, 0.6)',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: '-4px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '8px',
              height: '8px',
              background: '#00ff00',
              borderRadius: '50%',
              boxShadow: '0 0 8px rgba(0, 255, 0, 1)',
            }}
          />
        </div>
      </div>
      
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '0.75rem',
          color: '#00ff00',
          minWidth: '35px',
          flexShrink: 0,
        }}
      >
        {Math.round(volume * 100)}%
      </span>
    </div>
  )
}

/**
 * Icône SVG du volume qui s'adapte selon le niveau et l'état muet
 * Affiche différents niveaux d'ondes selon le volume (faible, moyen, fort)
 * Affiche une ligne barrée si muet ou volume à 0
 * 
 * @param isMuted - Indique si le volume est muet
 * @param volume - Niveau de volume (0-1)
 */
function VolumeIcon({ isMuted, volume }: { isMuted: boolean; volume: number }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ fill: '#00ff00' }}>
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
      {!isMuted && volume > 0 && volume < 0.5 && (
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" opacity="0.5" />
      )}
      {!isMuted && volume >= 0.5 && (
        <>
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
          <path d="M19 12c0-2.89-1.62-5.39-4-6.65v2.1c1.42.92 2.5 2.52 2.5 4.55s-1.08 3.63-2.5 4.55v2.1c2.38-1.26 4-3.76 4-6.65z" opacity="0.7" />
        </>
      )}
      {(isMuted || volume === 0) && (
        <line x1="2" y1="2" x2="22" y2="22" stroke="#00ff00" strokeWidth="2" />
      )}
    </svg>
  )
}

/**
 * Panneau d'informations techniques sur la vidéo
 * Affiche le format, le statut de lecture et la source
 * Effet scanlines pour l'esthétique cyberpunk
 * 
 * @param isPlaying - État de lecture de la vidéo
 * @param onMouseEnter - Callback appelé au survol (pour empêcher le masquage des contrôles)
 * @param onMouseLeave - Callback appelé à la fin du survol
 */
function VideoInfo({
  isPlaying,
  onMouseEnter,
  onMouseLeave,
}: {
  isPlaying: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
}) {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        marginTop: '0.5rem',
        padding: '0.8rem',
        background: 'rgba(0, 30, 15, 0.2)',
        border: '1px solid rgba(0, 255, 0, 0.5)',
        borderRadius: '4px',
        boxShadow: '0 0 30px rgba(0, 255, 0, 0.4), inset 0 0 20px rgba(0, 255, 0, 0.1)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0, 255, 0, 0.05) 2px, rgba(0, 255, 0, 0.05) 4px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          color: 'rgba(136, 255, 136, 0.9)',
          lineHeight: '1.6',
          position: 'relative',
        }}
      >
        <p style={{ margin: '0 0 0.5rem 0' }}>
          <span style={{ color: '#00ff00', textShadow: '0 0 5px rgba(0, 255, 0, 0.8)' }}>FORMAT:</span> MP4 • 1920x1080 • 60fps
        </p>
        <p style={{ margin: '0 0 0.5rem 0' }}>
          <span style={{ color: '#00ff00', textShadow: '0 0 5px rgba(0, 255, 0, 0.8)' }}>STATUS:</span> {isPlaying ? 'PLAYING' : 'PAUSED'}
        </p>
        <p style={{ margin: 0 }}>
          <span style={{ color: '#00ff00', textShadow: '0 0 5px rgba(0, 255, 0, 0.8)' }}>SOURCE:</span> Official Game Trailer
        </p>
      </div>
    </div>
  )
}
