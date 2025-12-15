import { useMemo } from 'react'
import { useResponsive } from '../../hooks/useResponsive'

/**
 * Props du module About
 */
interface AboutModuleProps {
  onClose?: () => void
}

/**
 * Interface pour une carte d'information
 * Utilisée pour afficher les informations sur l'éditeur, la sortie, etc.
 */
interface InfoCard {
  id: string
  title: string
  icon?: string
  items: Array<{
    label: string
    value: string
  }>
}

/**
 * Interface pour un événement de la timeline
 * Représente une étape du développement du jeu
 */
interface TimelineEvent {
  period: string
  title: string
  description: string[]
  status: 'success' | 'warning' | 'error' // Statut visuel de l'événement
}

/**
 * Interface pour un mode de jeu
 */
interface GameMode {
  name: string
  description: string
}

/**
 * Interface pour les modes de jeu classés par type
 */
interface GameModes {
  classic: GameMode[]
  experimental: GameMode[]
}

const gameInfo: InfoCard[] = [
  {
    id: 'publisher',
    title: 'Éditeur & Développement',
    items: [
      { label: 'Éditeur', value: 'Nexon America' },
      { label: 'Studio', value: 'Neople (Dungeon Fighter Online)' },
      { label: 'Moteur', value: 'Unreal Engine 3' },
      { label: 'Genre', value: 'FPS Multijoueur Compétitif' },
    ]
  },
  {
    id: 'release',
    title: 'Sortie Officielle',
    items: [
      { label: 'Date', value: '28 juillet 2016' },
      { label: 'Plateforme', value: 'Steam' },
      { label: 'Modèle', value: 'Free-to-Play' },
      { label: 'Régions', value: 'Amérique du Nord, Europe, Corée du Sud, Asie' },
    ]
  },
  {
    id: 'closure',
    title: 'Fermeture',
    items: [
      { label: 'Date', value: '29 décembre 2017' },
      { label: 'Raison principale', value: 'Nombre de joueurs insuffisant' },
      { label: 'Statut', value: 'Serveurs désactivés' },
    ]
  }
]

/**
 * Chronologie du développement du jeu
 * Liste tous les événements majeurs de la conception à la fermeture
 */
const timeline: TimelineEvent[] = [
  {
    period: 'Septembre 2011',
    title: 'Début du Développement',
    description: [
      'Développement initié par l\'équipe de Dungeon Fighter Online',
      'Conception du système de jeu'
    ],
    status: 'success'
  },
  {
    period: '2012',
    title: 'Acquisition des Droits',
    description: [
      'Nexon obtient les droits pour un jeu Stand Alone Complex',
      'Accord avec Kodansha'
    ],
    status: 'success'
  },
  {
    period: '2013',
    title: 'Planification de Sortie',
    description: [
      'Sortie prévue pour la première moitié de 2014',
      'Développement en cours'
    ],
    status: 'success'
  },
  {
    period: '2014',
    title: 'G-STAR 2014 - Première Révélation',
    description: [
      'Premier trailer dévoilé à Busan',
      'Titre révélé: "First Connection Online"',
      'Préservation de l\'atmosphère de la série animée'
    ],
    status: 'success'
  },
  {
    period: '2015',
    title: 'Titre Final & Beta Fermée',
    description: [
      'Titre final: "First Assault - Stand Alone Complex Online"',
      'Beta fermée du 1er au 5 octobre 2015'
    ],
    status: 'success'
  },
  {
    period: '2015 - Début 2016',
    title: 'Phase 1 — Early Access',
    description: [
      'Accès anticipé sur Steam',
      'Gameplay lent et tactique',
      'Contenu limité au lancement'
    ],
    status: 'success'
  },
  {
    period: 'Fin 2016 - 2017',
    title: 'Phase 2 — Reboot "1st Connect"',
    description: [
      'Révision majeure du gameplay',
      'Nouveaux personnages et maps',
      'Système d\'armes modernisé',
      'Métagame amélioré'
    ],
    status: 'success'
  },
  {
    period: '2017',
    title: 'Phase 3 — Déclin',
    description: [
      'Baisse du nombre de joueurs',
      'Support limité',
      'Problèmes techniques persistants'
    ],
    status: 'warning'
  },
  {
    period: '29 décembre 2017',
    title: 'Fermeture',
    description: [
      'Retrait de Steam',
      'Fermeture des serveurs',
      'Fin du support'
    ],
    status: 'error'
  }
]

