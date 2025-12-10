import s from './QuestionResult.module.scss';

interface QuestionResultProps {
  score: number;
  feedback: string;
  playerName?: string;
  playerScore?: number;
}

export function QuestionResult({ score, feedback, playerName = 'Игрок', playerScore = 0 }: QuestionResultProps) {
  return (
    <div className={s.root}>
      <div className={s.wrapper}>
        <div className={s.header}>
          <div className={s.left}>
            {playerName}
            <div className={s.points}>
              {playerScore}
              <img src="/images/points.svg" alt="" />
            </div>
          </div>
        </div>
        <div className={s.content}>
          <div className={s.plusOne}>{score > 0 ? `+${score}` : score}</div>
          <div className={s.correctText}>{feedback}</div>
        </div>
        <div className={s.nextQuestionText}>
          Скоро появится <br /> следующий вопрос
        </div>
      </div>
      <img className={s.img} src="/images/bg_mobile.png" alt="bg" />
    </div>
  );
}
