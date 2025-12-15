import { useState, useMemo, useCallback, lazy, Suspense, useEffect, useRef } from 'react'
import NetworkGlobe from './NetworkGlobe'
import { useResponsive } from '../hooks/useResponsive'

/**
 * Chargement différé (lazy loading) des modules pour optimiser les performances
 * Chaque module n'est chargé que lorsqu'il est sélectionné par l'utilisateur
 */
const MediaHubModule = lazy(() => import('./modules/MediaHubModule'))
const CharacterModule = lazy(() => import('./modules/CharacterModule'))
const ArmoryModule = lazy(() => import('./modules/ArmoryModule'))
const MusicModule = lazy(() => import('./modules/MusicModule'))
const MapsModule = lazy(() => import('./modules/MapsModule'))
const AboutModule = lazy(() => import('./modules/AboutModule'))

interface Module {
  id: string
  title: string
  subtitle: string
  description: string
  position: { x: number; y: number; z: number }
  color: number
}

// Mapping des couleurs par module
const MODULE_COLORS: Record<string, { color: string; rgba: string; shadow: string }> = {
  media: { color: '#00ff00', rgba: 'rgba(0, 255, 0, 0.5)', shadow: 'rgba(0, 255, 0, 0.6)' },
  music: { color: '#9966ff', rgba: 'rgba(153, 102, 255, 0.5)', shadow: 'rgba(153, 102, 255, 0.6)' },
  maps: { color: '#ff6600', rgba: 'rgba(255, 102, 0, 0.5)', shadow: 'rgba(255, 102, 0, 0.6)' },
  arsenal: { color: '#ff0066', rgba: 'rgba(255, 0, 102, 0.5)', shadow: 'rgba(255, 0, 102, 0.6)' },
  characters: { color: '#ff33cc', rgba: 'rgba(255, 51, 204, 0.5)', shadow: 'rgba(255, 51, 204, 0.6)' },
  about: { color: '#ffff00', rgba: 'rgba(255, 255, 0, 0.5)', shadow: 'rgba(255, 255, 0, 0.6)' },
  default: { color: '#00d4ff', rgba: 'rgba(0, 212, 255, 0.5)', shadow: 'rgba(0, 212, 255, 0.6)' },
}

/**
 * Configuration de base des modules disponibles dans l'application
 * Les positions 3D sont calculées dynamiquement selon le breakpoint (voir getModulePositions)
 */
const baseModules: Omit<Module, 'position'>[] = [
  { 
    id: 'music', 
    title: 'MUSIQUE', 
    subtitle: 'Bande sonore',
    description: 'Écoute la bande sonore du jeu Ghost in the Shell: First Assault',
    color: 0x9966ff
  },
  { 
    id: 'characters', 
    title: 'OPÉRATEURS', 
    subtitle: 'Profil des agents',
    description: 'Consulte les 12 membres jouables de la Section 9 et leurs variantes.',
    color: 0xff33cc
  },
  { 
    id: 'maps', 
    title: 'MAPS', 
    subtitle: 'Cartes & Layouts',
    description: 'Explore les 12 maps du jeu avec leurs layouts et vues',
    color: 0xff6600
  },
  { 
    id: 'arsenal', 
    title: 'ARSENAL', 
    subtitle: 'Armes, Gadgets',
    description: 'Armement futuriste et augmentations cybernétiques',
    color: 0xff0066
  },
  { 
    id: 'media', 
    title: 'TRAILER', 
    subtitle: 'Official Game Trailer',
    description: 'Ghost in the Shell: First Assault - Official Trailer',
    color: 0x00ff00
  },
  { 
    id: 'about', 
    title: 'À PROPOS', 
    subtitle: 'Informations sur le jeu',
    description: 'Découvre l\'histoire, le développement et les détails de First Assault',
    color: 0xffff00
  },
]

