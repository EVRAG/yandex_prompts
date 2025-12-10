import { useState, useEffect } from 'react';
import type { GameStage } from '@prompt-night/shared';
import s from './MultipleChoiceQuestion.module.scss';
import { Timer } from '../common/Timer';

interface MultipleChoiceQuestionProps {
  stage: GameStage;
  onSubmit: (answer: string) => void;
  playerName: string;
  playerScore: number;
  hasSubmitted?: boolean;
  questionNumber?: number | null;
}

export function MultipleChoiceQuestion({
  stage,
  onSubmit,
  playerName,
  playerScore,
  hasSubmitted = false,
  questionNumber,
}: MultipleChoiceQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Буквы для вариантов (А, Б, В, Г, Д, Е, ...)
  const getLetter = (index: number) => {
    return String.fromCharCode(1040 + index); // 1040 - это код буквы А в кириллице
  };

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
    setSelectedAnswer(null);
  }, [stage.id]);

  const handleAnswerClick = (index: number) => {
    if (!hasSubmitted && timeLeft !== null && timeLeft > 0) {
      setSelectedAnswer(index);
    }
  };

  const handleButtonClick = () => {
    if (selectedAnswer !== null && !hasSubmitted && stage.answerOptions && timeLeft !== null && timeLeft > 0) {
      const selectedOption = stage.answerOptions[selectedAnswer];
      onSubmit(selectedOption.text);
    }
  };

  const isButtonActive = selectedAnswer !== null && !hasSubmitted && timeLeft !== null && timeLeft > 0;

  if (!stage.answerOptions || stage.answerOptions.length === 0) {
    return null;
  }

  // Находим правильный ответ для подсветки
  const correctAnswerIndex = stage.answerOptions.findIndex(opt => opt.isCorrect);
  
  // Показываем правильный ответ если время истекло или ответ отправлен
  // После отправки экран остается тем же, просто подсвечивается правильный ответ
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
          <div className={s.answers}>
            {stage.answerOptions.map((answer, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = shouldShowCorrect && correctAnswerIndex === index;
              // После отправки или истечения времени показываем правильный ответ (зеленый), выбранный остается фиолетовым
              return (
                <button
                  key={index}
                  className={`${s.answerCard} ${
                    isSelected && !shouldShowCorrect ? s.answerCard_selected : ''
                  } ${
                    isCorrect ? s.answerCard_correct : ''
                  }`}
                  onClick={() => handleAnswerClick(index)}
                  disabled={shouldShowCorrect}
                >
                  <span className={s.answerLetter}>{getLetter(index)}</span>
                  <span className={s.answerText}>{answer.text}</span>
                </button>
              );
            })}
          </div>
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
