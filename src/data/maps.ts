// Types pour les maps
export interface MapImage {
  id: string
  src: string
  alt: string
  type: 'layout' | 'visual'
}

export interface Map {
  id: string
  name: string
  description: string
  gameModes: string[]
  images: MapImage[]
}

// Données des maps disponibles
export const mapsData: Map[] = [
  {
    id: 'pss9-headquarters',
    name: 'PSS9 Headquarters',
    description: 'Quartier général de la Section 9',
    gameModes: ['Team Deathmatch', 'Demolition'],
    images: [
      { id: 'img-1', src: '/images/maps/PSS9 Headquarters/layout.png', alt: 'Layout PSS9 Headquarters', type: 'layout' },
      { id: 'img-2', src: '/images/maps/PSS9 Headquarters/PSS9.png', alt: 'Aspect visuel PSS9 Headquarters', type: 'visual' },
    ]
  },
  {
    id: 'port-city',
    name: 'Port City',
    description: 'Zone portuaire industrielle',
    gameModes: ['Team Deathmatch'],
    images: [
      { id: 'img-1', src: '/images/maps/Port City/layout.png', alt: 'Layout Port City', type: 'layout' },
      { id: 'img-2', src: '/images/maps/Port City/Port.png', alt: 'Aspect visuel Port City', type: 'visual' },
    ]
  },
  {
    id: 'district-ruins',
    name: 'District Ruins',
    description: 'Ruines urbaines post-apocalyptiques',
    gameModes: ['Terminal Conquest'],
    images: [
      { id: 'img-1', src: '/images/maps/District Ruins/layout.png', alt: 'Layout District Ruins', type: 'layout' },
      { id: 'img-2', src: '/images/maps/District Ruins/Distric Ruins.png', alt: 'Aspect visuel District Ruins', type: 'visual' },
    ]
  },
  {
    id: 'urban-city',
    name: 'Urban City',
    description: 'Métropole futuriste',
    gameModes: ['Team Deathmatch'],
    images: [
      { id: 'img-1', src: '/images/maps/Urban City/layout.png', alt: 'Layout Urban City', type: 'layout' },
      { id: 'img-2', src: '/images/maps/Urban City/Urban city.png', alt: 'Aspect visuel Urban City', type: 'visual' },
    ]
  },
  {
    id: 'downtown-dejima',
    name: 'Downtown Dejima',
    description: 'Centre-ville de Dejima',
    gameModes: ['Team Deathmatch', 'Demolition'],
    images: [
      { id: 'img-1', src: '/images/maps/Downtown Dejima/layout.png', alt: 'Layout Downtown Dejima', type: 'layout' },
      { id: 'img-2', src: '/images/maps/Downtown Dejima/Downtown Dejima.png', alt: 'Aspect visuel Downtown Dejima', type: 'visual' },
    ]
  },
  {
    id: 'dubbing-site',
    name: 'Dubbing Site',
    description: 'Site de doublage',
    gameModes: ['Team Deathmatch'],
    images: [
      { id: 'img-1', src: '/images/maps/Dubbing Site/layout.png', alt: 'Layout Dubbing Site', type: 'layout' },
      { id: 'img-2', src: '/images/maps/Dubbing Site/Dubbing Site.png', alt: 'Aspect visuel Dubbing Site', type: 'visual' },
    ]
  },
  {
    id: 'geofront',
    name: 'Geofront',
    description: 'Zone souterraine',
    gameModes: ['Demolition'],
    images: [
      { id: 'img-1', src: '/images/maps/Geofront/layout.png', alt: 'Layout Geofront', type: 'layout' },
      { id: 'img-2', src: '/images/maps/Geofront/Geofront.png', alt: 'Aspect visuel Geofront', type: 'visual' },
    ]
  },
  {
    id: 'neon-ruins',
    name: 'Neon Ruins',
    description: 'Ruines néon',
    gameModes: ['Team Deathmatch'],
    images: [
      { id: 'img-1', src: '/images/maps/Neon Ruins/layout.png', alt: 'Layout Neon Ruins', type: 'layout' },
      { id: 'img-2', src: '/images/maps/Neon Ruins/Neon Ruins.png', alt: 'Aspect visuel Neon Ruins', type: 'visual' },
    ]
  },
  {
    id: 'cyber-ward',
    name: 'Cyber Ward',
    description: 'Quartier cybernétique',
    gameModes: ['Terminal Conquest'],
    images: [
      { id: 'img-1', src: '/images/maps/Cyber Ward/layout.png', alt: 'Layout Cyber Ward', type: 'layout' },
      { id: 'img-2', src: '/images/maps/Cyber Ward/Cyber Ward.png', alt: 'Aspect visuel Cyber Ward', type: 'visual' },
    ]
  },
  {
    id: 'underground-base',
    name: 'Underground Base',
    description: 'Base souterraine',
    gameModes: ['Terminal Conquest'],
    images: [
      { id: 'img-1', src: '/images/maps/Underground Base/layout.png', alt: 'Layout Underground Base', type: 'layout' },
      { id: 'img-2', src: '/images/maps/Underground Base/Underground Base.png', alt: 'Aspect visuel Underground Base', type: 'visual' },
    ]
  },
]

