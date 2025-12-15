// Types pour les musiques
export interface Music {
  id: string
  title: string
  artist: string
  duration: string
  category: 'ambient' | 'combat' | 'menu' | 'theme'
  file: string
  description?: string
}

// Données des musiques du jeu
export const musicData: Music[] = [
  // Menu / Lobby
  {
    id: 'logo',
    title: 'Opening',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'menu',
    file: '/music/Logo.mp3',
    description: 'Musique d\'ouverture du jeu'
  },
  {
    id: 'intro-sj',
    title: 'Intro SJ',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'menu',
    file: '/music/Intro Sj.mp3',
    description: 'Introduction'
  },
  {
    id: 'lobby-sj-01',
    title: 'Lobby SJ 01',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'menu',
    file: '/music/Lobby Sj 01.mp3',
    description: 'Musique du lobby'
  },
  {
    id: 'ready-sj-01',
    title: 'Ready SJ 01',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'menu',
    file: '/music/Ready Sj 01.mp3',
    description: 'Écran de préparation'
  },
  // In Game
  {
    id: 'in-game-dm-round',
    title: 'In Game DM Round',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'combat',
    file: '/music/In Game Dm Round.mp3',
    description: 'Round de Deathmatch'
  },
  {
    id: 'in-game-gm-ready',
    title: 'In Game GM Ready',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'combat',
    file: '/music/In Game Gm Ready.mp3',
    description: 'Préparation partie'
  },
  {
    id: 'in-game-start-ttm-01',
    title: 'In Game Start TTM 01',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'combat',
    file: '/music/In Game Start TTM 01.mp3',
    description: 'Début de partie TTM'
  },
  // TTM (Terminal)
  {
    id: 'ttm-01-ready',
    title: 'TTM 01 Ready',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'combat',
    file: '/music/TTM 01 Ready.mp3',
    description: 'Préparation TTM'
  },
  {
    id: 'ttm-01-start',
    title: 'TTM 01 Start',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'combat',
    file: '/music/TTM 01 Start.mp3',
    description: 'Début TTM'
  },
  {
    id: 'ttm-01-start-fade-out',
    title: 'TTM 01 Start Fade Out',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'combat',
    file: '/music/TTM 01 Start Fade Out.mp3',
    description: 'Transition TTM'
  },
  {
    id: 'ttm-01-hacking',
    title: 'TTM 01 Hacking',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'combat',
    file: '/music/TTM 01 Hacking.mp3',
    description: 'Musique de hacking'
  },
  {
    id: 'ttm-01-hacking-fade-out',
    title: 'TTM 01 Hacking Fade Out',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'combat',
    file: '/music/TTM 01 Hacking Fade Out.mp3',
    description: 'Transition hacking'
  },
  {
    id: 'ttm-01-hacking-fade-out-a',
    title: 'TTM 01 Hacking Fade Out A',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'combat',
    file: '/music/TTM 01 Hacking Fade Out A.mp3',
    description: 'Transition hacking A'
  },
  {
    id: 'ttm-01-hacking-fade-out-b',
    title: 'TTM 01 Hacking Fade Out B',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'combat',
    file: '/music/TTM 01 Hacking Fade Out B.mp3',
    description: 'Transition hacking B'
  },
  {
    id: 'ttm-01-terminal-01',
    title: 'TTM 01 Terminal 01',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'combat',
    file: '/music/TTM 01 Terminal 01.mp3',
    description: 'Terminal 01'
  },
  {
    id: 'ttm-01-terminal-02',
    title: 'TTM 01 Terminal 02',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'combat',
    file: '/music/TTM 01 Terminal 02.mp3',
    description: 'Terminal 02'
  },
  {
    id: 'ttm-01-terminal-fade-out',
    title: 'TTM 01 Terminal Fade Out',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'combat',
    file: '/music/TTM 01 Terminal Fade Out.mp3',
    description: 'Transition terminal'
  },
  {
    id: 'ttm-01-final-score',
    title: 'TTM 01 Final Score',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'combat',
    file: '/music/TTM 01 Final Score.mp3',
    description: 'Score final TTM'
  },
  // Tutorial
  {
    id: 'tutorial',
    title: 'Tutorial',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'theme',
    file: '/music/Tutorial.mp3',
    description: 'Musique du tutoriel'
  },
  {
    id: 'tutorial-intro-cut-scene',
    title: 'Tutorial Intro Cut Scene',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'theme',
    file: '/music/Tutorial Intro Cut Scene.mp3',
    description: 'Introduction du tutoriel'
  },
  {
    id: 'tutorial-matrix',
    title: 'Tutorial Matrix',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'theme',
    file: '/music/Tutorial Matrix.mp3',
    description: 'Matrix du tutoriel'
  },
  // Events
  {
    id: 'bomb-count',
    title: 'Bomb Count',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'combat',
    file: '/music/Bomb Count.mp3',
    description: 'Compte à rebours bombe'
  },
  {
    id: 'end-count',
    title: 'End Count',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'combat',
    file: '/music/End Count.mp3',
    description: 'Fin du compte à rebours'
  },
  {
    id: 'win',
    title: 'Win',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'theme',
    file: '/music/Win.mp3',
    description: 'Musique de victoire'
  },
  {
    id: 'lose',
    title: 'Lose',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'theme',
    file: '/music/Lose.mp3',
    description: 'Musique de défaite'
  },
  {
    id: 'dead-01',
    title: 'Dead 01',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'combat',
    file: '/music/Dead 01.mp3',
    description: 'Mort 01'
  },
  {
    id: 'dead-02',
    title: 'Dead 02',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'combat',
    file: '/music/Dead 02.mp3',
    description: 'Mort 02'
  },
  {
    id: 'dead-03',
    title: 'Dead 03',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'combat',
    file: '/music/Dead 03.mp3',
    description: 'Mort 03'
  },
  {
    id: 'result',
    title: 'Result',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'theme',
    file: '/music/Result.mp3',
    description: 'Résultats'
  },
  // Ambient
  {
    id: 'matrix',
    title: 'Matrix',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'ambient',
    file: '/music/Matrix.mp3',
    description: 'Ambiance Matrix'
  },
  {
    id: 'even',
    title: 'Even',
    artist: 'Ghost in the Shell: First Assault OST',
    duration: '0:00',
    category: 'ambient',
    file: '/music/Even.mp3',
    description: 'Ambiance Even'
  }
]