/**
 * Calcule les positions 3D des modules dans le globe selon le breakpoint actif
 * 
 * @param isMobile - Indique si l'écran est en mode mobile (< 768px)
 * @param isTablet - Indique si l'écran est en mode tablette (768px - 1024px)
 * @param isSmallMobile - Indique si l'écran est en mode petit mobile (< 650px)
 * @returns Objet contenant les positions {x, y, z} pour chaque module
 * 
 * Les positions sont adaptées pour :
 * - Desktop : disposition 3D complète avec profondeur (z)
 * - Tablet : positions rapprochées, moins de profondeur
 * - Mobile : disposition verticale, tous les modules sur le plan z=0
 * - Tiny Mobile : disposition encore plus compacte et verticale
 */
const getModulePositions = (isMobile: boolean, isTablet: boolean, isSmallMobile: boolean) => {
  // Desktop : disposition 3D optimale avec profondeur
  if (!isMobile && !isTablet) {
    return {
      music: { x: 3, y: 1.5, z: 0 },
      characters: { x: 1.5, y: -1, z: -2.5 },
      maps: { x: -3, y: 1.5, z: 0 },
      arsenal: { x: 0, y: -1.5, z: 3 },
      media: { x: 0, y: -1.5, z: -2.5 },
      about: { x: 1.5, y: 2.5, z: 1.5 },
    }
  }
  
  // Tablet : positions rapprochées, profondeur réduite
  if (isTablet) {
    return {
      music: { x: 2.2, y: 1.2, z: 0 },
      characters: { x: 1.1, y: -0.8, z: -2 },
      maps: { x: -2.2, y: 1.2, z: 0 },
      arsenal: { x: 0, y: -1.2, z: 2.4 },
      media: { x: 0, y: -1.2, z: -2 },
      about: { x: 1.1, y: 2, z: 1.2 },
    }
  }
  
  // Mobile moyen/grand (< 650px) : disposition verticale, plan z=0
  if (isSmallMobile) {
    return {
      music: { x: 0.5, y: 2.2, z: 0 },
      characters: { x: -0.5, y: 1, z: 0 },
      maps: { x: 0.5, y: -0.2, z: 0 },
      arsenal: { x: -0.5, y: -1.4, z: 0 },
      media: { x: 0.5, y: -1.8, z: 0 },
      about: { x: -0.5, y: 1.6, z: 0 },
    }
  }
  
  // Tiny Mobile (< 500px) : disposition ultra-compacte et verticale
  return {
    music: { x: 0.3, y: 1.8, z: 0 },
    characters: { x: -0.3, y: 0.8, z: 0 },
    maps: { x: 0.3, y: -0.2, z: 0 },
    arsenal: { x: -0.3, y: -1.2, z: 0 },
    media: { x: 0.3, y: -1.4, z: 0 },
    about: { x: -0.3, y: 1.3, z: 0 },
  }
}

/**
 * Définitions CSS des animations utilisées dans le Dashboard
 * Toutes les animations sont centralisées ici pour faciliter la maintenance
 */
const ANIMATION_STYLES = `
  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
  
  @keyframes dataUpload {
    from { 
      opacity: 0; 
      transform: scale(0.98);
    }
    to { 
      opacity: 1; 
      transform: scale(1);
    }
  }

  @keyframes slideLeft {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes fadeInMobile {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    to {
      opacity: 0;
      transform: scale(0.9) translateY(20px);
    }
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes textSlideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes glowPulse {
    0%, 100% {
      box-shadow: 0 0 10px rgba(0, 212, 255, 0.3),
                  0 0 20px rgba(0, 212, 255, 0.2),
                  inset 0 0 10px rgba(0, 212, 255, 0.1);
    }
    50% {
      box-shadow: 0 0 15px rgba(0, 212, 255, 0.5),
                  0 0 30px rgba(0, 212, 255, 0.3),
                  inset 0 0 15px rgba(0, 212, 255, 0.15);
    }
  }

  @keyframes scanlines {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 0 100%;
    }
  }
`

