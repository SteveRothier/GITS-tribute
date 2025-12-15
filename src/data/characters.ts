export type CharacterClass = 'assault' | 'infiltrator' | 'specialist'

export type CharacterSkin = {
  label: string
  src: string
}

export type CharacterAbility = {
  name: string
  image: string
  description: string
}

export type CharacterCard = {
  id: string
  name: string
  codename?: string
  description: string
  class: CharacterClass
  isNew?: boolean
  skins: CharacterSkin[]
  ability: CharacterAbility
}

export const CLASS_META: Record<CharacterClass, { label: string; icon: string; color: string; accent: string }> = {
  assault: {
    label: 'ASSAUT',
    icon: '/images/roles/Assaut.png',
    color: '#ff661a',
    accent: 'rgba(255, 102, 26, 0.8)',
  },
  infiltrator: {
    label: 'INFILTRATEUR',
    icon: '/images/roles/Infiltrateur.png',
    color: '#00d4ff',
    accent: 'rgba(0, 212, 255, 0.7)',
  },
  specialist: {
    label: 'SPÉCIALISTE',
    icon: '/images/roles/Sp%C3%A9cialiste.png',
    color: '#00ff84',
    accent: 'rgba(0, 255, 132, 0.7)',
  },
}

export const FALLBACK_AVATAR = '/images/ui/Laughing_man_bleu.svg'

