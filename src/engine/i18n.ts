import { LanguageCode } from './types';

export interface TabStrings {
  play: string;
  scene: string;
  agent: string;
  arena: string;
  assets: string;
  generators: string;
  controls: string;
  art: string;
  lab: string;
  skills: string;
  services: string;
  export: string;
}

export interface TranslationStrings {
  appTitle: string;
  appSubtitle: string;
  playGame: string;
  openStudio: string;
  resumeGame: string;
  restartLevel: string;
  saveProgress: string;
  loadProgress: string;
  controlsBtn: string;
  backToTitle: string;
  pausedTitle: string;
  victoryTitle: string;
  gameoverTitle: string;
  nextLevel: string;
  continueSaved: string;
  offlineBadge: string;
  onlineBadge: string;
  levelLabel: string;
  hpLabel: string;
  energyLabel: string;
  shardsLabel: string;
  coinsLabel: string;
  scoreLabel: string;
  slotLabel: string;
  autoSaveLabel: string;
  deleteSlot: string;
  emptySlot: string;
  tabs: TabStrings;
}

const idStrings: TranslationStrings = {
  appTitle: 'Mungil Engine V7',
  appSubtitle: 'Bowo: Penjaga Cahaya',
  playGame: 'Main Game',
  openStudio: 'Buka Studio',
  resumeGame: 'Lanjutkan',
  restartLevel: 'Ulangi Babak',
  saveProgress: 'Simpan Progres',
  loadProgress: 'Muat Progres',
  controlsBtn: 'Kontrol Sentuh',
  backToTitle: 'Menu Judul',
  pausedTitle: 'Game Dijeda',
  victoryTitle: 'Cahaya Menang!',
  gameoverTitle: 'Lentera Redup',
  nextLevel: 'Babak Berikutnya',
  continueSaved: 'Lanjutkan Simpanan',
  offlineBadge: 'Mode Offline',
  onlineBadge: 'Online',
  levelLabel: 'Babak',
  hpLabel: 'HP',
  energyLabel: 'EN',
  shardsLabel: 'Shard',
  coinsLabel: 'Koin',
  scoreLabel: 'Skor',
  slotLabel: 'Slot',
  autoSaveLabel: 'Auto-Save',
  deleteSlot: 'Hapus',
  emptySlot: 'Kosong',
  tabs: {
    play: 'Play',
    scene: 'Scene',
    agent: 'AI & MCP',
    arena: 'Arena AI',
    assets: 'Assets',
    generators: 'Generators',
    controls: 'Controls',
    art: 'Art Style',
    lab: 'Lab',
    skills: 'AI Skills',
    services: 'Services',
    export: 'Export'
  }
};

const enStrings: TranslationStrings = {
  appTitle: 'Mungil Engine V7',
  appSubtitle: 'Bowo: Guardian of Light',
  playGame: 'Play Game',
  openStudio: 'Open Studio',
  resumeGame: 'Resume',
  restartLevel: 'Restart Level',
  saveProgress: 'Save Progress',
  loadProgress: 'Load Progress',
  controlsBtn: 'Touch Controls',
  backToTitle: 'Title Screen',
  pausedTitle: 'Paused',
  victoryTitle: 'Light Prevails!',
  gameoverTitle: 'Lantern Dimmed',
  nextLevel: 'Next Level',
  continueSaved: 'Continue Saved',
  offlineBadge: 'Offline Ready',
  onlineBadge: 'Online',
  levelLabel: 'Level',
  hpLabel: 'HP',
  energyLabel: 'EN',
  shardsLabel: 'Shard',
  coinsLabel: 'Coin',
  scoreLabel: 'Score',
  slotLabel: 'Slot',
  autoSaveLabel: 'Auto-Save',
  deleteSlot: 'Delete',
  emptySlot: 'Empty',
  tabs: {
    play: 'Play',
    scene: 'Scene',
    agent: 'AI & MCP',
    arena: 'Arena AI',
    assets: 'Assets',
    generators: 'Generators',
    controls: 'Controls',
    art: 'Art Style',
    lab: 'Lab',
    skills: 'AI Skills',
    services: 'Services',
    export: 'Export'
  }
};

const jaStrings: TranslationStrings = {
  ...enStrings,
  appSubtitle: 'Bowo: 光の守護者',
  playGame: 'ゲーム開始',
  openStudio: 'スタジオを開く',
  resumeGame: '再開',
  restartLevel: 'リスタート',
  saveProgress: 'セーブ',
  loadProgress: 'ロード',
  controlsBtn: 'タッチ設定',
  backToTitle: 'タイトル',
  pausedTitle: '一時停止',
  victoryTitle: '光の勝利！',
  gameoverTitle: 'ゲームオーバー',
  nextLevel: '次のステージ',
  continueSaved: '続きから',
  offlineBadge: 'オフライン対応',
  onlineBadge: 'オンライン',
  levelLabel: 'ステージ',
  scoreLabel: 'スコア'
};

const koStrings: TranslationStrings = {
  ...enStrings,
  appSubtitle: 'Bowo: 빛의 수호자',
  playGame: '게임 시작',
  openStudio: '스튜디오 열기',
  resumeGame: '계속하기',
  restartLevel: '다시 시작',
  saveProgress: '저장',
  loadProgress: '불러오기',
  controlsBtn: '터치 설정',
  backToTitle: '타이틀',
  pausedTitle: '일시 정지',
  victoryTitle: '빛의 승리!',
  gameoverTitle: '게임 오버',
  nextLevel: '다음 단계',
  continueSaved: '이어하기',
  offlineBadge: '오프라인 지원',
  onlineBadge: '온라인',
  levelLabel: '스테이지',
  scoreLabel: '점수'
};

const esStrings: TranslationStrings = {
  ...enStrings,
  appSubtitle: 'Bowo: Guardián de la Luz',
  playGame: 'Jugar',
  openStudio: 'Abrir Estudio',
  resumeGame: 'Reanudar',
  restartLevel: 'Reiniciar',
  saveProgress: 'Guardar',
  loadProgress: 'Cargar',
  controlsBtn: 'Controles',
  backToTitle: 'Título',
  pausedTitle: 'Pausado',
  victoryTitle: '¡La Luz Triunfa!',
  gameoverTitle: 'Linterna Apagada',
  nextLevel: 'Siguiente Nivel',
  continueSaved: 'Continuar',
  offlineBadge: 'Listo Sin Conexión',
  onlineBadge: 'En Línea',
  levelLabel: 'Nivel',
  coinsLabel: 'Monedas',
  scoreLabel: 'Puntos'
};

export const I18n = {
  t(lang: LanguageCode): TranslationStrings {
    switch (lang) {
      case 'id':
        return idStrings;
      case 'en':
        return enStrings;
      case 'ja':
        return jaStrings;
      case 'ko':
        return koStrings;
      case 'es':
        return esStrings;
    }
  }
};
