import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useResponsive } from '../../hooks/useResponsive'
import { musicData } from '../../data/music'

/**
 * Props du module Music
 */
interface MusicModuleProps {
  onClose?: () => void
}

/**
 * Type définissant les catégories de musique disponibles
 */
type MusicCategory = 'all' | 'ambient' | 'combat' | 'menu' | 'theme'

/**
 * Styles CSS pour la barre de défilement personnalisée
 * Utilise la couleur violette (#9966ff) pour correspondre au thème du module
 */
const SCROLLBAR_STYLES = `
  .armory-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .armory-scrollbar::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 4px;
  }
  .armory-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(153, 102, 255, 0.2);
    border-radius: 4px;
  }
  .armory-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(153, 102, 255, 0.4);
  }
  .armory-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(153, 102, 255, 0.2) transparent;
  }
  
  @keyframes scanlines {
    from { transform: translateY(0); }
    to { transform: translateY(4px); }
  }
`

/**
 * Constantes de configuration du lecteur audio
 */
const VOLUME_STORAGE_KEY = 'music-module-volume' // Clé localStorage pour sauvegarder le volume
const CATEGORIES: MusicCategory[] = ['all', 'theme', 'ambient', 'combat', 'menu'] // Liste des catégories disponibles
const CATEGORY_LABELS: Record<MusicCategory, string> = {
  all: 'Toutes',
  menu: 'Menu/Lobby',
  theme: 'theme',
  ambient: 'ambient',
  combat: 'combat',
}

/**
 * Module Music - Lecteur audio pour la bande sonore du jeu
 * Permet de filtrer les musiques par catégorie et de les lire avec un player personnalisé
 * Gère un player fixe en bas de l'écran avec contrôles complets
 * 
 * @param onClose - Callback optionnel appelé pour fermer le module
 */