interface GameMode {
  name: string
  description: string
}

interface GameModes {
  classic: GameMode[]
  experimental: GameMode[]
}

/**
 * Liste des modes de jeu classés par type (classiques et expérimentaux)
 */
const gameModes: GameModes = {
  classic: [
    { name: 'Team Deathmatch', description: 'Combat par équipes' },
    { name: 'Demolition / Bomb Plant', description: 'Pose et désamorçage de bombe' },
    { name: 'Terminal Conquest', description: 'Capture de zones' },
    { name: 'Hive Mode', description: 'Mode PvE coopératif' },
  ],
  experimental: [
    { name: 'Deathmatch solo', description: 'Mode solo' },
    { name: 'Capture The Flag', description: 'Capture de drapeau' },
    { name: 'Escort', description: 'Escorte d\'objectif' },
    { name: 'Breach', description: 'Infiltration' },
  ]
}

const SCROLLBAR_STYLES = `
  .about-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .about-scrollbar::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 4px;
  }
  .about-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 0, 0.2);
    border-radius: 4px;
  }
  .about-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 0, 0.2) transparent;
  }
`

const MODULE_COLOR = '#ffff00'
const MODULE_COLOR_RGBA = 'rgba(255, 255, 0, 0.3)'
const MODULE_COLOR_RGBA_LIGHT = 'rgba(255, 255, 0, 0.15)'

/**
 * Module About - Informations sur le jeu First Assault
 * Affiche le contexte, le lore, le gameplay, la chronologie et les modes de jeu
 * Layout responsive avec sections organisées verticalement
 * 
 * @param onClose - Callback optionnel (non utilisé actuellement)
 */
export default function AboutModule({}: AboutModuleProps = {}) {
  const { isMobile, isTablet, isDesktop } = useResponsive()

  /**
   * Mémorise les valeurs de style responsive pour éviter les recalculs
   * Adapte les paddings, tailles de police et largeur maximale selon le breakpoint
   */
  const styles = useMemo(() => ({
    paddingTop: isMobile ? 'calc(0.75rem + 1rem + 0.85rem + 1px)' : 'calc(1rem + 1rem + 0.9rem + 1px)',
    sectionPadding: isMobile ? '1rem' : '1.5rem',
    fontSize: isMobile ? '0.85rem' : '0.95rem',
    titleFontSize: isMobile ? '1.2rem' : '1.5rem',
    maxWidth: isDesktop ? '1400px' : '100%',
  }), [isMobile, isDesktop])

  return (
    <>
      <style>{SCROLLBAR_STYLES}</style>
      <div
        className="about-scrollbar"
        style={{
          width: '100%',
          height: '100%',
          paddingTop: styles.paddingTop,
          paddingLeft: styles.sectionPadding,
          paddingRight: styles.sectionPadding,
          paddingBottom: styles.sectionPadding,
          overflowY: 'auto',
          overflowX: 'hidden',
          background: 'transparent',
          scrollbarGutter: 'stable',
        }}
      >
        <div
          style={{
            maxWidth: styles.maxWidth,
            margin: '0 auto',
          }}
        >
          <Section
            title="Contexte & Lore"
            styles={styles}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                gap: '1.5rem',
              }}
            >
              <LoreContent styles={styles} />
              <ContextContent styles={styles} />
            </div>
          </Section>

          <Section
            title="Gameplay"
            styles={styles}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                gap: '1.5rem',
              }}
            >
              <GameplayCard
                title="Customisation Cyborg"
                content="Le jeu proposait un système de customisation de cyborg supportant 5 000 configurations différentes, permettant aux joueurs de personnaliser leur personnage de manière unique."
                styles={styles}
              />
              <SkillsCard styles={styles} />
            </div>
          </Section>

          <InfoCardsGrid
            cards={gameInfo}
            styles={styles}
            isMobile={isMobile}
            isTablet={isTablet}
          />

          <TimelineSection
            timeline={timeline}
            styles={styles}
            isMobile={isMobile}
          />

          <GameModesSection
            gameModes={gameModes}
            styles={styles}
            isMobile={isMobile}
          />

          <DiscordSection styles={styles} isMobile={isMobile} />
        </div>
      </div>
    </>
  )
}

