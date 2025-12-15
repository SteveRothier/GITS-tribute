import { useEffect, useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useResponsive } from '../hooks/useResponsive'

/**
 * Interface pour un module affiché dans le globe
 */
interface Module {
  id: string
  title: string
  position: { x: number; y: number; z: number }
  color: number
}

/**
 * Props du composant NetworkGlobe
 */
interface NetworkGlobeProps {
  modules: Module[]
  onNodeHover?: (moduleId: string | null) => void
  onNodeClick?: (moduleId: string) => void
  hoveredModule?: string | null
}

/**
 * Constantes de configuration du globe
 */
const CAMERA_FOV = 60
const CAMERA_NEAR = 0.1
const CAMERA_FAR = 1000
const CAMERA_Z_DESKTOP = 8
const CAMERA_Z_TABLET = 7.5
const CAMERA_Z_MOBILE = 7
const CAMERA_Z_SMALL_MOBILE = 6.5
const CAMERA_Z_TINY_MOBILE = 6

const SMALL_NODE_COUNT_DESKTOP = 40
const SMALL_NODE_COUNT_MOBILE = 20
const MEDIUM_NODE_COUNT_DESKTOP = 20
const MEDIUM_NODE_COUNT_MOBILE = 10

const MAX_POSITION_ATTEMPTS = 50
const CONNECTION_DISTANCE_THRESHOLD = 4
const MIN_DISTANCE_FROM_MODULES_SMALL = 1.5
const MIN_DISTANCE_FROM_MODULES_MEDIUM = 1.8

const MODULE_SCALE_MOBILE = 1.3
const MODULE_SCALE_DESKTOP = 1

const PULSE_SPEED = 0.5
const SCALE_LERP_FACTOR = 0.1
const HOVER_SCALE = 1.5
const NORMAL_SCALE = 1

const MOUSE_MOVE_THROTTLE_MS = 16 // ~60fps

/**
 * Composant NetworkGlobe - Globe 3D interactif affichant les modules
 * Utilise Three.js pour créer une visualisation 3D avec nodes, connexions et animations
 * Optimisé pour les performances avec adaptation responsive
 * 
 * @param modules - Liste des modules à afficher
 * @param onNodeHover - Callback appelé lors du survol d'un module
 * @param onNodeClick - Callback appelé lors du clic sur un module
 * @param hoveredModule - ID du module actuellement survolé
 */