export default function MusicModule({ onClose }: MusicModuleProps) {
  const { isMobile, isTablet, isSmallMobile, isTinyMobile } = useResponsive()
  
  // État de la catégorie sélectionnée pour le filtrage
  const [selectedCategory, setSelectedCategory] = useState<MusicCategory>('all')
  // État de la musique actuellement en lecture
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null)
  // État de lecture (play/pause)
  const [isPlaying, setIsPlaying] = useState(false)
  // Temps actuel de la musique en secondes
  const [currentTime, setCurrentTime] = useState(0)
  // Volume (récupéré depuis localStorage ou valeur par défaut 1 = 100%)
  const [volume, setVolume] = useState(() => {
    const savedVolume = localStorage.getItem(VOLUME_STORAGE_KEY)
    return savedVolume ? parseFloat(savedVolume) : 1
  })
  // État du mode muet
  const [isMuted, setIsMuted] = useState(false)
  // États de drag pour les contrôles
  const [isDraggingVolume, setIsDraggingVolume] = useState(false)
  const [isDraggingProgress, setIsDraggingProgress] = useState(false)
  const [wasPlayingBeforeDrag, setWasPlayingBeforeDrag] = useState(false)
  // Durées des musiques (chargées dynamiquement)
  const [durations, setDurations] = useState<Record<string, number>>({})
  // ID de la musique survolée (pour l'effet de highlight)
  const [hoveredMusicId, setHoveredMusicId] = useState<string | null>(null)
  // Référence vers l'élément audio HTML
  const audioRef = useRef<HTMLAudioElement | null>(null)

  /**
   * Filtre les musiques selon la catégorie sélectionnée
   * Retourne toutes les musiques si la catégorie est 'all'
   */
  const filteredMusic = useMemo(() => 
    selectedCategory === 'all' 
      ? musicData 
      : musicData.filter(music => music.category === selectedCategory),
    [selectedCategory]
  )

  /**
   * Calcule le nombre de colonnes de la grille selon le breakpoint
   * Adapte la disposition pour optimiser l'affichage sur tous les écrans
   */
  const gridColumns = useMemo(() => {
    if (isTinyMobile) return 1
    if (isSmallMobile) return 2
    if (isMobile) return 2
    if (isTablet) return 3
    return 4
  }, [isTinyMobile, isSmallMobile, isMobile, isTablet])

  /**
   * Récupère les données complètes de la musique en cours de lecture
   * Utilisé pour afficher le titre dans le player fixe
   */
  const currentMusic = useMemo(
    () => currentPlaying ? musicData.find(m => m.id === currentPlaying) : null,
    [currentPlaying]
  )

  /**
   * Gère la lecture/pause d'une musique
   * Si la même musique est déjà en lecture, bascule play/pause
   * Sinon, arrête la musique précédente et lance la nouvelle
   * Configure les événements audio et met à jour les durées
   * 
   * @param musicId - Identifiant de la musique à lire
   */
  const handlePlay = useCallback((musicId: string) => {
    const music = musicData.find(m => m.id === musicId)
    if (!music) return

    if (currentPlaying === musicId && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      const audio = new Audio(music.file)
      audio.volume = volume
      audio.muted = isMuted
      audioRef.current = audio

      audio.addEventListener('loadedmetadata', () => {
        setCurrentTime(0)
        setDurations(prev => ({ ...prev, [musicId]: audio.duration }))
      })

      audio.addEventListener('timeupdate', () => {
        requestAnimationFrame(() => {
          setCurrentTime(audio.currentTime)
        })
      })

      audio.addEventListener('ended', () => {
        setIsPlaying(false)
        setCurrentTime(audio.duration)
      })

      audio.play()
      setCurrentPlaying(musicId)
      setIsPlaying(true)
    }
  }, [currentPlaying, isPlaying, volume, isMuted])

  /**
   * Arrête complètement la lecture et réinitialise l'état
   * Utilisé lors de la fermeture du module ou de l'appui sur Échap
   */
  const handleStop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    setIsPlaying(false)
    setCurrentPlaying(null)
    setCurrentTime(0)
  }, [])

  /**
   * Met à jour le volume et le sauvegarde dans localStorage
   * Désactive automatiquement le mode muet si le volume est augmenté
   * 
   * @param newVolume - Nouveau niveau de volume (0-1)
   */
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume)
    localStorage.setItem(VOLUME_STORAGE_KEY, newVolume.toString())
    if (audioRef.current) {
      audioRef.current.volume = newVolume
      if (newVolume > 0 && isMuted) {
        setIsMuted(false)
        audioRef.current.muted = false
      }
    }
  }, [isMuted])

  /**
   * Bascule le mode muet de l'audio
   */
  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }, [isMuted])

  /**
   * Gère le début du drag sur la barre de volume
   */
  const handleVolumeMouseDown = useCallback(() => {
    setIsDraggingVolume(true)
  }, [])

  /**
   * Gère le drag de la barre de progression et du volume
   * Écoute les événements mousemove et mouseup au niveau du document
   * Reprend la lecture si elle était active avant le drag de progression
   */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Gérer le drag de la barre de progression
      if (isDraggingProgress && audioRef.current && audioRef.current.duration) {
        const progressBar = document.getElementById('music-progress-bar') || document.getElementById('music-card-progress-bar')
        if (progressBar) {
          const rect = progressBar.getBoundingClientRect()
          const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
          const newTime = percent * audioRef.current.duration
          audioRef.current.currentTime = newTime
          setCurrentTime(newTime)
        }
      }
      
      // Gérer le drag de la barre de volume
      if (isDraggingVolume) {
        const volumeBar = document.getElementById('music-volume-bar')
        if (volumeBar && audioRef.current) {
          const rect = volumeBar.getBoundingClientRect()
          const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
          handleVolumeChange(percent)
        }
      }
    }

    const handleMouseUp = () => {
      // Reprendre la lecture si elle était active avant le drag
      if (isDraggingProgress && wasPlayingBeforeDrag && audioRef.current) {
        audioRef.current.play()
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
  }, [isDraggingProgress, isDraggingVolume, wasPlayingBeforeDrag, handleVolumeChange])

  /**
   * Gère le clic sur la barre de progression pour naviguer dans la musique
   * Calcule la position en pourcentage selon la position du clic
   * 
   * @param e - Événement de clic
   * @param duration - Durée totale de la musique en secondes
   */
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>, duration: number) => {
    if (!audioRef.current || !duration) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    const newTime = percentage * duration
    
    audioRef.current.currentTime = Math.max(0, Math.min(newTime, duration))
    setCurrentTime(audioRef.current.currentTime)
  }, [])

  /**
   * Gère le début du drag sur la barre de progression
   * Met en pause la musique si elle joue pour permettre le drag fluide
   */
  const handleProgressMouseDown = useCallback(() => {
    if (audioRef.current && isPlaying) {
      setWasPlayingBeforeDrag(true)
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      setWasPlayingBeforeDrag(false)
    }
    setIsDraggingProgress(true)
  }, [isPlaying])

  /**
   * Cleanup : arrête la lecture audio lors du démontage du composant
   * Évite les fuites mémoire et les lectures en arrière-plan
   */
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  /**
   * Écoute la touche Échap pour arrêter la lecture et fermer le module
   * L'événement est capturé au niveau de la fenêtre avec capture phase
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        event.preventDefault()
        handleStop()
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [onClose, handleStop])

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
   * Récupère la durée totale formatée d'une musique
   * Utilise la durée chargée dynamiquement si disponible, sinon la durée du fichier
   * 
   * @param musicId - Identifiant de la musique
   * @returns Durée formatée (MM:SS) ou "0:00" si non disponible
   */
  const getTotalDuration = useCallback((musicId: string) => {
    if (durations[musicId]) {
      return formatTime(durations[musicId])
    }
    const music = musicData.find(m => m.id === musicId)
    return music ? music.duration : '0:00'
  }, [durations, formatTime])

  return (
    <>
      <style>{SCROLLBAR_STYLES}</style>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 26, 51, 0.98) 100%)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 0 50px rgba(0, 212, 255, 0.3)',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose?.()
        }}
      >
        <CategoryFilters
          categories={CATEGORIES}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          isMobile={isMobile}
          isTablet={isTablet}
        />

        <MusicGrid
          music={filteredMusic}
          gridColumns={gridColumns}
          currentPlaying={currentPlaying}
          isPlaying={isPlaying}
          hoveredMusicId={hoveredMusicId}
          durations={durations}
          currentTime={currentTime}
          audioRef={audioRef}
          onPlay={handlePlay}
          onHover={setHoveredMusicId}
          onProgressClick={handleProgressClick}
          onProgressMouseDown={handleProgressMouseDown}
          formatTime={formatTime}
          getTotalDuration={getTotalDuration}
          isMobile={isMobile}
          isTablet={isTablet}
        />

        {currentPlaying && (
          <MusicPlayer
            music={currentMusic}
            isPlaying={isPlaying}
            currentTime={currentTime}
            volume={volume}
            isMuted={isMuted}
            audioRef={audioRef}
            onPlay={handlePlay}
            onToggleMute={toggleMute}
            onVolumeChange={handleVolumeChange}
            onVolumeMouseDown={handleVolumeMouseDown}
            onProgressClick={handleProgressClick}
            onProgressMouseDown={handleProgressMouseDown}
            formatTime={formatTime}
            getTotalDuration={getTotalDuration}
            isMobile={isMobile}
            isTablet={isTablet}
          />
        )}
      </div>
    </>
  )
}