/**
 * Composant Section réutilisable
 * Crée une section avec titre stylisé, bordure et ligne décorative en haut
 * Utilisé pour toutes les sections principales du module
 * 
 * @param title - Titre de la section
 * @param children - Contenu de la section
 * @param styles - Objet contenant les styles responsive (titleFontSize, sectionPadding)
 */
function Section({
  title,
  children,
  styles,
}: {
  title: string
  children: React.ReactNode
  styles: { titleFontSize: string; sectionPadding: string }
}) {
  return (
    <div
      style={{
        marginBottom: '1.5rem',
        background: 'rgba(0, 0, 0, 0.4)',
        border: `1px solid ${MODULE_COLOR_RGBA}`,
        borderRadius: '8px',
        padding: styles.sectionPadding,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, transparent, ${MODULE_COLOR}, transparent)`,
          boxShadow: `0 0 10px ${MODULE_COLOR_RGBA}`,
        }}
      />
      <h2
        style={{
          fontSize: styles.titleFontSize,
          color: MODULE_COLOR,
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '1.5rem',
          textShadow: `0 0 15px ${MODULE_COLOR_RGBA}`,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  )
}

// Composant pour le contenu Lore
function LoreContent({ styles }: { styles: { fontSize: string } }) {
  const eraItems = ['Tokyo, années 2030-2040', 'Société ultra-connectée', 'Cybernétique omniprésente', 'Terrorisme technologique']
  
  return (
    <div>
      <p
        style={{
          marginBottom: '1rem',
          lineHeight: '1.7',
          color: 'rgb(255, 255, 255)',
          fontSize: styles.fontSize,
        }}
      >
        First Assault Online se déroule dans l'univers de <strong style={{ color: MODULE_COLOR }}>Ghost in the Shell: Stand Alone Complex</strong>, peu avant les événements de la série animée. Le joueur incarne un membre de <strong style={{ color: MODULE_COLOR }}>Public Security Section 9 (PSS9)</strong>, l'unité antiterroriste dirigée par Aramaki, composée d'agents cyborgs d'élite.
      </p>
      <div
        style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderLeft: `3px solid ${MODULE_COLOR}`,
          borderRadius: '4px',
        }}
      >
        <h3
          style={{
            fontSize: styles.fontSize === '0.85rem' ? '0.95rem' : '1.1rem',
            color: MODULE_COLOR,
            fontWeight: 'bold',
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
          }}
        >
          Époque
        </h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {eraItems.map((item, idx) => (
            <li
              key={idx}
              style={{
                marginBottom: '0.5rem',
                paddingLeft: '1.2rem',
                position: 'relative',
                color: 'rgb(255, 255, 255)',
                fontSize: styles.fontSize,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  color: MODULE_COLOR,
                }}
              >
                ▸
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/**
 * Contenu de la section Context
 * Affiche le contexte scénaristique du jeu
 * Décrit les équipes, les personnages et les rôles
 * 
 * @param styles - Objet contenant les styles responsive (fontSize)
 */
function ContextContent({ styles }: { styles: { fontSize: string } }) {
  return (
    <div
      style={{
        padding: '1rem',
        background: 'rgba(0, 0, 0, 0.3)',
        borderLeft: `3px solid ${MODULE_COLOR}`,
        borderRadius: '4px',
      }}
    >
      <h3
        style={{
          fontSize: styles.fontSize === '0.85rem' ? '0.95rem' : '1.1rem',
          color: MODULE_COLOR,
          fontWeight: 'bold',
          marginBottom: '0.75rem',
          textTransform: 'uppercase',
        }}
      >
        Contexte Scénaristique
      </h3>
      <p
        style={{
          marginBottom: '1rem',
          lineHeight: '1.7',
          color: 'rgb(255, 255, 255)',
          fontSize: styles.fontSize,
        }}
      >
        Les joueurs incarnent des personnages classiques de la Section 9 ainsi que de nouvelles recrues dans des combats contre le groupe de cyberterrorisme <strong style={{ color: MODULE_COLOR }}>"The Kraken"</strong> qui se déroulent dans le cyberspace.
      </p>
      <p
        style={{
          marginBottom: '1rem',
          lineHeight: '1.7',
          color: 'rgb(255, 255, 255)',
          fontSize: styles.fontSize,
        }}
      >
        Bien que les deux équipes utilisent des personnages de la Section 9, le jeu est conçu pour que chaque équipe se perçoive comme la Section 9 et ses adversaires comme des terroristes du Kraken.
      </p>
      <p
        style={{
          lineHeight: '1.7',
          color: 'rgb(255, 255, 255)',
          fontSize: styles.fontSize,
        }}
      >
        Chaque personnage possède ses propres capacités spéciales et appartient à l'un des trois rôles principaux : <strong style={{ color: MODULE_COLOR }}>Assault</strong> (offensif), <strong style={{ color: MODULE_COLOR }}>Infiltrator</strong> (furtif) et <strong style={{ color: MODULE_COLOR }}>Specialist</strong> (support).
      </p>
    </div>
  )
}

/**
 * Carte d'information sur un aspect du gameplay
 * Affiche un titre et un contenu textuel dans un encadré stylisé
 * 
 * @param title - Titre de la carte
 * @param content - Contenu textuel de la carte
 * @param styles - Objet contenant les styles responsive (fontSize)
 */
function GameplayCard({
  title,
  content,
  styles,
}: {
  title: string
  content: string
  styles: { fontSize: string }
}) {
  return (
    <div>
      <div
        style={{
          padding: '1rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderLeft: `3px solid ${MODULE_COLOR}`,
          borderRadius: '4px',
        }}
      >
        <h3
          style={{
            fontSize: styles.fontSize === '0.85rem' ? '0.95rem' : '1.1rem',
            color: MODULE_COLOR,
            fontWeight: 'bold',
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            marginBottom: '1rem',
            lineHeight: '1.7',
            color: 'rgb(255, 255, 255)',
            fontSize: styles.fontSize,
          }}
        >
          {content}
        </p>
      </div>
    </div>
  )
}

// Composant pour les compétences
function SkillsCard({ styles }: { styles: { fontSize: string } }) {
  const skills = ['Camouflage thermo-optique', 'Armure de puissance', 'Contrôle de mechas variés']
  
  return (
    <div>
      <div
        style={{
          padding: '1rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderLeft: `3px solid ${MODULE_COLOR}`,
          borderRadius: '4px',
        }}
      >
        <h3
          style={{
            fontSize: styles.fontSize === '0.85rem' ? '0.95rem' : '1.1rem',
            color: MODULE_COLOR,
            fontWeight: 'bold',
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
          }}
        >
          Système de Compétences
        </h3>
        <p
          style={{
            marginBottom: '1rem',
            lineHeight: '1.7',
            color: 'rgb(255, 255, 255)',
            fontSize: styles.fontSize,
          }}
        >
          Les joueurs pouvaient <strong style={{ color: MODULE_COLOR }}>partager leurs compétences avec les alliés proches</strong>, permettant un support stratégique en équipe.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {skills.map((item, idx) => (
            <li
              key={idx}
              style={{
                marginBottom: '0.5rem',
                paddingLeft: '1.2rem',
                position: 'relative',
                color: 'rgb(255, 255, 255)',
                fontSize: styles.fontSize,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  color: MODULE_COLOR,
                }}
              >
                ▸
              </span>
              {item}
            </li>
          ))}
        </ul>
        <p
          style={{
            marginTop: '1rem',
            lineHeight: '1.7',
            color: 'rgb(255, 255, 255)',
            fontSize: styles.fontSize,
            fontStyle: 'italic',
            opacity: 0.8,
          }}
        >
          Note: Des modes PvE étaient prévus mais n'ont jamais vu le jour.
        </p>
      </div>
    </div>
  )
}

/**
 * Grille responsive des cartes d'information
 * Affiche les cartes d'info (éditeur, sortie, fermeture) dans une grille adaptative
 * 
 * @param cards - Liste des cartes d'information à afficher
 * @param styles - Objet contenant les styles responsive (fontSize, sectionPadding)
 * @param isMobile - Indique si l'écran est en mode mobile
 * @param isTablet - Indique si l'écran est en mode tablette
 */
function InfoCardsGrid({
  cards,
  styles,
  isMobile,
  isTablet,
}: {
  cards: InfoCard[]
  styles: { fontSize: string; sectionPadding: string }
  isMobile: boolean
  isTablet: boolean
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
        gap: '1.5rem',
        marginBottom: '1.5rem',
      }}
    >
      {cards.map((card) => (
        <InfoCard key={card.id} card={card} styles={styles} />
      ))}
    </div>
  )
}

// Composant pour une carte d'info
function InfoCard({
  card,
  styles,
}: {
  card: InfoCard
  styles: { fontSize: string; sectionPadding: string }
}) {
  return (
    <div
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        border: `1px solid ${MODULE_COLOR_RGBA}`,
        borderRadius: '8px',
        padding: styles.sectionPadding,
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'none',
        transform: 'translate3d(0, 0, 0)',
        willChange: 'transform, border-color, box-shadow',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = MODULE_COLOR
        e.currentTarget.style.boxShadow = `0 0 20px ${MODULE_COLOR_RGBA}`
        e.currentTarget.style.transform = 'translate3d(0, -3px, 0)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = MODULE_COLOR_RGBA
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translate3d(0, 0, 0)'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '2px',
          background: MODULE_COLOR,
          opacity: 0.6,
        }}
      />
      <h3
        style={{
          fontSize: styles.fontSize === '0.85rem' ? '1rem' : '1.2rem',
          color: MODULE_COLOR,
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '1rem',
          textShadow: `0 0 10px ${MODULE_COLOR_RGBA}`,
        }}
      >
        {card.title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {card.items.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              paddingBottom: '0.75rem',
              borderBottom: idx < card.items.length - 1 ? `1px solid ${MODULE_COLOR_RGBA_LIGHT}` : 'none',
            }}
          >
            <span
              style={{
                color: 'rgb(255, 255, 255)',
                fontSize: styles.fontSize,
                fontWeight: '500',
              }}
            >
              {item.label}:
            </span>
            <span
              style={{
                color: 'rgb(255, 255, 255)',
                fontSize: styles.fontSize,
                textAlign: 'right',
                flex: 1,
                marginLeft: '1rem',
              }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Section de la chronologie du développement
 * Affiche une timeline verticale avec tous les événements majeurs
 * Chaque événement a un statut visuel (success, warning, error)
 * 
 * @param timeline - Liste des événements à afficher
 * @param styles - Objet contenant les styles responsive (fontSize, sectionPadding, titleFontSize)
 * @param isMobile - Indique si l'écran est en mode mobile
 */
function TimelineSection({
  timeline,
  styles,
  isMobile,
}: {
  timeline: TimelineEvent[]
  styles: { fontSize: string; sectionPadding: string; titleFontSize: string }
  isMobile: boolean
}) {
  const statusColors = {
    success: '#00ff00',
    warning: '#ffaa00',
    error: '#ff0000',
  }

  return (
    <div
      style={{
        marginBottom: '1.5rem',
        background: 'rgba(0, 0, 0, 0.4)',
        border: `1px solid ${MODULE_COLOR_RGBA}`,
        borderRadius: '8px',
        padding: styles.sectionPadding,
      }}
    >
      <h2
        style={{
          fontSize: styles.titleFontSize,
          color: MODULE_COLOR,
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '2rem',
          textShadow: `0 0 15px ${MODULE_COLOR_RGBA}`,
        }}
      >
        Chronologie du Développement
      </h2>
      <div
        style={{
          position: 'relative',
          paddingLeft: isMobile ? '1.5rem' : '2rem',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: isMobile ? '0.5rem' : '1rem',
            top: 0,
            bottom: 0,
            width: '2px',
            background: `linear-gradient(180deg, ${MODULE_COLOR}, transparent)`,
            opacity: 0.5,
          }}
        />
        {timeline.map((event, idx) => (
          <TimelineEvent
            key={idx}
            event={event}
            styles={styles}
            isMobile={isMobile}
            statusColor={statusColors[event.status]}
          />
        ))}
      </div>
    </div>
  )
}

// Composant pour un événement de timeline
function TimelineEvent({
  event,
  styles,
  isMobile,
  statusColor,
}: {
  event: TimelineEvent
  styles: { fontSize: string }
  isMobile: boolean
  statusColor: string
}) {
  return (
    <div
      style={{
        position: 'relative',
        marginBottom: '2rem',
        paddingLeft: isMobile ? '1.5rem' : '2rem',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '-1.25rem',
          top: '0.5rem',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: statusColor,
          border: `2px solid ${MODULE_COLOR}`,
          boxShadow: `0 0 10px ${MODULE_COLOR_RGBA}`,
        }}
      />
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: `1px solid ${MODULE_COLOR_RGBA}`,
          borderRadius: '6px',
          padding: '1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            marginBottom: '0.75rem',
          }}
        >
          <span
            style={{
              color: MODULE_COLOR,
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            {event.period}
          </span>
          <h3
            style={{
              fontSize: isMobile ? '1rem' : '1.1rem',
              color: 'rgb(255, 255, 255)',
              fontWeight: 'bold',
              marginTop: isMobile ? '0.5rem' : 0,
            }}
          >
            {event.title}
          </h3>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {event.description.map((item, itemIdx) => (
            <li
              key={itemIdx}
              style={{
                marginBottom: '0.5rem',
                paddingLeft: '1.2rem',
                position: 'relative',
                color: 'rgb(255, 255, 255)',
                fontSize: styles.fontSize,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  color: MODULE_COLOR,
                }}
              >
                ▸
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/**
 * Section des modes de jeu
 * Affiche deux colonnes : modes classiques et modes expérimentaux
 * 
 * @param gameModes - Objet contenant les modes classiques et expérimentaux
 * @param styles - Objet contenant les styles responsive (fontSize, sectionPadding)
 * @param isMobile - Indique si l'écran est en mode mobile
 */
function GameModesSection({
  gameModes,
  styles,
  isMobile,
}: {
  gameModes: GameModes
  styles: { fontSize: string; sectionPadding: string }
  isMobile: boolean
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: '1.5rem',
      }}
    >
      <GameModeList
        title="Modes Classiques"
        modes={gameModes.classic}
        styles={styles}
        isMobile={isMobile}
      />
      <GameModeList
        title="Modes Expérimentaux"
        modes={gameModes.experimental}
        styles={styles}
        isMobile={isMobile}
      />
    </div>
  )
}

// Composant pour une liste de modes
function GameModeList({
  title,
  modes,
  styles,
  isMobile,
}: {
  title: string
  modes: Array<{ name: string; description: string }>
  styles: { fontSize: string; sectionPadding: string }
  isMobile: boolean
}) {
  return (
    <div
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        border: `1px solid ${MODULE_COLOR_RGBA}`,
        borderRadius: '8px',
        padding: styles.sectionPadding,
      }}
    >
      <h3
        style={{
          fontSize: styles.fontSize === '0.85rem' ? '1rem' : '1.2rem',
          color: MODULE_COLOR,
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '1.5rem',
          textShadow: `0 0 10px ${MODULE_COLOR_RGBA}`,
        }}
      >
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {modes.map((mode, idx) => (
          <div
            key={idx}
            style={{
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderLeft: `3px solid ${MODULE_COLOR}`,
              borderRadius: '4px',
            }}
          >
            <div
              style={{
                color: title === 'Modes Classiques' ? MODULE_COLOR : 'rgb(255, 255, 255)',
                fontWeight: 'bold',
                fontSize: styles.fontSize,
                marginBottom: '0.25rem',
              }}
            >
              {mode.name}
            </div>
            <div
              style={{
                color: 'rgb(255, 255, 255)',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
              }}
            >
              {mode.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Section d'invitation au serveur Discord
 * Affiche une description et un lien vers le serveur Discord
 * Bouton stylisé avec effet hover
 * 
 * @param styles - Objet contenant les styles responsive (fontSize, sectionPadding)
 * @param isMobile - Indique si l'écran est en mode mobile
 */
function DiscordSection({
  styles,
  isMobile,
}: {
  styles: { fontSize: string; sectionPadding: string }
  isMobile: boolean
}) {
  return (
    <div
      style={{
        marginTop: '2rem',
        padding: styles.sectionPadding,
        background: 'rgba(0, 0, 0, 0.4)',
        border: `1px solid ${MODULE_COLOR_RGBA}`,
        borderRadius: '8px',
        textAlign: 'center',
      }}
    >
      <h3
        style={{
          fontSize: styles.fontSize === '0.85rem' ? '1rem' : '1.2rem',
          color: MODULE_COLOR,
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '1rem',
          textShadow: `0 0 10px ${MODULE_COLOR_RGBA}`,
        }}
      >
        Serveur Discord
      </h3>
      <p
        style={{
          marginBottom: '1rem',
          lineHeight: '1.7',
          color: 'rgb(255, 255, 255)',
          fontSize: styles.fontSize,
        }}
      >
        Grâce à la communauté, il est encore possible de jouer à First Assault ! Un émulateur basé sur la version beta du jeu a été développé, permettant de jouer sur des serveurs privés. Rejoignez le serveur Discord pour y accéder.
      </p>
      <a
        href="https://discord.gg/gKjK3S2Ne6"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1.5rem',
          background: 'rgba(0, 0, 0, 0.3)',
          border: `2px solid ${MODULE_COLOR}`,
          borderRadius: '4px',
          color: MODULE_COLOR,
          textDecoration: 'none',
          fontSize: styles.fontSize,
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          transition: 'all 0.3s ease',
          textShadow: `0 0 10px ${MODULE_COLOR_RGBA}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = MODULE_COLOR_RGBA_LIGHT
          e.currentTarget.style.boxShadow = `0 0 20px ${MODULE_COLOR_RGBA}`
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'
          e.currentTarget.style.boxShadow = 'none'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        <img
          src="/images/ui/discordlogo.svg"
          alt="Discord Logo"
          draggable={false}
          style={{
            width: isMobile ? '24px' : '28px',
            height: isMobile ? '24px' : '28px',
          }}
        />
        Discord
      </a>
    </div>
  )
}