export default function NetworkGlobe({ modules, onNodeHover, onNodeClick, hoveredModule }: NetworkGlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const moduleNodesRef = useRef<Map<string, THREE.Mesh>>(new Map())
  const onNodeHoverRef = useRef(onNodeHover)
  const onNodeClickRef = useRef(onNodeClick)
  const hoveredModuleRef = useRef(hoveredModule)
  const lastMouseMoveTime = useRef(0)

  // Hook responsive pour adapter la caméra et les performances
  const { isMobile, isTablet, isSmallMobile, isTinyMobile } = useResponsive()

  /**
   * Mémoriser les géométries pour éviter de les recréer à chaque rendu
   * Les géométries sont partagées entre tous les nodes du même type
   */
  const geometries = useMemo(() => ({
    small: new THREE.SphereGeometry(0.03, 6, 6),
    medium: new THREE.SphereGeometry(0.1, 10, 10),
    mediumGlow: new THREE.SphereGeometry(0.14, 10, 10),
    module: new THREE.SphereGeometry(0.2, 16, 16),
    moduleGlow: new THREE.SphereGeometry(0.25, 16, 16)
  }), [])

  /**
   * Mémoriser les matériaux réutilisables pour éviter les recréations
   */
  const materials = useMemo(() => ({
    smallNode: new THREE.MeshBasicMaterial({ 
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3,
    }),
    lineBase: new THREE.LineBasicMaterial({ 
      color: 0x00ffff,
      transparent: true,
    })
  }), [])

  /**
   * Mettre à jour les refs sans reconstruire la scène
   * Permet d'utiliser les dernières valeurs des callbacks sans déclencher de re-render
   */
  useEffect(() => {
    onNodeHoverRef.current = onNodeHover
    onNodeClickRef.current = onNodeClick
    hoveredModuleRef.current = hoveredModule
  }, [onNodeHover, onNodeClick, hoveredModule])

  /**
   * Calcule la position Z de la caméra selon le breakpoint
   * Plus proche sur mobile pour faciliter l'interaction
   */
  const cameraZ = useMemo(() => {
    if (isTinyMobile) return CAMERA_Z_TINY_MOBILE
    if (isSmallMobile) return CAMERA_Z_SMALL_MOBILE
    if (isMobile) return CAMERA_Z_MOBILE
    if (isTablet) return CAMERA_Z_TABLET
    return CAMERA_Z_DESKTOP
  }, [isTinyMobile, isSmallMobile, isMobile, isTablet])

  /**
   * Calcule le nombre de nodes selon le breakpoint
   * Réduit sur mobile pour améliorer les performances
   */
  const nodeCounts = useMemo(() => ({
    small: isMobile ? SMALL_NODE_COUNT_MOBILE : SMALL_NODE_COUNT_DESKTOP,
    medium: isMobile ? MEDIUM_NODE_COUNT_MOBILE : MEDIUM_NODE_COUNT_DESKTOP,
    moduleScale: isMobile ? MODULE_SCALE_MOBILE : MODULE_SCALE_DESKTOP
  }), [isMobile])

  useEffect(() => {
    if (!mountRef.current) return

    const container = mountRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Scène
    const scene = new THREE.Scene()

    // Caméra avec position adaptée selon le breakpoint
    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, width / height, CAMERA_NEAR, CAMERA_FAR)
    camera.position.set(0, 0, cameraZ)

    // Renderer optimisé
    const renderer = new THREE.WebGLRenderer({ 
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance'
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    container.appendChild(renderer.domElement)

    /**
     * Vérifie si une position est trop proche des modules
     * Utilise distanceTo pour un calcul optimisé
     * 
     * @param position - Position à vérifier
     * @param minDistance - Distance minimale requise
     * @returns true si trop proche, false sinon
     */
    const isTooCloseToModules = (position: THREE.Vector3, minDistance: number) => {
      const posVec = new THREE.Vector3(position.x, position.y, position.z)
      return modules.some(module => {
        const modulePos = new THREE.Vector3(module.position.x, module.position.y, module.position.z)
        return posVec.distanceTo(modulePos) < minDistance
      })
    }

    // Fonction pour vérifier si une position est dans les limites visibles du canvas
    // Calcul basé sur le frustum de la caméra (FOV 60, position z=cameraZ)
    const isWithinCanvasBounds = (position: THREE.Vector3) => {
      // Calculer les limites visibles basées sur le FOV et la distance de la caméra
      const fov = 60 * (Math.PI / 180) // Convertir en radians
      const aspect = width / height
      const visibleHeight = 2 * Math.tan(fov / 2) * cameraZ
      const visibleWidth = visibleHeight * aspect
      
      // Limites avec une marge de sécurité
      const margin = 0.2
      const maxX = (visibleWidth / 2) * (1 - margin)
      const maxY = (visibleHeight / 2) * (1 - margin)
      const maxZ = cameraZ * 0.3 // Limiter la profondeur pour rester visible
      const minZ = -cameraZ * 0.3
      
      return (
        Math.abs(position.x) <= maxX &&
        Math.abs(position.y) <= maxY &&
        position.z >= minZ &&
        position.z <= maxZ
      )
    }

    /**
     * Créer des petits nodes de fond (non connectés)
     * Utilise un matériau partagé pour optimiser les performances
     */
    const smallNodes: THREE.Mesh[] = []
    
    for (let i = 0; i < nodeCounts.small; i++) {
      // Cloner le matériau pour permettre des modifications individuelles si nécessaire
      const material = materials.smallNode.clone()
      const node = new THREE.Mesh(geometries.small, material)
      
      // Essayer de trouver une position qui n'est pas trop proche des modules
      let attempts = 0
      let validPosition = false
      
      while (!validPosition && attempts < MAX_POSITION_ATTEMPTS) {
        const theta = Math.random() * Math.PI * 2
        const radiusHorizontal = 3.5 + Math.random() * 3
        const radiusVertical = 1.5 + Math.random() * 1.5
        const depthVariation = (Math.random() - 0.5) * 4 // Variation en profondeur de -2 à +2
        
        node.position.x = radiusHorizontal * Math.cos(theta)
        node.position.y = (Math.random() - 0.5) * radiusVertical * 2
        node.position.z = radiusHorizontal * Math.sin(theta) + depthVariation
        
        // Vérifier si la position est dans les limites du canvas et assez loin des modules
        if (isWithinCanvasBounds(node.position) && !isTooCloseToModules(node.position, MIN_DISTANCE_FROM_MODULES_SMALL)) {
          validPosition = true
        }
        attempts++
      }
      
      // Si on n'a pas trouvé de position valide, on skip cette node
      if (!validPosition) continue
      
      node.userData.offsetX = Math.random() * Math.PI * 2
      node.userData.offsetY = Math.random() * Math.PI * 2
      node.userData.offsetZ = Math.random() * Math.PI * 2
      node.userData.basePosition = node.position.clone()
      
      smallNodes.push(node)
      scene.add(node)
    }

    /**
     * Créer des nodes moyens décoratifs (connectés entre eux)
     */
    const decorativeColors = [0x88ccff, 0x6699ff, 0x44aaff, 0x00ddff]
    const mediumNodes: THREE.Mesh[] = []
    
    for (let i = 0; i < nodeCounts.medium; i++) {
      const color = decorativeColors[i % decorativeColors.length]
      const material = new THREE.MeshBasicMaterial({ 
        color,
        transparent: true,
        opacity: 0.5,
      })
      const node = new THREE.Mesh(geometries.medium, material)
      
      // Essayer de trouver une position qui n'est pas trop proche des modules
      let attempts = 0
      let validPosition = false
      
      while (!validPosition && attempts < MAX_POSITION_ATTEMPTS) {
        const theta = Math.random() * Math.PI * 2
        const radiusHorizontal = 2.5 + Math.random() * 2
        const radiusVertical = 1.2 + Math.random() * 1
        const depthVariation = (Math.random() - 0.5) * 3 // Variation en profondeur de -1.5 à +1.5
        
        node.position.x = radiusHorizontal * Math.cos(theta)
        node.position.y = (Math.random() - 0.5) * radiusVertical * 2
        node.position.z = radiusHorizontal * Math.sin(theta) + depthVariation
        
        // Vérifier si la position est dans les limites du canvas et assez loin des modules
        if (isWithinCanvasBounds(node.position) && !isTooCloseToModules(node.position, MIN_DISTANCE_FROM_MODULES_MEDIUM)) {
          validPosition = true
        }
        attempts++
      }
      
      // Si on n'a pas trouvé de position valide, on skip cette node
      if (!validPosition) continue
      
      node.userData.offsetX = Math.random() * Math.PI * 2
      node.userData.offsetY = Math.random() * Math.PI * 2
      node.userData.offsetZ = Math.random() * Math.PI * 2
      node.userData.basePosition = node.position.clone()
      
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: decorativeColors[i % decorativeColors.length],
        transparent: true,
        opacity: 0.15,
      })
      const glow = new THREE.Mesh(geometries.mediumGlow, glowMaterial)
      node.add(glow)
      
      mediumNodes.push(node)
      scene.add(node)
    }

    /**
     * Créer les nodes principaux (modules)
     * Chaque module a un matériau et un glow personnalisés selon sa couleur
     */
    const moduleNodes: THREE.Mesh[] = []
    modules.forEach((module) => {
      const material = new THREE.MeshBasicMaterial({ 
        color: module.color,
        transparent: true,
        opacity: 0.8,
      })
      const node = new THREE.Mesh(geometries.module, material)
      node.position.set(module.position.x, module.position.y, module.position.z)
      node.scale.setScalar(nodeCounts.moduleScale)
      
      node.userData.moduleId = module.id
      node.userData.title = module.title
      node.userData.offsetX = Math.random() * Math.PI * 2
      node.userData.offsetY = Math.random() * Math.PI * 2
      node.userData.offsetZ = Math.random() * Math.PI * 2
      node.userData.basePosition = new THREE.Vector3(module.position.x, module.position.y, module.position.z)
      
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: module.color,
        transparent: true,
        opacity: 0.2,
      })
      const glow = new THREE.Mesh(geometries.moduleGlow, glowMaterial)
      node.add(glow)
      
      moduleNodes.push(node)
      moduleNodesRef.current.set(module.id, node)
      scene.add(node)
    })

    // Relier les nodes moyens et grands entre eux
    const connectableNodes = [...mediumNodes, ...moduleNodes]
    const lines: THREE.Line[] = []
    
    for (let i = 0; i < connectableNodes.length; i++) {
      for (let j = i + 1; j < connectableNodes.length; j++) {
        const distance = connectableNodes[i].position.distanceTo(connectableNodes[j].position)
        
        if (distance < CONNECTION_DISTANCE_THRESHOLD) {
          const geometry = new THREE.BufferGeometry().setFromPoints([
            connectableNodes[i].position.clone(),
            connectableNodes[j].position.clone(),
          ])
          
          const opacity = Math.max(0.15, 0.4 - distance * 0.08)
          
          const material = new THREE.LineBasicMaterial({ 
            color: 0x00ffff,
            transparent: true,
            opacity: opacity,
          })
          const line = new THREE.Line(geometry, material)
          line.userData.nodes = [connectableNodes[i], connectableNodes[j]]
          lines.push(line)
          scene.add(line)
        }
      }
    }

    // Lumières
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    // Détection hover/click
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    /**
     * Gère le mouvement de la souris avec throttling pour améliorer les performances
     * Limite les calculs de raycaster à ~60fps
     */
    const handleMouseMove = (event: MouseEvent) => {
      const now = performance.now()
      if (now - lastMouseMoveTime.current < MOUSE_MOVE_THROTTLE_MS) {
        return
      }
      lastMouseMoveTime.current = now

      const rect = container.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(moduleNodes, false)

      if (intersects.length > 0 && onNodeHoverRef.current) {
        const moduleId = intersects[0].object.userData.moduleId
        onNodeHoverRef.current(moduleId)
        container.style.cursor = 'pointer'
      } else if (onNodeHoverRef.current) {
        onNodeHoverRef.current(null)
        container.style.cursor = 'default'
      }
    }

    const handleClick = () => {
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(moduleNodes, false)

      if (intersects.length > 0 && onNodeClickRef.current) {
        const moduleId = intersects[0].object.userData.moduleId
        onNodeClickRef.current(moduleId)
      }
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('click', handleClick)

    // Animation
    let animationId: number
    const clock = new THREE.Clock()


    /**
     * Fonction d'animation principale
     * Optimisée pour éviter les recalculs inutiles
     */
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      const time = clock.getElapsedTime()

      /**
       * Mettre à jour les lignes de connexion avec effet de flux de données
       * Combine la mise à jour des positions et l'effet de pulse en une seule passe
       */
      lines.forEach((line, index) => {
        const nodes = line.userData.nodes as THREE.Mesh[]
        if (!nodes || nodes.length !== 2) return

        // Mettre à jour les positions
        const positions = line.geometry.attributes.position
        positions.setXYZ(0, nodes[0].position.x, nodes[0].position.y, nodes[0].position.z)
        positions.setXYZ(1, nodes[1].position.x, nodes[1].position.y, nodes[1].position.z)
        positions.needsUpdate = true
        
        // Effet de flux de données avec direction logique (vers les modules)
        const material = line.material as THREE.LineBasicMaterial
        const node0IsModule = nodes[0].userData.moduleId !== undefined
        const node1IsModule = nodes[1].userData.moduleId !== undefined
        
        // Flux directionnels vers les modules
        const direction = node0IsModule || node1IsModule ? -1 : 1
        const pulsePhase = (index * 0.3) * direction
        const pulse = (Math.sin(time * PULSE_SPEED + pulsePhase) * 0.5 + 0.5)
        
        // Opacité de base plus l'effet de flux
        const baseOpacity = material.userData.baseOpacity ?? material.opacity
        if (!material.userData.baseOpacity) {
          material.userData.baseOpacity = baseOpacity
        }
        material.opacity = Math.max(0.1, Math.min(0.6, baseOpacity * 0.5 + pulse * 0.3))
      })
      
      // Mouvement des petits nodes (très réduit pour rester visible)
      smallNodes.forEach((node) => {
        const basePos = node.userData.basePosition
        node.position.x = basePos.x + Math.sin(time * 0.3 + node.userData.offsetX) * 0.03
        node.position.y = basePos.y + Math.cos(time * 0.4 + node.userData.offsetY) * 0.03
        node.position.z = basePos.z + Math.sin(time * 0.35 + node.userData.offsetZ) * 0.03
      })
      
      // Mouvement des nodes moyens (très réduit)
      mediumNodes.forEach((node) => {
        const basePos = node.userData.basePosition
        node.position.x = basePos.x + Math.sin(time * 0.25 + node.userData.offsetX) * 0.03
        node.position.y = basePos.y + Math.cos(time * 0.35 + node.userData.offsetY) * 0.03
        node.position.z = basePos.z + Math.sin(time * 0.3 + node.userData.offsetZ) * 0.03
        
        if (node.children[0]) {
          node.children[0].rotation.y = time * 0.5
        }
      })
      
      // Effet de "Ghost Dive" - certaines nodes émettent des ondes périodiques
      moduleNodes.forEach((node, index) => {
        // Onde d'activité sur les nodes principales
        const waveFrequency = 3 + index * 0.5
        const wave = Math.sin(time * waveFrequency) * 0.5 + 0.5
        const material = node.material as THREE.MeshBasicMaterial
        material.opacity = 0.6 + wave * 0.2
        
        // Les glows des modules émettent des impulsions
        if (node.children[0] && node.children[0] instanceof THREE.Mesh) {
          const glowMaterial = (node.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial
          glowMaterial.opacity = 0.1 + wave * 0.15
        }
      })
      
      // Mouvement des nodes modules (très limité)
      moduleNodes.forEach((node, index) => {
        const basePos = node.userData.basePosition
        const isHovered = hoveredModuleRef.current === modules[index]?.id
        
        if (isHovered) {
          // Sauvegarder la position actuelle et le temps
          if (!node.userData.pausedAt) {
            node.userData.pausedAt = time
            node.userData.pausedPosition = node.position.clone()
          }
          // Rester à la position sauvegardée
          node.position.copy(node.userData.pausedPosition)
        } else {
          // Calculer le décalage de temps si on vient de quitter le hover
          if (node.userData.pausedAt !== undefined) {
            // Ajuster les offsets pour que l'animation reprenne depuis la position actuelle
            const deltaX = node.userData.pausedPosition.x - basePos.x
            const deltaY = node.userData.pausedPosition.y - basePos.y
            const deltaZ = node.userData.pausedPosition.z - basePos.z
            
            // Calculer les nouveaux offsets pour continuer depuis cette position
            node.userData.offsetX = Math.asin(Math.max(-1, Math.min(1, deltaX / 0.15))) - time * 0.2
            node.userData.offsetY = Math.acos(Math.max(-1, Math.min(1, deltaY / 0.15))) - time * 0.25
            node.userData.offsetZ = Math.asin(Math.max(-1, Math.min(1, deltaZ / 0.15))) - time * 0.22
            
            // Réinitialiser les données de pause
            node.userData.pausedAt = undefined
            node.userData.pausedPosition = undefined
          }
          
          // Mouvement orbital lent et ample
          node.position.x = basePos.x + Math.sin(time * 0.2 + node.userData.offsetX) * 0.15
          node.position.y = basePos.y + Math.cos(time * 0.25 + node.userData.offsetY) * 0.15
          node.position.z = basePos.z + Math.sin(time * 0.22 + node.userData.offsetZ) * 0.15
        }
        
        // Scale au hover avec interpolation fluide
        const targetScale = isHovered ? HOVER_SCALE : NORMAL_SCALE
        node.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), SCALE_LERP_FACTOR)
        
        // Pulsation du glow
        if (node.children[0]) {
          const pulsation = isHovered ? 0.3 : 0.15
          const scale = 1 + Math.sin(time * 2) * pulsation
          node.children[0].scale.setScalar(scale)
        }
      })

      renderer.render(scene, camera)
    }
    animate()

    // Redimensionnement
    const handleResize = () => {
      const newWidth = container.clientWidth
      const newHeight = container.clientHeight
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup complet
    return () => {
      window.removeEventListener('resize', handleResize)
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('click', handleClick)
      cancelAnimationFrame(animationId)
      
      // Disposer les matériaux
      smallNodes.forEach(node => {
        if (node.material instanceof THREE.Material) node.material.dispose()
      })
      mediumNodes.forEach(node => {
        if (node.material instanceof THREE.Material) node.material.dispose()
        if (node.children[0] && node.children[0] instanceof THREE.Mesh) {
          const childMaterial = (node.children[0] as THREE.Mesh).material
          if (childMaterial instanceof THREE.Material) childMaterial.dispose()
        }
      })
      moduleNodes.forEach(node => {
        if (node.material instanceof THREE.Material) node.material.dispose()
        if (node.children[0] && node.children[0] instanceof THREE.Mesh) {
          const childMaterial = (node.children[0] as THREE.Mesh).material
          if (childMaterial instanceof THREE.Material) childMaterial.dispose()
        }
      })
      
      // Disposer les lignes
      lines.forEach(line => {
        line.geometry.dispose()
        if (line.material instanceof THREE.Material) line.material.dispose()
      })
      
      // Disposer le renderer
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      
      // Nettoyer la scène
      scene.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modules, cameraZ, nodeCounts, geometries, materials]) // Dépendances optimisées

  /**
   * Cleanup des géométries et matériaux mémorisés au unmount
   * Libère les ressources Three.js pour éviter les fuites mémoire
   */
  useEffect(() => {
    return () => {
      Object.values(geometries).forEach(geometry => geometry.dispose())
      Object.values(materials).forEach(material => material.dispose())
    }
  }, [geometries, materials])

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    />
  )
}
