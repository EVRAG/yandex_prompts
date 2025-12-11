import { useState, useEffect } from 'react';
import type { GameStage, Submission } from '@prompt-night/shared';
import s from './TextQuestion.module.scss';
import { Timer } from '../common/Timer';
import { QuestionResult } from './QuestionResult';

interface TextQuestionProps {
  stage: GameStage;
  onSubmit: (answer: string) => void;
  playerName: string;
  playerScore: number;
  hasSubmitted?: boolean;
  questionNumber?: number | null; // Deprecated: используйте stage.questionNumberLabel
  submission?: Submission; // Submission с score и feedback
}

export function TextQuestion({
  stage,
  onSubmit,
  playerName,
  playerScore,
  hasSubmitted = false,
  questionNumber,
  submission,
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
    if (answer.trim() && !hasSubmitted && stage.status === 'active') {
      onSubmit(answer.trim());
    }
  };

  const isButtonActive = answer.trim().length > 0 && !hasSubmitted;

  const isFinished = stage.status === 'locked' || stage.status === 'revealed';
  const timeoutNoAnswer = isFinished && !hasSubmitted && !submission;

  // Подставляем результат 0 баллов, если время вышло и ответа не было
  const resultSubmission = submission ?? (timeoutNoAnswer ? { score: 0, feedback: 'время истекло' } : undefined);

  // Показываем правильный ответ если время истекло или ответ отправлен
  const shouldShowCorrect = hasSubmitted || isFinished;
  
  // Показываем экран результатов если таймер закончился (stage locked/revealed) и есть score
  const shouldShowResult = isFinished && resultSubmission?.score !== undefined;
  
  // Показываем затемнение с плашкой если ответ отправлен, но таймер еще не закончился
  const shouldShowWaiting = hasSubmitted && stage.status === 'active';

  // Если показываем результаты - показываем компонент результатов
  if (shouldShowResult && resultSubmission) {
    return (
      <QuestionResult
        score={resultSubmission.score}
        feedback={resultSubmission.feedback || ''}
        playerName={playerName}
        playerScore={playerScore}
      />
    );
  }

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
            {(stage.questionNumberLabel || questionNumber) && (
              <div className={s.questionNumber}>
                {stage.questionNumberLabel || `Вопрос ${questionNumber}`}
              </div>
            )}
          </div>
          <div className={s.right}>
            {timeLeft !== null && stage.startTime && stage.timeLimitSeconds && (
              <Timer 
                seconds={stage.timeLimitSeconds!} 
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
          {stage.showQuestionTextOnMobile !== false && stage.questionText && (
            <div className={s.questionText}>
              {stage.questionText}
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
      {!shouldShowCorrect && !shouldShowWaiting && (
        <button
          className={`${s.button} ${isButtonActive ? s.active : ''}`}
          onClick={handleButtonClick}
          disabled={!isButtonActive}
        >
          Отправить
        </button>
      )}
      {shouldShowWaiting && (
        <div className={s.overlay}>
          <div className={s.waitingMessage}>
            Ответ принят,<br />ожидайте результат
          </div>
        </div>
      )}
      <img className={s.img} src="/images/bg_mobile2.png" alt="bg" />
    </div>
  );
}
