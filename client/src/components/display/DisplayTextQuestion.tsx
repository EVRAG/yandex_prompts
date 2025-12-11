import type { GameStage } from '@prompt-night/shared';
import s from './DisplayTextQuestion.module.scss';
import { Timer } from '../common/Timer';

interface DisplayTextQuestionProps {
  stage: GameStage;
}

export function DisplayTextQuestion({ stage }: DisplayTextQuestionProps) {
  const isFinished = stage.status === 'locked' || stage.status === 'revealed';
  const hasMedia = Boolean(stage.imageUrl);

  return (
    <div className={s.root}>
      <div className={s.wrapper}>
        <div className={s.content}>
          <div className={`${s.leftSection} ${!hasMedia ? s.leftSection_noMedia : ''}`}>
            {stage.status === 'active' && stage.startTime && stage.timeLimitSeconds && (
              <div className={s.timerWrapper}>
                <Timer 
                  seconds={stage.timeLimitSeconds} 
                  startTime={stage.startTime}
                  desktop={true}
                />
              </div>
            )}
            {stage.questionNumberLabel && (
              <div className={s.questionNumber}>
                {stage.questionNumberLabel}
              </div>
            )}
            {hasMedia ? (
              stage.imageUrl!.match(/\.(mp4|webm|mov|avi)$/i) ? (
                <video 
                  className={s.image} 
                  src={stage.imageUrl!} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                />
              ) : (
                <img className={s.image} src={stage.imageUrl!} alt="Question image" />
              )
            ) : (
              <div className={s.questionTextBox}>
                <div
                  className={s.questionTextContent}
                  style={{
                    fontSize: stage.displayQuestionTextFontSize
                      ? `${stage.displayQuestionTextFontSize}px`
                      : undefined,
                  }}
                >
                  {stage.questionText}
                </div>
              </div>
            )}
          </div>
          <div className={s.rightSection}>
            <img className={s.img} src="/images/bg_desktop.png" alt="bg" />
            <h2 className={s.title}>
              {isFinished
                ? (stage.displayAnswerRevealedTitle || 'Правильный ответ')
                : (stage.displayQuestionTitle || 'Какой правильный ответ?')
              }
            </h2>
            <div className={`${s.answerBox} ${!isFinished ? s.answerBox_blurred : ''}`}>
              <div
                className={`${s.answerText} ${!isFinished ? s.answerText_blurred : ''}`}
                style={{
                  fontSize: stage.displayAnswerFontSize
                    ? `${stage.displayAnswerFontSize}px`
                    : undefined,
                }}
              >
                {stage.referenceAnswer}
              </div>
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