/**
 * Composant des filtres de catégories
 * Affiche les boutons de filtrage horizontalement avec style adaptatif
 * 
 * @param categories - Liste des catégories disponibles
 * @param selectedCategory - Catégorie actuellement sélectionnée
 * @param onSelectCategory - Callback appelé lors de la sélection d'une catégorie
 * @param isMobile - Indique si l'écran est en mode mobile
 * @param isTablet - Indique si l'écran est en mode tablette
 */
function CategoryFilters({
  categories,
  selectedCategory,
  onSelectCategory,
  isMobile,
  isTablet,
}: {
  categories: MusicCategory[]
  selectedCategory: MusicCategory
  onSelectCategory: (category: MusicCategory) => void
  isMobile: boolean
  isTablet: boolean
}) {
  return (
    <div
      style={{
        padding: isMobile ? '0.75rem' : isTablet ? '1rem' : '1.25rem',
        paddingTop: isMobile ? 'calc(0.75rem + 1rem + 0.85rem + 1px)' : 'calc(1rem + 1rem + 0.9rem + 1px)',
        borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
        background: 'rgba(0, 0, 0, 0.4)',
        position: 'relative',
        zIndex: 10,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          display: 'flex',
          gap: isMobile ? '0.5rem' : '0.75rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {categories.map((category) => (
          <CategoryButton
            key={category}
            category={category}
            isSelected={selectedCategory === category}
            onSelect={() => onSelectCategory(category)}
            isMobile={isMobile}
            isTablet={isTablet}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Bouton de catégorie individuel
 * Style adaptatif selon l'état sélectionné/non sélectionné
 * 
 * @param category - Identifiant de la catégorie
 * @param isSelected - Indique si cette catégorie est sélectionnée
 * @param onSelect - Callback appelé lors du clic
 * @param isMobile - Indique si l'écran est en mode mobile
 * @param isTablet - Indique si l'écran est en mode tablette
 */
function CategoryButton({
  category,
  isSelected,
  onSelect,
  isMobile,
  isTablet,
}: {
  category: MusicCategory
  isSelected: boolean
  onSelect: () => void
  isMobile: boolean
  isTablet: boolean
}) {
  return (
    <button
      onClick={onSelect}
      style={{
        background: isSelected
          ? 'rgba(153, 102, 255, 0.2)'
          : 'rgba(0, 212, 255, 0.05)',
        border: `1px solid ${
          isSelected
            ? 'rgba(153, 102, 255, 0.6)'
            : 'rgba(0, 212, 255, 0.2)'
        }`,
        color: isSelected
          ? 'rgba(153, 102, 255, 1)'
          : 'rgba(0, 212, 255, 0.6)',
        padding: isMobile ? '0.4rem 0.6rem' : isTablet ? '0.5rem 0.75rem' : '0.6rem 1rem',
        cursor: 'pointer',
        textTransform: 'capitalize',
        fontSize: isMobile ? '0.65rem' : isTablet ? '0.75rem' : '0.85rem',
        fontFamily: 'monospace',
        transition: 'all 0.3s ease',
        boxShadow: isSelected
          ? '0 0 10px rgba(153, 102, 255, 0.3)'
          : 'none',
        borderRadius: '4px',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)'
          e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.4)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'rgba(0, 212, 255, 0.05)'
          e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.2)'
        }
      }}
    >
      {CATEGORY_LABELS[category]}
    </button>
  )
}

