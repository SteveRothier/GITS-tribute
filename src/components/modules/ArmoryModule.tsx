import { useState, useMemo, useEffect, useRef } from 'react'
import { useResponsive } from '../../hooks/useResponsive'
import { weaponsData, type Weapon, type WeaponType } from '../../data/weapons'
import { attachmentsData, type AttachmentType } from '../../data/attachments'

/**
 * Type pour les méthodes de tri des armes
 */
type FilterType = 'alphabetical' | 'price'

/**
 * Liste complète des armes disponibles
 */
const weapons: Weapon[] = weaponsData

/**
 * Props du module Armory
 */
interface ArmoryModuleProps {
  onClose?: () => void
  onPreviewStateChange?: (isOpen: boolean, closePreview: () => void) => void
}

/**
 * Module Armory - Gestionnaire d'armes et d'attachments
 * Permet de parcourir les armes, les filtrer, les trier et les prévisualiser
 * Gère l'équipement d'attachments sur les armes avec prévisualisation 3D
 * Layout responsive avec adaptation mobile/tablet/desktop
 * 
 * @param onClose - Callback optionnel appelé pour fermer le module
 * @param onPreviewStateChange - Callback pour notifier le Dashboard de l'état du preview
 */
export default function ArmoryModule({ onClose, onPreviewStateChange }: ArmoryModuleProps = {}) {
  const { isMobile, isTablet, isSmallMobile, isTinyMobile, isDesktop } = useResponsive()
  
  // États de filtrage et sélection
  const [selectedWeaponType, setSelectedWeaponType] = useState<WeaponType>('primary') // Type d'arme sélectionné
  const [selectedCategory, setSelectedCategory] = useState<string>('all') // Catégorie pour les armes principales ('all', 'SMG', 'AR', 'SR', 'SG', 'MG')
  const [filter, setFilter] = useState<FilterType>('alphabetical') // Méthode de tri
  
  // États de prévisualisation et interaction
  const [previewWeapon, setPreviewWeapon] = useState<Weapon | null>(null) // Arme en prévisualisation
  const [hoveredWeaponId, setHoveredWeaponId] = useState<string | null>(null) // ID de l'arme survolée
  const [hoveredAttachmentId, setHoveredAttachmentId] = useState<string | null>(null) // ID de l'attachment survolé (équipé)
  const [hoveredAvailableAttachmentId, setHoveredAvailableAttachmentId] = useState<string | null>(null) // ID de l'attachment disponible survolé
  const [clickedWeaponId, setClickedWeaponId] = useState<string | null>(null) // ID de l'arme cliquée (pour afficher le bouton preview)
  const [attachmentTooltip, setAttachmentTooltip] = useState<{ attachmentId: string; x: number; y: number; side: 'left' | 'right' } | null>(null) // Tooltip d'attachment
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null) // Timeout pour le tooltip
  
  /**
   * État des attachments équipés sur l'arme en prévisualisation
   * Chaque clé correspond à un type d'attachment (body = skin de l'arme)
   */
  const [equippedAttachments, setEquippedAttachments] = useState<{
    body?: string // ID du skin sélectionné
    sight?: string
    aimAssist?: string
    barrel?: string
    muzzle?: string
    magazine?: string
    grip?: string
    bipod?: string
  }>({})
  
  /**
   * Type d'attachment actuellement sélectionné pour afficher la liste des options
   * null si aucun type n'est sélectionné
   */
  const [selectedAttachmentType, setSelectedAttachmentType] = useState<AttachmentType | 'body' | null>(null)

  /**
   * Filtre les armes selon le type sélectionné (primary, secondary, melee)
   * Mémorisé pour éviter les recalculs
   */
  const filteredWeaponsByType = useMemo(() => {
    return weapons.filter(weapon => weapon.type === selectedWeaponType)
  }, [selectedWeaponType])

  /**
   * Filtre les armes par catégorie (uniquement pour les armes principales)
   * Si le type n'est pas 'primary' ou si la catégorie est 'all', retourne toutes les armes du type
   * Mémorisé pour éviter les recalculs
   */
  const filteredWeaponsByCategory = useMemo(() => {
    if (selectedWeaponType !== 'primary' || selectedCategory === 'all') {
      return filteredWeaponsByType
    }
    return filteredWeaponsByType.filter(weapon => weapon.category === selectedCategory)
  }, [filteredWeaponsByType, selectedCategory, selectedWeaponType])

  /**
   * Trie les armes selon le filtre sélectionné (alphabétique ou par prix)
   * Mémorisé pour éviter les recalculs
   */
  const sortedWeapons = useMemo(() => {
    const weaponsToSort = [...filteredWeaponsByCategory]
    
    switch (filter) {
      case 'alphabetical':
        return weaponsToSort.sort((a, b) => a.name.localeCompare(b.name))
      case 'price':
        return weaponsToSort.sort((a, b) => a.price - b.price)
      default:
        return weaponsToSort
    }
  }, [filteredWeaponsByCategory, filter])

  /**
   * Liste des catégories disponibles pour les armes principales
   */
  const categories = ['all', 'SMG', 'AR', 'SR', 'SG', 'MG']

  /**
   * Handlers pour les interactions avec les armes
   */
  
  /**
   * Gère le survol d'une arme (pour l'effet de highlight)
   * 
   * @param weapon - Arme survolée
   */
  const handleWeaponHover = (weapon: Weapon) => {
    setHoveredWeaponId(weapon.id)
  }

  /**
   * Réinitialise l'état de survol quand la souris quitte une arme
   */
  const handleWeaponLeave = () => {
    setHoveredWeaponId(null)
  }

  /**
   * Ouvre le preview d'une arme avec ses attachments
   * 
   * @param weapon - Arme à prévisualiser
   */
  const handlePreview = (weapon: Weapon) => {
    setPreviewWeapon(weapon)
  }

  /**
   * Gère le clic sur une arme
   * Bascule l'affichage du bouton preview (affiche/cache)
   * 
   * @param weapon - Arme cliquée
   */
  const handleWeaponClick = (weapon: Weapon) => {
    if (clickedWeaponId === weapon.id) {
      // Si l'arme est déjà cliquée, fermer le bouton
      setClickedWeaponId(null)
    } else {
      // Sinon, marquer l'arme comme cliquée pour afficher le bouton
      setClickedWeaponId(weapon.id)
    }
  }

  /**
   * Ferme le preview et réinitialise les attachments équipés
   */
  const handleClosePreview = () => {
    setPreviewWeapon(null)
    setEquippedAttachments({})
    setSelectedAttachmentType(null)
  }

  /**
   * Notifie le Dashboard de l'état du preview
   * Permet au Dashboard de gérer la fermeture du preview avec Échap
   */
  useEffect(() => {
    if (onPreviewStateChange) {
      onPreviewStateChange(!!previewWeapon, handleClosePreview)
    }
  }, [previewWeapon, onPreviewStateChange])

  /**
   * Écoute la touche Échap pour fermer le preview ou le module
   * Priorité au preview : si ouvert, ferme seulement le preview
   * Sinon, ferme le module entier
   * L'événement est capturé avec capture phase pour intercepter avant le Dashboard
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (previewWeapon) {
          event.stopPropagation() // Empêcher la propagation vers le Dashboard
          event.preventDefault() // Empêcher le comportement par défaut
          handleClosePreview()
        } else if (onClose) {
          event.stopPropagation()
          event.preventDefault()
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown, true) // Utiliser capture phase pour intercepter avant Dashboard
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [previewWeapon, onClose])
  
  /**
   * Formate les statistiques d'un attachment pour l'affichage
   * Retourne un tableau de paires label/valeur avec couleur
   * Adapte le format selon le type d'attachment
   * 
   * @param attachmentId - ID de l'attachment à formater
   * @returns Tableau des statistiques formatées
   */
  const formatAttachmentStats = (attachmentId: string | undefined): Array<{ label: string; value: string; color: string }> => {
    if (!attachmentId) return []
    
    const attachment = attachmentsData.find(a => a.id === attachmentId)
    if (!attachment) return []
    
    const stats: Array<{ label: string; value: string; color: string }> = []
    
    // Formater les stats selon le type d'attachment
    // Sight attachments
    if (attachment.type === 'sight') {
      if (attachment.variableZoom !== undefined) {
        stats.push({ label: 'VARIABLE ZOOM:', value: attachment.variableZoom ? 'On' : 'Off', color: '#ff8800' })
      }
      if (attachment.zoom !== undefined) {
        stats.push({ label: 'ZOOM:', value: `${attachment.zoom}x`, color: '#ff8800' })
      }
      if (attachment.aimSpeed !== undefined) {
        stats.push({ label: 'AIM SPEED:', value: `${attachment.aimSpeed}s`, color: '#ff8800' })
      }
    }
    
    // Aim Assist attachments
    if (attachment.type === 'aim-assist') {
      if (attachment.attachmentType === 'Laser Sight' && attachment.laserColor !== undefined) {
        stats.push({ label: 'LASER TYPE:', value: attachment.laserColor, color: '#ff8800' })
      }
      if (attachment.accuracyBonus !== undefined) {
        const color = attachment.accuracyBonus >= 0 ? '#ff8800' : '#ff0000'
        stats.push({ label: 'ACCURACY:', value: `${attachment.accuracyBonus >= 0 ? '+' : ''}${attachment.accuracyBonus}`, color })
      }
      if (attachment.movementSpeedBonus !== undefined) {
        const color = attachment.movementSpeedBonus >= 0 ? '#ff8800' : '#ff0000'
        stats.push({ label: 'MOVEMENT SPEED:', value: `${attachment.movementSpeedBonus >= 0 ? '+' : ''}${attachment.movementSpeedBonus}`, color })
      }
      if (attachment.damageFarthestRange !== undefined) {
        const color = attachment.damageFarthestRange >= 0 ? '#ff8800' : '#ff0000'
        stats.push({ label: 'DAMAGE FARTHEST RANGE:', value: `${attachment.damageFarthestRange >= 0 ? '+' : ''}${attachment.damageFarthestRange}%`, color })
      }
      if (attachment.damageEffectiveRange !== undefined) {
        const color = attachment.damageEffectiveRange >= 0 ? '#ff8800' : '#ff0000'
        stats.push({ label: 'DAMAGE EFFECTIVE RANGE:', value: `${attachment.damageEffectiveRange >= 0 ? '+' : ''}${attachment.damageEffectiveRange}%`, color })
      }
      if (attachment.damageOptimalRange !== undefined) {
        const color = attachment.damageOptimalRange >= 0 ? '#ff8800' : '#ff0000'
        stats.push({ label: 'DAMAGE OPTIMAL RANGE:', value: `${attachment.damageOptimalRange >= 0 ? '+' : ''}${attachment.damageOptimalRange}%`, color })
      }
    }
    
    // Barrel attachments
    if (attachment.type === 'barrel') {
      if (attachment.accuracy !== undefined) {
        const color = attachment.accuracy >= 0 ? '#ff8800' : '#ff0000'
        stats.push({ label: 'ACCURACY:', value: `${attachment.accuracy >= 0 ? '+' : ''}${attachment.accuracy}`, color })
      }
      if (attachment.movementSpeed !== undefined) {
        const color = attachment.movementSpeed >= 0 ? '#ff8800' : '#ff0000'
        stats.push({ label: 'MOVEMENT SPEED:', value: `${attachment.movementSpeed >= 0 ? '+' : ''}${attachment.movementSpeed}`, color })
      }
      if (attachment.damage !== undefined) {
        if (typeof attachment.damage === 'number') {
          const color = attachment.damage >= 0 ? '#ff8800' : '#ff0000'
          stats.push({ label: 'DAMAGE:', value: `${attachment.damage >= 0 ? '+' : ''}${attachment.damage}`, color })
        }
      }
      if (attachment.effectiveRange !== undefined) {
        const color = attachment.effectiveRange >= 0 ? '#ff8800' : '#ff0000'
        stats.push({ label: 'EFFECTIVE RANGE:', value: `${attachment.effectiveRange >= 0 ? '+' : ''}${attachment.effectiveRange}%`, color })
      }
      if (attachment.stability !== undefined) {
        const color = attachment.stability >= 0 ? '#ff8800' : '#ff0000'
        stats.push({ label: 'STABILITY:', value: `${attachment.stability >= 0 ? '+' : ''}${attachment.stability}`, color })
      }
    }
    
    // Muzzle attachments
    if (attachment.type === 'muzzle') {
      if (attachment.attachmentType === 'Flash Guard' && attachment.muzzleType !== undefined) {
        stats.push({ label: 'MUZZLE TYPE:', value: attachment.muzzleType, color: '#ff8800' })
      }
      if (attachment.accuracy !== undefined) {
        const color = attachment.accuracy >= 0 ? '#ff8800' : '#ff0000'
        stats.push({ label: 'ACCURACY:', value: `${attachment.accuracy >= 0 ? '+' : ''}${attachment.accuracy}`, color })
      }
      if (attachment.stability !== undefined) {
        const color = attachment.stability >= 0 ? '#ff8800' : '#ff0000'
        stats.push({ label: 'STABILITY:', value: `${attachment.stability >= 0 ? '+' : ''}${attachment.stability}`, color })
      }
      if (attachment.effectiveRange !== undefined) {
        const color = attachment.effectiveRange >= 0 ? '#ff8800' : '#ff0000'
        stats.push({ label: 'EFFECTIVE RANGE:', value: `${attachment.effectiveRange >= 0 ? '+' : ''}${attachment.effectiveRange}%`, color })
      }
      if (attachment.detectionRange !== undefined) {
        const color = attachment.detectionRange >= 0 ? '#ff8800' : '#ff0000'
        stats.push({ label: 'DETECTION RANGE:', value: `${attachment.detectionRange >= 0 ? '+' : ''}${attachment.detectionRange}m`, color })
      }
    }
    
    // Magazine attachments
    if (attachment.type === 'magazine') {
      if (attachment.movementSpeed !== undefined) {
        const color = attachment.movementSpeed >= 0 ? '#ff8800' : '#ff0000'
        stats.push({ label: 'MOVEMENT SPEED:', value: `${attachment.movementSpeed >= 0 ? '+' : ''}${attachment.movementSpeed}`, color })
      }
      if (attachment.stability !== undefined) {
        const color = attachment.stability >= 0 ? '#ff8800' : '#ff0000'
        stats.push({ label: 'STABILITY:', value: `${attachment.stability >= 0 ? '+' : ''}${attachment.stability}`, color })
      }
      if (attachment.weaponSwap !== undefined) {
        const color = attachment.weaponSwap >= 0 ? '#ff8800' : '#ff0000'
        stats.push({ label: 'WEAPON SWAP:', value: `${attachment.weaponSwap >= 0 ? '+' : ''}${attachment.weaponSwap}`, color })
      }
      if (attachment.expandedMagazine !== undefined) {
        const color = attachment.expandedMagazine >= 0 ? '#ff8800' : '#ff0000'
        stats.push({ label: 'EXPANDED MAGAZINE:', value: `${attachment.expandedMagazine >= 0 ? '+' : ''}${attachment.expandedMagazine}`, color })
      }
    }
    
    // Grip attachments
    if (attachment.type === 'grip') {
      if (attachment.movementSpeed !== undefined) {
        const color = attachment.movementSpeed >= 0 ? '#ff8800' : '#ff0000'
        stats.push({ label: 'MOVEMENT SPEED:', value: `${attachment.movementSpeed >= 0 ? '+' : ''}${attachment.movementSpeed}`, color })
      }
      if (attachment.stability !== undefined) {
        const color = attachment.stability >= 0 ? '#ff8800' : '#ff0000'
        stats.push({ label: 'STABILITY:', value: `${attachment.stability >= 0 ? '+' : ''}${attachment.stability}`, color })
      }
    }
    
    // Bipod attachments
    if (attachment.type === 'bipod') {
      if (attachment.movementSpeed !== undefined) {
        const color = attachment.movementSpeed >= 0 ? '#ff8800' : '#ff0000'
        stats.push({ label: 'MOVEMENT SPEED:', value: `${attachment.movementSpeed >= 0 ? '+' : ''}${attachment.movementSpeed}`, color })
      }
      if (attachment.stability !== undefined) {
        const color = attachment.stability >= 0 ? '#ff8800' : '#ff0000'
        stats.push({ label: 'STABILITY:', value: `${attachment.stability >= 0 ? '+' : ''}${attachment.stability}`, color })
      }
      if (attachment.weaponSwap !== undefined) {
        const color = attachment.weaponSwap >= 0 ? '#ff8800' : '#ff0000'
        stats.push({ label: 'WEAPON SWAP:', value: `${attachment.weaponSwap >= 0 ? '+' : ''}${attachment.weaponSwap}`, color })
      }
    }
    
    return stats
  }
  
  /**
   * Récupère toutes les statistiques d'un attachment pour l'affichage dans un tooltip
   * Utilise formatAttachmentStats pour le formatage
   * 
   * @param attachmentId - ID de l'attachment
   * @returns Tableau des statistiques formatées
   */
  const getAllAttachmentStats = (attachmentId: string | undefined): Array<{ label: string; value: string; color: string }> => {
    if (!attachmentId) return []
    
    const attachment = attachmentsData.find(a => a.id === attachmentId)
    if (!attachment) return []
    
    return formatAttachmentStats(attachmentId)
  }
  
  /**
   * Calcule les statistiques modifiées d'une arme selon les attachments équipés
   * Applique les bonus/malus de chaque attachment aux stats de base
   * Limite les valeurs à 100 maximum
   * 
   * @param weapon - Arme dont on veut calculer les stats modifiées
   * @param attachments - Objet contenant les IDs des attachments équipés
   * @returns Statistiques modifiées de l'arme
   */
  const calculateModifiedStats = (weapon: Weapon, attachments: typeof equippedAttachments) => {
    if (!weapon || weapon.type !== 'primary' || !('accuracy' in weapon.stats)) {
      return weapon.stats
    }
    
    const baseStats = { ...weapon.stats }
    let modifiedStats = { ...baseStats }
    
    // Appliquer les modifications des attachments
    Object.entries(attachments).forEach(([type, attachmentId]) => {
      if (!attachmentId || type === 'body') return
      
      const attachment = attachmentsData.find(a => a.id === attachmentId)
      if (!attachment) return
      
      // Aim Assist
      if (attachment.type === 'aim-assist' && 'accuracyBonus' in attachment) {
        modifiedStats.accuracy = Math.min(100, modifiedStats.accuracy + (attachment.accuracyBonus || 0))
      }
      
      // Barrel
      if (attachment.type === 'barrel') {
        if (attachment.accuracy) modifiedStats.accuracy = Math.min(100, modifiedStats.accuracy + attachment.accuracy)
        if (attachment.stability) modifiedStats.stability = Math.min(100, modifiedStats.stability + attachment.stability)
        if (attachment.damage) {
          if (typeof attachment.damage === 'number') {
            modifiedStats.damage = Math.min(100, modifiedStats.damage + attachment.damage)
          } else if (weapon.category) {
            const damageBonus = attachment.damage[weapon.category.toLowerCase() as 'ar' | 'lmg' | 'smg' | 'sr'] || 0
            modifiedStats.damage = Math.min(100, modifiedStats.damage + damageBonus)
          }
        }
      }
      
      // Muzzle
      if (attachment.type === 'muzzle') {
        if (attachment.accuracy) modifiedStats.accuracy = Math.min(100, modifiedStats.accuracy + attachment.accuracy)
        if (attachment.stability) modifiedStats.stability = Math.min(100, modifiedStats.stability + attachment.stability)
      }
      
      // Grip
      if (attachment.type === 'grip') {
        if (attachment.stability) modifiedStats.stability = Math.min(100, modifiedStats.stability + attachment.stability)
      }
      
      // Bipod
      if (attachment.type === 'bipod') {
        if (attachment.stability) modifiedStats.stability = Math.min(100, modifiedStats.stability + attachment.stability)
      }
      
      // Magazine
      if (attachment.type === 'magazine') {
        if (attachment.stability) modifiedStats.stability = Math.min(100, modifiedStats.stability + attachment.stability)
        if (attachment.expandedMagazine && 'magazineSize' in modifiedStats) {
          modifiedStats.magazineSize = modifiedStats.magazineSize + attachment.expandedMagazine
        }
      }
    })
    
    return modifiedStats
  }
  
  // Obtenir les stats modifiées
  const modifiedStats = previewWeapon ? calculateModifiedStats(previewWeapon, equippedAttachments) : null
  
  // Obtenir l'image de l'arme (avec skin si sélectionné)
  const getWeaponImage = (weapon: Weapon) => {
    if (equippedAttachments.body && weapon.skins) {
      const selectedSkin = weapon.skins.find(skin => skin.label === equippedAttachments.body)
      if (selectedSkin) return selectedSkin.src
    }
    return weapon.image
  }
  
  /**
   * Récupère les attachments disponibles pour un type donné
   * Filtre les attachments selon le type et la compatibilité avec l'arme
   * 
   * @param type - Type d'attachment recherché
   * @returns Liste des attachments disponibles avec id, name et image
   */
  const getAvailableAttachments = (type: AttachmentType | 'body'): Array<{ id: string; name: string; image: string }> => {
    if (!previewWeapon || previewWeapon.type !== 'primary') {
      return []
    }
    
    if (type === 'body') {
      return (previewWeapon.skins || []).map(skin => ({ id: skin.label, name: skin.label, image: skin.src }))
    }
    
    const attachmentKey = type === 'aim-assist' ? 'aimAssist' :
      type === 'sight' ? 'sight' :
      type === 'barrel' ? 'barrel' :
      type === 'muzzle' ? 'muzzle' :
      type === 'magazine' ? 'magazine' :
      type === 'grip' ? 'grip' :
      type === 'bipod' ? 'bipod' : 'sight'
    
    const compatibleIds = previewWeapon.compatibleAttachments?.[attachmentKey] || []
    
    return attachmentsData
      .filter(attachment => {
        const matchesType = attachment.type === type
        const matchesId = compatibleIds.includes(attachment.id)
        return matchesType && matchesId
      })
      .map(attachment => ({ id: attachment.id, name: attachment.name, image: attachment.image }))
  }

  return (
    <>
      {/* Styles pour la barre de scroll personnalisée */}
      <style>{`
        .armory-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .armory-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 4px;
        }
        .armory-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 0, 102, 0.2);
          border-radius: 4px;
        }
        .armory-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 0, 102, 0.4);
        }
        .armory-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 0, 102, 0.2) transparent;
        }
        
        @keyframes scanlines {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(4px);
          }
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'monospace',
          color: 'rgba(0, 212, 255, 1)',
        }}
      >
      {/* Contenu principal */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          overflow: 'hidden',
        }}
      >
        {/* Sidebar - Types d'armes */}
        <div
            className="armory-scrollbar"
            style={{
              width: isMobile ? '100%' : '200px',
              borderRight: 'none',
              borderBottom: 'none',
              padding: 0,
              paddingTop: '3.25rem',
              display: 'flex',
              flexDirection: isMobile ? 'row' : 'column',
              gap: '0.5rem',
              overflowX: isMobile ? 'auto' : 'visible',
              position: 'relative',
            }}
        >
          {/* Bordure qui commence à partir des boutons */}
          {!isMobile && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '3.25rem',
                bottom: 0,
                width: '1px',
                background: 'rgba(0, 212, 255, 0.3)',
                pointerEvents: 'none',
              }}
            />
          )}
          {isMobile && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: '1px',
                background: 'rgba(0, 212, 255, 0.3)',
                pointerEvents: 'none',
              }}
            />
          )}
          {(['primary', 'secondary', 'melee', 'throwable'] as WeaponType[]).map((type, index, array) => {
            const isFirst = index === 0
            const isLast = index === array.length - 1
            return (
            <button
              key={type}
              onClick={() => {
                setSelectedWeaponType(type)
                setSelectedCategory('all')
              }}
              style={{
                padding: '0.75rem 1rem',
                background: selectedWeaponType === type
                  ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.15) 0%, rgba(0, 212, 255, 0.25) 100%)'
                  : 'rgba(0, 0, 0, 0.4)',
                border: 'none',
                borderLeft: 'none',
                borderTop: isFirst ? 'none' : '1px solid rgba(255, 255, 255, 0.5)',
                borderBottom: isLast ? 'none' : '1px solid rgba(255, 255, 255, 0.5)',
                borderRight: selectedWeaponType === type
                  ? '5px solid rgba(255, 0, 102, 0.4)'
                  : '5px solid transparent',
                color: selectedWeaponType === type
                  ? 'rgba(0, 212, 255, 1)'
                  : 'rgba(0, 212, 255, 0.7)',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                fontWeight: 'normal',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                position: 'relative',
                textAlign: 'right',
                width: '100%',
                boxSizing: 'border-box',
                textShadow: selectedWeaponType === type
                  ? '0 0 8px rgba(0, 212, 255, 0.6)'
                  : 'none',
                boxShadow: selectedWeaponType === type
                  ? 'inset 0 0 10px rgba(0, 212, 255, 0.1)'
                  : 'none',
              }}
              onMouseEnter={(e) => {
                if (selectedWeaponType !== type) {
                  e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)'
                  e.currentTarget.style.color = 'rgba(0, 212, 255, 0.9)'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedWeaponType !== type) {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)'
                  e.currentTarget.style.color = 'rgba(0, 212, 255, 0.7)'
                }
              }}
            >
              {type === 'primary' ? 'Principale' :
               type === 'secondary' ? 'Secondaire' :
               type === 'melee' ? 'Mélée' :
               'Jetable'}
            </button>
            )
          })}
        </div>

        {/* Zone principale */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            paddingTop: isMobile ? '0.5rem' : '1rem',
          }}
        >
          {/* Catégories et Filtres */}
          <div
            className="armory-scrollbar"
            style={{
              padding: '0rem',
              borderBottom: '1px solid rgba(0, 212, 255, 0.3)',
              display: 'flex',
              gap: 0,
              alignItems: 'stretch',
              flexWrap: isMobile ? 'wrap' : 'nowrap',
              overflowX: 'auto',
              flexShrink: 0,
              minHeight: 'fit-content',
            }}
          >
            {/* Catégories (seulement pour armes principales) */}
            {selectedWeaponType === 'primary' && (
              <div
                style={{
                  display: 'flex',
                  gap: 0,
                  flexWrap: 'nowrap',
                  flex: '0 0 75%',
                  width: '75%',
                  minWidth: 0,
                  overflow: 'hidden',
                }}
              >
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      flex: '1 1 0',
                      minWidth: 0,
                      padding: '0.6rem 0.5rem',
                      background: selectedCategory === cat
                        ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.15) 0%, rgba(0, 212, 255, 0.25) 100%)'
                        : 'rgba(0, 0, 0, 0.4)',
                      border: 'none',
                      borderTop: 'none',
                      borderBottom: 'none',
                      borderLeft: `3px solid ${
                        selectedCategory === cat
                          ? 'rgba(255, 255, 255, 0.6)'
                          : 'transparent'
                      }`,
                      borderRight: `3px solid ${
                        selectedCategory === cat
                          ? 'rgba(255, 255, 255, 0.6)'
                          : 'transparent'
                      }`,
                      boxSizing: 'border-box',
                      color: selectedCategory === cat
                        ? 'rgba(0, 212, 255, 1)'
                        : 'rgba(0, 212, 255, 0.7)',
                      cursor: 'pointer',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      transition: 'border-color 0.3s ease, background 0.3s ease, color 0.3s ease',
                      boxShadow: selectedCategory === cat
                        ? 'inset 0 1px 2px rgba(255, 255, 255, 0.1), 0 0 8px rgba(0, 212, 255, 0.2)'
                        : 'none',
                      textShadow: selectedCategory === cat
                        ? '0 0 6px rgba(0, 212, 255, 0.5)'
                        : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCategory !== cat) {
                        e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)'
                        e.currentTarget.style.borderLeftColor = 'rgba(255, 255, 255, 0.4)'
                        e.currentTarget.style.borderRightColor = 'rgba(255, 255, 255, 0.4)'
                        e.currentTarget.style.color = 'rgba(0, 212, 255, 0.9)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCategory !== cat) {
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)'
                        e.currentTarget.style.borderLeftColor = 'transparent'
                        e.currentTarget.style.borderRightColor = 'transparent'
                        e.currentTarget.style.color = 'rgba(0, 212, 255, 0.7)'
                      }
                    }}
                  >
                    {cat === 'all' ? 'Tout' : cat}
                  </button>
                ))}
              </div>
            )}

            {/* Filtre Select */}
            <div
              style={{
                display: 'flex',
                alignItems: 'stretch',
                flex: '0 0 25%',
                minWidth: 0,
              }}
            >
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid rgba(255, 255, 255, 0.5)',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.5)',
                  borderLeft: '1px solid rgba(255, 255, 255, 0.4)',
                  borderRight: '1px solid rgba(255, 255, 255, 0.4)',
                  color: 'rgba(0, 212, 255, 1)',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.1), 0 0 8px rgba(255, 255, 255, 0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)'
                  e.currentTarget.style.borderTopColor = 'rgba(255, 255, 255, 0.8)'
                  e.currentTarget.style.borderBottomColor = 'rgba(255, 255, 255, 0.8)'
                  e.currentTarget.style.borderLeftColor = 'rgba(255, 255, 255, 0.7)'
                  e.currentTarget.style.borderRightColor = 'rgba(255, 255, 255, 0.7)'
                  e.currentTarget.style.background = 'rgba(0, 212, 255, 0.15)'
                  e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(255, 255, 255, 0.2), 0 0 12px rgba(255, 255, 255, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                  e.currentTarget.style.borderTopColor = 'rgba(255, 255, 255, 0.5)'
                  e.currentTarget.style.borderBottomColor = 'rgba(255, 255, 255, 0.5)'
                  e.currentTarget.style.borderLeftColor = 'rgba(255, 255, 255, 0.4)'
                  e.currentTarget.style.borderRightColor = 'rgba(255, 255, 255, 0.4)'
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)'
                  e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(255, 255, 255, 0.1), 0 0 8px rgba(255, 255, 255, 0.1)'
                }}
              >
                <option value="alphabetical" style={{ background: '#000', color: 'rgba(0, 212, 255, 1)' }}>Alphabétique</option>
                <option value="price" style={{ background: '#000', color: 'rgba(0, 212, 255, 1)' }}>Prix GP</option>
              </select>
            </div>
          </div>

          {/* Liste des armes - Scrollable */}
          <div
            className="armory-scrollbar"
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '1rem',
              paddingRight: 'calc(1rem - 8px)',
              display: 'grid',
              gridTemplateColumns: isMobile
                ? 'repeat(auto-fill, minmax(150px, 1fr))'
                : isTablet
                ? 'repeat(auto-fill, minmax(180px, 1fr))'
                : 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.5rem',
              scrollbarGutter: 'stable',
              minHeight: 0,
              alignContent: 'start',
              alignItems: 'start',
            }}
          >
            {sortedWeapons.map((weapon) => (
              <div
                key={weapon.id}
                onMouseEnter={() => handleWeaponHover(weapon)}
                onMouseLeave={handleWeaponLeave}
                onClick={() => handleWeaponClick(weapon)}
                style={{
                  position: 'relative',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid transparent',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                  borderColor: hoveredWeaponId === weapon.id || clickedWeaponId === weapon.id
                    ? '#ff0066'
                    : 'transparent',
                  boxShadow: hoveredWeaponId === weapon.id || clickedWeaponId === weapon.id
                    ? '0 0 20px rgba(255, 0, 102, 0.4)'
                    : 'none',
                  overflow: 'visible',
                  maxHeight: isMobile ? '200px' : '200px',
                }}
              >
                {/* Nom de l'arme */}
                <div
                  style={{
                    fontSize: isMobile ? '0.75rem' : '0.85rem',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem',
                    margin: '-0.5rem',
                    color: '#ffffff',
                    
                    background: hoveredWeaponId === weapon.id || clickedWeaponId === weapon.id
                      ? 'rgba(255, 0, 102, 0.5)'
                      : '#0c1a21',
                    padding: '0.25rem 0.5rem',
                    transition: 'background 0.3s ease',
                  }}
                >
                  {weapon.name}
                </div>

                {/* Scanlines au hover - Derrière l'image */}
                {hoveredWeaponId === weapon.id && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255, 0, 102, 0.08) 2px, rgba(255, 0, 102, 0.08) 4px)',
                      pointerEvents: 'none',
                      zIndex: 1,
                      borderRadius: '4px',
                    }}
                    className="animate-scanlines"
                  />
                )}
                
                {/* Image de l'arme */}
                <div
                  style={{
                    width: '100%',
                    height: isMobile ? '140px' : '160px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    marginBottom: clickedWeaponId === weapon.id ? '0.25rem' : '0.5rem',
                    overflow: 'hidden',
                    transition: 'margin-bottom 0.3s ease',
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  <img
                    src={weapon.image}
                    alt={weapon.name}
                    draggable={false}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                      objectPosition: 'center',
                      display: 'block',
                    }}
                    onError={(e) => {
                      // Placeholder si l'image n'existe pas
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMDBkNGZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QVJNRTwvdGV4dD48L3N2Zz4='
                    }}
                  />
                </div>

                {/* Prix */}
                <div
                  style={{
                    fontSize: '0.9rem',
                    color: 'rgba(0, 212, 255, 0.7)',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'transform 0.3s ease',
                    transform: clickedWeaponId === weapon.id ? 'translateY(-2.5rem)' : 'translateY(-0.5rem)',
                  }}
                >
                  {weapon.price === 0 ? (
                    <span style={{ 
                      fontSize: '0.75rem',
                      color: 'rgba(0, 255, 132, 0.9)',
                      textTransform: 'uppercase',
                      fontWeight: 'bold',
                    }}>
                      Défaut
                    </span>
                  ) : (
                    <>
                      <img
                        src="/images/ui/GP.png"
                        alt="GP"
                        draggable={false}
                        style={{
                          width: '18px',
                          height: '18px',
                          objectFit: 'contain',
                        }}
                      />
                      {weapon.price.toLocaleString()}
                    </>
                  )}
                </div>

                {/* Bouton Preview - Affiché seulement si l'arme est cliquée */}
                {clickedWeaponId === weapon.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePreview(weapon)
                    }}
                    style={{
                      position: 'absolute',
                      bottom: '0rem',
                      left: '0rem',
                      right: '0rem',
                      width: '100%',
                      padding: '0.5rem',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      color: '#ffffff',
                      background: 'rgba(255, 0, 102, 0.8)',
                      border: '1px solid #ff0066',
                      cursor: 'pointer',
                      transition: 'background 0.3s ease, opacity 0.3s ease, transform 0.3s ease',
                      opacity: clickedWeaponId === weapon.id ? 1 : 0,
                      transform: clickedWeaponId === weapon.id ? 'translateY(0)' : 'translateY(-10px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                      pointerEvents: 'auto',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 0, 102, 1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 0, 102, 0.8)'
                    }}
                  >
                    <img
                      src="/images/ui/loupe.svg"
                      alt="Loupe"
                      draggable={false}
                      style={{
                        position: 'absolute',
                        left: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '16px',
                        height: '16px',
                        filter: 'brightness(0) invert(1)',
                        pointerEvents: 'none',
                      }}
                    />
                    Preview
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Preview */}
      {previewWeapon && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'stretch',
            zIndex: 1000,
            padding: 0,
          }}
          onClick={handleClosePreview}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 26, 51, 0.98) 100%)',
              padding: 0,
              width: '100%',
              height: '100%',
              boxShadow: '0 0 50px rgba(0, 212, 255, 0.5)',
              display: 'grid',
              gridTemplateColumns: '1fr',
              gridTemplateRows: previewWeapon.type === 'primary' ? '1fr auto' : '1fr',
              gap: isMobile ? '0.75rem' : isTablet ? '1rem' : '1.5rem',
              overflow: 'auto',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Logo au centre avec opacité */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 0,
                pointerEvents: 'none',
                opacity: 0.1,
                filter: 'blur(2px)',
              }}
            >
              <img
                src="/images/ui/logo.png"
                alt="Section 9"
                draggable={false}
                style={{
                  width: isMobile ? '200px' : isTablet ? '300px' : '400px',
                  height: 'auto',
                  objectFit: 'contain',
                  filter: 'blur(3px) drop-shadow(0 0 20px rgba(0, 212, 255, 0.5)) drop-shadow(0 0 40px rgba(0, 212, 255, 0.3))',
                }}
              />
            </div>
            {/* Colonne gauche : Catégorie, Nom, Description, Stats */}
            <div 
              className="armory-scrollbar"
              style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.15rem' : '0.25rem', padding: isMobile ? '0.75rem' : isTablet ? '1rem' : '1.5rem', overflowY: 'auto', position: 'relative', zIndex: 10 }}
            >
              {/* Catégorie */}
              {previewWeapon.category && (
                <div style={{ fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem', color: 'rgba(0, 212, 255, 0.6)', textTransform: 'uppercase' }}>
                  {previewWeapon.category === 'SMG' ? 'Submachine Gun' :
                   previewWeapon.category === 'AR' ? 'Assault Rifle' :
                   previewWeapon.category === 'SR' ? 'Sniper Rifle' :
                   previewWeapon.category === 'SG' ? 'Shotgun' :
                   previewWeapon.category === 'MG' ? 'Machine Gun' :
                   previewWeapon.category}
                </div>
              )}

              {/* Nom */}
              <h3
                style={{
                  margin: 0,
                  fontSize: isMobile ? '1.1rem' : isTablet ? '1.3rem' : '1.5rem',
                  color: 'rgba(0, 212, 255, 1)',
                  textTransform: 'uppercase',
                }}
              >
                {previewWeapon.name}
              </h3>

              {/* Description */}
              {previewWeapon.description && (
                <p
                  style={{
                    margin: 0,
                    marginBottom: isMobile ? '0.5rem' : isTablet ? '0.75rem' : '1rem',
                    fontSize: isMobile ? '0.7rem' : isTablet ? '0.8rem' : '0.9rem',
                    color: 'rgba(0, 212, 255, 0.9)',
                    lineHeight: isMobile ? '1.4' : isTablet ? '1.5' : '1.6',
                    maxWidth: '100%',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    padding: isMobile ? '0.25rem 0' : isTablet ? '0.35rem 0' : '0.5rem 0',
                  }}
                >
                  {previewWeapon.description}
                </p>
              )}

              {/* Stats */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.3rem' : isTablet ? '0.4rem' : '0.6rem' }}>
                {/* Damage - Toujours affiché */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem',
                  }}
                >
                  <span style={{ minWidth: '90px' }}>Damage</span>
                  <div
                    style={{
                      width: '33%',
                      height: isMobile ? '4px' : '6px',
                      background: 'rgba(0, 212, 255, 0.1)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {/* Barre de base */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: `${previewWeapon.stats.damage}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #00ff84, #00d4ff)',
                        transition: 'width 0.5s ease',
                      }}
                    />
                    {/* Barre orange pour augmentation */}
                    {modifiedStats && modifiedStats.damage > previewWeapon.stats.damage && (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${previewWeapon.stats.damage}%`,
                          top: 0,
                          width: `${modifiedStats.damage - previewWeapon.stats.damage}%`,
                          height: '100%',
                          background: '#ff8800',
                          transition: 'width 0.5s ease, left 0.5s ease',
                        }}
                      />
                    )}
                    {/* Barre rouge pour diminution */}
                    {modifiedStats && modifiedStats.damage < previewWeapon.stats.damage && (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${modifiedStats.damage}%`,
                          top: 0,
                          width: `${previewWeapon.stats.damage - modifiedStats.damage}%`,
                          height: '100%',
                          background: '#ff0000',
                          transition: 'width 0.5s ease, left 0.5s ease',
                        }}
                      />
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', minWidth: '90px' }}>
                    <span>{modifiedStats ? modifiedStats.damage : previewWeapon.stats.damage}</span>
                    {modifiedStats && modifiedStats.damage !== previewWeapon.stats.damage && (
                      <span style={{ 
                        color: modifiedStats.damage > previewWeapon.stats.damage ? '#ff8800' : '#ff0000',
                        fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.1rem',
                      }}>
                        {modifiedStats.damage > previewWeapon.stats.damage ? '▲' : '▼'}
                        {Math.abs(modifiedStats.damage - previewWeapon.stats.damage)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats pour armes primaires et secondaires */}
                {'accuracy' in previewWeapon.stats && (
                  <>
                    {/* Accuracy */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem',
                      }}
                    >
                      <span style={{ minWidth: '90px' }}>Accuracy</span>
                      <div
                        style={{
                          width: '33%',
                          height: isMobile ? '4px' : '6px',
                          background: 'rgba(0, 212, 255, 0.1)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        {/* Barre de base */}
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: `${previewWeapon.stats.accuracy}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #00ff84, #00d4ff)',
                            transition: 'width 0.5s ease',
                          }}
                        />
                        {/* Barre orange pour augmentation */}
                        {modifiedStats && 'accuracy' in modifiedStats && (modifiedStats.accuracy as number) > previewWeapon.stats.accuracy && (
                          <div
                            style={{
                              position: 'absolute',
                              left: `${previewWeapon.stats.accuracy}%`,
                              top: 0,
                              width: `${(modifiedStats.accuracy as number) - previewWeapon.stats.accuracy}%`,
                              height: '100%',
                              background: '#ff8800',
                              transition: 'width 0.5s ease, left 0.5s ease',
                            }}
                          />
                        )}
                        {/* Barre rouge pour diminution */}
                        {modifiedStats && 'accuracy' in modifiedStats && (modifiedStats.accuracy as number) < previewWeapon.stats.accuracy && (
                          <div
                            style={{
                              position: 'absolute',
                              left: `${modifiedStats.accuracy as number}%`,
                              top: 0,
                              width: `${previewWeapon.stats.accuracy - (modifiedStats.accuracy as number)}%`,
                              height: '100%',
                              background: '#ff0000',
                              transition: 'width 0.5s ease, left 0.5s ease',
                            }}
                          />
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', minWidth: '90px' }}>
                        <span>{modifiedStats && 'accuracy' in modifiedStats ? (modifiedStats.accuracy as number) : previewWeapon.stats.accuracy}</span>
                        {modifiedStats && 'accuracy' in modifiedStats && (modifiedStats.accuracy as number) !== previewWeapon.stats.accuracy && (
                          <span style={{ 
                            color: (modifiedStats.accuracy as number) > previewWeapon.stats.accuracy ? '#ff8800' : '#ff0000',
                            fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.1rem',
                          }}>
                            {(modifiedStats.accuracy as number) > previewWeapon.stats.accuracy ? '▲' : '▼'}
                            {Math.abs((modifiedStats.accuracy as number) - previewWeapon.stats.accuracy)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stability */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem',
                      }}
                    >
                      <span style={{ minWidth: '90px' }}>Stability</span>
                      <div
                        style={{
                          width: '33%',
                          height: isMobile ? '4px' : '6px',
                          background: 'rgba(0, 212, 255, 0.1)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        {/* Barre de base */}
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: `${previewWeapon.stats.stability}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #00ff84, #00d4ff)',
                            transition: 'width 0.5s ease',
                          }}
                        />
                        {/* Barre orange pour augmentation */}
                        {modifiedStats && 'stability' in modifiedStats && (modifiedStats.stability as number) > previewWeapon.stats.stability && (
                          <div
                            style={{
                              position: 'absolute',
                              left: `${previewWeapon.stats.stability}%`,
                              top: 0,
                              width: `${(modifiedStats.stability as number) - previewWeapon.stats.stability}%`,
                              height: '100%',
                              background: '#ff8800',
                              transition: 'width 0.5s ease, left 0.5s ease',
                            }}
                          />
                        )}
                        {/* Barre rouge pour diminution */}
                        {modifiedStats && 'stability' in modifiedStats && (modifiedStats.stability as number) < previewWeapon.stats.stability && (
                          <div
                            style={{
                              position: 'absolute',
                              left: `${modifiedStats.stability as number}%`,
                              top: 0,
                              width: `${previewWeapon.stats.stability - (modifiedStats.stability as number)}%`,
                              height: '100%',
                              background: '#ff0000',
                              transition: 'width 0.5s ease, left 0.5s ease',
                            }}
                          />
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', minWidth: '90px' }}>
                        <span>{modifiedStats && 'stability' in modifiedStats ? (modifiedStats.stability as number) : previewWeapon.stats.stability}</span>
                        {modifiedStats && 'stability' in modifiedStats && (modifiedStats.stability as number) !== previewWeapon.stats.stability && (
                          <span style={{ 
                            color: (modifiedStats.stability as number) > previewWeapon.stats.stability ? '#ff8800' : '#ff0000',
                            fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.1rem',
                          }}>
                            {(modifiedStats.stability as number) > previewWeapon.stats.stability ? '▲' : '▼'}
                            {Math.abs((modifiedStats.stability as number) - previewWeapon.stats.stability)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Fire Rate */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem',
                      }}
                    >
                      <span style={{ minWidth: '90px' }}>Fire Rate</span>
                      <div
                        style={{
                          width: '33%',
                          height: isMobile ? '4px' : '6px',
                          background: 'rgba(0, 212, 255, 0.1)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        {/* Barre de base */}
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: `${previewWeapon.stats.fireRate}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #00ff84, #00d4ff)',
                            transition: 'width 0.5s ease',
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', minWidth: '90px' }}>
                        <span>{previewWeapon.stats.fireRate}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Stats pour armes de mêlée */}
                {previewWeapon.type === 'melee' && 'fireRate' in previewWeapon.stats && !('accuracy' in previewWeapon.stats) && (
                  <>
                    {/* Fire Rate */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem',
                      }}
                    >
                      <span style={{ minWidth: '90px' }}>Fire Rate</span>
                      <div
                        style={{
                          width: '33%',
                          height: isMobile ? '4px' : '6px',
                          background: 'rgba(0, 212, 255, 0.1)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        {/* Barre de base */}
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: `${previewWeapon.stats.fireRate}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #00ff84, #00d4ff)',
                            transition: 'width 0.5s ease',
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', minWidth: '90px' }}>
                        <span>{previewWeapon.stats.fireRate}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Range et Munitions */}
                <div style={{ marginTop: isMobile ? '0.75rem' : '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.4rem' : '0.5rem' }}>
                    {/* Range - Affiché pour primaires, secondaires et mêlée */}
                    {('range' in previewWeapon.stats) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem' }}>
                        <span style={{ minWidth: '90px', color: 'rgba(0, 212, 255, 0.7)' }}>Range</span>
                        <span style={{ color: 'rgba(0, 212, 255, 1)' }}>
                          {previewWeapon.stats.range} m
                        </span>
                      </div>
                    )}

                    {/* Munitions - Format: 30 / 90 */}
                    {'magazineSize' in previewWeapon.stats && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem' }}>
                        <span style={{ minWidth: '90px', color: 'rgba(0, 212, 255, 0.7)' }}>Munitions</span>
                        <span style={{ color: 'rgba(0, 212, 255, 1)' }}>
                          {modifiedStats && 'magazineSize' in modifiedStats 
                            ? (modifiedStats.magazineSize as number)
                            : previewWeapon.stats.magazineSize} / {previewWeapon.stats.totalAmmo}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Attachments équipés */}
                {previewWeapon.type === 'primary' && (
                  <>
                    <div style={{ marginTop: isMobile ? '0.75rem' : '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.35rem' : '0.4rem' }}>
                        {/* Body */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem' }}>
                          <span style={{ minWidth: '90px', color: 'rgba(0, 212, 255, 0.7)' }}>Body</span>
                          <span style={{ color: 'rgba(0, 212, 255, 1)' }}>
                            {equippedAttachments.body || 'Aucun'}
                          </span>
                        </div>

                        {/* Sight */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem' }}>
                          <span style={{ minWidth: '90px', color: 'rgba(0, 212, 255, 0.7)' }}>Sight</span>
                          <span style={{ minWidth: '100px', color: 'rgba(0, 212, 255, 1)' }}>
                            {equippedAttachments.sight 
                              ? attachmentsData.find(a => a.id === equippedAttachments.sight)?.name || 'Aucun'
                              : 'Aucun'}
                          </span>
                          {equippedAttachments.sight && formatAttachmentStats(equippedAttachments.sight).length > 0 && (
                            <span style={{ fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem', color: 'rgba(0, 212, 255, 0.6)' }}>
                              {formatAttachmentStats(equippedAttachments.sight).map((stat, index) => (
                                <span key={index}>
                                  {stat.label} <span style={{ color: stat.color }}>{stat.value}</span>
                                  {index < formatAttachmentStats(equippedAttachments.sight).length - 1 && ' / '}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>

                        {/* Aim Assist */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem' }}>
                          <span style={{ minWidth: '90px', color: 'rgba(0, 212, 255, 0.7)' }}>Aim Assist</span>
                          <span style={{ minWidth: '100px', color: 'rgba(0, 212, 255, 1)' }}>
                            {equippedAttachments.aimAssist 
                              ? attachmentsData.find(a => a.id === equippedAttachments.aimAssist)?.name || 'Aucun'
                              : 'Aucun'}
                          </span>
                          {equippedAttachments.aimAssist && formatAttachmentStats(equippedAttachments.aimAssist).length > 0 && (
                            <span style={{ fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem', color: 'rgba(0, 212, 255, 0.6)' }}>
                              {formatAttachmentStats(equippedAttachments.aimAssist).map((stat, index) => (
                                <span key={index}>
                                  {stat.label} <span style={{ color: stat.color }}>{stat.value}</span>
                                  {index < formatAttachmentStats(equippedAttachments.aimAssist).length - 1 && ' / '}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>

                        {/* Barrel */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem' }}>
                          <span style={{ minWidth: '90px', color: 'rgba(0, 212, 255, 0.7)' }}>Barrel</span>
                          <span style={{ minWidth: '100px', color: 'rgba(0, 212, 255, 1)' }}>
                            {equippedAttachments.barrel 
                              ? attachmentsData.find(a => a.id === equippedAttachments.barrel)?.name || 'Aucun'
                              : 'Aucun'}
                          </span>
                          {equippedAttachments.barrel && formatAttachmentStats(equippedAttachments.barrel).length > 0 && (
                            <span style={{ fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem', color: 'rgba(0, 212, 255, 0.6)' }}>
                              {formatAttachmentStats(equippedAttachments.barrel).map((stat, index) => (
                                <span key={index}>
                                  {stat.label} <span style={{ color: stat.color }}>{stat.value}</span>
                                  {index < formatAttachmentStats(equippedAttachments.barrel).length - 1 && ' / '}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>

                        {/* Muzzle */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem' }}>
                          <span style={{ minWidth: '90px', color: 'rgba(0, 212, 255, 0.7)' }}>Muzzle</span>
                          <span style={{ minWidth: '100px', color: 'rgba(0, 212, 255, 1)' }}>
                            {equippedAttachments.muzzle 
                              ? attachmentsData.find(a => a.id === equippedAttachments.muzzle)?.name || 'Aucun'
                              : 'Aucun'}
                          </span>
                          {equippedAttachments.muzzle && formatAttachmentStats(equippedAttachments.muzzle).length > 0 && (
                            <span style={{ fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem', color: 'rgba(0, 212, 255, 0.6)' }}>
                              {formatAttachmentStats(equippedAttachments.muzzle).map((stat, index) => (
                                <span key={index}>
                                  {stat.label} <span style={{ color: stat.color }}>{stat.value}</span>
                                  {index < formatAttachmentStats(equippedAttachments.muzzle).length - 1 && ' / '}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>

                        {/* Magazine */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem' }}>
                          <span style={{ minWidth: '90px', color: 'rgba(0, 212, 255, 0.7)' }}>Magazine</span>
                          <span style={{ minWidth: '100px', color: 'rgba(0, 212, 255, 1)' }}>
                            {equippedAttachments.magazine 
                              ? attachmentsData.find(a => a.id === equippedAttachments.magazine)?.name || 'Aucun'
                              : 'Aucun'}
                          </span>
                          {equippedAttachments.magazine && formatAttachmentStats(equippedAttachments.magazine).length > 0 && (
                            <span style={{ fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem', color: 'rgba(0, 212, 255, 0.6)' }}>
                              {formatAttachmentStats(equippedAttachments.magazine).map((stat, index) => (
                                <span key={index}>
                                  {stat.label} <span style={{ color: stat.color }}>{stat.value}</span>
                                  {index < formatAttachmentStats(equippedAttachments.magazine).length - 1 && ' / '}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>

                        {/* Grip */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem' }}>
                          <span style={{ minWidth: '90px', color: 'rgba(0, 212, 255, 0.7)' }}>Grip</span>
                          <span style={{ minWidth: '100px', color: 'rgba(0, 212, 255, 1)' }}>
                            {equippedAttachments.grip 
                              ? attachmentsData.find(a => a.id === equippedAttachments.grip)?.name || 'Aucun'
                              : 'Aucun'}
                          </span>
                          {equippedAttachments.grip && formatAttachmentStats(equippedAttachments.grip).length > 0 && (
                            <span style={{ fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem', color: 'rgba(0, 212, 255, 0.6)' }}>
                              {formatAttachmentStats(equippedAttachments.grip).map((stat, index) => (
                                <span key={index}>
                                  {stat.label} <span style={{ color: stat.color }}>{stat.value}</span>
                                  {index < formatAttachmentStats(equippedAttachments.grip).length - 1 && ' / '}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>

                        {/* Bipod */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem' }}>
                          <span style={{ minWidth: '90px', color: 'rgba(0, 212, 255, 0.7)' }}>Bipod</span>
                          <span style={{ minWidth: '100px', color: 'rgba(0, 212, 255, 1)' }}>
                            {equippedAttachments.bipod 
                              ? attachmentsData.find(a => a.id === equippedAttachments.bipod)?.name || 'Aucun'
                              : 'Aucun'}
                          </span>
                          {equippedAttachments.bipod && formatAttachmentStats(equippedAttachments.bipod).length > 0 && (
                            <span style={{ fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem', color: 'rgba(0, 212, 255, 0.6)' }}>
                              {formatAttachmentStats(equippedAttachments.bipod).map((stat, index) => (
                                <span key={index}>
                                  {stat.label} <span style={{ color: stat.color }}>{stat.value}</span>
                                  {index < formatAttachmentStats(equippedAttachments.bipod).length - 1 && ' / '}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
                </div>

                {/* Autres infos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.5rem' : '0.75rem', marginTop: isMobile ? '0.75rem' : '1rem' }}>
                  {/* Stats spécifiques selon le type d'arme */}
                  {'explosionRadius' in previewWeapon.stats ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem' }}>
                      <span style={{ minWidth: '90px', color: 'rgba(0, 212, 255, 0.7)' }}>Zone d'explosion</span>
                      <span style={{ color: 'rgba(0, 212, 255, 1)' }}>{previewWeapon.stats.explosionRadius} m</span>
                    </div>
                  ) : null}
                  {'explosionRadius' in previewWeapon.stats ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem' }}>
                      <span style={{ minWidth: '90px', color: 'rgba(0, 212, 255, 0.7)' }}>Délai de détonation</span>
                      <span style={{ color: 'rgba(0, 212, 255, 1)' }}>{previewWeapon.stats.detonationDelay} sec</span>
                    </div>
                  ) : null}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem' }}>
                    <span style={{ minWidth: '90px', color: 'rgba(0, 212, 255, 0.7)' }}>Prix</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.3rem' : '0.4rem' }}>
                      {previewWeapon.price === 0 ? (
                        <span style={{ 
                          fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem',
                          color: 'rgba(0, 255, 132, 0.9)',
                          textTransform: 'uppercase',
                          fontWeight: 'bold',
                        }}>
                          Par défaut
                        </span>
                      ) : (
                        <>
                          <img
                            src="/images/ui/GP.png"
                            alt="GP"
                            draggable={false}
                            style={{
                              width: '18px',
                              height: '18px',
                              objectFit: 'contain',
                            }}
                          />
                          <span style={{ fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.75rem' }}>{previewWeapon.price.toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Image de l'arme en position absolue */}
            <div
              style={{
                position: 'absolute',
                top: '33%',
                right: '33%',
                bottom: 'auto',
                left: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 5,
                transform: 'translate(50%, -50%)',
              }}
            >
              <img
                src={getWeaponImage(previewWeapon)}
                alt={previewWeapon.name}
                draggable={false}
                style={{
                  width: isMobile ? '250px' : isTablet ? '350px' : '600px',
                  height: isMobile ? '188px' : isTablet ? '263px' : '450px',
                  objectFit: 'contain',
                  objectPosition: 'center',
                }}
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMDBkNGZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QVJNRTwvdGV4dD48L3N2Zz4='
                }}
              />
            </div>
            
            {/* Section Attachments en bas */}
            {previewWeapon.type === 'primary' && (
              <div
                style={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  padding: isMobile ? '1rem' : '1.5rem',
                  alignItems: 'center',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {/* Ligne de labels pour les types d'attachments */}
                <div
                  style={{
                    display: 'flex',
                    gap: isTinyMobile ? '0.25rem' : isSmallMobile ? '0.35rem' : isMobile ? '0.5rem' : isTablet ? '0.4rem' : '0.5rem',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    marginBottom: '-0.25rem',
                    maxWidth: isTinyMobile ? 'calc(4 * 55px + 3 * 0.25rem)' : '100%',
                  }}
                >
                  <div style={{ width: isSmallMobile ? '55px' : isMobile ? '70px' : isTablet ? '80px' : '90px', height: isSmallMobile ? '20px' : isMobile ? '24px' : isTablet ? '27px' : '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isSmallMobile ? '0.5rem' : isMobile ? '0.6rem' : isTablet ? '0.65rem' : '0.75rem', color: 'rgba(0, 212, 255, 0.7)', background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: '4px' }}>Body</div>
                  <div style={{ width: isSmallMobile ? '55px' : isMobile ? '70px' : isTablet ? '80px' : '90px', height: isSmallMobile ? '20px' : isMobile ? '24px' : isTablet ? '27px' : '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isSmallMobile ? '0.5rem' : isMobile ? '0.6rem' : isTablet ? '0.65rem' : '0.75rem', color: 'rgba(0, 212, 255, 0.7)', background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: '4px' }}>Sight</div>
                  <div style={{ width: isSmallMobile ? '55px' : isMobile ? '70px' : isTablet ? '80px' : '90px', height: isSmallMobile ? '20px' : isMobile ? '24px' : isTablet ? '27px' : '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isSmallMobile ? '0.5rem' : isMobile ? '0.6rem' : isTablet ? '0.65rem' : '0.75rem', color: 'rgba(0, 212, 255, 0.7)', background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: '4px' }}>Aim Assist</div>
                  <div style={{ width: isSmallMobile ? '55px' : isMobile ? '70px' : isTablet ? '80px' : '90px', height: isSmallMobile ? '20px' : isMobile ? '24px' : isTablet ? '27px' : '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isSmallMobile ? '0.5rem' : isMobile ? '0.6rem' : isTablet ? '0.65rem' : '0.75rem', color: 'rgba(0, 212, 255, 0.7)', background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: '4px' }}>Barrel</div>
                  <div style={{ width: isSmallMobile ? '55px' : isMobile ? '70px' : isTablet ? '80px' : '90px', height: isSmallMobile ? '20px' : isMobile ? '24px' : isTablet ? '27px' : '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isSmallMobile ? '0.5rem' : isMobile ? '0.6rem' : isTablet ? '0.65rem' : '0.75rem', color: 'rgba(0, 212, 255, 0.7)', background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: '4px' }}>Muzzle</div>
                  <div style={{ width: isSmallMobile ? '55px' : isMobile ? '70px' : isTablet ? '80px' : '90px', height: isSmallMobile ? '20px' : isMobile ? '24px' : isTablet ? '27px' : '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isSmallMobile ? '0.5rem' : isMobile ? '0.6rem' : isTablet ? '0.65rem' : '0.75rem', color: 'rgba(0, 212, 255, 0.7)', background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: '4px' }}>Magazine</div>
                  <div style={{ width: isSmallMobile ? '55px' : isMobile ? '70px' : isTablet ? '80px' : '90px', height: isSmallMobile ? '20px' : isMobile ? '24px' : isTablet ? '27px' : '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isSmallMobile ? '0.5rem' : isMobile ? '0.6rem' : isTablet ? '0.65rem' : '0.75rem', color: 'rgba(0, 212, 255, 0.7)', background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: '4px' }}>Grip</div>
                  <div style={{ width: isSmallMobile ? '55px' : isMobile ? '70px' : isTablet ? '80px' : '90px', height: isSmallMobile ? '20px' : isMobile ? '24px' : isTablet ? '27px' : '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isSmallMobile ? '0.5rem' : isMobile ? '0.6rem' : isTablet ? '0.65rem' : '0.75rem', color: 'rgba(0, 212, 255, 0.7)', background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: '4px' }}>Bipod</div>
                </div>
                
                {/* Première ligne : Attachments équipés */}
                <div
                  style={{
                    display: 'flex',
                    gap: isTinyMobile ? '0.25rem' : isSmallMobile ? '0.35rem' : isMobile ? '0.5rem' : isTablet ? '0.4rem' : '0.5rem',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    maxWidth: isTinyMobile ? 'calc(4 * 55px + 3 * 0.25rem)' : '100%',
                  }}
                >
                  {/* Body (Skins) */}
                  <div
                    onClick={() => setSelectedAttachmentType(selectedAttachmentType === 'body' ? null : 'body')}
                    onMouseEnter={() => {
                      setHoveredAttachmentId('body')
                      // Pour les skins, on ne montre pas de tooltip car ce ne sont pas des attachments
                    }}
                    onMouseLeave={() => {
                      setHoveredAttachmentId(null)
                      setAttachmentTooltip(null)
                    }}
                    style={{
                      width: isSmallMobile ? '55px' : isMobile ? '70px' : isTablet ? '80px' : '90px',
                      height: isSmallMobile ? '43px' : isMobile ? '55px' : isTablet ? '62px' : '70px',
                      background: selectedAttachmentType === 'body' 
                        ? 'rgba(255, 0, 102, 0.3)' 
                        : 'rgba(0, 212, 255, 0.1)',
                      border: selectedAttachmentType === 'body'
                        ? '2px solid rgba(255, 0, 102, 0.8)'
                        : hoveredAttachmentId === 'body'
                        ? '1px solid rgba(255, 0, 102, 0.6)'
                        : '1px solid rgba(0, 212, 255, 0.3)',
                      boxShadow: hoveredAttachmentId === 'body' || selectedAttachmentType === 'body'
                        ? '0 0 15px rgba(255, 0, 102, 0.4)'
                        : 'none',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {/* Scanlines au hover */}
                    {hoveredAttachmentId === 'body' && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255, 0, 102, 0.08) 2px, rgba(255, 0, 102, 0.08) 4px)',
                          pointerEvents: 'none',
                          zIndex: 1,
                          borderRadius: '4px',
                        }}
                      />
                    )}
                    <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {equippedAttachments.body ? (
                        <img
                          src={previewWeapon.skins?.find(skin => skin.label === equippedAttachments.body)?.src || previewWeapon.image}
                          alt={equippedAttachments.body}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.3)', objectPosition: 'center' }}
                          draggable={false}
                        />
                      ) : (
                        <img
                          src={previewWeapon.image}
                          alt={previewWeapon.name}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          draggable={false}
                        />
                      )}
                    </div>
                    <div style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', fontSize: isSmallMobile ? '0.4rem' : isMobile ? '0.45rem' : isTablet ? '0.5rem' : '0.55rem', color: 'rgba(0, 212, 255, 0.9)', textAlign: 'center', width: '100%', padding: '0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: 'rgba(0, 0, 0, 0.6)', borderRadius: '2px', zIndex: 3 }}>
                      {equippedAttachments.body || 'Défaut'}
                    </div>
                  </div>
                  
                  {/* Sight */}
                  <div
                    onClick={() => {
                      if (previewWeapon.compatibleAttachments?.sight) {
                        setSelectedAttachmentType(selectedAttachmentType === 'sight' ? null : 'sight')
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (previewWeapon.compatibleAttachments?.sight && equippedAttachments.sight) {
                        setHoveredAttachmentId('sight')
                        if (isDesktop) {
                          if (tooltipTimeoutRef.current) {
                            clearTimeout(tooltipTimeoutRef.current)
                          }
                          const target = e.currentTarget
                          tooltipTimeoutRef.current = setTimeout(() => {
                            const rect = target.getBoundingClientRect()
                            const tooltipWidth = 350
                            const spaceOnRight = window.innerWidth - rect.right
                            const side = spaceOnRight < tooltipWidth + 20 ? 'left' : 'right'
                            const x = side === 'right' ? rect.right + 7 : rect.left - tooltipWidth - 9
                            const y = rect.top - 38
                            setAttachmentTooltip({ attachmentId: equippedAttachments.sight || '', x, y, side })
                          }, 300)
                        }
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredAttachmentId(null)
                      if (tooltipTimeoutRef.current) {
                        clearTimeout(tooltipTimeoutRef.current)
                        tooltipTimeoutRef.current = null
                      }
                      setAttachmentTooltip(null)
                    }}
                    style={{
                      width: isSmallMobile ? '55px' : isMobile ? '70px' : isTablet ? '80px' : '90px',
                      height: isSmallMobile ? '43px' : isMobile ? '55px' : isTablet ? '62px' : '70px',
                      background: previewWeapon.compatibleAttachments?.sight
                        ? (selectedAttachmentType === 'sight' 
                          ? 'rgba(255, 0, 102, 0.3)' 
                          : 'rgba(0, 212, 255, 0.1)')
                        : 'rgba(50, 50, 50, 0.3)',
                      border: previewWeapon.compatibleAttachments?.sight
                        ? (selectedAttachmentType === 'sight'
                          ? '2px solid rgba(255, 0, 102, 0.8)'
                          : hoveredAttachmentId === 'sight'
                          ? '1px solid rgba(255, 0, 102, 0.6)'
                          : '1px solid rgba(0, 212, 255, 0.3)')
                        : '1px solid rgba(100, 100, 100, 0.3)',
                      boxShadow: (hoveredAttachmentId === 'sight' || selectedAttachmentType === 'sight') && previewWeapon.compatibleAttachments?.sight
                        ? '0 0 15px rgba(255, 0, 102, 0.4)'
                        : 'none',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: previewWeapon.compatibleAttachments?.sight ? 'pointer' : 'not-allowed',
                      opacity: previewWeapon.compatibleAttachments?.sight ? 1 : 0.5,
                      position: 'relative',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {/* Scanlines au hover */}
                    {hoveredAttachmentId === 'sight' && previewWeapon.compatibleAttachments?.sight && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255, 0, 102, 0.08) 2px, rgba(255, 0, 102, 0.08) 4px)',
                          pointerEvents: 'none',
                          zIndex: 1,
                          borderRadius: '4px',
                        }}
                      />
                    )}
                    <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {equippedAttachments.sight && (
                        <img
                          src={attachmentsData.find(a => a.id === equippedAttachments.sight)?.image || ''}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: previewWeapon.compatibleAttachments?.sight ? 1 : 0.3 }}
                          draggable={false}
                        />
                      )}
                    </div>
                    <div style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.55rem', color: previewWeapon.compatibleAttachments?.sight ? 'rgba(0, 212, 255, 0.9)' : 'rgba(150, 150, 150, 0.7)', textAlign: 'center', width: '100%', padding: '0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: 'rgba(0, 0, 0, 0.6)', borderRadius: '2px', zIndex: 3 }}>
                      {equippedAttachments.sight ? attachmentsData.find(a => a.id === equippedAttachments.sight)?.name || 'Aucun' : 'Aucun'}
                    </div>
                  </div>
                  
                  {/* Aim Assist */}
                  <div
                    onClick={() => {
                      if (previewWeapon.compatibleAttachments?.aimAssist) {
                        setSelectedAttachmentType(selectedAttachmentType === 'aim-assist' ? null : 'aim-assist')
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (previewWeapon.compatibleAttachments?.aimAssist && equippedAttachments.aimAssist) {
                        setHoveredAttachmentId('aim-assist')
                        if (isDesktop) {
                          if (tooltipTimeoutRef.current) {
                            clearTimeout(tooltipTimeoutRef.current)
                          }
                          const target = e.currentTarget
                          tooltipTimeoutRef.current = setTimeout(() => {
                            const rect = target.getBoundingClientRect()
                            const tooltipWidth = 350
                            const spaceOnRight = window.innerWidth - rect.right
                            const side = spaceOnRight < tooltipWidth + 20 ? 'left' : 'right'
                            const x = side === 'right' ? rect.right + 9 : rect.left - tooltipWidth - 9
                            const y = rect.top - 38
                            setAttachmentTooltip({ attachmentId: equippedAttachments.aimAssist || '', x, y, side })
                          }, 300)
                        }
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredAttachmentId(null)
                      if (tooltipTimeoutRef.current) {
                        clearTimeout(tooltipTimeoutRef.current)
                        tooltipTimeoutRef.current = null
                      }
                      setAttachmentTooltip(null)
                    }}
                    style={{
                      width: isSmallMobile ? '55px' : isMobile ? '70px' : isTablet ? '80px' : '90px',
                      height: isSmallMobile ? '43px' : isMobile ? '55px' : isTablet ? '62px' : '70px',
                      background: previewWeapon.compatibleAttachments?.aimAssist
                        ? (selectedAttachmentType === 'aim-assist' 
                          ? 'rgba(255, 0, 102, 0.3)' 
                          : 'rgba(0, 212, 255, 0.1)')
                        : 'rgba(50, 50, 50, 0.3)',
                      border: previewWeapon.compatibleAttachments?.aimAssist
                        ? (selectedAttachmentType === 'aim-assist'
                          ? '2px solid rgba(255, 0, 102, 0.8)'
                          : hoveredAttachmentId === 'aim-assist'
                          ? '1px solid rgba(255, 0, 102, 0.6)'
                          : '1px solid rgba(0, 212, 255, 0.3)')
                        : '1px solid rgba(100, 100, 100, 0.3)',
                      boxShadow: (hoveredAttachmentId === 'aim-assist' || selectedAttachmentType === 'aim-assist') && previewWeapon.compatibleAttachments?.aimAssist
                        ? '0 0 15px rgba(255, 0, 102, 0.4)'
                        : 'none',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: previewWeapon.compatibleAttachments?.aimAssist ? 'pointer' : 'not-allowed',
                      opacity: previewWeapon.compatibleAttachments?.aimAssist ? 1 : 0.5,
                      position: 'relative',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {/* Scanlines au hover */}
                    {hoveredAttachmentId === 'aim-assist' && previewWeapon.compatibleAttachments?.aimAssist && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255, 0, 102, 0.08) 2px, rgba(255, 0, 102, 0.08) 4px)',
                          pointerEvents: 'none',
                          zIndex: 1,
                          borderRadius: '4px',
                        }}
                      />
                    )}
                    <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {equippedAttachments.aimAssist && (
                        <img
                          src={attachmentsData.find(a => a.id === equippedAttachments.aimAssist)?.image || ''}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: previewWeapon.compatibleAttachments?.aimAssist ? 1 : 0.3 }}
                          draggable={false}
                        />
                      )}
                    </div>
                    <div style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.55rem', color: previewWeapon.compatibleAttachments?.aimAssist ? 'rgba(0, 212, 255, 0.9)' : 'rgba(150, 150, 150, 0.7)', textAlign: 'center', width: '100%', padding: '0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: 'rgba(0, 0, 0, 0.6)', borderRadius: '2px', zIndex: 3 }}>
                      {equippedAttachments.aimAssist ? attachmentsData.find(a => a.id === equippedAttachments.aimAssist)?.name || 'Aucun' : 'Aucun'}
                    </div>
                  </div>
                  
                  {/* Barrel */}
                  <div
                    onClick={() => {
                      if (previewWeapon.compatibleAttachments?.barrel) {
                        setSelectedAttachmentType(selectedAttachmentType === 'barrel' ? null : 'barrel')
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (previewWeapon.compatibleAttachments?.barrel && equippedAttachments.barrel) {
                        setHoveredAttachmentId('barrel')
                        if (isDesktop) {
                          if (tooltipTimeoutRef.current) {
                            clearTimeout(tooltipTimeoutRef.current)
                          }
                          const target = e.currentTarget
                          tooltipTimeoutRef.current = setTimeout(() => {
                            const rect = target.getBoundingClientRect()
                            const tooltipWidth = 350
                            const spaceOnRight = window.innerWidth - rect.right
                            const side = spaceOnRight < tooltipWidth + 20 ? 'left' : 'right'
                            const x = side === 'right' ? rect.right + 9 : rect.left - tooltipWidth - 9
                            const y = rect.top - 38
                            setAttachmentTooltip({ attachmentId: equippedAttachments.barrel || '', x, y, side })
                          }, 300)
                        }
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredAttachmentId(null)
                      if (tooltipTimeoutRef.current) {
                        clearTimeout(tooltipTimeoutRef.current)
                        tooltipTimeoutRef.current = null
                      }
                      setAttachmentTooltip(null)
                    }}
                    style={{
                      width: isSmallMobile ? '55px' : isMobile ? '70px' : isTablet ? '80px' : '90px',
                      height: isSmallMobile ? '43px' : isMobile ? '55px' : isTablet ? '62px' : '70px',
                      background: previewWeapon.compatibleAttachments?.barrel
                        ? (selectedAttachmentType === 'barrel' 
                          ? 'rgba(255, 0, 102, 0.3)' 
                          : 'rgba(0, 212, 255, 0.1)')
                        : 'rgba(50, 50, 50, 0.3)',
                      border: previewWeapon.compatibleAttachments?.barrel
                        ? (selectedAttachmentType === 'barrel'
                          ? '2px solid rgba(255, 0, 102, 0.8)'
                          : hoveredAttachmentId === 'barrel'
                          ? '1px solid rgba(255, 0, 102, 0.6)'
                          : '1px solid rgba(0, 212, 255, 0.3)')
                        : '1px solid rgba(100, 100, 100, 0.3)',
                      boxShadow: (hoveredAttachmentId === 'barrel' || selectedAttachmentType === 'barrel') && previewWeapon.compatibleAttachments?.barrel
                        ? '0 0 15px rgba(255, 0, 102, 0.4)'
                        : 'none',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: previewWeapon.compatibleAttachments?.barrel ? 'pointer' : 'not-allowed',
                      opacity: previewWeapon.compatibleAttachments?.barrel ? 1 : 0.5,
                      position: 'relative',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {/* Scanlines au hover */}
                    {hoveredAttachmentId === 'barrel' && previewWeapon.compatibleAttachments?.barrel && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255, 0, 102, 0.08) 2px, rgba(255, 0, 102, 0.08) 4px)',
                          pointerEvents: 'none',
                          zIndex: 1,
                          borderRadius: '4px',
                        }}
                      />
                    )}
                    <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {equippedAttachments.barrel && (
                        <img
                          src={attachmentsData.find(a => a.id === equippedAttachments.barrel)?.image || ''}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: previewWeapon.compatibleAttachments?.barrel ? 1 : 0.3 }}
                          draggable={false}
                        />
                      )}
                    </div>
                    <div style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.55rem', color: previewWeapon.compatibleAttachments?.barrel ? 'rgba(0, 212, 255, 0.9)' : 'rgba(150, 150, 150, 0.7)', textAlign: 'center', width: '100%', padding: '0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: 'rgba(0, 0, 0, 0.6)', borderRadius: '2px', zIndex: 3 }}>
                      {equippedAttachments.barrel ? attachmentsData.find(a => a.id === equippedAttachments.barrel)?.name || 'Aucun' : 'Aucun'}
                    </div>
                  </div>
                  
                  {/* Muzzle */}
                  <div
                    onClick={() => {
                      if (previewWeapon.compatibleAttachments?.muzzle) {
                        setSelectedAttachmentType(selectedAttachmentType === 'muzzle' ? null : 'muzzle')
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (previewWeapon.compatibleAttachments?.muzzle && equippedAttachments.muzzle) {
                        setHoveredAttachmentId('muzzle')
                        if (isDesktop) {
                          if (tooltipTimeoutRef.current) {
                            clearTimeout(tooltipTimeoutRef.current)
                          }
                          const target = e.currentTarget
                          tooltipTimeoutRef.current = setTimeout(() => {
                            const rect = target.getBoundingClientRect()
                            const tooltipWidth = 350
                            const spaceOnRight = window.innerWidth - rect.right
                            const side = spaceOnRight < tooltipWidth + 20 ? 'left' : 'right'
                            const x = side === 'right' ? rect.right + 9 : rect.left - tooltipWidth - 9
                            const y = rect.top - 38
                            setAttachmentTooltip({ attachmentId: equippedAttachments.muzzle || '', x, y, side })
                          }, 300)
                        }
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredAttachmentId(null)
                      if (tooltipTimeoutRef.current) {
                        clearTimeout(tooltipTimeoutRef.current)
                        tooltipTimeoutRef.current = null
                      }
                      setAttachmentTooltip(null)
                    }}
                    style={{
                      width: isSmallMobile ? '55px' : isMobile ? '70px' : isTablet ? '80px' : '90px',
                      height: isSmallMobile ? '43px' : isMobile ? '55px' : isTablet ? '62px' : '70px',
                      background: previewWeapon.compatibleAttachments?.muzzle
                        ? (selectedAttachmentType === 'muzzle' 
                          ? 'rgba(255, 0, 102, 0.3)' 
                          : 'rgba(0, 212, 255, 0.1)')
                        : 'rgba(50, 50, 50, 0.3)',
                      border: previewWeapon.compatibleAttachments?.muzzle
                        ? (selectedAttachmentType === 'muzzle'
                          ? '2px solid rgba(255, 0, 102, 0.8)'
                          : hoveredAttachmentId === 'muzzle'
                          ? '1px solid rgba(255, 0, 102, 0.6)'
                          : '1px solid rgba(0, 212, 255, 0.3)')
                        : '1px solid rgba(100, 100, 100, 0.3)',
                      boxShadow: (hoveredAttachmentId === 'muzzle' || selectedAttachmentType === 'muzzle') && previewWeapon.compatibleAttachments?.muzzle
                        ? '0 0 15px rgba(255, 0, 102, 0.4)'
                        : 'none',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: previewWeapon.compatibleAttachments?.muzzle ? 'pointer' : 'not-allowed',
                      opacity: previewWeapon.compatibleAttachments?.muzzle ? 1 : 0.5,
                      position: 'relative',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {/* Scanlines au hover */}
                    {hoveredAttachmentId === 'muzzle' && previewWeapon.compatibleAttachments?.muzzle && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255, 0, 102, 0.08) 2px, rgba(255, 0, 102, 0.08) 4px)',
                          pointerEvents: 'none',
                          zIndex: 1,
                          borderRadius: '4px',
                        }}
                      />
                    )}
                    <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {equippedAttachments.muzzle && (
                        <img
                          src={attachmentsData.find(a => a.id === equippedAttachments.muzzle)?.image || ''}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: previewWeapon.compatibleAttachments?.muzzle ? 1 : 0.3 }}
                          draggable={false}
                        />
                      )}
                    </div>
                    <div style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.55rem', color: previewWeapon.compatibleAttachments?.muzzle ? 'rgba(0, 212, 255, 0.9)' : 'rgba(150, 150, 150, 0.7)', textAlign: 'center', width: '100%', padding: '0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: 'rgba(0, 0, 0, 0.6)', borderRadius: '2px', zIndex: 3 }}>
                      {equippedAttachments.muzzle ? attachmentsData.find(a => a.id === equippedAttachments.muzzle)?.name || 'Aucun' : 'Aucun'}
                    </div>
                  </div>
                  
                  {/* Magazine */}
                  <div
                    onClick={() => {
                      if (previewWeapon.compatibleAttachments?.magazine) {
                        setSelectedAttachmentType(selectedAttachmentType === 'magazine' ? null : 'magazine')
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (previewWeapon.compatibleAttachments?.magazine && equippedAttachments.magazine) {
                        setHoveredAttachmentId('magazine')
                        if (isDesktop) {
                          if (tooltipTimeoutRef.current) {
                            clearTimeout(tooltipTimeoutRef.current)
                          }
                          const target = e.currentTarget
                          tooltipTimeoutRef.current = setTimeout(() => {
                            const rect = target.getBoundingClientRect()
                            const tooltipWidth = 350
                            const spaceOnRight = window.innerWidth - rect.right
                            const side = spaceOnRight < tooltipWidth + 20 ? 'left' : 'right'
                            const x = side === 'right' ? rect.right + 9 : rect.left - tooltipWidth - 9
                            const y = rect.top - 38
                            setAttachmentTooltip({ attachmentId: equippedAttachments.magazine || '', x, y, side })
                          }, 300)
                        }
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredAttachmentId(null)
                      if (tooltipTimeoutRef.current) {
                        clearTimeout(tooltipTimeoutRef.current)
                        tooltipTimeoutRef.current = null
                      }
                      setAttachmentTooltip(null)
                    }}
                    style={{
                      width: isSmallMobile ? '55px' : isMobile ? '70px' : isTablet ? '80px' : '90px',
                      height: isSmallMobile ? '43px' : isMobile ? '55px' : isTablet ? '62px' : '70px',
                      background: previewWeapon.compatibleAttachments?.magazine
                        ? (selectedAttachmentType === 'magazine' 
                          ? 'rgba(255, 0, 102, 0.3)' 
                          : 'rgba(0, 212, 255, 0.1)')
                        : 'rgba(50, 50, 50, 0.3)',
                      border: previewWeapon.compatibleAttachments?.magazine
                        ? (selectedAttachmentType === 'magazine'
                          ? '2px solid rgba(255, 0, 102, 0.8)'
                          : hoveredAttachmentId === 'magazine'
                          ? '1px solid rgba(255, 0, 102, 0.6)'
                          : '1px solid rgba(0, 212, 255, 0.3)')
                        : '1px solid rgba(100, 100, 100, 0.3)',
                      boxShadow: (hoveredAttachmentId === 'magazine' || selectedAttachmentType === 'magazine') && previewWeapon.compatibleAttachments?.magazine
                        ? '0 0 15px rgba(255, 0, 102, 0.4)'
                        : 'none',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: previewWeapon.compatibleAttachments?.magazine ? 'pointer' : 'not-allowed',
                      opacity: previewWeapon.compatibleAttachments?.magazine ? 1 : 0.5,
                      position: 'relative',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {/* Scanlines au hover */}
                    {hoveredAttachmentId === 'magazine' && previewWeapon.compatibleAttachments?.magazine && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255, 0, 102, 0.08) 2px, rgba(255, 0, 102, 0.08) 4px)',
                          pointerEvents: 'none',
                          zIndex: 1,
                          borderRadius: '4px',
                        }}
                      />
                    )}
                    <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {equippedAttachments.magazine && (
                        <img
                          src={attachmentsData.find(a => a.id === equippedAttachments.magazine)?.image || ''}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: previewWeapon.compatibleAttachments?.magazine ? 1 : 0.3 }}
                          draggable={false}
                        />
                      )}
                    </div>
                    <div style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.55rem', color: previewWeapon.compatibleAttachments?.magazine ? 'rgba(0, 212, 255, 0.9)' : 'rgba(150, 150, 150, 0.7)', textAlign: 'center', width: '100%', padding: '0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: 'rgba(0, 0, 0, 0.6)', borderRadius: '2px', zIndex: 3 }}>
                      {equippedAttachments.magazine ? attachmentsData.find(a => a.id === equippedAttachments.magazine)?.name || 'Aucun' : 'Aucun'}
                    </div>
                  </div>
                  
                  {/* Grip */}
                  <div
                    onClick={() => {
                      if (previewWeapon.compatibleAttachments?.grip) {
                        setSelectedAttachmentType(selectedAttachmentType === 'grip' ? null : 'grip')
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (previewWeapon.compatibleAttachments?.grip && equippedAttachments.grip) {
                        setHoveredAttachmentId('grip')
                        if (isDesktop) {
                          if (tooltipTimeoutRef.current) {
                            clearTimeout(tooltipTimeoutRef.current)
                          }
                          const target = e.currentTarget
                          tooltipTimeoutRef.current = setTimeout(() => {
                            const rect = target.getBoundingClientRect()
                            const tooltipWidth = 350
                            const spaceOnRight = window.innerWidth - rect.right
                            const side = spaceOnRight < tooltipWidth + 20 ? 'left' : 'right'
                            const x = side === 'right' ? rect.right + 9 : rect.left - tooltipWidth - 9
                            const y = rect.top - 38
                            setAttachmentTooltip({ attachmentId: equippedAttachments.grip || '', x, y, side })
                          }, 300)
                        }
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredAttachmentId(null)
                      if (tooltipTimeoutRef.current) {
                        clearTimeout(tooltipTimeoutRef.current)
                        tooltipTimeoutRef.current = null
                      }
                      setAttachmentTooltip(null)
                    }}
                    style={{
                      width: isSmallMobile ? '55px' : isMobile ? '70px' : isTablet ? '80px' : '90px',
                      height: isSmallMobile ? '43px' : isMobile ? '55px' : isTablet ? '62px' : '70px',
                      background: previewWeapon.compatibleAttachments?.grip
                        ? (selectedAttachmentType === 'grip' 
                          ? 'rgba(255, 0, 102, 0.3)' 
                          : 'rgba(0, 212, 255, 0.1)')
                        : 'rgba(50, 50, 50, 0.3)',
                      border: previewWeapon.compatibleAttachments?.grip
                        ? (selectedAttachmentType === 'grip'
                          ? '2px solid rgba(255, 0, 102, 0.8)'
                          : hoveredAttachmentId === 'grip'
                          ? '1px solid rgba(255, 0, 102, 0.6)'
                          : '1px solid rgba(0, 212, 255, 0.3)')
                        : '1px solid rgba(100, 100, 100, 0.3)',
                      boxShadow: (hoveredAttachmentId === 'grip' || selectedAttachmentType === 'grip') && previewWeapon.compatibleAttachments?.grip
                        ? '0 0 15px rgba(255, 0, 102, 0.4)'
                        : 'none',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: previewWeapon.compatibleAttachments?.grip ? 'pointer' : 'not-allowed',
                      opacity: previewWeapon.compatibleAttachments?.grip ? 1 : 0.5,
                      position: 'relative',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {/* Scanlines au hover */}
                    {hoveredAttachmentId === 'grip' && previewWeapon.compatibleAttachments?.grip && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255, 0, 102, 0.08) 2px, rgba(255, 0, 102, 0.08) 4px)',
                          pointerEvents: 'none',
                          zIndex: 1,
                          borderRadius: '4px',
                        }}
                      />
                    )}
                    <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {equippedAttachments.grip && (
                        <img
                          src={attachmentsData.find(a => a.id === equippedAttachments.grip)?.image || ''}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: previewWeapon.compatibleAttachments?.grip ? 1 : 0.3 }}
                          draggable={false}
                        />
                      )}
                    </div>
                    <div style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.55rem', color: previewWeapon.compatibleAttachments?.grip ? 'rgba(0, 212, 255, 0.9)' : 'rgba(150, 150, 150, 0.7)', textAlign: 'center', width: '100%', padding: '0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: 'rgba(0, 0, 0, 0.6)', borderRadius: '2px', zIndex: 3 }}>
                      {equippedAttachments.grip ? attachmentsData.find(a => a.id === equippedAttachments.grip)?.name || 'Aucun' : 'Aucun'}
                    </div>
                  </div>
                  
                  {/* Bipod */}
                  <div
                    onClick={() => {
                      if (previewWeapon.compatibleAttachments?.bipod) {
                        setSelectedAttachmentType(selectedAttachmentType === 'bipod' ? null : 'bipod')
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (previewWeapon.compatibleAttachments?.bipod && equippedAttachments.bipod) {
                        setHoveredAttachmentId('bipod')
                        if (isDesktop) {
                          if (tooltipTimeoutRef.current) {
                            clearTimeout(tooltipTimeoutRef.current)
                          }
                          const target = e.currentTarget
                          tooltipTimeoutRef.current = setTimeout(() => {
                            const rect = target.getBoundingClientRect()
                            const tooltipWidth = 350
                            const spaceOnRight = window.innerWidth - rect.right
                            const side = spaceOnRight < tooltipWidth + 20 ? 'left' : 'right'
                            const x = side === 'right' ? rect.right + 9 : rect.left - tooltipWidth - 9
                            const y = rect.top - 38
                            setAttachmentTooltip({ attachmentId: equippedAttachments.bipod || '', x, y, side })
                          }, 300)
                        }
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredAttachmentId(null)
                      if (tooltipTimeoutRef.current) {
                        clearTimeout(tooltipTimeoutRef.current)
                        tooltipTimeoutRef.current = null
                      }
                      setAttachmentTooltip(null)
                    }}
                    style={{
                      width: isSmallMobile ? '55px' : isMobile ? '70px' : isTablet ? '80px' : '90px',
                      height: isSmallMobile ? '43px' : isMobile ? '55px' : isTablet ? '62px' : '70px',
                      background: previewWeapon.compatibleAttachments?.bipod
                        ? (selectedAttachmentType === 'bipod' 
                          ? 'rgba(255, 0, 102, 0.3)' 
                          : 'rgba(0, 212, 255, 0.1)')
                        : 'rgba(50, 50, 50, 0.3)',
                      border: previewWeapon.compatibleAttachments?.bipod
                        ? (selectedAttachmentType === 'bipod'
                          ? '2px solid rgba(255, 0, 102, 0.8)'
                          : hoveredAttachmentId === 'bipod'
                          ? '1px solid rgba(255, 0, 102, 0.6)'
                          : '1px solid rgba(0, 212, 255, 0.3)')
                        : '1px solid rgba(100, 100, 100, 0.3)',
                      boxShadow: (hoveredAttachmentId === 'bipod' || selectedAttachmentType === 'bipod') && previewWeapon.compatibleAttachments?.bipod
                        ? '0 0 15px rgba(255, 0, 102, 0.4)'
                        : 'none',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: previewWeapon.compatibleAttachments?.bipod ? 'pointer' : 'not-allowed',
                      opacity: previewWeapon.compatibleAttachments?.bipod ? 1 : 0.5,
                      position: 'relative',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {/* Scanlines au hover */}
                    {hoveredAttachmentId === 'bipod' && previewWeapon.compatibleAttachments?.bipod && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255, 0, 102, 0.08) 2px, rgba(255, 0, 102, 0.08) 4px)',
                          pointerEvents: 'none',
                          zIndex: 1,
                          borderRadius: '4px',
                        }}
                      />
                    )}
                    <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {equippedAttachments.bipod && (
                        <img
                          src={attachmentsData.find(a => a.id === equippedAttachments.bipod)?.image || ''}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: previewWeapon.compatibleAttachments?.bipod ? 1 : 0.3 }}
                          draggable={false}
                        />
                      )}
                    </div>
                    <div style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.55rem', color: previewWeapon.compatibleAttachments?.bipod ? 'rgba(0, 212, 255, 0.9)' : 'rgba(150, 150, 150, 0.7)', textAlign: 'center', width: '100%', padding: '0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: 'rgba(0, 0, 0, 0.6)', borderRadius: '2px', zIndex: 3 }}>
                      {equippedAttachments.bipod ? attachmentsData.find(a => a.id === equippedAttachments.bipod)?.name || 'Aucun' : 'Aucun'}
                    </div>
                  </div>
                </div>
                
                {/* Deuxième ligne : Liste des attachments disponibles pour le type sélectionné - TOUJOURS VISIBLE */}
                <div
                  style={{
                    display: 'flex',
                    gap: isTinyMobile ? '0.25rem' : isSmallMobile ? '0.35rem' : isMobile ? '0.5rem' : isTablet ? '0.4rem' : '0.5rem',
                    flexWrap: isTinyMobile ? 'wrap' : 'nowrap',
                    justifyContent: 'center',
                    minHeight: isSmallMobile ? '55px' : isMobile ? '70px' : isTablet ? '80px' : '90px',
                    height: isTinyMobile ? 'auto' : (isSmallMobile ? '55px' : isMobile ? '70px' : isTablet ? '80px' : '90px'),
                    alignItems: 'center',
                    maxWidth: isTinyMobile ? 'calc(4 * 55px + 3 * 0.25rem)' : (isSmallMobile ? 'calc(8 * 55px + 7 * 0.35rem)' : isMobile ? 'calc(8 * 70px + 7 * 0.5rem)' : isTablet ? 'calc(8 * 80px + 7 * 0.4rem)' : 'calc(8 * 90px + 7 * 0.5rem)'),
                    overflowX: isTinyMobile ? 'visible' : 'auto',
                    overflowY: 'hidden',
                    width: '100%',
                    margin: '0 auto',
                    padding: '0',
                    marginTop: '-0.5rem',
                    position: 'relative',
                  }}
                  className={isTinyMobile ? '' : 'armory-scrollbar'}
                >
                  {(() => {
                    const slotsCount = 8 // Toujours afficher 8 boîtes
                    let availableAttachments: Array<{ id: string; name: string; image: string }> = []
                    let isCompatible = false
                    
                    if (selectedAttachmentType) {
                      if (selectedAttachmentType === 'body') {
                        availableAttachments = [
                          { id: 'default', name: 'Défaut', image: '' },
                          ...(previewWeapon.skins || []).map(skin => ({ id: skin.label, name: skin.label, image: skin.src }))
                        ]
                        isCompatible = true // Body est toujours compatible
                      } else {
                        // Vérifier si le type d'attachment est compatible avec l'arme
                        const attachmentKey = selectedAttachmentType === 'aim-assist' ? 'aimAssist' :
                          selectedAttachmentType === 'sight' ? 'sight' :
                          selectedAttachmentType === 'barrel' ? 'barrel' :
                          selectedAttachmentType === 'muzzle' ? 'muzzle' :
                          selectedAttachmentType === 'magazine' ? 'magazine' :
                          selectedAttachmentType === 'grip' ? 'grip' :
                          selectedAttachmentType === 'bipod' ? 'bipod' : 'sight'
                        
                        isCompatible = !!(previewWeapon.compatibleAttachments?.[attachmentKey] && previewWeapon.compatibleAttachments[attachmentKey].length > 0)
                        
                        const attachments = getAvailableAttachments(selectedAttachmentType)
                        availableAttachments = [
                          { id: 'none', name: 'Aucun', image: '' },
                          ...attachments
                        ]
                      }
                    }
                    
                    // TOUJOURS afficher le même nombre de boxes (slotsCount)
                    // Remplir les premières avec les attachments disponibles si un type est sélectionné
                    return Array.from({ length: slotsCount }).map((_, index) => {
                      const attachment = availableAttachments[index]
                      
                      if (selectedAttachmentType && attachment) {
                        // Remplir les boxes avec les attachments disponibles
                        if (selectedAttachmentType === 'body') {
                          if (attachment.id === 'default') {
                            return (
                              <div
                                key={`body-default-${index}`}
                                onClick={() => {
                                  setEquippedAttachments({ ...equippedAttachments, body: undefined })
                                  setSelectedAttachmentType(null)
                                }}
                                onMouseEnter={() => setHoveredAvailableAttachmentId(`body-default-${index}`)}
                                onMouseLeave={() => setHoveredAvailableAttachmentId(null)}
                                style={{
                                  width: isSmallMobile ? '55px' : isMobile ? '70px' : isTablet ? '80px' : '90px',
                                  height: isSmallMobile ? '43px' : isMobile ? '55px' : isTablet ? '62px' : '70px',
                                  background: !equippedAttachments.body 
                                    ? 'rgba(255, 0, 102, 0.3)' 
                                    : 'rgba(0, 212, 255, 0.1)',
                                  border: !equippedAttachments.body
                                    ? '2px solid rgba(255, 0, 102, 0.8)'
                                    : hoveredAvailableAttachmentId === `body-default-${index}`
                                    ? '1px solid rgba(255, 0, 102, 0.6)'
                                    : '1px solid rgba(0, 212, 255, 0.3)',
                                  boxShadow: hoveredAvailableAttachmentId === `body-default-${index}` || !equippedAttachments.body
                                    ? '0 0 15px rgba(255, 0, 102, 0.4)'
                                    : 'none',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  flexShrink: 0,
                                  position: 'relative',
                                  transition: 'all 0.3s ease',
                                }}
                              >
                                {/* Scanlines au hover */}
                                {hoveredAvailableAttachmentId === `body-default-${index}` && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      inset: 0,
                                      background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255, 0, 102, 0.08) 2px, rgba(255, 0, 102, 0.08) 4px)',
                                      pointerEvents: 'none',
                                      zIndex: 1,
                                      borderRadius: '4px',
                                    }}
                                  />
                                )}
                                <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <img
                                    src={previewWeapon.image}
                                    alt="Défaut"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    draggable={false}
                                  />
                                </div>
                                <div style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', fontSize: isSmallMobile ? '0.4rem' : isMobile ? '0.45rem' : isTablet ? '0.5rem' : '0.55rem', color: 'rgba(0, 212, 255, 0.9)', textAlign: 'center', width: '100%', padding: '0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: 'rgba(0, 0, 0, 0.6)', borderRadius: '2px', zIndex: 3 }}>
                                  {attachment.name}
                                </div>
                              </div>
                            )
                          } else {
                            return (
                              <div
                                key={`body-${attachment.id}-${index}`}
                                onClick={() => {
                                  setEquippedAttachments({ ...equippedAttachments, body: attachment.id })
                                  setSelectedAttachmentType(null)
                                }}
                                onMouseEnter={() => {
                                  setHoveredAvailableAttachmentId(`body-${attachment.id}-${index}`)
                                  // Pour les skins, on ne montre pas de tooltip car ce ne sont pas des attachments
                                }}
                                onMouseLeave={() => {
                                  setHoveredAvailableAttachmentId(null)
                                  setAttachmentTooltip(null)
                                }}
                                style={{
                                  width: isSmallMobile ? '55px' : isMobile ? '70px' : isTablet ? '80px' : '90px',
                                  height: isSmallMobile ? '43px' : isMobile ? '55px' : isTablet ? '62px' : '70px',
                                  background: equippedAttachments.body === attachment.id 
                                    ? 'rgba(255, 0, 102, 0.3)' 
                                    : 'rgba(0, 212, 255, 0.1)',
                                  border: equippedAttachments.body === attachment.id
                                    ? '2px solid rgba(255, 0, 102, 0.8)'
                                    : hoveredAvailableAttachmentId === `body-${attachment.id}-${index}`
                                    ? '1px solid rgba(255, 0, 102, 0.6)'
                                    : '1px solid rgba(0, 212, 255, 0.3)',
                                  boxShadow: hoveredAvailableAttachmentId === `body-${attachment.id}-${index}` || equippedAttachments.body === attachment.id
                                    ? '0 0 15px rgba(255, 0, 102, 0.4)'
                                    : 'none',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  flexShrink: 0,
                                  position: 'relative',
                                  transition: 'all 0.3s ease',
                                }}
                              >
                                {/* Scanlines au hover */}
                                {hoveredAvailableAttachmentId === `body-${attachment.id}-${index}` && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      inset: 0,
                                      background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255, 0, 102, 0.08) 2px, rgba(255, 0, 102, 0.08) 4px)',
                                      pointerEvents: 'none',
                                      zIndex: 1,
                                      borderRadius: '4px',
                                    }}
                                  />
                                )}
                                <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                  <img
                                    src={attachment.image}
                                    alt={attachment.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain', transform: selectedAttachmentType === 'body' ? 'scale(1.3)' : 'scale(1)', objectPosition: 'center' }}
                                    draggable={false}
                                  />
                                </div>
                                <div style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', fontSize: isSmallMobile ? '0.4rem' : isMobile ? '0.45rem' : isTablet ? '0.5rem' : '0.55rem', color: 'rgba(0, 212, 255, 0.9)', textAlign: 'center', width: '100%', padding: '0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: 'rgba(0, 0, 0, 0.6)', borderRadius: '2px', zIndex: 3 }}>
                                  {attachment.name}
                                </div>
                              </div>
                            )
                          }
                        } else {
                          if (attachment.id === 'none') {
                            return (
                              <div
                                key={`${selectedAttachmentType}-none-${index}`}
                                onClick={() => {
                                  if (isCompatible) {
                                    // Mapper le type d'attachment au nom de clé correct
                                    const attachmentKey = selectedAttachmentType === 'aim-assist' ? 'aimAssist' :
                                      selectedAttachmentType === 'sight' ? 'sight' :
                                      selectedAttachmentType === 'barrel' ? 'barrel' :
                                      selectedAttachmentType === 'muzzle' ? 'muzzle' :
                                      selectedAttachmentType === 'magazine' ? 'magazine' :
                                      selectedAttachmentType === 'grip' ? 'grip' :
                                      selectedAttachmentType === 'bipod' ? 'bipod' : selectedAttachmentType
                                    
                                    setEquippedAttachments({ ...equippedAttachments, [attachmentKey]: undefined })
                                    setSelectedAttachmentType(null)
                                  }
                                }}
                                onMouseEnter={() => isCompatible && setHoveredAvailableAttachmentId(`${selectedAttachmentType}-none-${index}`)}
                                onMouseLeave={() => setHoveredAvailableAttachmentId(null)}
                                style={{
                                  width: isSmallMobile ? '55px' : isMobile ? '70px' : isTablet ? '80px' : '90px',
                                  height: isSmallMobile ? '43px' : isMobile ? '55px' : isTablet ? '62px' : '70px',
                                  background: isCompatible
                                    ? (() => {
                                        const attachmentKey = selectedAttachmentType === 'aim-assist' ? 'aimAssist' :
                                          selectedAttachmentType === 'sight' ? 'sight' :
                                          selectedAttachmentType === 'barrel' ? 'barrel' :
                                          selectedAttachmentType === 'muzzle' ? 'muzzle' :
                                          selectedAttachmentType === 'magazine' ? 'magazine' :
                                          selectedAttachmentType === 'grip' ? 'grip' :
                                          selectedAttachmentType === 'bipod' ? 'bipod' : selectedAttachmentType
                                        return !equippedAttachments[attachmentKey as keyof typeof equippedAttachments]
                                          ? 'rgba(255, 0, 102, 0.3)' 
                                          : 'rgba(0, 212, 255, 0.1)'
                                      })()
                                    : 'rgba(50, 50, 50, 0.3)',
                                  border: isCompatible
                                    ? (() => {
                                        const attachmentKey = selectedAttachmentType === 'aim-assist' ? 'aimAssist' :
                                          selectedAttachmentType === 'sight' ? 'sight' :
                                          selectedAttachmentType === 'barrel' ? 'barrel' :
                                          selectedAttachmentType === 'muzzle' ? 'muzzle' :
                                          selectedAttachmentType === 'magazine' ? 'magazine' :
                                          selectedAttachmentType === 'grip' ? 'grip' :
                                          selectedAttachmentType === 'bipod' ? 'bipod' : selectedAttachmentType
                                        const isSelected = !equippedAttachments[attachmentKey as keyof typeof equippedAttachments]
                                        return isSelected
                                          ? '2px solid rgba(255, 0, 102, 0.8)'
                                          : hoveredAvailableAttachmentId === `${selectedAttachmentType}-none-${index}`
                                          ? '1px solid rgba(255, 0, 102, 0.6)'
                                          : '1px solid rgba(0, 212, 255, 0.3)'
                                      })()
                                    : '1px solid rgba(100, 100, 100, 0.3)',
                                  boxShadow: isCompatible && (hoveredAvailableAttachmentId === `${selectedAttachmentType}-none-${index}` || (() => {
                                    const attachmentKey = selectedAttachmentType === 'aim-assist' ? 'aimAssist' :
                                      selectedAttachmentType === 'sight' ? 'sight' :
                                      selectedAttachmentType === 'barrel' ? 'barrel' :
                                      selectedAttachmentType === 'muzzle' ? 'muzzle' :
                                      selectedAttachmentType === 'magazine' ? 'magazine' :
                                      selectedAttachmentType === 'grip' ? 'grip' :
                                      selectedAttachmentType === 'bipod' ? 'bipod' : selectedAttachmentType
                                    return !equippedAttachments[attachmentKey as keyof typeof equippedAttachments]
                                  })())
                                    ? '0 0 15px rgba(255, 0, 102, 0.4)'
                                    : 'none',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: isCompatible ? 'pointer' : 'not-allowed',
                                  flexShrink: 0,
                                  opacity: isCompatible ? 1 : 0.5,
                                  position: 'relative',
                                  transition: 'all 0.3s ease',
                                }}
                              >
                                {/* Scanlines au hover */}
                                {hoveredAvailableAttachmentId === `${selectedAttachmentType}-none-${index}` && isCompatible && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      inset: 0,
                                      background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255, 0, 102, 0.08) 2px, rgba(255, 0, 102, 0.08) 4px)',
                                      pointerEvents: 'none',
                                      zIndex: 1,
                                      borderRadius: '4px',
                                    }}
                                  />
                                )}
                                <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span style={{ fontSize: '0.6rem', color: isCompatible ? 'rgba(0, 212, 255, 0.7)' : 'rgba(150, 150, 150, 0.5)' }}>Aucun</span>
                                </div>
                                <div style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', fontSize: isSmallMobile ? '0.4rem' : isMobile ? '0.45rem' : isTablet ? '0.5rem' : '0.55rem', color: isCompatible ? 'rgba(0, 212, 255, 0.9)' : 'rgba(150, 150, 150, 0.7)', textAlign: 'center', width: '100%', padding: '0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: 'rgba(0, 0, 0, 0.6)', borderRadius: '2px', zIndex: 3 }}>
                                  {attachment.name}
                                </div>
                              </div>
                            )
                          } else {
                            return (
                              <div
                                key={`${selectedAttachmentType}-${attachment.id}-${index}`}
                                onClick={() => {
                                  if (isCompatible) {
                                    // Mapper le type d'attachment au nom de clé correct
                                    const attachmentKey = selectedAttachmentType === 'aim-assist' ? 'aimAssist' :
                                      selectedAttachmentType === 'sight' ? 'sight' :
                                      selectedAttachmentType === 'barrel' ? 'barrel' :
                                      selectedAttachmentType === 'muzzle' ? 'muzzle' :
                                      selectedAttachmentType === 'magazine' ? 'magazine' :
                                      selectedAttachmentType === 'grip' ? 'grip' :
                                      selectedAttachmentType === 'bipod' ? 'bipod' : selectedAttachmentType
                                    
                                    setEquippedAttachments({ 
                                      ...equippedAttachments, 
                                      [attachmentKey]: attachment.id 
                                    })
                                    setSelectedAttachmentType(null)
                                  }
                                }}
                                onMouseEnter={(e) => {
                                  if (isCompatible) {
                                    setHoveredAvailableAttachmentId(`${selectedAttachmentType}-${attachment.id}-${index}`)
                                    if (isDesktop) {
                                      if (tooltipTimeoutRef.current) {
                                        clearTimeout(tooltipTimeoutRef.current)
                                      }
                                      const target = e.currentTarget
                                      tooltipTimeoutRef.current = setTimeout(() => {
                                        const rect = target.getBoundingClientRect()
                                        const tooltipWidth = 350
                                        const spaceOnRight = window.innerWidth - rect.right
                                        const side = spaceOnRight < tooltipWidth + 20 ? 'left' : 'right'
                                        const x = side === 'right' ? rect.right + 9 : rect.left - tooltipWidth - 9
                                        // Positionner le tooltip plus haut, au niveau de la première ligne d'attachments équipés
                                        const y = rect.top - 122
                                        setAttachmentTooltip({ attachmentId: attachment.id, x, y, side })
                                      }, 300)
                                    }
                                  }
                                }}
                                onMouseLeave={() => {
                                  setHoveredAvailableAttachmentId(null)
                                  if (tooltipTimeoutRef.current) {
                                    clearTimeout(tooltipTimeoutRef.current)
                                    tooltipTimeoutRef.current = null
                                  }
                                  setAttachmentTooltip(null)
                                }}
                                style={{
                                  width: isSmallMobile ? '55px' : isMobile ? '70px' : isTablet ? '80px' : '90px',
                                  height: isSmallMobile ? '43px' : isMobile ? '55px' : isTablet ? '62px' : '70px',
                                  background: isCompatible
                                    ? (() => {
                                        const attachmentKey = selectedAttachmentType === 'aim-assist' ? 'aimAssist' :
                                          selectedAttachmentType === 'sight' ? 'sight' :
                                          selectedAttachmentType === 'barrel' ? 'barrel' :
                                          selectedAttachmentType === 'muzzle' ? 'muzzle' :
                                          selectedAttachmentType === 'magazine' ? 'magazine' :
                                          selectedAttachmentType === 'grip' ? 'grip' :
                                          selectedAttachmentType === 'bipod' ? 'bipod' : selectedAttachmentType
                                        return equippedAttachments[attachmentKey as keyof typeof equippedAttachments] === attachment.id 
                                          ? 'rgba(255, 0, 102, 0.3)' 
                                          : 'rgba(0, 212, 255, 0.1)'
                                      })()
                                    : 'rgba(50, 50, 50, 0.3)',
                                  border: isCompatible
                                    ? (() => {
                                        const attachmentKey = selectedAttachmentType === 'aim-assist' ? 'aimAssist' :
                                          selectedAttachmentType === 'sight' ? 'sight' :
                                          selectedAttachmentType === 'barrel' ? 'barrel' :
                                          selectedAttachmentType === 'muzzle' ? 'muzzle' :
                                          selectedAttachmentType === 'magazine' ? 'magazine' :
                                          selectedAttachmentType === 'grip' ? 'grip' :
                                          selectedAttachmentType === 'bipod' ? 'bipod' : selectedAttachmentType
                                        const isSelected = equippedAttachments[attachmentKey as keyof typeof equippedAttachments] === attachment.id
                                        return isSelected
                                          ? '2px solid rgba(255, 0, 102, 0.8)'
                                          : hoveredAvailableAttachmentId === `${selectedAttachmentType}-${attachment.id}-${index}`
                                          ? '1px solid rgba(255, 0, 102, 0.6)'
                                          : '1px solid rgba(0, 212, 255, 0.3)'
                                      })()
                                    : '1px solid rgba(100, 100, 100, 0.3)',
                                  boxShadow: isCompatible && (hoveredAvailableAttachmentId === `${selectedAttachmentType}-${attachment.id}-${index}` || (() => {
                                    const attachmentKey = selectedAttachmentType === 'aim-assist' ? 'aimAssist' :
                                      selectedAttachmentType === 'sight' ? 'sight' :
                                      selectedAttachmentType === 'barrel' ? 'barrel' :
                                      selectedAttachmentType === 'muzzle' ? 'muzzle' :
                                      selectedAttachmentType === 'magazine' ? 'magazine' :
                                      selectedAttachmentType === 'grip' ? 'grip' :
                                      selectedAttachmentType === 'bipod' ? 'bipod' : selectedAttachmentType
                                    return equippedAttachments[attachmentKey as keyof typeof equippedAttachments] === attachment.id
                                  })())
                                    ? '0 0 15px rgba(255, 0, 102, 0.4)'
                                    : 'none',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: isCompatible ? 'pointer' : 'not-allowed',
                                  position: 'relative',
                                  flexShrink: 0,
                                  opacity: isCompatible ? 1 : 0.5,
                                  transition: 'all 0.3s ease',
                                }}
                              >
                                {/* Scanlines au hover */}
                                {hoveredAvailableAttachmentId === `${selectedAttachmentType}-${attachment.id}-${index}` && isCompatible && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      inset: 0,
                                      background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255, 0, 102, 0.08) 2px, rgba(255, 0, 102, 0.08) 4px)',
                                      pointerEvents: 'none',
                                      zIndex: 1,
                                      borderRadius: '4px',
                                    }}
                                  />
                                )}
                                <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <img
                                    src={attachment.image}
                                    alt={attachment.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: isCompatible ? 1 : 0.3 }}
                                    draggable={false}
                                  />
                                </div>
                                <div style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', fontSize: isSmallMobile ? '0.4rem' : isMobile ? '0.45rem' : isTablet ? '0.5rem' : '0.55rem', color: isCompatible ? 'rgba(0, 212, 255, 0.9)' : 'rgba(150, 150, 150, 0.7)', textAlign: 'center', width: '100%', padding: '0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: 'rgba(0, 0, 0, 0.6)', borderRadius: '2px', zIndex: 3 }}>
                                  {attachment.name}
                                </div>
                              </div>
                            )
                          }
                        }
                      } else {
                        // Box vide (quand aucun type n'est sélectionné ou plus d'attachments)
                        // Si un type est sélectionné mais qu'il n'y a pas d'attachments compatibles, afficher une box grisée
                        if (selectedAttachmentType && !isCompatible) {
                          return (
                            <div
                              key={`disabled-${index}`}
                              style={{
                                width: isSmallMobile ? '55px' : isMobile ? '70px' : isTablet ? '80px' : '90px',
                                height: isSmallMobile ? '43px' : isMobile ? '55px' : isTablet ? '62px' : '70px',
                                background: 'rgba(50, 50, 50, 0.3)',
                                border: '1px solid rgba(100, 100, 100, 0.3)',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                opacity: 0.5,
                                cursor: 'not-allowed',
                              }}
                            />
                          )
                        }
                        // Box vide normale (quand aucun type n'est sélectionné)
                        return (
                          <div
                            key={`empty-${index}`}
                            style={{
                              width: isSmallMobile ? '55px' : isMobile ? '70px' : isTablet ? '80px' : '90px',
                              height: isSmallMobile ? '43px' : isMobile ? '55px' : isTablet ? '62px' : '70px',
                              background: 'rgba(0, 212, 255, 0.05)',
                              border: '1px solid rgba(0, 212, 255, 0.1)',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          />
                        )
                      }
                    })
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tooltip pour les attachments */}
      {attachmentTooltip && isDesktop && (() => {
        const attachment = attachmentsData.find(a => a.id === attachmentTooltip.attachmentId)
        if (!attachment) return null
        
        const stats = getAllAttachmentStats(attachment.id)
        const attachmentTypeLabel = 'attachmentType' in attachment ? attachment.attachmentType : attachment.type.charAt(0).toUpperCase() + attachment.type.slice(1)
        
        return (
          <div
            style={{
              position: 'fixed',
              left: `${attachmentTooltip.x}px`,
              top: `${attachmentTooltip.y}px`,
              background: 'rgba(0, 0, 0, 0.95)',
              border: '1px solid rgba(0, 212, 255, 0.5)',
              borderRadius: '4px',
              padding: '0.5rem',
              minWidth: '250px',
              maxWidth: '350px',
              minHeight: '191px',
              maxHeight: '191px',
              zIndex: 99999,
              pointerEvents: 'none',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 212, 255, 0.3)',
            }}
          >
            {/* Nom de l'attachment */}
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'rgba(0, 212, 255, 1)', marginBottom: '0.25rem' }}>
              {attachment.name}
            </div>
            
            {/* Type d'attachment */}
            <div style={{ fontSize: '0.75rem', color: 'rgba(255, 136, 0, 0.9)', marginBottom: '0.75rem' }}>
              {attachmentTypeLabel}
            </div>
            
            {/* Liste des bonus/malus */}
            {stats.length > 0 && (
              <div style={{ marginBottom: '0.5rem' }}>
                {stats.map((stat, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.7rem' }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{stat.label}</span>
                    <span style={{ color: stat.color }}>{stat.value}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Description */}
            {attachment.description && (
              <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5', borderTop: '1px solid rgba(0, 212, 255, 0.2)', paddingTop: '0.25rem' }}>
                {attachment.description}
              </div>
            )}
          </div>
        )
      })()}
    </div>
    </>
  )
}



