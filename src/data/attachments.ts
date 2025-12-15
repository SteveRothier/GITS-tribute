// Types pour les attachments d'armes

export type AttachmentType = 'sight' | 'aim-assist' | 'barrel' | 'muzzle' | 'magazine' | 'grip' | 'bipod'

export type LaserColor = 'Red' | 'Green' | 'Blue' | 'Yellow' | 'White'
export type MuzzleType = 'Cross' | 'X-Cross' | 'Star' | 'X-Star'

// Sight Attachment
export type SightAttachment = {
  id: string
  name: string
  type: 'sight'
  price: number
  zoom: number
  aimSpeed: number // en secondes
  variableZoom: boolean // on ou off
  image: string
  compatibleWeapons?: string[] // IDs des armes compatibles, undefined = toutes
  description?: string
}

// Aim Assist Attachment
export type AimAssistAttachment = {
  id: string
  name: string
  type: 'aim-assist'
  attachmentType: 'Laser Sight' | 'Brain Connector'
  price: number
  image: string
  compatibleWeapons?: string[]
  description?: string
  // Pour Laser Sight
  accuracyBonus?: number // ex: +3
  laserColor?: LaserColor
  movementSpeedBonus?: number // ex: -2
  // Pour Brain Connector
  damageFarthestRange?: number // ex: -5% ou +10%
  damageEffectiveRange?: number // ex: -5% ou +10%
  damageOptimalRange?: number // ex: -5% ou +10%
}

// Barrel Attachment
export type BarrelAttachment = {
  id: string
  name: string
  type: 'barrel'
  price: number
  accuracy: number // ex: +2
  movementSpeed?: number // ex: -5 ou +5
  damage?: number | { ar: number; lmg: number; smg: number; sr: number } // ex: +3 ou { ar: 3, lmg: 3, smg: 1, sr: 3 }
  effectiveRange?: number // ex: -10 (en pourcentage)
  stability?: number // ex: +2
  image: string
  compatibleWeapons?: string[]
  description?: string
}

// Muzzle Attachment
export type MuzzleAttachment = {
  id: string
  name: string
  type: 'muzzle'
  attachmentType: 'Flash Guard' | 'Suppressor'
  price: number
  image: string
  compatibleWeapons?: string[]
  description?: string
  // Pour Flash Guard
  accuracy?: number // ex: +2
  muzzleType?: MuzzleType
  // Pour Suppressor
  stability?: number // ex: +4
  effectiveRange?: number // ex: -5 (en pourcentage)
  detectionRange?: number // ex: -10 (en mètres)
}

// Magazine Attachment
export type MagazineAttachment = {
  id: string
  name: string
  type: 'magazine'
  price: number
  movementSpeed: number // ex: -5
  stability: number // ex: -5
  image: string
  compatibleWeapons?: string[]
  description?: string
  // Pour Drum Magazine
  drumMag?: string // ex: "50/100"
  weaponSwap?: number // ex: -10
  // Pour Extended Magazine
  expandedMagazine?: number // ex: +3
}

// Grip Attachment
export type GripAttachment = {
  id: string
  name: string
  type: 'grip'
  price: number
  movementSpeed: number // ex: -5
  stability: number // ex: +3
  image: string
  compatibleWeapons?: string[]
  description?: string
}

// Bipod Attachment
export type BipodAttachment = {
  id: string
  name: string
  type: 'bipod'
  price: number
  movementSpeed: number // ex: -5
  stability: number // ex: +3
  weaponSwap: number // ex: -3
  image: string
  compatibleWeapons?: string[]
  description?: string
}

export type Attachment =
  | SightAttachment
  | AimAssistAttachment
  | BarrelAttachment
  | MuzzleAttachment
  | MagazineAttachment
  | GripAttachment
  | BipodAttachment