/**
 * Grille de cartes de musiques
 * Affiche toutes les musiques filtrées dans une grille responsive
 * Gère l'affichage du message "Aucune musique" si la liste est vide
 * 
 * @param music - Liste des musiques à afficher (filtrées)
 * @param gridColumns - Nombre de colonnes de la grille
 * @param currentPlaying - ID de la musique en cours de lecture
 * @param isPlaying - État de lecture
 * @param hoveredMusicId - ID de la musique survolée
 * @param durations - Durées chargées des musiques
 * @param currentTime - Temps actuel de la musique en lecture
 * @param audioRef - Référence vers l'élément audio
 * @param onPlay - Callback pour lire/pause une musique
 * @param onHover - Callback pour gérer le survol
 * @param onProgressClick - Callback pour naviguer dans la musique
 * @param onProgressMouseDown - Callback pour débuter le drag de progression
 * @param formatTime - Fonction pour formater le temps
 * @param getTotalDuration - Fonction pour obtenir la durée totale
 * @param isMobile - Indique si l'écran est en mode mobile
 * @param isTablet - Indique si l'écran est en mode tablette
 */
function MusicGrid({
  music,
  gridColumns,
  currentPlaying,
  isPlaying,
  hoveredMusicId,
  durations,
  currentTime,
  audioRef,
  onPlay,
  onHover,
  onProgressClick,
  onProgressMouseDown,
  formatTime,
  getTotalDuration,
  isMobile,
  isTablet,
}: {
  music: typeof musicData
  gridColumns: number
  currentPlaying: string | null
  isPlaying: boolean
  hoveredMusicId: string | null
  durations: Record<string, number>
  currentTime: number
  audioRef: React.RefObject<HTMLAudioElement | null>
  onPlay: (id: string) => void
  onHover: (id: string | null) => void
  onProgressClick: (e: React.MouseEvent<HTMLDivElement>, duration: number) => void
  onProgressMouseDown: () => void
  formatTime: (seconds: number) => string
  getTotalDuration: (id: string) => string
  isMobile: boolean
  isTablet: boolean
}) {
  return (
    <div
      style={{
        flex: 1,
        padding: isMobile ? '0.75rem' : isTablet ? '1rem' : '1.25rem',
        paddingRight: isMobile ? 'calc(0.75rem - 8px)' : isTablet ? 'calc(1rem - 8px)' : 'calc(1.25rem - 8px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative',
        zIndex: 10,
        paddingBottom: currentPlaying ? '120px' : isMobile ? '0.75rem' : isTablet ? '1rem' : '1.25rem',
        scrollbarGutter: 'stable',
        minHeight: 0,
      }}
      className="armory-scrollbar"
      onClick={(e) => e.stopPropagation()}
    >
      {music.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            color: 'rgba(0, 212, 255, 0.6)',
            padding: '2rem',
            fontFamily: 'monospace',
            fontSize: isMobile ? '0.85rem' : '1rem',
          }}
        >
          Aucune musique dans cette catégorie
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
            gap: isMobile ? '0.75rem' : isTablet ? '1rem' : '1.25rem',
            alignContent: 'start',
            alignItems: 'start',
          }}
        >
          {music.map((musicItem) => (
            <MusicCard
              key={musicItem.id}
              music={musicItem}
              isPlaying={currentPlaying === musicItem.id && isPlaying}
              isCurrent={currentPlaying === musicItem.id}
              isHovered={hoveredMusicId === musicItem.id}
              duration={durations[musicItem.id]}
              currentTime={currentTime}
              audioRef={audioRef}
              onPlay={onPlay}
              onHover={onHover}
              onProgressClick={onProgressClick}
              onProgressMouseDown={onProgressMouseDown}
              formatTime={formatTime}
              getTotalDuration={getTotalDuration}
              isMobile={isMobile}
              isTablet={isTablet}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Composant pour une carte de musique
function MusicCard({
  music,
  isPlaying,
  isCurrent,
  isHovered,
  duration,
  currentTime,
  audioRef,
  onPlay,
  onHover,
  onProgressClick,
  onProgressMouseDown,
  formatTime,
  getTotalDuration,
  isMobile,
  isTablet,
}: {
  music: typeof musicData[0]
  isPlaying: boolean
  isCurrent: boolean
  isHovered: boolean
  duration?: number
  currentTime: number
  audioRef: React.RefObject<HTMLAudioElement | null>
  onPlay: (id: string) => void
  onHover: (id: string | null) => void
  onProgressClick: (e: React.MouseEvent<HTMLDivElement>, duration: number) => void
  onProgressMouseDown: () => void
  formatTime: (seconds: number) => string
  getTotalDuration: (id: string) => string
  isMobile: boolean
  isTablet: boolean
}) {
  return (
    <div
      onMouseEnter={() => onHover(music.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        background: isCurrent
          ? 'rgba(153, 102, 255, 0.15)'
          : isHovered
          ? 'rgba(0, 212, 255, 0.08)'
          : 'rgba(0, 212, 255, 0.03)',
        border: `1px solid ${
          isCurrent
            ? 'rgba(153, 102, 255, 0.6)'
            : isHovered
            ? 'rgba(0, 212, 255, 0.3)'
            : 'rgba(0, 212, 255, 0.15)'
        }`,
        outline: isCurrent ? '1px solid rgba(153, 102, 255, 0.6)' : 'none',
        outlineOffset: '-1px',
        borderRadius: '4px',
        padding: isMobile ? '0.75rem' : isTablet ? '1rem' : '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '0.5rem' : '0.75rem',
        transition: 'all 0.3s ease',
        position: 'relative',
        boxShadow: isCurrent
          ? '0 0 15px rgba(153, 102, 255, 0.3)'
          : isHovered
          ? '0 0 10px rgba(0, 212, 255, 0.2)'
          : 'none',
        cursor: 'pointer',
        height: isMobile ? '150px' : isTablet ? '170px' : '180px',
        boxSizing: 'border-box',
      }}
      onClick={() => onPlay(music.id)}
    >
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0, 212, 255, 0.06) 2px, rgba(0, 212, 255, 0.06) 4px)',
            pointerEvents: 'none',
            zIndex: 1,
            borderRadius: '4px',
          }}
          className="animate-scanlines"
        />
      )}

      <div style={{ 
        flex: 1, 
        minWidth: 0, 
        position: 'relative', 
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        paddingLeft: isMobile ? 'calc(40px + 0.75rem)' : isTablet ? 'calc(45px + 0.75rem)' : 'calc(50px + 0.75rem)',
      }}>
        <h3
          style={{
            margin: 0,
            fontSize: isMobile ? '0.8rem' : isTablet ? '0.9rem' : '1rem',
            color: isCurrent
              ? 'rgba(153, 102, 255, 1)'
              : 'rgba(0, 212, 255, 1)',
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            textAlign: 'left',
            lineHeight: 1.3,
          }}
        >
          {music.title}
        </h3>
        {music.description && (
          <p
            style={{
              margin: '0.25rem 0 0 0',
              fontSize: isMobile ? '0.6rem' : isTablet ? '0.65rem' : '0.7rem',
              color: 'rgba(0, 212, 255, 0.5)',
              fontFamily: 'monospace',
              textAlign: 'left',
              lineHeight: 1.3,
            }}
          >
            {music.description}
          </p>
        )}
      </div>

      <PlayButton
        musicId={music.id}
        isPlaying={isPlaying}
        isCurrent={isCurrent}
        onPlay={onPlay}
        isMobile={isMobile}
        isTablet={isTablet}
      />

      <MusicProgress
        musicId={music.id}
        isCurrent={isCurrent}
        duration={duration}
        currentTime={currentTime}
        audioRef={audioRef}
        onProgressClick={onProgressClick}
        onProgressMouseDown={onProgressMouseDown}
        formatTime={formatTime}
        getTotalDuration={getTotalDuration}
        isMobile={isMobile}
        isTablet={isTablet}
      />
    </div>
  )
}