/**
 * Récupère la palette de couleurs associée à un module
 * 
 * @param moduleId - Identifiant du module (ex: 'media', 'music', etc.) ou null
 * @returns Objet contenant les couleurs du module ou les couleurs par défaut si le module n'existe pas
 */
const getModuleColor = (moduleId: string | null) => {
  return moduleId ? (MODULE_COLORS[moduleId] || MODULE_COLORS.default) : MODULE_COLORS.default
}

/**
 * Composant principal du Dashboard
 * Gère l'affichage du globe 3D interactif et la navigation entre les différents modules
 */
export default function Dashboard() {
  // État du module actuellement sélectionné (null si aucun)
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  // État du module survolé dans le globe 3D
  const [hoveredModule, setHoveredModule] = useState<string | null>(null)
  // État de l'animation de fermeture en cours
  const [isClosing, setIsClosing] = useState(false)
  // Clé utilisée pour forcer le re-render du titre et déclencher les animations
  const [titleKey, setTitleKey] = useState(0)
  // État du preview de l'arsenal (ouvert/fermé)
  const [armoryPreviewOpen, setArmoryPreviewOpen] = useState(false)
  // Référence vers la fonction de fermeture du preview de l'arsenal
  const armoryClosePreviewRef = useRef<(() => void) | null>(null)
  
  // Hook responsive pour détecter le breakpoint actuel
  const { isMobile, isTablet, isSmallMobile } = useResponsive()
  
  /**
   * Calcule et mémorise les modules avec leurs positions 3D adaptées au breakpoint
   * Recalcul uniquement lorsque les breakpoints changent
   */
  const modules = useMemo<Module[]>(() => {
    const positions = getModulePositions(isMobile, isTablet, isSmallMobile)
    return baseModules.map(base => ({
      ...base,
      position: positions[base.id as keyof typeof positions]
    }))
  }, [isMobile, isTablet, isSmallMobile])

  /**
   * Mémorise la palette de couleurs du module sélectionné
   * Utilisée pour styliser le titre, le bouton close, etc.
   */
  const moduleColors = useMemo(() => getModuleColor(selectedModule), [selectedModule])

  /**
   * Mémorise les données complètes du module sélectionné
   * Permet d'afficher le titre et autres informations du module
   */
  const selectedModuleData = useMemo(
    () => selectedModule ? modules.find(m => m.id === selectedModule) : null,
    [selectedModule, modules]
  )

  /**
   * Gère le clic sur un nœud du globe 3D
   * Ajoute un délai de 300ms pour une transition plus fluide
   * 
   * @param moduleId - Identifiant du module à ouvrir
   */
  const handleNodeClick = useCallback((moduleId: string) => {
    setTimeout(() => {
    setSelectedModule(moduleId)
      setTitleKey(prev => prev + 1) // Force le re-render pour déclencher l'animation
    }, 300)
  }, [])

  /**
   * Gère la fermeture du module actuellement ouvert
   * Gère le cas spécial de l'arsenal avec son preview
   * Déclenche l'animation de fermeture avant de réinitialiser l'état
   */
  const handleCloseModule = useCallback(() => {
    if (selectedModule) {
      // Si c'est l'arsenal et que le preview est ouvert, fermer seulement le preview
      if (selectedModule === 'arsenal' && armoryPreviewOpen && armoryClosePreviewRef.current) {
        armoryClosePreviewRef.current()
        return
      }
      // Sinon, fermer le module avec animation
      setIsClosing(true)
      setTimeout(() => {
    setSelectedModule(null)
        setIsClosing(false)
        setTitleKey(prev => prev + 1) // Force le re-render pour déclencher l'animation
      }, 400) // Durée synchronisée avec l'animation fadeOut
    }
  }, [selectedModule, armoryPreviewOpen])

  /**
   * Écoute la touche Échap pour fermer le module ouvert
   * L'événement est ajouté uniquement lorsqu'un module est sélectionné
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedModule) {
        handleCloseModule()
      }
    }

    if (selectedModule) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedModule, handleCloseModule])

  /**
   * Mémorise le pattern de circuit décoratif
   * Ne change jamais, donc mémorisé une seule fois
   */
  const circuitPattern = useMemo(() => (
    <CircuitPattern />
  ), [])

  /**
   * Styles du conteneur principal mémorisés
   * Couvre toute la viewport avec fond noir
   */
  const containerStyle = useMemo(() => ({
    width: '100vw',
    height: '100vh',
    background: '#000000',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  }), [])

  /**
   * Styles du conteneur de contenu principal mémorisés
   * Layout adaptatif : colonne sur mobile, ligne sur desktop
   */
  const mainContentStyle = useMemo(() => {
    const flexDirection = isMobile ? 'column' : 'row'
    return {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex' as const,
      flexDirection: flexDirection as 'column' | 'row',
      gap: isMobile ? '1rem' : (isTablet ? '1.5rem' : '2rem'),
    }
  }, [isMobile, isTablet])

  return (
    <div style={containerStyle}>
      <BackgroundLayers />
      {circuitPattern}
      
      <div style={mainContentStyle}>
        <NetworkGlobeContainer
          isMobile={isMobile}
          modules={modules}
          selectedModule={selectedModule}
          selectedModuleData={selectedModuleData}
          moduleColors={moduleColors}
          titleKey={titleKey}
          hoveredModule={hoveredModule}
          isClosing={isClosing}
          onNodeHover={setHoveredModule}
          onNodeClick={handleNodeClick}
          onClose={handleCloseModule}
          onArmoryPreviewChange={(isOpen, closePreview) => {
            setArmoryPreviewOpen(isOpen)
            armoryClosePreviewRef.current = closePreview
          }}
        />
      </div>

      <style>{ANIMATION_STYLES}</style>
    </div>
  )
}