// Données des attachments
export const attachmentsData: Attachment[] = [
  // ========== AIM ASSIST - Laser Sights ==========
  {
    id: 'kby-11',
    name: 'KBY-11',
    type: 'aim-assist',
    attachmentType: 'Laser Sight',
    price: 42250,
    accuracyBonus: 3,
    laserColor: 'Red',
    movementSpeedBonus: -2,
    image: '/images/attachments/aim-assist/KBY-11.png',
    description: 'A low-profile laser sight that helps aim quickly.',
  },
  {
    id: 'kby-11a',
    name: 'KBY-11A',
    type: 'aim-assist',
    attachmentType: 'Laser Sight',
    price: 44750,
    accuracyBonus: 3,
    laserColor: 'Red',
    movementSpeedBonus: -2,
    image: '/images/attachments/aim-assist/KBY-11A.png',
    description: 'A low-profile laser sight that helps aim quickly.',
  },
  {
    id: 'kby-18a',
    name: 'KBY-18A',
    type: 'aim-assist',
    attachmentType: 'Laser Sight',
    price: 44750,
    accuracyBonus: 2,
    laserColor: 'Green',
    movementSpeedBonus: -1,
    image: '/images/attachments/aim-assist/KBY-18A.png',
    description: 'A low-profile laser sight that helps aim quickly.',
  },
  {
    id: 'soc-1',
    name: 'SOC-1',
    type: 'aim-assist',
    attachmentType: 'Laser Sight',
    price: 44750,
    accuracyBonus: 2,
    laserColor: 'Blue',
    movementSpeedBonus: -1,
    image: '/images/attachments/aim-assist/SOC-1.png',
    description: 'A low-profile laser sight that helps aim quickly.',
  },

  // ========== AIM ASSIST - Brain Connectors ==========
  {
    id: 'range-cbc1',
    name: 'RANGE-CBC1',
    type: 'aim-assist',
    attachmentType: 'Brain Connector',
    price: 55250,
    damageFarthestRange: -5,
    damageEffectiveRange: -5,
    damageOptimalRange: 10,
    image: '/images/attachments/aim-assist/RANGE-CBC1.png',
    description: 'A neural-networked device that amplifies damage at short range.',
  },
  {
    id: 'range-cbc2',
    name: 'RANGE-CBC2',
    type: 'aim-assist',
    attachmentType: 'Brain Connector',
    price: 55250,
    damageFarthestRange: -5,
    damageEffectiveRange: 10,
    damageOptimalRange: -5,
    image: '/images/attachments/aim-assist/RANGE-CBC2.png',
    description: 'A neural-networked device that amplifies damage at farthest range.',
  },
  {
    id: 'range-cbc3',
    name: 'RANGE-CBC3',
    type: 'aim-assist',
    attachmentType: 'Brain Connector',
    price: 55250,
    damageFarthestRange: 10,
    damageEffectiveRange: -5,
    damageOptimalRange: -5,
    image: '/images/attachments/aim-assist/RANGE-CBC3.png',
    description: 'A neural-networked device that amplifies damage at farthest range.',
  },

  // ========== BARRELS ==========
  {
    id: '1511-lb',
    name: '1511-LB',
    type: 'barrel',
    price: 62250,
    accuracy: 2,
    movementSpeed: -5,
    damage: { ar: 2, lmg: 2, smg: 1, sr: 3 },
    effectiveRange: 10,
    image: '/images/attachments/barrel/1511-LB.png',
    description: 'Significantly increases damage, accuracy, and range, but slows movement.',
  },
  {
    id: '1116-sb',
    name: '1116-SB',
    type: 'barrel',
    price: 42250,
    accuracy: 2,
    movementSpeed: 5,
    damage: -2,
    effectiveRange: -10,
    image: '/images/attachments/barrel/1116-SB.png',
    description: 'Increases stability and movement speed, but reduces damage and effective range.',
  },
  {
    id: '2001-basic',
    name: '2001-BASIC',
    type: 'barrel',
    price: 44750,
    accuracy: 2,
    stability: 2,
    image: '/images/attachments/barrel/2001-BASIC.png',
    description: 'A premium bore barrel.',
  },
  {
    id: '2116-sb',
    name: '2116-SB',
    type: 'barrel',
    price: 54750,
    accuracy: 2,
    movementSpeed: 10,
    damage: -3,
    effectiveRange: -10,
    image: '/images/attachments/barrel/2116-SB.png',
    description: 'Increases stability and movement speed but reduces damage and effective range.',
  },
  {
    id: '2511-lb',
    name: '2511-LB',
    type: 'barrel',
    price: 67250,
    accuracy: 2,
    movementSpeed: -5,
    damage: { ar: 3, lmg: 3, smg: 2, sr: 4 },
    effectiveRange: 10,
    image: '/images/attachments/barrel/2511-LB.png',
    description: 'Significantly increases damage, accuracy, and range, but slows movement.',
  },

  // ========== GRIPS ==========
  {
    id: 'afg-3',
    name: 'AFG-3',
    type: 'grip',
    price: 52250,
    movementSpeed: -2,
    stability: 3,
    image: '/images/attachments/grip/AFG-3.png',
    description: 'A grip that increases horizontal stability when firing.',
  },
  {
    id: 'afg-7',
    name: 'AFG-7',
    type: 'grip',
    price: 52250,
    movementSpeed: -2,
    stability: 3,
    image: '/images/attachments/grip/AFG-7.png',
    description: 'A grip that increases horizontal stability when firing.',
  },
  {
    id: 'sse5',
    name: 'SSE5',
    type: 'grip',
    price: 52250,
    movementSpeed: -2,
    stability: 3,
    image: '/images/attachments/grip/SSE5.png',
    description: 'A grip that increases horizontal stability when firing.',
  },

  // ========== MUZZLES ==========
  {
    id: 'mb50l',
    name: 'MB50L',
    type: 'muzzle',
    attachmentType: 'Flash Guard',
    price: 42250,
    accuracy: 2,
    muzzleType: 'Cross',
    image: '/images/attachments/muzzle/MB50L.png',
    description: 'This lightweight flash guard reduces recoil.',
  },
  {
    id: 'mb58l',
    name: 'MB58L',
    type: 'muzzle',
    attachmentType: 'Flash Guard',
    price: 44750,
    accuracy: 2,
    muzzleType: 'X-Cross',
    image: '/images/attachments/muzzle/MB58L.png',
    description: 'This lightweight flash guard reduces recoil.',
  },
  {
    id: 'mb72h',
    name: 'MB72H',
    type: 'muzzle',
    attachmentType: 'Flash Guard',
    price: 42250,
    accuracy: 2,
    muzzleType: 'Star',
    image: '/images/attachments/muzzle/MB72H.png',
    description: 'A heavy flash guard that reduces recoil.',
  },
  {
    id: 'mb76h',
    name: 'MB76H',
    type: 'muzzle',
    attachmentType: 'Flash Guard',
    price: 47250,
    accuracy: 2,
    muzzleType: 'X-Star',
    image: '/images/attachments/muzzle/MB76H.png',
    description: 'A heavy flash guard that reduces recoil.',
  },
  {
    id: 'r4-sp1-heavy',
    name: 'R4-SP1',
    type: 'muzzle',
    attachmentType: 'Suppressor',
    price: 47250,
    stability: 4,
    effectiveRange: -5,
    detectionRange: -10,
    image: '/images/attachments/muzzle/R4-SP1.png',
    description: 'This suppressor muffles noise and increases stability at the cost of range.',
  },
  {
    id: 'r4-sp5',
    name: 'R4-SP5',
    type: 'muzzle',
    attachmentType: 'Suppressor',
    price: 47250,
    stability: 4,
    effectiveRange: -5,
    detectionRange: -10,
    image: '/images/attachments/muzzle/R4-SP5.png',
    description: 'This suppressor muffles noise and increases stability at the cost of range.',
  },
  {
    id: 'r4-sp1-light',
    name: 'R4-SP1',
    type: 'muzzle',
    attachmentType: 'Suppressor',
    price: 44750,
    stability: 2,
    effectiveRange: -3,
    detectionRange: -12,
    image: '/images/attachments/muzzle/R4-SP1.png',
    description: 'This suppressor muffles noise and increases stability at the cost of range.',
  },

  // ========== SIGHTS ==========
  {
    id: '4x32-ps',
    name: '4x32 PS',
    type: 'sight',
    price: 57250,
    zoom: 1.4,
    aimSpeed: 0.22,
    variableZoom: false,
    image: '/images/attachments/sight/4x32 PS.png',
    description: 'This sight\'s reticle is optimized for mid or long-range engagement.',
  },
  {
    id: 'dio-v',
    name: 'DIO-V',
    type: 'sight',
    price: 47250,
    zoom: 1.4,
    aimSpeed: 0.14,
    variableZoom: false,
    image: '/images/attachments/sight/DIO-V.png',
    description: 'A light sight meant for lining up accurate aimed shots.',
  },
  {
    id: 'fm-rds',
    name: 'FM RDS',
    type: 'sight',
    price: 49750,
    zoom: 1.4,
    aimSpeed: 0.14,
    variableZoom: false,
    image: '/images/attachments/sight/FM RDS.png',
    description: 'A red dot sight with enough peripheral view to react to melee attackers.',
  },
  {
    id: 'khi-776',
    name: 'KHI 776',
    type: 'sight',
    price: 49250,
    zoom: 2.0,
    aimSpeed: 0.18,
    variableZoom: false,
    image: '/images/attachments/sight/KHI 776.png',
    description: 'A holographic sight with a wide range of vision.',
  },
  {
    id: 'khi-hs',
    name: 'KHI HS',
    type: 'sight',
    price: 52250,
    zoom: 2.0,
    aimSpeed: 0.18,
    variableZoom: false,
    image: '/images/attachments/sight/KHI HS.png',
    description: 'A holographic hybrid sight that consists of two lenses.',
  },
  {
    id: 'n7-rds',
    name: 'N7 RDS',
    type: 'sight',
    price: 49750,
    zoom: 1.4,
    aimSpeed: 0.18,
    variableZoom: false,
    image: '/images/attachments/sight/N7 RDS.png',
    description: 'A standard tube-style red dot sight.',
  },
  {
    id: 'pso-1',
    name: 'PSO-1',
    type: 'sight',
    price: 62250,
    zoom: 4.6,
    aimSpeed: 0.25,
    variableZoom: true,
    image: '/images/attachments/sight/PSO-1.png',
    description: 'A scope exclusively designed for precise long-range shots.',
  },
  {
    id: 'quick-point-s1',
    name: 'QUICK POINT S1',
    type: 'sight',
    price: 49750,
    zoom: 1.2,
    aimSpeed: 0.25,
    variableZoom: false,
    image: '/images/attachments/sight/QUICK POINT S1.png',
    description: 'This sight allows you to take very quick aim.',
  },
  {
    id: 'quick-point-s2',
    name: 'QUICK POINT S2',
    type: 'sight',
    price: 49750,
    zoom: 1.2,
    aimSpeed: 0.25,
    variableZoom: false,
    image: '/images/attachments/sight/QUICK POINT S2.png',
    description: 'This sight allows you to take very quick aim.',
  },
  {
    id: 'seburo-acs',
    name: 'SEBURO ACS',
    type: 'sight',
    price: 59250,
    zoom: 3.4,
    aimSpeed: 0.22,
    variableZoom: false,
    image: '/images/attachments/sight/SEBURO ACS.png',
    description: 'This sight is specialised for mid-range combat.',
  },
  {
    id: 'seburo-hd25',
    name: 'SEBURO HD25',
    type: 'sight',
    price: 59250,
    zoom: 3.4,
    aimSpeed: 0.22,
    variableZoom: false,
    image: '/images/attachments/sight/SEBURO HD25.png',
    description: 'A high-precision optical lens useful in most situation.',
  },
  {
    id: 'seburo-rs',
    name: 'SEBURO RS',
    type: 'sight',
    price: 47250,
    zoom: 1.4,
    aimSpeed: 0.14,
    variableZoom: false,
    image: '/images/attachments/sight/SEBURO RS.png',
    description: 'This sight has a wide range of view for quick aiming.',
  },
  {
    id: 'trico-minicon',
    name: 'TRICO MINICON',
    type: 'sight',
    price: 49750,
    zoom: 1.4,
    aimSpeed: 0.14,
    variableZoom: false,
    image: '/images/attachments/sight/TRICO MINICON.png',
    description: 'This sight is made for quick and accurate targeting.',
  },
  {
    id: 'trico-urdu',
    name: 'TRICO URDU',
    type: 'sight',
    price: 52250,
    zoom: 2.0,
    aimSpeed: 0.18,
    variableZoom: false,
    image: '/images/attachments/sight/TRICO URDU.png',
    description: 'A reflex sight with a unique design.',
  },
  {
    id: 'trusight',
    name: 'TruSIGHT',
    type: 'sight',
    price: 47250,
    zoom: 1.4,
    aimSpeed: 0.14,
    variableZoom: false,
    image: '/images/attachments/sight/TruSIGHT.png',
    description: 'A sight that is easy to use and provides a wide range of vision.',
  },
  {
    id: 'xt1',
    name: 'XT1',
    type: 'sight',
    price: 47250,
    zoom: 1.4,
    aimSpeed: 0.14,
    variableZoom: false,
    image: '/images/attachments/sight/XT1.png',
    description: 'A sight optimized for quick reaction in short and mid-range combat.',
  },

  // ========== MAGAZINES ==========
  {
    id: 'drum-a1',
    name: 'Drum A1',
    type: 'magazine',
    price: 74750,
    movementSpeed: -5,
    stability: -10,
    drumMag: '50/100',
    weaponSwap: -10,
    image: '/images/attachments/magazine/Drum A1.png',
    description: 'Significantly decreases all stats, but its huge capacity significantly increases combat sustainability.',
  },
  {
    id: 'drum-s1',
    name: 'Drum S1',
    type: 'magazine',
    price: 74750,
    movementSpeed: -5,
    stability: -10,
    drumMag: '50/100',
    weaponSwap: -10,
    image: '/images/attachments/magazine/Drum S1.png',
    description: 'Significantly decreases all stats, but its huge capacity significantly increases combat sustainability.',
  },
  {
    id: 'dual-a1',
    name: 'Dual A1',
    type: 'magazine',
    price: 59750,
    movementSpeed: -5,
    stability: -5,
    drumMag: '+30',
    image: '/images/attachments/magazine/Dual A1.png',
    description: 'Provides an extra magazine during combat.',
  },
  {
    id: 'extended-a1',
    name: 'Extended A1',
    type: 'magazine',
    price: 64750,
    movementSpeed: -2,
    stability: -2,
    expandedMagazine: 3,
    image: '/images/attachments/magazine/Extended A1.png',
    description: 'This magazine carries more rounds than usual.',
  },

  // ========== BIPODS ==========
  {
    id: 'fa-con',
    name: 'FA-CON',
    type: 'bipod',
    price: 47250,
    movementSpeed: -2,
    stability: 2,
    weaponSwap: -5,
    image: '/images/attachments/bipod/FA-CON.png',
    description: 'Increases stability but slows down movement and weapon swapping.',
  },
  {
    id: 'fot-ff',
    name: 'FOT-FF',
    type: 'bipod',
    price: 47250,
    movementSpeed: -5,
    stability: 5,
    weaponSwap: -5,
    image: '/images/attachments/bipod/FOT-FF.png',
    description: 'Increases stability but slows down movement and weapon swapping.',
  },
  {
    id: 'morris-q7-sh',
    name: 'MORRIS Q7 / SH',
    type: 'bipod',
    price: 47250,
    movementSpeed: -5,
    stability: 5,
    weaponSwap: -5,
    image: '/images/attachments/bipod/MORRIS Q7 SH.png',
    description: 'Increases stability but slows down movement and weapon swapping.',
  },
  {
    id: 'morris-ul5',
    name: 'MORRIS UL5',
    type: 'bipod',
    price: 44750,
    movementSpeed: -5,
    stability: 5,
    weaponSwap: -5,
    image: '/images/attachments/bipod/MORRIS UL5.png',
    description: 'A heavy bipod that increases stability with a significant reduction to movement speed.',
  },
  {
    id: 'qb100',
    name: 'QB100',
    type: 'bipod',
    price: 47250,
    movementSpeed: -5,
    stability: 5,
    weaponSwap: -5,
    image: '/images/attachments/bipod/QB100.png',
    description: 'Increases stability but slows down movement and weapon swapping.',
  },
  {
    id: 't-10',
    name: 'T-10',
    type: 'bipod',
    price: 15700,
    movementSpeed: -5,
    stability: 5,
    weaponSwap: -5,
    image: '/images/attachments/bipod/T-10.png',
    description: 'Increases stability but slows down movement and weapon swapping.',
  },
  {
    id: 'th1029',
    name: 'TH1029',
    type: 'bipod',
    price: 49750,
    movementSpeed: -5,
    stability: 7,
    weaponSwap: -5,
    image: '/images/attachments/bipod/TH1029.png',
    description: 'Increases stability but slows down movement and weapon swapping.',
  },
]

