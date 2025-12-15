import { 
  characters, 
  CLASS_META, 
  FALLBACK_AVATAR,
  type CharacterCard 
} from '../../data/characters'
import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useResponsive } from '../../hooks/useResponsive'

/**
 * Props du module Character
 */
interface CharacterModuleProps {
  onClose?: () => void
}

/**
 * Module Character - Affichage des opérateurs (personnages) du jeu
 * Gère un carrousel horizontal de personnages avec panneau de détails
 * Affiche les profils, capacités et skins de chaque personnage
 * Layout responsive avec adaptation mobile/tablet/desktop
 * 
 * @param onClose - Callback optionnel appelé pour fermer le module
 */
export default function CharacterModule({ onClose }: CharacterModuleProps = {}) {
  const { isMobile, isTablet } = useResponsive()
  
  // États de navigation et sélection
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null) // Index du personnage survolé
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null) // Index du personnage sélectionné
  const [selectedTab, setSelectedTab] = useState<boolean>(false) // Indique si le panneau de détails est ouvert
  const [isClosing, setIsClosing] = useState<boolean>(false) // État de l'animation de fermeture
  const [activeTab, setActiveTab] = useState<'profile' | 'skins'>('profile') // Onglet actif dans le panneau
  
  // États de sélection des skins (par personnage)
  const [selectedSkinIndex, setSelectedSkinIndex] = useState<Record<number, number>>({})
  
  // États de padding dynamique pour le scroll
  const [leftPadding, setLeftPadding] = useState<number>(50)
  const [rightPadding, setRightPadding] = useState<number>(50)
  
  // États de scroll et pagination
  const [canScrollDown, setCanScrollDown] = useState<boolean>(false)
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false)
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  
  // Références DOM
  const scrollContainerRef = useRef<HTMLDivElement>(null) // Conteneur du carrousel
  const closingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null) // Timeout pour l'animation de fermeture
  const contentScrollRef = useRef<HTMLDivElement>(null) // Conteneur scrollable du panneau de détails

  /**
   * Réorganise les personnages selon un ordre de priorité spécifique
   * Les personnages principaux (Saito, Togusa, Motoko, etc.) sont affichés en premier
   * Les autres personnages suivent dans leur ordre d'origine
   */
  const orderedCharacters = useMemo(() => {
    // Ordre de priorité des personnages principaux
    const priorityOrder = ['saito', 'togusa', 'motoko', 'batou', 'ishikawa', 'maven', 'paz', 'borma', 'kuro']
    const priorityChars: CharacterCard[] = []
    const otherChars: CharacterCard[] = []

    // Séparer les personnages prioritaires des autres
    characters.forEach((char) => {
      if (priorityOrder.includes(char.id)) {
        priorityChars.push(char)
      } else {
        otherChars.push(char)
      }
    })

    // Trier les personnages prioritaires selon l'ordre spécifié
    priorityChars.sort((a, b) => {
      const indexA = priorityOrder.indexOf(a.id)
      const indexB = priorityOrder.indexOf(b.id)
      return indexA - indexB
    })

    return [...priorityChars, ...otherChars]
  }, [])

  /**
   * Récupère les données du personnage sélectionné
   * Mémorisé pour éviter les recalculs
   */
  const selectedCharacter = useMemo(
    () => selectedIndex !== null ? orderedCharacters[selectedIndex] : null,
    [selectedIndex, orderedCharacters]
  )

  /**
   * Fonction de scroll fluide avec courbe d'animation personnalisée
   * Utilise une approximation de cubic-bezier(0.25, 0.46, 0.45, 0.94)
   * Synchronisée avec les transitions CSS pour une cohérence visuelle
   * 
   * @param element - Élément à scroller
   * @param target - Position de scroll cible en pixels
   * @param duration - Durée de l'animation en millisecondes (défaut: 600ms)
   */
  const smoothScrollTo = useCallback((element: HTMLElement, target: number, duration: number = 600) => {
    const start = element.scrollLeft
    const distance = target - start
    const startTime = performance.now()

    /**
     * Approximation de la courbe cubic-bezier(0.25, 0.46, 0.45, 0.94)
     * Crée une transition douce avec accélération puis décélération
     * 
     * @param t - Progression de l'animation (0-1)
     * @returns Valeur interpolée selon la courbe
     */
    const cubicBezier = (t: number): number => {
      return t * t * (3 - 2 * t) * 0.7 + t * 0.3
    }

    /**
     * Fonction d'animation récursive utilisant requestAnimationFrame
     * Calcule la progression et applique le scroll avec l'easing
     */
    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Appliquer la courbe d'easing pour une transition fluide
      const easedProgress = cubicBezier(progress)
      element.scrollLeft = start + distance * easedProgress

      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      }
    }

    requestAnimationFrame(animateScroll)
  }, [])

  /**
   * Scroll automatique vers le personnage sélectionné
   * Calcule les paddings dynamiques nécessaires pour positionner le personnage
   * Aligne toujours le personnage sélectionné au même endroit à droite de l'écran
   * Gère les cas limites (bords de la grille, petits écrans)
   */
  useEffect(() => {
      if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      // Dimensions adaptatives selon le breakpoint
      const itemWidth = isMobile ? 200 : isTablet ? 280 : 350
      const gap = isMobile ? -60 : isTablet ? -75 : -90 // Gap négatif pour chevauchement
      const sidePadding = isMobile ? 20 : isTablet ? 35 : 50
      const containerWidth = container.clientWidth
      const totalCharacters = orderedCharacters.length
      
      // Vérifier que le conteneur est correctement dimensionné
      if (containerWidth === 0 || totalCharacters === 0) {
        return
      }
      
      if (selectedIndex !== null && selectedTab && selectedIndex >= 0 && selectedIndex < totalCharacters) {
        // Position cible fixe : tous les personnages doivent finir au même endroit à droite
        // Offset pour déplacer le personnage un peu plus à gauche (desktop uniquement)
        const offsetLeft = isMobile ? 0 : isTablet ? 200 : 250
        const targetPosition = containerWidth - sidePadding - itemWidth - offsetLeft
        
        // Calculer le padding gauche nécessaire pour permettre au personnage sélectionné de se positionner
        const requiredPaddingForSelected = targetPosition - selectedIndex * (itemWidth + gap)
        // Utiliser le padding minimum si le calcul donne une valeur trop petite
        const calculatedLeftPadding = Math.max(requiredPaddingForSelected, sidePadding)
        
        // Calculer le padding à droite nécessaire pour que le dernier personnage puisse aussi se positionner
        const lastCharacterIndex = totalCharacters - 1
        const lastCharacterAbsolutePosition = calculatedLeftPadding + lastCharacterIndex * (itemWidth + gap)
        const requiredScrollForLast = lastCharacterAbsolutePosition - targetPosition
        
        // Vérifier si un padding supplémentaire à droite est nécessaire
        const currentContentWidth = totalCharacters * itemWidth + (totalCharacters - 1) * gap + calculatedLeftPadding + sidePadding
        const currentMaxScroll = Math.max(0, currentContentWidth - containerWidth)
        const requiredRightPadding = requiredScrollForLast > currentMaxScroll 
          ? requiredScrollForLast + containerWidth - (totalCharacters * itemWidth + (totalCharacters - 1) * gap + calculatedLeftPadding)
          : sidePadding
        
        const calculatedRightPadding = Math.max(requiredRightPadding, sidePadding)
        
        setLeftPadding(calculatedLeftPadding)
        setRightPadding(calculatedRightPadding)
        
        // Calculer la position de scroll cible pour aligner le personnage
        const characterAbsolutePosition = calculatedLeftPadding + selectedIndex * (itemWidth + gap)
        const contentWidth = totalCharacters * itemWidth + (totalCharacters - 1) * gap + calculatedLeftPadding + calculatedRightPadding
        const maxScroll = Math.max(0, contentWidth - containerWidth)
        const scrollPosition = characterAbsolutePosition - targetPosition
        const finalScrollPosition = Math.max(0, Math.min(scrollPosition, maxScroll))
        
        // Attendre que le padding commence sa transition CSS, puis scroller
        // Double requestAnimationFrame pour synchroniser avec le rendu
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (scrollContainerRef.current) {
              const updatedContainer = scrollContainerRef.current
              // Durée adaptative : plus rapide sur mobile
              smoothScrollTo(updatedContainer, finalScrollPosition, isMobile ? 400 : 600)
            }
          })
        })
      } else {
        // Réinitialiser les paddings quand aucun personnage n'est sélectionné
        setLeftPadding(sidePadding)
        setRightPadding(sidePadding)
  }
    }
  }, [selectedIndex, selectedTab, orderedCharacters, isMobile, isTablet, smoothScrollTo])

  /**
   * Vérifie si le panneau de détails peut défiler vers le bas
   * Utilisé pour afficher l'indicateur de scroll en bas du panneau
   */
  useEffect(() => {
    const checkScroll = () => {
      if (contentScrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentScrollRef.current
        const canScroll = scrollHeight > clientHeight && scrollTop < scrollHeight - clientHeight - 5
        setCanScrollDown(canScroll)
      }
    }

    checkScroll()
    
    const scrollElement = contentScrollRef.current
    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkScroll)
      // Vérifier aussi lors du resize
      window.addEventListener('resize', checkScroll)
      
      return () => {
        scrollElement.removeEventListener('scroll', checkScroll)
        window.removeEventListener('resize', checkScroll)
      }
    }
  }, [activeTab, selectedCharacter, selectedIndex])

  // Vérifier le scroll horizontal et calculer la pagination
  useEffect(() => {
    const checkHorizontalScroll = () => {
      if (scrollContainerRef.current && !selectedTab) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
        
        // Calculer la largeur totale théorique du contenu en utilisant TOUJOURS les tailles normales
        // Cela garantit que le nombre de pages ne change pas quand un personnage est sélectionné
        const normalWidth = isMobile ? 200 : isTablet ? 280 : 350
        const gap = isMobile ? -60 : isTablet ? -75 : -90
        const sidePadding = isMobile ? 20 : isTablet ? 35 : 50
        
        // Calculer la largeur totale en utilisant uniquement les tailles normales (comme si aucun personnage n'était sélectionné)
        let totalContentWidth = sidePadding * 2 // Padding gauche et droite
        orderedCharacters.forEach((_, index) => {
          totalContentWidth += normalWidth
          if (index > 0) {
            totalContentWidth += gap
          }
        })
        
        // Pour le scroll réel, utiliser la largeur actuelle du DOM
        const actualContentWidth = scrollWidth
        const maxScroll = Math.max(0, actualContentWidth - clientWidth)
        
        const canScrollR = actualContentWidth > clientWidth && scrollLeft < maxScroll - 5
        const canScrollL = scrollLeft > 5
        setCanScrollRight(canScrollR)
        setCanScrollLeft(canScrollL)
        
        // Calculer le nombre de pages basé sur la largeur théorique (tailles normales uniquement)
        // Cela garantit que le nombre de points de pagination reste constant
        if (totalContentWidth <= clientWidth) {
          // Pas assez de contenu pour scroller, une seule page
          setTotalPages(1)
          setCurrentPage(0)
        } else {
          // Calculer le nombre de pages basé sur la largeur théorique (tailles normales)
          const theoreticalMaxScroll = totalContentWidth - clientWidth
          const pageSize = clientWidth * 0.9 // Utiliser 90% de la largeur comme taille de page
          const total = Math.ceil(theoreticalMaxScroll / pageSize) + 1
          setTotalPages(Math.max(1, total))
          
          // Calculer la page actuelle basée sur la position de scroll réelle
          // Utiliser un seuil plus permissif pour atteindre la dernière page
          let page = 0
          if (scrollLeft >= maxScroll - 20) {
            // Si on est proche de la fin (dans les 20px), on est sur la dernière page
            page = total - 1
          } else {
            // Sinon, calculer normalement avec un arrondi pour être plus permissif
            page = Math.round(scrollLeft / pageSize)
          }
          setCurrentPage(Math.max(0, Math.min(page, total - 1)))
        }
      } else {
        setCanScrollRight(false)
        setCanScrollLeft(false)
        setTotalPages(1)
        setCurrentPage(0)
      }
    }

    // Recalculer immédiatement seulement si aucun personnage n'est sélectionné
    // Sinon attendre la fin de la transition
    if (selectedIndex === null || !selectedTab) {
      checkHorizontalScroll()
    }
    
    const scrollElement = scrollContainerRef.current
    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkHorizontalScroll, { passive: true })
      window.addEventListener('resize', checkHorizontalScroll)
      
      // Recalculer la pagination après les transitions de taille (quand un personnage est sélectionné/désélectionné)
      // Attendre que les transitions CSS soient terminées (600ms pour la transition de taille)
      let timeoutId1: ReturnType<typeof setTimeout> | null = null
      let timeoutId2: ReturnType<typeof setTimeout> | null = null
      
      // Recalculer après un changement de selectedIndex (sélection ou désélection)
      // Double vérification pour s'assurer que les transitions sont bien terminées
      timeoutId1 = setTimeout(() => {
        checkHorizontalScroll()
      }, 700) // Légèrement plus que la durée de transition (600ms)
      
      timeoutId2 = setTimeout(() => {
        checkHorizontalScroll()
      }, 900) // Double vérification pour être sûr
      
      return () => {
        scrollElement.removeEventListener('scroll', checkHorizontalScroll)
        window.removeEventListener('resize', checkHorizontalScroll)
        if (timeoutId1) {
          clearTimeout(timeoutId1)
        }
        if (timeoutId2) {
          clearTimeout(timeoutId2)
        }
      }
    }
  }, [orderedCharacters, selectedTab, selectedIndex])

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
      return () => {
        window.removeEventListener('keydown', handleKeyDown, true)
      }
    }
  }, [onClose])

  /**
   * Navigue vers une page spécifique du carrousel
   * Utilisé pour la pagination du carrousel avec les boutons précédent/suivant
   * 
   * @param page - Numéro de la page (0-indexed)
   */
  const goToPage = useCallback((page: number) => {
    if (scrollContainerRef.current && !selectedTab) {
      const { scrollWidth, clientWidth } = scrollContainerRef.current
      const maxScroll = scrollWidth - clientWidth
      
      if (maxScroll <= 0) return
      
      const pageSize = clientWidth * 0.9
      const total = Math.ceil(maxScroll / pageSize) + 1
      const targetScroll = page >= total - 1 
        ? maxScroll 
        : Math.min(page * pageSize, maxScroll)
      
      smoothScrollTo(scrollContainerRef.current, targetScroll, 600)
    }
  }, [selectedTab, smoothScrollTo])

  /**
   * Gère le clic sur un personnage dans le carrousel
   * Ouvre le panneau de détails et sélectionne le personnage
   * Initialise le skin sélectionné si nécessaire
   * 
   * @param index - Index du personnage cliqué dans orderedCharacters
   */
  const handleCharacterClick = useCallback((index: number) => {
    // Annuler toute animation de fermeture en cours
    if (closingTimeoutRef.current) {
      clearTimeout(closingTimeoutRef.current)
      closingTimeoutRef.current = null
    }
    setIsClosing(false)
    setSelectedIndex(index)
    setSelectedTab(true) // Ouvrir le panneau de détails
    setActiveTab('profile') // Réinitialiser à l'onglet Profile
    // Initialiser le skin sélectionné si ce personnage n'en a pas encore
    setSelectedSkinIndex(prev => {
      if (!(index in prev)) {
        return { ...prev, [index]: 0 }
      }
      return prev
    })
  }, [])

  /**
   * Gère la fermeture du panneau de détails
   * Déclenche l'animation de fermeture puis réinitialise l'état
   * Durée synchronisée avec l'animation CSS (600ms)
   */
  const handleClose = useCallback(() => {
    setIsClosing(true)
    setSelectedTab(false) // Déclenche immédiatement la transition
    if (closingTimeoutRef.current) {
      clearTimeout(closingTimeoutRef.current)
    }
    closingTimeoutRef.current = setTimeout(() => {
      setSelectedIndex(null)
      setIsClosing(false)
      closingTimeoutRef.current = null
    }, 600) // Durée synchronisée avec l'animation
  }, [])

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Contenu principal avec carrousel et détails */}
      <div
        style={{
          flex: 1,
          display: 'flex',
                position: 'relative',
                overflow: 'hidden',
        }}
      >
        {/* Panneau de détails à gauche (position absolute, visible quand un personnage est sélectionné) */}
        {selectedCharacter && selectedIndex !== null && (selectedTab || isClosing) && (
              <div
            style={{
                  position: isMobile ? 'fixed' : 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: isMobile ? '100%' : isTablet ? '450px' : '700px',
              padding: isMobile ? '0.5rem 0' : isTablet ? '0.75rem 0' : '1rem 0',
              paddingTop: isMobile ? '3.25rem' : '1.25rem',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              background: 'transparent',
              zIndex: 100,
                overflow: 'hidden',
              minHeight: 0,
              animation: isClosing 
                ? 'slideOutToLeft 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
                : 'slideInFromLeft 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
            >
            {/* Première colonne : Boutons (Desktop uniquement) */}
              {!isMobile && !isTablet && (
              <div
                style={{
                width: '200px',
          display: 'flex',
                flexDirection: 'column',
          gap: '1rem',
                borderRight: '1px solid rgba(0, 212, 255, 0.1)',
                background: 'transparent',
                padding: '0',
        }}
      >
              {/* Boutons Profile et Skins en haut */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0 1rem', flex: 'none' }}>
                <button
                  onClick={() => setActiveTab('profile')}
                      style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: activeTab === 'profile' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'rgba(255, 255, 255, 0.03)',
                    border: activeTab === 'profile' 
                      ? '1px solid rgba(255, 255, 255, 0.9)' 
                      : '1px solid rgba(255, 255, 255, 0.3)',
                    borderLeft: activeTab === 'profile' 
                      ? '3px solid rgba(255, 255, 255, 1)' 
                      : '3px solid rgba(255, 255, 255, 0.4)',
                    color: 'rgba(255, 255, 255, 1)',
              fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    fontWeight: 'normal',
                cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    textTransform: 'uppercase',
                    textAlign: 'left',
                    letterSpacing: '0.1em',
                    boxShadow: activeTab === 'profile' 
                      ? '0 0 10px rgba(255, 255, 255, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.1)' 
                      : 'none',
                    position: 'relative',
                overflow: 'hidden',
              }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'profile') {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)'
                      e.currentTarget.style.borderLeftColor = 'rgba(255, 255, 255, 0.8)'
                      e.currentTarget.style.boxShadow = '0 0 8px rgba(255, 255, 255, 0.2)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'profile') {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                      e.currentTarget.style.borderLeftColor = 'rgba(255, 255, 255, 0.4)'
                      e.currentTarget.style.boxShadow = 'none'
                    }
            }}
          >
                  PROFILE
                </button>
                <button
                  onClick={() => setActiveTab('skins')}
            style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: activeTab === 'skins' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'rgba(255, 255, 255, 0.03)',
                    border: activeTab === 'skins' 
                      ? '1px solid rgba(255, 255, 255, 0.9)' 
                      : '1px solid rgba(255, 255, 255, 0.3)',
                    borderLeft: activeTab === 'skins' 
                      ? '3px solid rgba(255, 255, 255, 1)' 
                      : '3px solid rgba(255, 255, 255, 0.4)',
                    color: 'rgba(255, 255, 255, 1)',
              fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    fontWeight: 'normal',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    textTransform: 'uppercase',
                    textAlign: 'left',
                    letterSpacing: '0.1em',
                    boxShadow: activeTab === 'skins' 
                      ? '0 0 10px rgba(255, 255, 255, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.1)' 
                      : 'none',
                    position: 'relative',
                overflow: 'hidden',
              }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'skins') {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)'
                      e.currentTarget.style.borderLeftColor = 'rgba(255, 255, 255, 0.8)'
                      e.currentTarget.style.boxShadow = '0 0 8px rgba(255, 255, 255, 0.2)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'skins') {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                      e.currentTarget.style.borderLeftColor = 'rgba(255, 255, 255, 0.4)'
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}
                >
                  SKINS
                </button>
        </div>

              {/* Bouton Retour en bas */}
              <div style={{ padding: '0 1rem', marginTop: 'auto' }}>
                <button
                  onClick={handleClose}
        style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    borderLeft: '3px solid rgba(255, 255, 255, 0.5)',
                    color: 'rgba(255, 255, 255, 1)',
                            fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    fontWeight: 'normal',
                cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    textTransform: 'uppercase',
                    textAlign: 'left',
                    letterSpacing: '0.1em',
                    position: 'relative',
                overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.7)'
                    e.currentTarget.style.borderLeftColor = 'rgba(255, 255, 255, 1)'
                    e.currentTarget.style.boxShadow = '0 0 8px rgba(255, 255, 255, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'
                    e.currentTarget.style.borderLeftColor = 'rgba(255, 255, 255, 0.5)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                        >
                  RETOUR
                </button>
                    </div>
                </div>
              )}

            {/* Deuxième colonne : Contenu */}
                <div
                  className="content-column"
              style={{
                    flex: 1,
                position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#0b242d',
                    minHeight: 0,
                    overflow: 'hidden',
              }}
            >
              <div
                    ref={contentScrollRef}
                style={{
                      flex: 1,
                      height: isMobile || isTablet ? '100%' : undefined,
                      maxHeight: isMobile || isTablet ? '100%' : undefined,
                      padding: isMobile ? '1rem' : isTablet ? '1.25rem' : '2rem',
                      paddingBottom: (isMobile || isTablet) ? (isMobile ? '5.5rem' : '6rem') : undefined,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: isMobile ? '1rem' : isTablet ? '1.25rem' : '1.5rem',
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      WebkitOverflowScrolling: 'touch',
                      minHeight: 0,
                      overscrollBehavior: 'contain',
                    }}
                    className="content-scroll-container"
                  >
              {/* En-tête */}
                  <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <h2 style={{ color: 'rgba(0, 212, 255, 1)', fontFamily: 'monospace', margin: 0, fontSize: isMobile ? '1.25rem' : isTablet ? '1.35rem' : '1.5rem' }}>
                      {selectedCharacter.name.toUpperCase()}
                    </h2>
                    {/* Badge "Nouveau" */}
                    {selectedCharacter.isNew && (
                    <div
                      style={{
                          background: 'linear-gradient(135deg, #00ff84 0%, #00d4ff 100%)',
                          color: '#000',
                          padding: isMobile ? '4px 8px' : '5px 10px',
                          borderRadius: '4px',
                          fontSize: isMobile ? '0.65rem' : '0.7rem',
                          fontWeight: 'bold',
                          fontFamily: 'monospace',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          boxShadow: '0 0 10px rgba(0, 255, 132, 0.6), 0 0 20px rgba(0, 212, 255, 0.4)',
                          border: '1px solid rgba(0, 255, 132, 0.8)',
                          }}
                        >
                        Nouveau
                    </div>
                    )}
                  </div>
                  {/* Badge de classe */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img
                      src={CLASS_META[selectedCharacter.class].icon}
                      alt={CLASS_META[selectedCharacter.class].label}
                      draggable={false}
                        style={{
                        width: '24px',
                        height: '24px',
                        objectFit: 'contain',
                        }}
                    />
                    <span
                      style={{
                        color: CLASS_META[selectedCharacter.class].color,
                        fontFamily: 'monospace',
                          fontSize: '0.85rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {CLASS_META[selectedCharacter.class].label}
                    </span>
                  </div>
                </div>
                {selectedCharacter.codename && (
                  <p style={{ color: 'rgba(136, 204, 255, 0.7)', fontFamily: 'monospace', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                    {selectedCharacter.codename.toUpperCase()}
                  </p>
                    )}
                </div>

              {/* Contenu selon l'onglet actif */}
              {activeTab === 'profile' ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Description */}
                  <div>
                    <h3 style={{ color: 'rgba(0, 212, 255, 1)', fontFamily: 'monospace', margin: '0 0 0.75rem 0', fontSize: isMobile ? '0.85rem' : isTablet ? '0.9rem' : '1rem', textTransform: 'uppercase' }}>
                      DESCRIPTION
                    </h3>
                    <p style={{ color: 'rgba(182, 226, 255, 0.9)', fontFamily: 'monospace', lineHeight: 1.6, fontSize: isMobile ? '0.75rem' : '0.8rem', margin: 0 }}>
                      {selectedCharacter.description}
                    </p>
                </div>

                  {/* Compétence */}
                  <div>
                    <h3 style={{ color: 'rgba(0, 212, 255, 1)', fontFamily: 'monospace', margin: '0 0 0.75rem 0', fontSize: isMobile ? '0.85rem' : isTablet ? '0.9rem' : '1rem', textTransform: 'uppercase' }}>
                      COMPÉTENCE
                    </h3>
                    <div style={{ display: 'flex', gap: isMobile ? '0.75rem' : '1rem', alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row' }}>
                      <img
                        src={selectedCharacter.ability.image || FALLBACK_AVATAR}
                        alt={selectedCharacter.ability.name}
                        draggable={false}
                      style={{
                          width: isMobile ? '48px' : isTablet ? '56px' : '64px',
                          height: isMobile ? '48px' : isTablet ? '56px' : '64px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          border: '1px solid rgba(0, 212, 255, 0.3)',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ color: 'rgba(0, 212, 255, 1)', fontFamily: 'monospace', margin: '0 0 0.5rem 0', fontSize: isMobile ? '0.85rem' : isTablet ? '0.9rem' : '0.95rem', fontWeight: 'bold' }}>
                          {selectedCharacter.ability.name.toUpperCase()}
                        </h4>
                        <p style={{ color: 'rgba(182, 226, 255, 0.9)', fontFamily: 'monospace', lineHeight: 1.6, fontSize: isMobile ? '0.75rem' : '0.8rem', margin: 0 }}>
                          {selectedCharacter.ability.description}
                </p>
                  </div>
                </div>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h3 style={{ color: 'rgba(0, 212, 255, 1)', fontFamily: 'monospace', margin: '0 0 0.75rem 0', fontSize: isMobile ? '0.85rem' : isTablet ? '0.9rem' : '1rem', textTransform: 'uppercase' }}>
                    SKINS DISPONIBLES
                  </h3>
                <div
                  style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile 
                          ? 'repeat(2, 1fr)' 
                          : isTablet 
                            ? 'repeat(auto-fill, minmax(120px, 1fr))' 
                            : 'repeat(auto-fill, minmax(150px, 1fr))',
                        gap: isMobile ? '0.75rem' : '1rem',
                        paddingBottom: !isMobile && !isTablet ? '2rem' : undefined,
                  }}
                >
                    {selectedCharacter.skins.map((skin, index) => {
                      const isSelectedSkin = selectedIndex !== null && selectedSkinIndex[selectedIndex] === index
                      return (
                  <div
                        key={index}
                        onClick={() => {
                          if (selectedIndex !== null) {
                            setSelectedSkinIndex(prev => ({ ...prev, [selectedIndex]: index }))
                          }
                        }}
                      style={{
                        display: 'flex',
                      flexDirection: 'column',
                        gap: '0.5rem',
                      padding: '0.75rem',
                          background: isSelectedSkin 
                            ? 'rgba(0, 212, 255, 0.15)' 
                            : 'rgba(0, 212, 255, 0.05)',
                          border: isSelectedSkin 
                            ? '2px solid rgba(0, 212, 255, 0.8)' 
                            : '1px solid rgba(0, 212, 255, 0.2)',
                          borderRadius: '4px',
                          transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                          cursor: 'pointer',
                          boxShadow: isSelectedSkin 
                            ? '0 0 10px rgba(0, 212, 255, 0.4)' 
                            : 'none',
                      }}
                        onMouseEnter={(e) => {
                          if (!isSelectedSkin) {
                            e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)'
                            e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.5)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelectedSkin) {
                            e.currentTarget.style.background = 'rgba(0, 212, 255, 0.05)'
                            e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.2)'
                          }
                        }}
                      >
                        <img
                          src={skin.src || FALLBACK_AVATAR}
                          alt={skin.label}
                          draggable={false}
                        style={{
                            width: '100%',
                            aspectRatio: '1',
                            objectFit: 'contain',
                            objectPosition: 'center bottom',
                            borderRadius: '4px',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            MozUserSelect: 'none',
                            msUserSelect: 'none',
                        }}
                        />
                <p
                        style={{
                            color: 'rgba(182, 226, 255, 0.9)',
                          fontFamily: 'monospace',
                            fontSize: '0.8rem',
                    margin: 0,
                            textAlign: 'center',
                            textTransform: 'uppercase',
                        }}
                      >
                          {skin.label}
                </p>
                      </div>
                       )
                     })}
                     </div>
                   </div>
                 )}
                  </div>
                   {/* Indication de scroll en bas - positionnée par rapport au wrapper, pas au conteneur qui défile */}
                   {canScrollDown && activeTab === 'profile' && (
                     <div
                        style={{
                         position: 'absolute',
                         bottom: isMobile || isTablet ? '80px' : 0,
                         left: 0,
                         right: 0,
                         height: '60px',
                         background: 'linear-gradient(to top, rgba(11, 36, 45, 0.95) 0%, rgba(11, 36, 45, 0.7) 50%, transparent 100%)',
                         pointerEvents: 'none',
                        }}
                     />
                  )}

                  {/* Boutons en bas sur mobile et tablette */}
                  {(isMobile || isTablet) && (
                    <div
                      style={{
                        position: isMobile ? 'fixed' : 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: isMobile ? '0.75rem 1rem' : '1rem 1.25rem',
                        background: 'linear-gradient(to top, rgba(11, 36, 45, 0.98) 0%, rgba(11, 36, 45, 0.95) 100%)',
                        borderTop: '1px solid rgba(0, 212, 255, 0.2)',
                        display: 'flex',
                        gap: isMobile ? '0.5rem' : '0.75rem',
                        zIndex: 1000,
                        boxShadow: isMobile ? '0 -2px 10px rgba(0, 0, 0, 0.3)' : 'none',
                      }}
                    >
                      <button
                        onClick={() => setActiveTab('profile')}
                        style={{
                          flex: 1,
                          padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1rem',
                          background: activeTab === 'profile' 
                            ? 'rgba(255, 255, 255, 0.1)' 
                            : 'rgba(255, 255, 255, 0.03)',
                          border: activeTab === 'profile' 
                            ? '1px solid rgba(255, 255, 255, 0.9)' 
                            : '1px solid rgba(255, 255, 255, 0.3)',
                          borderLeft: activeTab === 'profile' 
                            ? '3px solid rgba(255, 255, 255, 1)' 
                            : '3px solid rgba(255, 255, 255, 0.4)',
                          color: 'rgba(255, 255, 255, 1)',
                          fontFamily: 'monospace',
                          fontSize: isMobile ? '0.7rem' : '0.8rem',
                          fontWeight: 'normal',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                          textTransform: 'uppercase',
                          textAlign: 'center',
                          letterSpacing: '0.1em',
                          boxShadow: activeTab === 'profile' 
                            ? '0 0 10px rgba(255, 255, 255, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.1)' 
                            : 'none',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                        onMouseEnter={(e) => {
                          if (activeTab !== 'profile') {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)'
                            e.currentTarget.style.borderLeftColor = 'rgba(255, 255, 255, 0.8)'
                            e.currentTarget.style.boxShadow = '0 0 8px rgba(255, 255, 255, 0.2)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (activeTab !== 'profile') {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                            e.currentTarget.style.borderLeftColor = 'rgba(255, 255, 255, 0.4)'
                            e.currentTarget.style.boxShadow = 'none'
                          }
                        }}
                      >
                        PROFILE
                      </button>
                      <button
                        onClick={() => setActiveTab('skins')}
                        style={{
                          flex: 1,
                          padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1rem',
                          background: activeTab === 'skins' 
                            ? 'rgba(255, 255, 255, 0.1)' 
                            : 'rgba(255, 255, 255, 0.03)',
                          border: activeTab === 'skins' 
                            ? '1px solid rgba(255, 255, 255, 0.9)' 
                            : '1px solid rgba(255, 255, 255, 0.3)',
                          borderLeft: activeTab === 'skins' 
                            ? '3px solid rgba(255, 255, 255, 1)' 
                            : '3px solid rgba(255, 255, 255, 0.4)',
                          color: 'rgba(255, 255, 255, 1)',
                          fontFamily: 'monospace',
                          fontSize: isMobile ? '0.7rem' : '0.8rem',
                          fontWeight: 'normal',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                          textTransform: 'uppercase',
                          textAlign: 'center',
                          letterSpacing: '0.1em',
                          boxShadow: activeTab === 'skins' 
                            ? '0 0 10px rgba(255, 255, 255, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.1)' 
                            : 'none',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                        onMouseEnter={(e) => {
                          if (activeTab !== 'skins') {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)'
                            e.currentTarget.style.borderLeftColor = 'rgba(255, 255, 255, 0.8)'
                            e.currentTarget.style.boxShadow = '0 0 8px rgba(255, 255, 255, 0.2)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (activeTab !== 'skins') {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                            e.currentTarget.style.borderLeftColor = 'rgba(255, 255, 255, 0.4)'
                            e.currentTarget.style.boxShadow = 'none'
                          }
                        }}
                      >
                        SKINS
                      </button>
                      <button
                        onClick={handleClose}
                        style={{
                          flex: 1,
                          padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.4)',
                          borderLeft: '3px solid rgba(255, 255, 255, 0.5)',
                          color: 'rgba(255, 255, 255, 1)',
                          fontFamily: 'monospace',
                          fontSize: isMobile ? '0.7rem' : '0.8rem',
                          fontWeight: 'normal',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                          textTransform: 'uppercase',
                          textAlign: 'center',
                          letterSpacing: '0.1em',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.7)'
                          e.currentTarget.style.borderLeftColor = 'rgba(255, 255, 255, 1)'
                          e.currentTarget.style.boxShadow = '0 0 8px rgba(255, 255, 255, 0.2)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'
                          e.currentTarget.style.borderLeftColor = 'rgba(255, 255, 255, 0.5)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        RETOUR
                      </button>
                    </div>
                  )}
                </div>
            </div>
        )}

        {/* Carrousel horizontal avec scroll */}
        <div
          ref={scrollContainerRef}
          className="carousel-scroll-container"
                  style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            overflowX: selectedTab ? 'hidden' : 'scroll',
            overflowY: 'hidden',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
                }}
          onScroll={() => {
            // Ne pas mettre à jour l'index automatiquement lors du scroll
            // L'index sera mis à jour uniquement lors d'un clic
          }}
          onWheel={(e) => {
            if (selectedTab) {
              e.preventDefault()
              return
            }
            e.preventDefault()
            const container = scrollContainerRef.current
            if (container) {
              container.scrollBy({
                left: e.deltaY,
                behavior: 'smooth',
              })
            }
          }}
        >
                  <div
                    style={{
                      display: 'flex',
                        alignItems: 'center',
              gap: '0px',
              paddingLeft: `${leftPadding}px`,
              paddingRight: `${rightPadding}px`,
              transition: 'padding-left 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), padding-right 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              minWidth: 'max-content',
                    }}
                  >
            {orderedCharacters.map((character, index) => {
              const isHovered = hoveredIndex === index
              const isSelected = selectedIndex === index && selectedTab
              // Utiliser le skin sélectionné pour ce personnage (stocké dans selectedSkinIndex), sinon utiliser le skin par défaut
              const currentSkinIndex = selectedSkinIndex[index] ?? 0
              const skin = character.skins[currentSkinIndex] || character.skins[0]
              
              // Clé unique pour forcer la récréation de l'image lors du changement de skin
              const skinKey = `${character.id}-${currentSkinIndex}`

              return (
                <div
                  key={character.id}
                onClick={() => {
                    if (!selectedTab) {
                      handleCharacterClick(index)
                    }
                  }}
                  onMouseEnter={() => {
                    if (!selectedTab) {
                      setHoveredIndex(index)
                    }
                  }}
                  onMouseLeave={() => {
                    if (!selectedTab) {
                      setHoveredIndex(null)
                    }
                }}
                        style={{
                    width: isSelected 
                      ? (isMobile ? '280px' : isTablet ? '350px' : '420px')
                      : (isMobile ? '200px' : isTablet ? '280px' : '350px'),
                    height: isSelected 
                      ? (isMobile ? '420px' : isTablet ? '525px' : '630px')
                      : (isMobile ? '300px' : isTablet ? '420px' : '525px'),
                    position: 'relative',
                    cursor: selectedTab ? 'default' : 'pointer',
                    pointerEvents: selectedTab && !isSelected ? 'none' : 'auto',
                    transition: 'width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), height 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    opacity: isSelected ? 1 : selectedTab ? 0.5 : 1,
                    filter: isSelected ? 'none' : selectedTab ? 'blur(5px)' : 'none',
                    zIndex: isSelected ? 10 : 1,
                    flexShrink: 0,
                    marginLeft: index > 0 ? (isMobile ? '-60px' : isTablet ? '-75px' : '-90px') : '0',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                  }}
                >
                  {/* Image du personnage sans arrière-plan */}
                  <img
                    key={skinKey}
                    src={skin?.src || FALLBACK_AVATAR}
                    alt={character.name}
                    draggable={false}
                        style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      objectPosition: 'center bottom',
                      transition: 'filter 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      pointerEvents: 'none',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none',
                      filter: isHovered ? 'drop-shadow(0 0 5px rgba(0, 212, 255, 0.8)) drop-shadow(0 0 25px rgba(0, 212, 255, 0.5))' : 'none',
                        }}
                  />

                  {/* Overlay avec info au hover */}
                  {isHovered && !selectedTab && (
                    <div
                      key={`hover-${character.id}`}
                          style={{
                        position: 'absolute',
                        top: '-80px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '1rem',
                          background: 'transparent',
                        borderRadius: '8px',
                        minWidth: '200px',
                        zIndex: 30,
                        willChange: 'transform',
                        pointerEvents: 'none',
                        }}
                    >
                      <p style={{ color: 'rgba(0, 212, 255, 1)', fontFamily: 'monospace', margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center' }}>
                        {character.name.toUpperCase()}
                </p>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
                <img
                          src={character.ability.image || FALLBACK_AVATAR}
                        alt={character.ability.name}
                          draggable={false}
                          style={{
                            width: '32px',
                            height: '32px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            border: '1px solid rgba(0, 212, 255, 0.3)',
                          }}
                        />
                        <p style={{ color: 'rgba(136, 204, 255, 0.9)', fontFamily: 'monospace', margin: 0, fontSize: '0.75rem' }}>
                          {character.ability.name.toUpperCase()}
                        </p>
                    </div>
                  </div>
                )}
            </div>
          )
        })}
      </div>
              </div>
      </div>

        {/* Pagination */}
        {!selectedTab && totalPages > 1 && (isTablet || !isMobile) && (
          <div
          style={{
              position: 'absolute',
              bottom: isTablet ? '15px' : '20px',
              left: '50%',
              transform: 'translateX(-50%)',
            display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isTablet ? '0.75rem' : '1rem',
              zIndex: 50,
            }}
          >
            {/* Flèche gauche */}
            <button
              onClick={() => goToPage(Math.max(0, currentPage - 1))}
              disabled={!canScrollLeft}
              className="futuristic-arrow-btn"
              style={{
                background: canScrollLeft 
                  ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 212, 255, 0.05) 100%)' 
                  : 'transparent',
                border: canScrollLeft ? '1px solid rgba(0, 212, 255, 0.4)' : '1px solid rgba(0, 212, 255, 0.2)',
                borderTop: canScrollLeft ? '2px solid rgba(0, 212, 255, 0.8)' : '2px solid rgba(0, 212, 255, 0.3)',
                borderRight: canScrollLeft ? '2px solid rgba(0, 212, 255, 0.6)' : '2px solid rgba(0, 212, 255, 0.2)',
                color: canScrollLeft ? 'rgba(0, 212, 255, 1)' : 'rgba(0, 212, 255, 0.3)',
                width: isTablet ? '28px' : '32px',
                height: isTablet ? '28px' : '32px',
                clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
                cursor: canScrollLeft ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                opacity: canScrollLeft ? 1 : 0.5,
                boxShadow: canScrollLeft 
                  ? 'inset 0 0 15px rgba(0, 212, 255, 0.15), 0 0 10px rgba(0, 212, 255, 0.2)' 
                  : 'none',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (canScrollLeft) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(0, 212, 255, 0.1) 100%)'
                  e.currentTarget.style.borderTopColor = 'rgba(0, 212, 255, 1)'
                  e.currentTarget.style.borderRightColor = 'rgba(0, 212, 255, 0.9)'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0, 212, 255, 0.8), 0 0 25px rgba(0, 212, 255, 0.7), inset 0 0 20px rgba(0, 212, 255, 0.25)'
                  e.currentTarget.style.transform = 'scale(1.1)'
                }
              }}
              onMouseLeave={(e) => {
                if (canScrollLeft) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 212, 255, 0.05) 100%)'
                  e.currentTarget.style.borderTopColor = 'rgba(0, 212, 255, 0.8)'
                  e.currentTarget.style.borderRightColor = 'rgba(0, 212, 255, 0.6)'
                  e.currentTarget.style.boxShadow = 'inset 0 0 15px rgba(0, 212, 255, 0.15), 0 0 10px rgba(0, 212, 255, 0.2)'
                  e.currentTarget.style.transform = 'scale(1)'
                }
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
              style={{
                  transform: 'rotate(90deg)',
                }}
              >
                <path
                  d="M7 10L12 15L17 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Indicateurs de pages */}
          <div
            style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
              }}
            >
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToPage(index)}
                style={{
                    width: currentPage === index ? (isTablet ? '20px' : '24px') : (isTablet ? '6px' : '8px'),
                    height: isTablet ? '6px' : '8px',
                    borderRadius: '4px',
                    background: currentPage === index
                      ? 'rgba(0, 212, 255, 1)'
                      : 'rgba(0, 212, 255, 0.3)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    boxShadow: currentPage === index
                      ? '0 0 8px rgba(0, 212, 255, 0.6)'
                      : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== index) {
                      e.currentTarget.style.background = 'rgba(0, 212, 255, 0.6)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== index) {
                      e.currentTarget.style.background = 'rgba(0, 212, 255, 0.3)'
                    }
                  }}
                />
            ))}
          </div>

            {/* Flèche droite */}
            <button
              onClick={() => goToPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={!canScrollRight}
              className="futuristic-arrow-btn"
                style={{
                background: canScrollRight 
                  ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 212, 255, 0.05) 100%)' 
                  : 'transparent',
                border: canScrollRight ? '1px solid rgba(0, 212, 255, 0.4)' : '1px solid rgba(0, 212, 255, 0.2)',
                borderTop: canScrollRight ? '2px solid rgba(0, 212, 255, 0.8)' : '2px solid rgba(0, 212, 255, 0.3)',
                borderRight: canScrollRight ? '2px solid rgba(0, 212, 255, 0.6)' : '2px solid rgba(0, 212, 255, 0.2)',
                color: canScrollRight ? 'rgba(0, 212, 255, 1)' : 'rgba(0, 212, 255, 0.3)',
                width: isTablet ? '28px' : '32px',
                height: isTablet ? '28px' : '32px',
                clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
                cursor: canScrollRight ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                opacity: canScrollRight ? 1 : 0.5,
                boxShadow: canScrollRight 
                  ? 'inset 0 0 15px rgba(0, 212, 255, 0.15), 0 0 10px rgba(0, 212, 255, 0.2)' 
                  : 'none',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (canScrollRight) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(0, 212, 255, 0.1) 100%)'
                  e.currentTarget.style.borderTopColor = 'rgba(0, 212, 255, 1)'
                  e.currentTarget.style.borderRightColor = 'rgba(0, 212, 255, 0.9)'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0, 212, 255, 0.8), 0 0 25px rgba(0, 212, 255, 0.7), inset 0 0 20px rgba(0, 212, 255, 0.25)'
                  e.currentTarget.style.transform = 'scale(1.1)'
                }
              }}
              onMouseLeave={(e) => {
                if (canScrollRight) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 212, 255, 0.05) 100%)'
                  e.currentTarget.style.borderTopColor = 'rgba(0, 212, 255, 0.8)'
                  e.currentTarget.style.borderRightColor = 'rgba(0, 212, 255, 0.6)'
                  e.currentTarget.style.boxShadow = 'inset 0 0 15px rgba(0, 212, 255, 0.15), 0 0 10px rgba(0, 212, 255, 0.2)'
                  e.currentTarget.style.transform = 'scale(1)'
                }
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  transform: 'rotate(-90deg)',
                }}
              >
                <path
                  d="M7 10L12 15L17 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
              </div>
        )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .carousel-scroll-container {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        
        .carousel-scroll-container::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
        
        .content-scroll-container {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        
        .content-scroll-container::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        
        @keyframes slideInFromLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOutToLeft {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(-100%);
            opacity: 0;
          }
        }
        
        
        .content-column {
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-left: 3px solid rgba(0, 212, 255, 0.6);
          box-shadow: inset 0 0 20px rgba(0, 212, 255, 0.1), 0 0 30px rgba(0, 212, 255, 0.2);
          clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));
        }
        
        .content-column::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 1px solid rgba(0, 212, 255, 0.2);
          clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));
          pointer-events: none;
          z-index: -1;
        }
        
        .content-column::after {
          content: '';
          position: absolute;
          top: 10px;
          right: 10px;
          width: 15px;
          height: 15px;
          border-top: 2px solid rgba(0, 212, 255, 0.5);
          border-right: 2px solid rgba(0, 212, 255, 0.5);
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