/**
 * Bouton play/pause pour une carte de musique
 * Positionné en haut à gauche de la carte
 * Style adaptatif selon l'état de lecture
 * 
 * @param musicId - Identifiant de la musique
 * @param isPlaying - Indique si cette musique est en cours de lecture
 * @param isCurrent - Indique si cette musique est la musique actuelle
 * @param onPlay - Callback pour lire/pause la musique
 * @param isMobile - Indique si l'écran est en mode mobile
 * @param isTablet - Indique si l'écran est en mode tablette
 */
function PlayButton({
  musicId,
  isPlaying,
  isCurrent,
  onPlay,
  isMobile,
  isTablet,
}: {
  musicId: string
  isPlaying: boolean
  isCurrent: boolean
  onPlay: (id: string) => void
  isMobile: boolean
  isTablet: boolean
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onPlay(musicId)
      }}
      style={{
        position: 'absolute',
        top: isMobile ? '0.5rem' : '0.75rem',
        left: isMobile ? '0.5rem' : '0.75rem',
        width: isMobile ? '40px' : isTablet ? '45px' : '50px',
        height: isMobile ? '40px' : isTablet ? '45px' : '50px',
        borderRadius: '50%',
        background: isCurrent && isPlaying
          ? 'rgba(153, 102, 255, 0.3)'
          : 'rgba(0, 212, 255, 0.1)',
        border: `2px solid ${
          isCurrent && isPlaying
            ? 'rgba(153, 102, 255, 0.8)'
            : 'rgba(0, 212, 255, 0.4)'
        }`,
        color: isCurrent && isPlaying
          ? 'rgba(153, 102, 255, 1)'
          : 'rgba(0, 212, 255, 1)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: isMobile ? '1rem' : isTablet ? '1.2rem' : '1.4rem',
        transition: 'all 0.3s ease',
        boxShadow: isCurrent && isPlaying
          ? '0 0 20px rgba(153, 102, 255, 0.6)'
          : 'none',
        zIndex: 3,
      }}
      onMouseEnter={(e) => {
        if (isCurrent && isPlaying) {
          e.currentTarget.style.background = 'rgba(153, 102, 255, 0.4)'
          e.currentTarget.style.boxShadow = '0 0 25px rgba(153, 102, 255, 0.8)'
        } else {
          e.currentTarget.style.background = 'rgba(0, 212, 255, 0.2)'
          e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 212, 255, 0.5)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isCurrent && isPlaying
          ? 'rgba(153, 102, 255, 0.3)'
          : 'rgba(0, 212, 255, 0.1)'
        e.currentTarget.style.boxShadow = isCurrent && isPlaying
          ? '0 0 20px rgba(153, 102, 255, 0.6)'
          : 'none'
      }}
    >
      {isCurrent && isPlaying ? '⏸' : '▶'}
    </button>
  )
}

