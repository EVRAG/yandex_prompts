import { useState, useEffect } from 'react';
import type { GameStage } from '@prompt-night/shared';
import s from './TextQuestion.module.scss';
import { Timer } from '../common/Timer';

interface TextQuestionProps {
  stage: GameStage;
  onSubmit: (answer: string) => void;
  playerName: string;
  playerScore: number;
  hasSubmitted?: boolean;
  questionNumber?: number | null;
}

export function TextQuestion({
  stage,
  onSubmit,
  playerName,
  playerScore,
  hasSubmitted = false,
  questionNumber,
}: TextQuestionProps) {
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (stage.status === 'active' && stage.startTime && stage.timeLimitSeconds) {
      const interval = setInterval(() => {
        const elapsed = (Date.now() - stage.startTime!) / 1000;
        const remaining = Math.max(0, Math.ceil(stage.timeLimitSeconds! - elapsed));
        setTimeLeft(remaining);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(null);
    }
  }, [stage]);

  useEffect(() => {
    setAnswer('');
  }, [stage.id]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!hasSubmitted) {
      setAnswer(e.target.value);
    }
  };

  const handleButtonClick = () => {
    if (answer.trim() && !hasSubmitted && timeLeft !== null && timeLeft > 0) {
      onSubmit(answer.trim());
    }
  };

  const isButtonActive = answer.trim().length > 0 && !hasSubmitted && timeLeft !== null && timeLeft > 0;

  // Показываем правильный ответ если время истекло или ответ отправлен
  const shouldShowCorrect = hasSubmitted || (timeLeft !== null && timeLeft === 0) || stage.status === 'locked' || stage.status === 'revealed';

  return (
    <div className={s.root}>
      <div className={s.wrapper}>
        <div className={s.header}>
          <div className={s.left}>
            <div className={s.nameRow}>
              {playerName}
              <div className={s.points}>
                {playerScore}
                <img src="/images/points.svg" alt="" />
              </div>
            </div>
            {questionNumber && <div className={s.questionNumber}>Вопрос {questionNumber}</div>}
          </div>
          <div className={s.right}>
            {timeLeft !== null && stage.startTime && stage.timeLimitSeconds && (
              <Timer 
                seconds={stage.timeLimitSeconds} 
                startTime={stage.startTime}
              />
            )}
          </div>
        </div>
        <div className={s.content}>
          {stage.imageUrl && (
            stage.imageUrl.match(/\.(mp4|webm|mov|avi)$/i) ? (
              <video 
                className={s.questionImage} 
                src={stage.imageUrl} 
                autoPlay 
                loop 
                muted 
                playsInline
              />
            ) : (
              <img className={s.questionImage} src={stage.imageUrl} alt="Question image" />
            )
          )}
          {shouldShowCorrect && stage.referenceAnswer && (
            <div className={s.correctAnswer}>
              {stage.referenceAnswer}
            </div>
          )}
          <textarea
            placeholder="Ваш ответ..."
            className={s.textarea}
            value={answer}
            onChange={handleTextareaChange}
            disabled={hasSubmitted || shouldShowCorrect}
          />
        </div>
      </div>
      {!shouldShowCorrect && (
        <button
          className={`${s.button} ${isButtonActive ? s.active : ''}`}
          onClick={handleButtonClick}
          disabled={!isButtonActive}
        >
          Далее
        </button>
      )}
      <img className={s.img} src="/images/bg_mobile2.png" alt="bg" />
    </div>
  );
}
