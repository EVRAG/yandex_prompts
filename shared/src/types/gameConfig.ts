export interface AnswerOption {
  text: string;
  isCorrect: boolean;
}

export interface GameStageConfig {
  id: string;
  title: string;
  type: 'registration' | 'info' | 'question' | 'leaderboard';
  questionText?: string;
  referenceAnswer?: string; // Hidden from client until revealed
  timeLimitSeconds?: number;
  answerOptions?: AnswerOption[]; // Если есть - вопрос с вариантами ответов, иначе - текстовый ввод
  imageUrl?: string; // URL изображения для вопроса (опционально)
  displayQuestionTextFontSize?: number; // Размер шрифта текста вопроса на display странице (в px)
  displayAnswerFontSize?: number; // Размер шрифта правильного ответа на display странице (в px)
  displayAnswerOptionsFontSize?: number; // Размер шрифта вариантов ответов на display странице (в px)
  displayQuestionTitle?: string; // Заголовок вопроса на display странице (например, "Какой правильный ответ?")
  displayAnswerRevealedTitle?: string; // Заголовок когда ответ раскрыт на display странице (например, "Правильный ответ")
  showQuestionTextOnMobile?: boolean; // Показывать ли текст вопроса на мобильной версии (в белой плашке)
  questionNumberLabel?: string; // Номер вопроса для отображения на мобильной версии (например, "Вопрос 8/15")
}

export interface GameConfig {
  stages: GameStageConfig[];
}

export interface GameStage extends GameStageConfig {
  status: 'pending' | 'active' | 'locked' | 'revealed';
  startTime?: number; // timestamp when active started
}

export interface Player {
  id: string;
  name: string;
  score: number;
  joinedAt: number;
  lastActive: number;
  isOnline: boolean;
}

export interface Submission {
  id: string;
  playerId: string;
  stageId: string;
  answer: string;
  score?: number;
  feedback?: string;
  createdAt: number;
}