/**
 * Composant des couches de fond décoratives
 * Crée l'atmosphère cyberpunk avec :
 * - Gradient radial sombre
 * - Effet de scanlines animé
 * - Ligne holographique horizontale
 */
function BackgroundLayers() {
  return (
    <>
      {/* Gradient radial pour la profondeur */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(0, 26, 51, 0.3) 0%, rgba(0, 0, 0, 0.9) 70%, #000000 100%)',
        }}
      />
      {/* Effet scanlines animé pour l'esthétique cyberpunk */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0, 212, 255, 0.02) 2px, rgba(0, 212, 255, 0.02) 4px)',
          pointerEvents: 'none',
          animation: 'scanlines 20s linear infinite',
        }}
      />
      {/* Ligne holographique horizontale décorative */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          width: '100%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, #00d4ff 20%, transparent 40%, #00d4ff 60%, transparent 80%, #00d4ff, transparent)',
          opacity: 0.2,
        }}
      />
    </>
  )
}

// Composant pour le pattern de circuit
function CircuitPattern() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.15,
        pointerEvents: 'none',
      }}
    >
      {[15, 35, 55, 75, 85].map((top, i) => (
        <div
          key={`h-${i}`}
          style={{
            position: 'absolute',
            top: `${top}%`,
            left: 0,
            right: 0,
            height: '1px',
            background: `linear-gradient(90deg, transparent, #00d4ff ${20 + i * 10}%, transparent ${80 - i * 10}%)`,
            opacity: 0.3,
          }}
        />
      ))}
      {/* Lignes verticales du circuit */}
      {[20, 40, 60, 80].map((left, i) => (
        <div
          key={`v-${i}`}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${left}%`,
            width: '1px',
            background: `linear-gradient(180deg, transparent, #00d4ff ${30 + i * 5}%, transparent ${70 - i * 5}%)`,
            opacity: 0.3,
          }}
        />
      ))}
      {/* Nœuds de connexion animés (points de jonction du circuit) */}
      {[
        { top: '15%', left: '20%' },
        { top: '35%', left: '40%' },
        { top: '55%', left: '60%' },
        { top: '75%', left: '80%' },
        { top: '85%', left: '40%' },
        { top: '35%', left: '60%' },
      ].map((pos, i) => (
        <div
          key={`node-${i}`}
          style={{
            position: 'absolute',
            ...pos,
            width: '4px',
            height: '4px',
            background: '#00d4ff',
            borderRadius: '50%',
            boxShadow: '0 0 10px #00d4ff',
            animation: `pulse ${2 + i * 0.3}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  )
}

/**
 * Conteneur principal du globe réseau 3D
 * Gère l'affichage du globe, du titre, du logo, des boutons et des overlays de modules
 * 
 * @param isMobile - Indique si l'écran est en mode mobile
 * @param modules - Liste des modules avec leurs positions 3D
 * @param selectedModule - ID du module actuellement sélectionné
 * @param selectedModuleData - Données complètes du module sélectionné
 * @param moduleColors - Palette de couleurs du module sélectionné
 * @param titleKey - Clé pour forcer le re-render du titre
 * @param hoveredModule - ID du module survolé dans le globe
 * @param isClosing - État de l'animation de fermeture
 * @param onNodeHover - Callback appelé lors du survol d'un nœud
 * @param onNodeClick - Callback appelé lors du clic sur un nœud
 * @param onClose - Callback appelé pour fermer le module
 * @param onArmoryPreviewChange - Callback pour gérer l'état du preview de l'arsenal
 */
function NetworkGlobeContainer({
  isMobile,
  modules,
  selectedModule,
  selectedModuleData,
  moduleColors,
  titleKey,
  hoveredModule,
  isClosing,
  onNodeHover,
  onNodeClick,
  onClose,
  onArmoryPreviewChange,
}: {
  isMobile: boolean
  modules: Module[]
  selectedModule: string | null
  selectedModuleData: Module | null | undefined
  moduleColors: { color: string; rgba: string; shadow: string }
  titleKey: number
  hoveredModule: string | null
  isClosing: boolean
  onNodeHover: (id: string | null) => void
  onNodeClick: (id: string) => void
  onClose: () => void
  onArmoryPreviewChange: (isOpen: boolean, closePreview: () => void) => void
}) {
  /**
   * Calcule le padding top pour les overlays de modules
   * Prend en compte la hauteur du header (titre + padding)
   */
  const topPadding = useMemo(() => 
    isMobile ? 'calc(0.75rem + 1rem + 0.85rem + 1px)' : 'calc(1rem + 1rem + 0.9rem + 1px)',
    [isMobile]
  )

  return (
          <div style={{ 
            flex: 1,
            height: isMobile ? '60%' : 'auto',
            position: 'relative', 
            animation: 'scaleIn 1s ease-out 0.2s backwards' 
          }}>
            <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, rgba(0, 26, 51, 0.7) 0%, rgba(0, 0, 0, 0.8) 100%)',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 0 40px rgba(0, 212, 255, 0.3), inset 0 0 60px rgba(0, 212, 255, 0.05)',
              animation: 'glowPulse 4s ease-in-out infinite',
            }}
          >
        <TitleSection
          isMobile={isMobile}
          selectedModule={selectedModule}
          selectedModuleData={selectedModuleData}
          moduleColors={moduleColors}
          titleKey={titleKey}
        />

        {!isMobile && <LogoSection />}

        {selectedModule && (
          <CloseButton
            isMobile={isMobile}
            moduleColors={moduleColors}
            isClosing={isClosing}
            titleKey={titleKey}
            onClose={onClose}
          />
        )}

        <NetworkGlobe 
          modules={modules}
          onNodeHover={onNodeHover}
          onNodeClick={onNodeClick}
          hoveredModule={hoveredModule}
        />
        
        {!selectedModule && (
          <ModuleLegend
            isMobile={isMobile}
            modules={modules}
            hoveredModule={hoveredModule}
          />
        )}

        <ModuleOverlays
          selectedModule={selectedModule}
          isClosing={isClosing}
          topPadding={topPadding}
          onClose={onClose}
          onArmoryPreviewChange={onArmoryPreviewChange}
        />
      </div>
    </div>
  )
}

/**
 * Section d'affichage du titre du module ou "GLOBAL NETWORK MAP"
 * Affiche un carré coloré animé et le titre correspondant
 * 
 * @param isMobile - Indique si l'écran est en mode mobile
 * @param selectedModule - ID du module sélectionné (null si aucun)
 * @param selectedModuleData - Données du module sélectionné
 * @param moduleColors - Palette de couleurs du module
 * @param titleKey - Clé pour forcer le re-render et déclencher l'animation
 */
function TitleSection({
  isMobile,
  selectedModule,
  selectedModuleData,
  moduleColors,
  titleKey,
}: {
  isMobile: boolean
  selectedModule: string | null
  selectedModuleData: Module | null | undefined
  moduleColors: { color: string; rgba: string; shadow: string }
  titleKey: number
}) {
  return (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
                fontFamily: 'monospace',
                zIndex: 1001,
                display: 'flex',
                alignItems: 'center',
                justifyContent: isMobile ? 'flex-start' : 'center',
                gap: '0.5rem',
              }}
            >
              {isMobile && (
                <>
                  <img 
                    src="/images/ui/logo.png"
                    alt="Section 9"
                    style={{
                      width: '35px',
                      height: '35px',
                      filter: 'drop-shadow(0 0 15px rgba(0, 212, 255, 0.8))',
                      animation: 'float 4s ease-in-out infinite',
                    }}
                  />
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
              color: '#00d4ff',
                      letterSpacing: '0.15em',
                      textShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
                      fontWeight: 'bold',
                      marginRight: '0.5rem',
                    }}
                  >
                    SECTION 9
                  </div>
                </>
              )}
      <div 
        key={`square-${titleKey}`}
        style={{
                width: '6px',
                height: '6px',
          background: moduleColors.color,
          boxShadow: `0 0 8px ${moduleColors.color}`,
          animation: 'pulse 2s ease-in-out infinite, slideDown 0.8s ease-out',
        }} 
      />
              <span 
                key={titleKey}
                style={{
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
          color: moduleColors.color,
                  letterSpacing: '0.15em',
          textShadow: `0 0 10px ${moduleColors.rgba}`,
          animation: 'slideDown 0.8s ease-out',
                }}
              >
        {selectedModule ? selectedModuleData?.title.toUpperCase() : 'GLOBAL NETWORK MAP'}
              </span>
            </div>
  )
}

/**
 * Composant du logo Section 9 (affiché uniquement sur desktop)
 * Affiche le logo avec animation float et le texte "SECTION 9 - PUBLIC SECURITY BUREAU"
 */
function LogoSection() {
  return (
            <div 
              style={{ 
                position: 'absolute',
                top: '1rem',
                left: '1.5rem',
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                zIndex: 11,
              }}
            >
              <img 
                src="/images/ui/logo.png"
                alt="Section 9"
                style={{
                  width: '50px',
                  height: '50px',
                  filter: 'drop-shadow(0 0 15px rgba(0, 212, 255, 0.8))',
                  animation: 'float 4s ease-in-out infinite',
                }}
              />
              <div>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '1.2rem',
            color: '#00d4ff',
                    letterSpacing: '0.15em',
                    textShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
                    fontWeight: 'bold',
                  }}
                >
                  SECTION 9
                </div>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                      color: 'rgba(0, 212, 255, 0.6)',
                letterSpacing: '0.1em',
                  }}
                >
                  PUBLIC SECURITY BUREAU
                </div>
              </div>
            </div>
  )
}

/**
 * Bouton de fermeture du module actuellement ouvert
 * Style adaptatif selon le module sélectionné (couleurs thématiques)
 * 
 * @param isMobile - Indique si l'écran est en mode mobile
 * @param moduleColors - Palette de couleurs du module pour le style du bouton
 * @param isClosing - État de l'animation de fermeture
 * @param titleKey - Clé pour forcer le re-render
 * @param onClose - Callback appelé lors du clic sur le bouton
 */
function CloseButton({
  isMobile,
  moduleColors,
  isClosing,
  titleKey,
  onClose,
}: {
  isMobile: boolean
  moduleColors: { color: string; rgba: string; shadow: string }
  isClosing: boolean
  titleKey: number
  onClose: () => void
}) {
  return (
            <div 
              style={{ 
                position: 'absolute',
                top: isMobile ? '0.75rem' : '1rem',
                right: isMobile ? '1rem' : '1.5rem',
                display: 'flex', 
                alignItems: 'center', 
                zIndex: 1002,
                pointerEvents: 'auto',
              }}
            >
                <button
                  key={`close-${titleKey}`}
                  onClick={(e) => {
                    e.stopPropagation()
          onClose()
                  }}
                  style={{
                    padding: isMobile ? '0.25rem 0.35rem' : '0.4rem 1.2rem',
                    background: 'rgba(0, 0, 0, 0.5)',
          border: `1px solid ${moduleColors.color}`,
          color: moduleColors.color,
                    fontFamily: 'monospace',
                    fontSize: isMobile ? '1.2rem' : '0.85rem',
                    cursor: 'pointer',
                    letterSpacing: isMobile ? '0' : '0.15em',
                    transition: 'background 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
                    borderRadius: '2px',
                    animation: isClosing ? 'fadeOut 0.3s ease-out forwards' : 'fadeIn 0.5s ease-out 0.3s backwards',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: isMobile ? '32px' : 'auto',
                    minHeight: isMobile ? '32px' : 'auto',
                  }}
                  onMouseEnter={(e) => {
                    if (!isClosing) {
            e.currentTarget.style.background = moduleColors.rgba.replace('0.5', '0.15')
            e.currentTarget.style.boxShadow = `0 0 20px ${moduleColors.shadow}`
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isClosing) {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}
                >
                  {isMobile ? '×' : 'CLOSE [ESC]'}
                </button>
            </div>
  )
}

// Composant pour la légende des modules
function ModuleLegend({
  isMobile,
  modules,
  hoveredModule,
}: {
  isMobile: boolean
  modules: Module[]
  hoveredModule: string | null
}) {
  return (
            <div
              style={{
                position: 'absolute',
                bottom: '1.5rem',
                left: isMobile ? '50%' : '1.5rem',
                transform: isMobile ? 'translateX(-50%)' : 'none',
                  background: 'linear-gradient(135deg, rgba(0, 26, 51, 0.25) 0%, rgba(0, 0, 0, 0.25) 100%)',
        border: '1px solid #00d4ff',
                  borderRadius: '4px',
                padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
                fontFamily: 'monospace',
                fontSize: isMobile ? '0.7rem' : '0.8rem',
                color: '#88ccff',
                  backdropFilter: 'blur(10px)',
                zIndex: 15,
                  animation: isMobile ? 'fadeInMobile 0.8s ease-out 0.6s backwards' : 'slideInLeft 0.8s ease-out 0.6s backwards',
                  boxShadow: '0 0 30px rgba(0, 212, 255, 0.3), inset 0 0 30px rgba(0, 212, 255, 0.05)',
                maxWidth: isMobile ? '90%' : 'auto',
              }}
            >
                <div style={{ 
                  marginBottom: '0.8rem', 
        color: '#00d4ff', 
                  letterSpacing: '0.15em', 
                  fontSize: '0.85rem',
                  textShadow: '0 0 8px rgba(0, 212, 255, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <div style={{
                    width: '4px',
                    height: '4px',
          background: '#00d4ff',
          boxShadow: '0 0 6px #00d4ff',
                  }} />
                MODULES:
              </div>
              <div
                style={{
                  display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
                }}
              >
              {modules.map((module, index) => (
                <div 
                  key={module.id}
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    opacity: hoveredModule === module.id ? 1 : 0.7,
                    transition: 'all 0.3s ease',
                    animation: `fadeIn 0.5s ease-out ${0.8 + index * 0.1}s backwards`,
                    transform: hoveredModule === module.id ? 'translateX(5px)' : 'translateX(0)',
                  }}
                >
                  <div 
                    style={{ 
                      width: '10px', 
                      height: '10px', 
                      borderRadius: '50%',
                      background: `#${module.color.toString(16).padStart(6, '0')}`,
                      boxShadow: `0 0 8px rgba(${(module.color >> 16) & 255}, ${(module.color >> 8) & 255}, ${module.color & 255}, 0.8)`,
                    }} 
                  />
                  <span>{module.title}</span>
                </div>
              ))}
            </div>
            </div>
  )
}