/**
 * Barre de progression pour une carte de musique
 * S'affiche uniquement si la musique est en cours de lecture
 * Permet de naviguer dans la musique directement depuis la carte
 * 
 * @param musicId - Identifiant de la musique
 * @param isCurrent - Indique si cette musique est la musique actuelle
 * @param duration - Durée chargée de la musique
 * @param currentTime - Temps actuel de la musique
 * @param audioRef - Référence vers l'élément audio
 * @param onProgressClick - Callback pour naviguer dans la musique
 * @param onProgressMouseDown - Callback pour débuter le drag de progression
 * @param formatTime - Fonction pour formater le temps
 * @param getTotalDuration - Fonction pour obtenir la durée totale
 * @param isMobile - Indique si l'écran est en mode mobile
 * @param isTablet - Indique si l'écran est en mode tablette
 */
function MusicProgress({
  musicId,
  isCurrent,
  duration,
  currentTime,
  audioRef,
  onProgressClick,
  onProgressMouseDown,
  formatTime,
  getTotalDuration,
  isMobile,
  isTablet,
}: {
  musicId: string
  isCurrent: boolean
  duration?: number
  currentTime: number
  audioRef: React.RefObject<HTMLAudioElement | null>
  onProgressClick: (e: React.MouseEvent<HTMLDivElement>, duration: number) => void
  onProgressMouseDown: () => void
  formatTime: (seconds: number) => string
  getTotalDuration: (id: string) => string
  isMobile: boolean
  isTablet: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.4rem',
        position: 'relative',
        zIndex: 2,
        marginTop: 'auto',
        minHeight: isCurrent && audioRef.current ? 'calc(0.7rem + 0.4rem + 4px)' : '0.7rem',
      }}
    >
      <div
        style={{
          fontSize: isMobile ? '0.7rem' : isTablet ? '0.75rem' : '0.8rem',
          color: 'rgba(0, 212, 255, 0.8)',
          fontFamily: 'monospace',
        }}
      >
        {isCurrent
          ? `${formatTime(currentTime)} / ${getTotalDuration(musicId)}`
          : duration ? getTotalDuration(musicId) : '--:--'}
      </div>
      <div
        style={{
          width: '100%',
          height: isCurrent && audioRef.current ? '4px' : '0px',
          overflow: 'hidden',
          transition: 'height 0.3s ease',
        }}
      >
        {isCurrent && audioRef.current && audioRef.current.duration && (
          <div
            id="music-card-progress-bar"
            onClick={(e) => {
              e.stopPropagation()
              onProgressClick(e, audioRef.current!.duration)
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
              onProgressMouseDown()
            }}
            onTouchStart={(e) => {
              e.stopPropagation()
              onProgressMouseDown()
            }}
            style={{
              width: '100%',
              height: '4px',
              background: 'rgba(0, 212, 255, 0.1)',
              borderRadius: '2px',
              overflow: 'hidden',
              cursor: 'pointer',
              position: 'relative',
              userSelect: 'none',
            }}
          >
            <div
              style={{
                width: `${(currentTime / audioRef.current.duration) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, rgba(153, 102, 255, 0.8) 0%, rgba(153, 102, 255, 1) 100%)',
                transition: 'width 0.2s ease-out',
                boxShadow: '0 0 10px rgba(153, 102, 255, 0.6)',
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Player fixe en bas de l'écran
 * Affiche les contrôles complets : play/pause, progression, volume
 * Layout adaptatif : colonne sur mobile, ligne sur desktop
 * Visible uniquement lorsqu'une musique est en lecture
 * 
 * @param music - Données de la musique en cours de lecture
 * @param isPlaying - État de lecture
 * @param currentTime - Temps actuel en secondes
 * @param volume - Niveau de volume (0-1)
 * @param isMuted - État du mode muet
 * @param audioRef - Référence vers l'élément audio
 * @param onPlay - Callback pour lire/pause
 * @param onToggleMute - Callback pour basculer le mode muet
 * @param onVolumeChange - Callback pour changer le volume
 * @param onVolumeMouseDown - Callback pour débuter le drag de volume
 * @param onProgressClick - Callback pour naviguer dans la musique
 * @param onProgressMouseDown - Callback pour débuter le drag de progression
 * @param formatTime - Fonction pour formater le temps
 * @param getTotalDuration - Fonction pour obtenir la durée totale
 * @param isMobile - Indique si l'écran est en mode mobile
 * @param isTablet - Indique si l'écran est en mode tablette
 */
function MusicPlayer({
  music,
  isPlaying,
  currentTime,
  volume,
  isMuted,
  audioRef,
  onPlay,
  onToggleMute,
  onVolumeChange,
  onVolumeMouseDown,
  onProgressClick,
  onProgressMouseDown,
  formatTime,
  getTotalDuration,
  isMobile,
  isTablet,
}: {
  music: typeof musicData[0] | null | undefined
  isPlaying: boolean
  currentTime: number
  volume: number
  isMuted: boolean
  audioRef: React.RefObject<HTMLAudioElement | null>
  onPlay: (id: string) => void
  onToggleMute: () => void
  onVolumeChange: (volume: number) => void
  onVolumeMouseDown: () => void
  onProgressClick: (e: React.MouseEvent<HTMLDivElement>, duration: number) => void
  onProgressMouseDown: () => void
  formatTime: (seconds: number) => string
  getTotalDuration: (id: string) => string
  isMobile: boolean
  isTablet: boolean
}) {
  if (!music) return null

  return (
    <div
      style={{
        padding: isMobile ? '0.75rem' : isTablet ? '1rem' : '1.25rem',
        borderTop: '1px solid rgba(0, 212, 255, 0.2)',
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        gap: isMobile ? '0.75rem' : '1rem',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        boxShadow: '0 -5px 30px rgba(0, 0, 0, 0.8)',
      }}
      className="animate-slide-up-player"
      onClick={(e) => e.stopPropagation()}
    >
      {!isMobile && (
        <div
          style={{
            flex: '0 0 200px',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: isTablet ? '0.95rem' : '1.05rem',
              color: 'rgba(153, 102, 255, 1)',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {music.title}
          </h3>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: isMobile ? '0.5rem' : '0.5rem',
          flex: 1,
          justifyContent: 'center',
          width: isMobile ? '100%' : 'auto',
        }}
      >
        {isMobile && (
          <h3
            style={{
              margin: 0,
              fontSize: '0.8rem',
              color: 'rgba(153, 102, 255, 1)',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textAlign: 'center',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {music.title}
          </h3>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (music.id) onPlay(music.id)
          }}
          style={{
            width: isMobile ? '35px' : isTablet ? '38px' : '40px',
            height: isMobile ? '35px' : isTablet ? '38px' : '40px',
            borderRadius: '50%',
            background: isPlaying
              ? 'rgba(153, 102, 255, 0.3)'
              : 'rgba(0, 212, 255, 0.1)',
            border: `2px solid ${
              isPlaying
                ? 'rgba(153, 102, 255, 0.8)'
                : 'rgba(0, 212, 255, 0.4)'
            }`,
            color: isPlaying
              ? 'rgba(153, 102, 255, 1)'
              : 'rgba(0, 212, 255, 1)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '0.9rem' : isTablet ? '1rem' : '1.1rem',
            transition: 'all 0.3s ease',
            fontFamily: 'monospace',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isPlaying
              ? 'rgba(153, 102, 255, 0.5)'
              : 'rgba(0, 212, 255, 0.2)'
            e.currentTarget.style.boxShadow = isPlaying
              ? '0 0 20px rgba(153, 102, 255, 0.8)'
              : '0 0 15px rgba(0, 212, 255, 0.6)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isPlaying
              ? 'rgba(153, 102, 255, 0.3)'
              : 'rgba(0, 212, 255, 0.1)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '0.5rem' : '0.75rem',
            width: isMobile ? '100%' : '33vw',
            maxWidth: '100%',
          }}
        >
          <span
            style={{
              fontSize: isMobile ? '0.7rem' : isTablet ? '0.75rem' : '0.8rem',
              color: 'rgba(0, 212, 255, 0.8)',
              fontFamily: 'monospace',
              minWidth: '45px',
              textAlign: 'right',
            }}
          >
            {formatTime(currentTime)}
          </span>
          <div
            id="music-progress-bar"
            onClick={(e) => {
              if (audioRef.current && audioRef.current.duration) {
                onProgressClick(e, audioRef.current.duration)
              }
            }}
            onMouseDown={onProgressMouseDown}
            onTouchStart={onProgressMouseDown}
            style={{
              flex: 1,
              height: isMobile ? '6px' : isTablet ? '7px' : '8px',
              background: 'rgba(0, 212, 255, 0.1)',
              borderRadius: '4px',
              overflow: 'hidden',
              cursor: 'pointer',
              position: 'relative',
              userSelect: 'none',
            }}
          >
            <div
              style={{
                width: audioRef.current && audioRef.current.duration
                  ? `${(currentTime / audioRef.current.duration) * 100}%`
                  : '0%',
                height: '100%',
                background: 'linear-gradient(90deg, rgba(153, 102, 255, 0.8) 0%, rgba(153, 102, 255, 1) 100%)',
                transition: 'width 0.2s ease-out',
                boxShadow: '0 0 10px rgba(153, 102, 255, 0.6)',
              }}
            />
          </div>
          <span
            style={{
              fontSize: isMobile ? '0.7rem' : isTablet ? '0.75rem' : '0.8rem',
              color: 'rgba(0, 212, 255, 0.8)',
              fontFamily: 'monospace',
              minWidth: '45px',
              textAlign: 'left',
            }}
          >
            {getTotalDuration(music.id)}
          </span>
        </div>
      </div>

      {!isMobile && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flex: '0 0 200px',
            minWidth: '120px',
          }}
        >
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
            }}
          >
            <VolumeIcon isMuted={isMuted} volume={volume} />
          </button>

          <div
            id="music-volume-bar"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
              onVolumeChange(percent)
            }}
            onMouseDown={onVolumeMouseDown}
            onTouchStart={onVolumeMouseDown}
            style={{
              width: '100px',
              height: '6px',
              background: 'rgba(153, 102, 255, 0.2)',
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
                background: 'linear-gradient(90deg, rgba(153, 102, 255, 0.8), rgba(153, 102, 255, 1))',
                borderRadius: '4px',
                boxShadow: '0 0 10px rgba(153, 102, 255, 0.6)',
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
                  background: 'rgba(153, 102, 255, 1)',
                  borderRadius: '50%',
                  boxShadow: '0 0 8px rgba(153, 102, 255, 1)',
                }}
              />
            </div>
          </div>
          
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: 'rgba(153, 102, 255, 0.8)',
              minWidth: '35px',
              textAlign: 'right',
            }}
          >
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}
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
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ fill: 'rgba(153, 102, 255, 1)' }}>
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
        <line x1="2" y1="2" x2="22" y2="22" stroke="rgba(153, 102, 255, 1)" strokeWidth="2" />
      )}
    </svg>
  )
}
