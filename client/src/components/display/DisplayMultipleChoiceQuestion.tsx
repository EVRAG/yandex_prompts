import type { GameStage } from '@prompt-night/shared';
import s from './DisplayMultipleChoiceQuestion.module.scss';
import { Timer } from '../common/Timer';

interface DisplayMultipleChoiceQuestionProps {
  stage: GameStage;
}

export function DisplayMultipleChoiceQuestion({ stage }: DisplayMultipleChoiceQuestionProps) {
  // Находим индекс правильного ответа
  const correctAnswerIndex = stage.answerOptions?.findIndex(opt => opt.isCorrect) ?? -1;
  
  // Показываем правильный ответ если время истекло или статус revealed
  const showRightAnswer = stage.status === 'revealed' || stage.status === 'locked';
  
  // Буквы для вариантов (А, Б, В, Г, Д, Е, ...)
  const getLetter = (index: number) => {
    return String.fromCharCode(1040 + index); // 1040 - это код буквы А в кириллице
  };

  // Вычисляем оставшееся время
  const getRemainingSeconds = (): number => {
    if (!stage.startTime || !stage.timeLimitSeconds) return 0;
    const elapsed = (Date.now() - stage.startTime) / 1000;
    return Math.max(0, Math.ceil(stage.timeLimitSeconds - elapsed));
  };

  const remainingSeconds = stage.status === 'active' && stage.startTime && stage.timeLimitSeconds
    ? getRemainingSeconds()
    : stage.timeLimitSeconds || 0;

  return (
    <div className={s.root}>
      <div className={s.wrapper}>
        <div className={s.content}>
          <div className={s.leftSection}>
            {stage.status === 'active' && stage.startTime && stage.timeLimitSeconds && (
              <div className={s.timerWrapper}>
                <Timer 
                  seconds={stage.timeLimitSeconds} 
                  startTime={stage.startTime}
                  desktop={true}
                />
              </div>
            )}
            {stage.imageUrl ? (
              <img className={s.image} src={stage.imageUrl} alt="Question image" />
            ) : (
              <img className={s.image} src="/images/placeholder.png" alt="" />
            )}
          </div>
          <div className={s.rightSection}>
            <img className={s.img} src="/images/bg_desktop.png" alt="bg" />
            <h2 className={s.title}>
              {showRightAnswer ? 'Правильный ответ' : 'Какой правильный ответ?'}
            </h2>
            <div className={s.answers}>
              {stage.answerOptions?.map((answer, index) => {
                const isCorrectAnswer = showRightAnswer && index === correctAnswerIndex;
                const isInactive = showRightAnswer && index !== correctAnswerIndex;

                return (
                  <button
                    key={index}
                    className={`${s.answerCard} ${
                      isCorrectAnswer ? s.answerCard_selected : ''
                    } ${isInactive ? s.answerCard_inactive : ''}`}
                    disabled={true}
                  >
                    <span 
                      className={s.answerLetter}
                      style={{
                        fontSize: stage.displayAnswerOptionsFontSize 
                          ? `${stage.displayAnswerOptionsFontSize}px` 
                          : undefined
                      }}
                    >
                      {getLetter(index)}
                    </span>
                    <span 
                      className={s.answerText}
                      style={{
                        fontSize: stage.displayAnswerOptionsFontSize 
                          ? `${stage.displayAnswerOptionsFontSize}px` 
                          : undefined
                      }}
                    >
                      {answer.text}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className={s.qrSection}>
              <div className={s.qrBox}>
                <p className={s.qrText}>
                  Отсканируйте qr-код, <br />
                  чтобы участвовать
                </p>
                <img className={s.qrCode} src="/images/qr.png" alt="QR code" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