/**
 * Gère l'affichage des overlays de tous les modules
 * Charge dynamiquement le module correspondant au module sélectionné
 * Gère les états de chargement avec Suspense
 * 
 * @param selectedModule - ID du module à afficher (null si aucun)
 * @param isClosing - État de l'animation de fermeture
 * @param topPadding - Padding top calculé pour positionner l'overlay
 * @param onClose - Callback pour fermer le module
 * @param onArmoryPreviewChange - Callback pour gérer l'état du preview de l'arsenal
 */
function ModuleOverlays({
  selectedModule,
  isClosing,
  topPadding,
  onClose,
  onArmoryPreviewChange,
}: {
  selectedModule: string | null
  isClosing: boolean
  topPadding: string
  onClose: () => void
  onArmoryPreviewChange: (isOpen: boolean, closePreview: () => void) => void
}) {
  /**
   * Styles de l'overlay du module mémorisés
   * Animation adaptée selon l'état de fermeture
   */
  const overlayStyle = useMemo(() => {
    const animation = isClosing ? 'fadeOut 0.4s ease-out forwards' : 'fadeIn 0.4s ease-out'
    return {
      position: 'absolute' as const,
      top: topPadding,
                  left: 0,
                  right: 0,
                  bottom: 0,
      animation,
    }
  }, [topPadding, isClosing])

  /**
   * Styles pour l'écran de chargement (fallback de Suspense)
   */
  const loadingStyle = useMemo(() => {
    return {
      ...overlayStyle,
      display: 'flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      color: '#00aaff',
                    fontFamily: 'monospace',
                    fontSize: '1rem',
    }
  }, [overlayStyle])

  if (selectedModule === 'media') {
    return (
      <div style={overlayStyle}>
        <Suspense fallback={<div style={loadingStyle}>Loading module...</div>}>
          <MediaHubModule onClose={onClose} />
                </Suspense>
          </div>
    )
  }

  if (selectedModule === 'characters') {
    return (
      <Suspense fallback={<div style={loadingStyle}>Loading operatives...</div>}>
        <div style={overlayStyle}>
          <CharacterModule onClose={onClose} />
                </div>
              </Suspense>
    )
  }
            
  if (selectedModule === 'arsenal') {
    return (
      <Suspense fallback={<div style={loadingStyle}>Loading armory...</div>}>
        <div style={overlayStyle}>
                  <ArmoryModule 
            onClose={onClose}
            onPreviewStateChange={onArmoryPreviewChange}
                  />
                </div>
              </Suspense>
    )
  }

  if (selectedModule === 'music') {
    return (
      <Suspense fallback={<div style={loadingStyle}>Loading music...</div>}>
        <div style={{ ...overlayStyle, top: 0 }}>
          <MusicModule onClose={onClose} />
                </div>
              </Suspense>
    )
  }

  if (selectedModule === 'maps') {
    return (
      <Suspense fallback={<div style={loadingStyle}>Loading maps...</div>}>
        <div style={{ ...overlayStyle, top: 0 }}>
          <MapsModule onClose={onClose} />
                </div>
              </Suspense>
    )
  }

  if (selectedModule === 'about') {
    return (
      <Suspense fallback={<div style={loadingStyle}>Loading about...</div>}>
        <div style={overlayStyle}>
          <AboutModule onClose={onClose} />
                </div>
              </Suspense>
    )
  }

  return null
}
