import { useState, useEffect, useMemo, useCallback } from 'react'
import { useResponsive } from '../../hooks/useResponsive'
import { mapsData } from '../../data/maps'

/**
 * Props du module Maps
 */
interface MapsModuleProps {
  onClose?: () => void
}

/**
 * Styles CSS pour la barre de défilement personnalisée
 * Utilise la couleur orange (#ff6600) pour correspondre au thème du module
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
    background: rgba(255, 102, 0, 0.2);
    border-radius: 4px;
  }
  .armory-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 102, 0, 0.4);
  }
  .armory-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 102, 0, 0.2) transparent;
  }
  
  @keyframes scanlines {
    from { transform: translateY(0); }
    to { transform: translateY(4px); }
  }
`

/**
 * Module Maps - Affichage des cartes du jeu avec leurs layouts
 * Permet de sélectionner une carte pour voir ses détails (vue visuelle et layout)
 * Utilise un système de grille responsive avec expansion de la carte sélectionnée
 * 
 * @param onClose - Callback optionnel appelé pour fermer le module
 */
export default function MapsModule({ onClose }: MapsModuleProps) {
  const { isMobile, isTablet, isSmallMobile, isTinyMobile } = useResponsive()
  
  // État de la carte actuellement sélectionnée
  const [selectedMap, setSelectedMap] = useState<string | null>(null)
  // État de la carte survolée (pour l'effet de highlight)
  const [hoveredMapId, setHoveredMapId] = useState<string | null>(null)

  /**
   * Calcule le nombre de colonnes de la grille selon le breakpoint
   * Adapte la disposition pour optimiser l'affichage sur tous les écrans
   */
  const gridColumns = useMemo(() => {
    if (isTinyMobile) return 1
    if (isSmallMobile) return 2
    if (isMobile) return 2
    if (isTablet) return 3
    return 5
  }, [isTinyMobile, isSmallMobile, isMobile, isTablet])

  /**
   * Calcule l'index de la carte sélectionnée dans le tableau mapsData
   * Retourne -1 si aucune carte n'est sélectionnée
   */
  const selectedIndex = useMemo(
    () => selectedMap ? mapsData.findIndex(m => m.id === selectedMap) : -1,
    [selectedMap]
  )

  /**
   * Calcule les positions et dimensions de la carte sélectionnée dans la grille
   * Gère l'expansion de la carte sélectionnée pour afficher ses détails
   * Prend en compte les cas limites (bords de la grille, petits écrans)
   * 
   * @returns Objet contenant les positions de grille calculées ou null si aucune carte sélectionnée
   */
  const selectedMapPosition = useMemo(() => {
    if (selectedIndex === -1) return null

    // Calculer la position de la carte dans la grille
    const selectedRow = Math.floor(selectedIndex / gridColumns)
    const selectedCol = selectedIndex % gridColumns
    // Nombre de lignes que la carte sélectionnée occupera (plus sur mobile)
    const expandedRowSpan = isMobile ? 3 : 2
    // Vérifier si la carte est sur le bord droit de la grille
    const isAtRightEdge = selectedCol === gridColumns - 1
    // Permettre l'extension vers la gauche si on est au bord droit et qu'il y a assez d'espace
    const canExtendLeft = isAtRightEdge && selectedCol >= 2

    const gridColStart = canExtendLeft
      ? selectedCol - 1
      : Math.max(1, Math.min(selectedCol + 1, gridColumns - 2))

    const gridRowStart = isTinyMobile && selectedRow >= expandedRowSpan - 1
      ? Math.max(1, selectedRow - expandedRowSpan + 2)
      : selectedRow > 0
      ? selectedRow
      : selectedRow + 1

    const extensionColStart = canExtendLeft ? selectedCol - 2 : selectedCol
    const extensionRowStart = isTinyMobile && selectedRow >= expandedRowSpan - 1
      ? Math.max(0, selectedRow - expandedRowSpan + 1)
      : selectedRow > 0 ? selectedRow - 1 : selectedRow

    return {
      selectedRow,
      selectedCol,
      expandedRowSpan,
      gridColStart,
      gridRowStart,
      extensionColStart,
      extensionRowStart,
      extensionColEnd: extensionColStart + 3,
      extensionRowEnd: extensionRowStart + expandedRowSpan,
    }
  }, [selectedIndex, gridColumns, isMobile, isTinyMobile])

  /**
   * Écoute la touche Échap pour fermer le module
   * L'événement est capturé au niveau de la fenêtre avec capture phase
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        event.preventDefault()
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [onClose])

  /**
   * Handlers mémorisés pour optimiser les performances
   */
  
  /**
   * Gère le clic sur une carte
   * Si la carte est déjà sélectionnée, la désélectionne (ferme les détails)
   * Sinon, sélectionne la carte (affiche les détails)
   * 
   * @param mapId - Identifiant de la carte cliquée
   */
  const handleMapClick = useCallback((mapId: string) => {
    setSelectedMap(prev => prev === mapId ? null : mapId)
  }, [])

  /**
   * Gère le survol d'une carte (uniquement si aucune carte n'est sélectionnée)
   * Permet d'afficher un effet de highlight au survol
   * 
   * @param mapId - Identifiant de la carte survolée
   */
  const handleMouseEnter = useCallback((mapId: string) => {
    if (!selectedMap) setHoveredMapId(mapId)
  }, [selectedMap])

  /**
   * Réinitialise l'état de survol quand la souris quitte une carte
   */
  const handleMouseLeave = useCallback(() => {
    setHoveredMapId(null)
  }, [])

  /**
   * Détermine si une carte doit être masquée car elle est couverte par la carte sélectionnée
   * La carte sélectionnée s'étend sur plusieurs cellules de grille, masquant les cartes en dessous
   * 
   * @param row - Ligne de la carte dans la grille
   * @param col - Colonne de la carte dans la grille
   * @returns true si la carte doit être masquée, false sinon
   */
  const shouldHideCard = useCallback((row: number, col: number) => {
    if (selectedIndex === -1 || !selectedMapPosition) return false

    const { extensionRowStart, extensionRowEnd, extensionColStart, extensionColEnd } = selectedMapPosition
    return (
      row >= extensionRowStart &&
      row < extensionRowEnd &&
      col >= extensionColStart &&
      col < extensionColEnd &&
      col >= 0 &&
      col < gridColumns
    )
  }, [selectedIndex, selectedMapPosition, gridColumns])

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
        <div
          style={{
            flex: 1,
            padding: 0,
            paddingTop: isMobile ? 'calc(1rem + 0.85rem + 1px + 1rem)' : isTablet ? 'calc(1rem + 0.9rem + 1px + 1.5rem)' : 'calc(1rem + 0.9rem + 1px + 2rem)',
            paddingBottom: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            position: 'relative',
            zIndex: 10,
            minHeight: 0,
          }}
          className="armory-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
              gridAutoRows: 'minmax(0, 1fr)',
              gap: 0,
              alignContent: 'start',
              alignItems: 'stretch',
              height: '100%',
              width: '100%',
              margin: 0,
            }}
          >
            {mapsData.map((map, index) => {
              // Récupérer les images visuelle et layout de la carte
              const visualImage = map.images.find(img => img.type === 'visual')
              const layoutImage = map.images.find(img => img.type === 'layout')
              // Vérifier si cette carte est sélectionnée
              const isSelected = selectedMap === map.id
              // Calculer la position de la carte dans la grille
              const row = Math.floor(index / gridColumns)
              const col = index % gridColumns
              // Déterminer si cette carte doit être masquée (couverte par la carte sélectionnée)
              const shouldHide = isSelected ? false : shouldHideCard(row, col)

              const cardStyle = {
                display: shouldHide ? 'none' : 'flex',
                flexDirection: 'column' as const,
                background: isSelected
                  ? 'transparent'
                  : hoveredMapId === map.id
                  ? 'rgba(255, 102, 0, 0.08)'
                  : 'rgba(0, 212, 255, 0.03)',
                border: `2px solid ${
                  isSelected
                    ? 'rgba(255, 102, 0, 0.6)'
                    : hoveredMapId === map.id
                    ? 'rgb(255, 102, 0)'
                    : 'rgba(0, 213, 255, 0)'
                }`,
                outline: isSelected ? '2px solid rgba(255, 102, 0, 0.6)' : 'none',
                outlineOffset: isSelected ? '-2px' : '0',
                borderRadius: 0,
                padding: 0,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative' as const,
                boxShadow: isSelected
                  ? '0 0 20px rgba(255, 102, 0, 0.4)'
                  : hoveredMapId === map.id
                  ? '0 0 10px rgba(255, 102, 0, 0.2)'
                  : 'none',
                overflow: 'hidden' as const,
                height: isSelected ? 'auto' : '100%',
                minHeight: isSelected ? '0' : 'auto',
                gridColumn: isSelected && selectedMapPosition
                  ? `${selectedMapPosition.gridColStart} / span 3`
                  : `${col + 1} / span 1`,
                gridRow: isSelected && selectedMapPosition
                  ? `${selectedMapPosition.gridRowStart} / span ${selectedMapPosition.expandedRowSpan}`
                  : `${row + 1} / span 1`,
                alignSelf: 'stretch' as const,
                boxSizing: 'border-box' as const,
                zIndex: isSelected ? 100 : 'auto',
              }

              return (
                <div
                  key={map.id}
                  onMouseEnter={() => handleMouseEnter(map.id)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleMapClick(map.id)}
                  style={cardStyle}
                  className={isSelected ? 'armory-scrollbar' : ''}
                >
                  {isSelected ? (
                    <ExpandedMapView
                      map={map}
                      visualImage={visualImage}
                      layoutImage={layoutImage}
                      isMobile={isMobile}
                      isTablet={isTablet}
                    />
                  ) : (
                    <CompactMapView
                      map={map}
                      visualImage={visualImage}
                      isMobile={isMobile}
                      isTablet={isTablet}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * Vue étendue d'une carte sélectionnée
 * Affiche les détails complets : image visuelle, layout, nom et description
 * Layout responsive avec disposition verticale sur mobile
 * 
 * @param map - Données de la carte à afficher
 * @param visualImage - Image visuelle de la carte
 * @param layoutImage - Image du layout de la carte
 * @param isMobile - Indique si l'écran est en mode mobile
 * @param isTablet - Indique si l'écran est en mode tablette
 */
function ExpandedMapView({
  map,
  visualImage,
  layoutImage,
  isMobile,
  isTablet,
}: {
  map: typeof mapsData[0]
  visualImage?: { src: string; alt: string }
  layoutImage?: { src: string; alt: string }
  isMobile: boolean
  isTablet: boolean
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {layoutImage && (
        <div
          style={{
            position: 'absolute',
            top: isMobile ? '50%' : '0.5rem',
            left: isMobile ? '0.25rem' : '0.5rem',
            transform: isMobile ? 'translateY(-50%)' : 'none',
            width: isMobile ? '300px' : isTablet ? '400px' : '500px',
            maxWidth: '35%',
            zIndex: 10,
            overflow: 'visible',
          }}
        >
          <img
            src={layoutImage.src}
            alt={layoutImage.alt}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              objectFit: 'contain',
              objectPosition: 'top left',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      )}

      {visualImage && (
        <img
          src={visualImage.src}
          alt={visualImage.alt}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          bottom: isMobile ? '0.75rem' : isTablet ? '1rem' : '1.25rem',
          left: isMobile ? 'auto' : isTablet ? '1rem' : '1.25rem',
          right: isMobile ? '0.75rem' : 'auto',
          zIndex: 10,
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.25) 100%)',
          padding: isMobile ? '0.75rem' : isTablet ? '1rem' : '1.25rem',
          maxWidth: isMobile ? '300px' : isTablet ? '400px' : '500px',
        }}
      >
        <h3
          style={{
            margin: 0,
            marginBottom: isMobile ? '0.5rem' : '0.75rem',
            fontSize: isMobile ? '0.9rem' : isTablet ? '1rem' : '1.2rem',
            color: 'rgba(255, 102, 0, 1)',
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            textShadow: '0 0 10px rgba(255, 102, 0, 0.5)',
          }}
        >
          {map.name}
        </h3>
        <p
          style={{
            margin: 0,
            marginBottom: map.gameModes?.length ? (isMobile ? '0.5rem' : '0.75rem') : '0',
            fontSize: isMobile ? '0.75rem' : isTablet ? '0.85rem' : '0.95rem',
            color: 'rgba(0, 212, 255, 0.8)',
            fontFamily: 'monospace',
            lineHeight: 1.6,
          }}
        >
          {map.description}
        </p>
        {map.gameModes && map.gameModes.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: isMobile ? '0.4rem' : '0.5rem',
              marginTop: isMobile ? '0.5rem' : '0.75rem',
            }}
          >
            {map.gameModes.map((mode, modeIndex) => (
              <span
                key={modeIndex}
                style={{
                  fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem',
                  color: 'rgba(255, 102, 0, 1)',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  padding: isMobile ? '0.25rem 0.5rem' : '0.3rem 0.6rem',
                  background: 'rgba(255, 102, 0, 0.15)',
                  border: '1px solid rgba(255, 102, 0, 0.6)',
                  borderRadius: '2px',
                  letterSpacing: '0.05em',
                }}
              >
                {mode}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Vue compacte d'une carte non sélectionnée
 * Affiche uniquement l'image visuelle de la carte en miniature
 * Utilisée dans la grille pour toutes les cartes sauf celle sélectionnée
 * 
 * @param map - Données de la carte à afficher
 * @param visualImage - Image visuelle de la carte
 * @param isMobile - Indique si l'écran est en mode mobile
 * @param isTablet - Indique si l'écran est en mode tablette
 */
function CompactMapView({
  map,
  visualImage,
  isMobile,
  isTablet,
}: {
  map: typeof mapsData[0]
  visualImage?: { src: string; alt: string }
  isMobile: boolean
  isTablet: boolean
}) {
  return (
    <>
      {visualImage && (
        <div
          style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          <img
            src={visualImage.src}
            alt={visualImage.alt}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              padding: isMobile ? '0.5rem' : isTablet ? '0.6rem' : '0.75rem',
              zIndex: 3,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: isMobile ? '0.7rem' : isTablet ? '0.8rem' : '0.9rem',
                color: 'rgba(0, 212, 255, 1)',
                fontFamily: 'monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                textAlign: 'left',
                lineHeight: 1.2,
                textShadow: '0 0 10px rgba(0, 212, 255, 0.8), 0 0 20px rgba(0, 212, 255, 0.6), 0 0 30px rgba(0, 212, 255, 0.4), 2px 2px 4px rgba(0, 0, 0, 0.9), -2px -2px 4px rgba(0, 0, 0, 0.9), 2px -2px 4px rgba(0, 0, 0, 0.9), -2px 2px 4px rgba(0, 0, 0, 0.9)',
                fontWeight: 'bold',
                WebkitTextStroke: '0.5px rgba(0, 212, 255, 0.5)',
              }}
            >
              {map.name}
            </h3>
          </div>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: isMobile ? '0.6rem' : isTablet ? '0.75rem' : '0.85rem',
          background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.7) 50%, transparent 100%)',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.2rem',
          justifyContent: 'flex-end',
          pointerEvents: 'none',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: isMobile ? '0.6rem' : isTablet ? '0.65rem' : '0.7rem',
            color: 'rgba(0, 212, 255, 0.7)',
            fontFamily: 'monospace',
            textAlign: 'left',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {map.description}
        </p>
      </div>
    </>
  )
}