export const characters: CharacterCard[] = [
  {
    id: 'motoko',
    name: 'Motoko Kusanagi',
    codename: 'Combat cybernétique',
    class: 'infiltrator',
    description: "La chef calme et déterminée des opérations de terrain de la Section 9. Elle est l'un des membres les plus cybernétisés de l'équipe et l'une des meilleures combattantes au monde en matière de cyber-cerveaux.",
    skins: [
      { label: 'Default', src: '/images/characters/motoko/motoko.png' },
      { label: 'Standard', src: '/images/characters/motoko/motoko_skin1.png' },
      { label: 'Stealth', src: '/images/characters/motoko/motoko_skin2.png' },
      { label: 'Prototype', src: '/images/characters/motoko/motoko_skin3.png' },
      { label: 'Skin 4', src: '/images/characters/motoko/motoko_skin4.png' },
      { label: 'Skin 5', src: '/images/characters/motoko/motoko_skin5.png' },
      { label: 'Skin 6', src: '/images/characters/motoko/motoko_skin6.png' },
      { label: 'Skin 7', src: '/images/characters/motoko/motoko_skin7.png' },
      { label: 'Skin 8', src: '/images/characters/motoko/motoko_skin8.png' },
      { label: 'Skin 9', src: '/images/characters/motoko/motoko_skin9.png' },
    ],
    ability: {
      name: 'Camouflage Thermo-Optique AMO',
      image: '/images/characters/motoko/skill_Camo.png',
      description: "Active une couche de camouflage actif qui rend le porteur temporairement invisible. Ce camouflage ne rend pas totalement invisible, mais reste actif pendant les déplacements. Le niveau 2 de cette compétence améliore l'efficacité du camouflage et permet de synchroniser la version 1 de la compétence avec les alliés (SkillSync). SkillSync est disponible au niveau 2."
    },
  },
  {
    id: 'batou',
    name: 'Batou',
    codename: 'Armes à feu',
    class: 'assault',
    description: "Un vétéran aguerri, opératif spécial au long passé militaire. Malgré son allure imposante, il est connu pour sa gentillesse et son humour.",
    skins: [
      { label: 'Default', src: '/images/characters/batou/batou.png' },
      { label: 'Standard', src: '/images/characters/batou/batou_skin1.png' },
      { label: 'Urban Siege', src: '/images/characters/batou/batou_skin2.png' },
      { label: 'Skin 3', src: '/images/characters/batou/batou_skin3.png' },
      { label: 'Skin 4', src: '/images/characters/batou/batou_skin4.png' },
      { label: 'Skin 5', src: '/images/characters/batou/batou_skin5.png' },
    ],
    ability: {
      name: 'Lanceur de Bras (Arm Launcher)',
      image: '/images/characters/batou/skill_ArmLauncher.png',
      description: "Tire un missile depuis un lanceur dissimulé dans le bras de l'utilisateur. Activer le lance-missile empêche de sprinter. Niveau 2 : tire deux missiles."
    },
  },
  {
    id: 'ishikawa',
    name: 'Ishikawa',
    codename: 'Renseignement',
    class: 'assault',
    description: "Expert en guerre cybernétique avec une grande expérience militaire. Plus âgé membre de la Section 9, il reste calme même dans les pires situations.",
    skins: [
      { label: 'Default', src: '/images/characters/ishikawa/ishikawa.png' },
      { label: 'Standard', src: '/images/characters/ishikawa/ishikawa_skin1.png' },
      { label: 'Firewall', src: '/images/characters/ishikawa/ishikawa_skin2.png' },
      { label: 'Skin 3', src: '/images/characters/ishikawa/ishikawa_skin3.png' },
      { label: 'Skin 4', src: '/images/characters/ishikawa/ishikawa_skin4.png' },
    ],
    ability: {
      name: 'Tourelle Cybernétique (Cyber Sentry)',
      image: '/images/characters/ishikawa/skill_CyberSentry.png',
      description: "Déploie une tourelle qui cible automatiquement les ennemis à portée. Les tourelles peuvent être détruites par les adversaires. Niveau 2 : augmente la portée de détection et les points de vie de la tourelle. Peut être repositionnée."
    },
  },
  {
    id: 'borma',
    name: 'Borma',
    codename: 'Démolitions',
    class: 'assault',
    description: "Équipé d'yeux prosthétiques comme Batou, il est expert en guerre cybernétique et en explosifs. Son attitude calme cache une grande intelligence.",
    skins: [
      { label: 'Default', src: '/images/characters/borma/borma.png' },
      { label: 'Standard', src: '/images/characters/borma/borma_skin1.png' },
      { label: 'Siege', src: '/images/characters/borma/borma_skin2.png' },
      { label: 'Skin 3', src: '/images/characters/borma/borma_skin3.png' },
      { label: 'Skin 4', src: '/images/characters/borma/borma_skin4.png' },
    ],
    ability: {
      name: 'Armure Nano-Gel (Nano-Gel Armor)',
      image: '/images/characters/borma/skill_NanogelArmor.png',
      description: "Active un gel de réparation cellulaire qui augmente légèrement et régénère progressivement l'armure et la santé. Le niveau 2 augmente la vitesse de régénération et permet la synchronisation de la version 1 avec les alliés (SkillSync). SkillSync est disponible au niveau 2."
    },
  },
  {
    id: 'azuma',
    name: 'Azuma',
    codename: 'Reconnaissance',
    class: 'assault',
    isNew: true,
    description: "Azuma a reçu plusieurs distinctions durant son service au sein des Forces d'autodéfense terrestres japonaises (JGSDF), ce qui lui a assuré son transfert vers la Section 9 de la Sécurité Publique.\n\nSon bouclier tactique lui permet d'avancer rapidement sur les ennemis et de tirer pleinement parti de son expérience du combat.\n\nMalgré son apparence sévère, Azuma a tendance à devenir très proche des membres de son équipe.",
    skins: [
      { label: 'Default', src: '/images/characters/azuma/azuma.png' },
    ],
    ability: {
      name: 'Bouclier/Dôme Tactique',
      image: FALLBACK_AVATAR,
      description: 'Déploie une protection temporaire pour lui-même ou ses alliés.'
    },
  },
  {
    id: 'paz',
    name: 'Paz',
    codename: 'Infiltration',
    class: 'infiltrator',
    description: "On dit qu'il fut autrefois un membre influent de la mafia japonaise. Expert en tactiques d'embuscade, il est redoutable au corps-à-corps avec un couteau.",
    skins: [
      { label: 'Default', src: '/images/characters/paz/paz.png' },
      { label: 'Standard', src: '/images/characters/paz/paz_skin1.png' },
      { label: 'Chromed', src: '/images/characters/paz/paz_skin2.png' },
      { label: 'Skin 3', src: '/images/characters/paz/paz_skin3.png' },
      { label: 'Skin 4', src: '/images/characters/paz/paz_skin4.png' },
      { label: 'Skin 5', src: '/images/characters/paz/paz_skin5.png' },
    ],
    ability: {
      name: 'Hyper Sprint',
      image: '/images/characters/paz/skill_HyperSprint.png',
      description: "Redirige l'énergie interne vers les implants musculaires pour augmenter temporairement la vitesse, la capacité de saut et la portée des attaques de mêlée. Le niveau 2 améliore l'efficacité générale et permet de synchroniser la version 1 avec les alliés (SkillSync). SkillSync est disponible au niveau 2."
    },
  },
  {
    id: 'maven',
    name: 'Maven',
    codename: 'Distraction',
    class: 'infiltrator',
    isNew: true,
    description: "Spécialiste du combat ayant prouvé sa valeur lors des conflits en Amérique du Sud. Elle a un tempérament explosif et les compétences pour aller avec.",
    skins: [
      { label: 'Default', src: '/images/characters/maven/maven.png' },
      { label: 'Skin 1', src: '/images/characters/maven/maven_skin1.png' },
      { label: 'Skin 2', src: '/images/characters/maven/maven_skin2.png' },
      { label: 'Skin 3', src: '/images/characters/maven/maven_skin3.png' },
      { label: 'Skin 4', src: '/images/characters/maven/maven_skin4.png' },
      { label: 'Skin 5', src: '/images/characters/maven/maven_skin5.png' },
      { label: 'Skin 6', src: '/images/characters/maven/maven_skin6.png' },
      { label: 'Skin 7', src: '/images/characters/maven/maven_skin7.png' },
    ],
    ability: {
      name: 'Barrière Thermo-Optique (Therm-Optic Barrier)',
      image: '/images/characters/maven/skill_CyberWal.png',
      description: "Active un mur thermo-optique capable d'obscurcir la vision et de ralentir les projectiles. Les barrières peuvent être détruites par les ennemis. Niveau 2 : augmente la taille de la barrière. Peut être repositionnée."
    },
  },
  {
    id: 'kuro',
    name: 'Kuro',
    codename: 'Guerre électronique',
    class: 'infiltrator',
    isNew: true,
    description: "Spécialiste de la guerre électronique capable d'immobiliser les ennemis avec des impulsions à courte portée. Ses compétences techniques rivalisent avec celles d'Ishikawa.",
    skins: [
      { label: 'Default', src: '/images/characters/kuro/kuro.png' },
      { label: 'Skin 1', src: '/images/characters/kuro/kuro_skin1.png' },
      { label: 'Skin 2', src: '/images/characters/kuro/kuro_skin2.png' },
      { label: 'Skin 3', src: '/images/characters/kuro/kuro_skin3.png' },
    ],
    ability: {
      name: 'Générateur EMP (EMP Generator)',
      image: FALLBACK_AVATAR,
      description: "Place un générateur EMP qui désactive les compétences et les dispositifs électroniques des ennemis proches. Niveau 2 : augmente la durée de l'effet et la santé du générateur. Les générateurs EMP peuvent être détruits par les ennemis."
    },
  },
  {
    id: 'reiko',
    name: 'Reiko',
    codename: 'Communication',
    class: 'infiltrator',
    isNew: true,
    description: "Issue d'une famille aisée, Reiko excellait en ingénierie cybercérébrale et a obtenu son doctorat dans le domaine avec deux ans d'avance.\n\nSa formation lui a donné un avantage en cyber-guerre, et elle est devenue experte en \"combat diving\", une technique utilisée pour distraire et désorienter les ennemis.\n\nNouvelle recrue de la Section 9, Reiko se montre généralement vive d'esprit et parfois sarcastique avec ses camarades.",
    skins: [
      { label: 'Default', src: '/images/characters/reiko/reiko.png' },
      { label: 'Skin 1', src: '/images/characters/reiko/reiko_skin1.png' },
    ],
    ability: {
      name: 'Saut de Réseau (Net Jump)',
      image: FALLBACK_AVATAR,
      description: "Effectue un plongeon cybernétique rapide, projetant une onde de distorsion qui désoriente les ennemis à proximité. Pensée pour perturber les lignes adverses avant une attaque surprise."
    },
  },
  {
    id: 'togusa',
    name: 'Togusa',
    codename: 'Investigation',
    class: 'specialist',
    description: "Le plus jeune membre de la Section 9 et le seul à avoir une famille. Le Major l'a recruté pour son talent d'enquêteur et son faible niveau de cybernétisation. Il a une passion pour les objets vintage, préférant un revolver Mateba aux armes modernes.",
    skins: [
      { label: 'Default', src: '/images/characters/togusa/togusa.png' },
      { label: 'Standard', src: '/images/characters/togusa/togusa_skin1.png' },
      { label: 'Investigative', src: '/images/characters/togusa/togusa_skin2.png' },
      { label: 'Skin 3', src: '/images/characters/togusa/togusa_skin3.png' },
      { label: 'Skin 4', src: '/images/characters/togusa/togusa_skin4.png' },
      { label: 'Skin 5', src: '/images/characters/togusa/togusa_skin5.png' },
      { label: 'Skin 6', src: '/images/characters/togusa/togusa_skin6.png' },
    ],
    ability: {
      name: 'Drone Traqueur (Seeker Drone)',
      image: '/images/characters/togusa/skill_Seeker.png',
      description: "Libère un drone chasseur qui explose au contact d'un ennemi. Les drones peuvent être détruits par les adversaires. Niveau 2 : libère deux drones et ajoute un effet de brouillage."
    },
  },
  {
    id: 'saito',
    name: 'Saito',
    codename: 'Tir de précision',
    class: 'specialist',
    description: "Le tireur d'élite de la Section 9 est un sniper d'exception. Il possède très peu d'implants, le principal étant son système oculaire connecté par satellite : le Hawkeye.",
    skins: [
      { label: 'Default', src: '/images/characters/saito/saito.png' },
      { label: 'Standard', src: '/images/characters/saito/saito_skin1.png' },
      { label: 'Longshot', src: '/images/characters/saito/saito_skin2.png' },
      { label: 'Skin 3', src: '/images/characters/saito/saito_skin3.png' },
      { label: 'Skin 4', src: '/images/characters/saito/saito_skin4.png' },
      { label: 'Skin 5', src: '/images/characters/saito/saito_skin5.png' },
    ],
    ability: {
      name: 'Capteur Thermique (Heat Sensor)',
      image: '/images/characters/saito/skill_Hawkeye.png',
      description: "Connecte les yeux à un satellite pour rendre les ennemis visibles à travers les murs. Si un ennemi utilise le Capteur Thermique, vous en serez averti. Le niveau 2 augmente le nombre de balayages et permet de synchroniser la version 1 avec les alliés (SkillSync). SkillSync est disponible au niveau 2."
    },
  },
  {
    id: 'sitara',
    name: 'Sitara',
    codename: 'Opérateur de Drone',
    class: 'specialist',
    isNew: true,
    description: "Sitara est arrivée à la Section 9 de la Sécurité Publique en passant par l'unité spéciale antiterroriste de la CIA. Grandir au sein de l'Empire Américain en difficulté lui a donné de solides compétences de survie, mais aussi des difficultés à se lier aux autres.\n\nIncapable de progresser au sein de la CIA, elle a sauté sur l'occasion de rejoindre l'équipe des Affaires Extérieures d'Aramaki à la Section 9.\n\nDotée d'un talent remarquable pour l'ingénierie mécanique, Sitara est capable d'entretenir son propre corps prothétique et de soutenir son équipe au combat grâce à des drones automatisés.",
    skins: [
      { label: 'Default', src: '/images/characters/sitara/sitara.png' },
    ],
    ability: {
      name: 'Drone Siphon (Siphon Drone)',
      image: FALLBACK_AVATAR,
      description: "Déploie un drone automatique qui attaque les ennemis ou perturbe leurs systèmes."
    },
  },
]

