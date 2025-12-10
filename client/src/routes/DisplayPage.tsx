import { useState, useEffect } from 'react';
import { useRealtime } from '../hooks/useRealtime';
import { DisplayRegistration } from '../components/display/DisplayRegistration';
import { DisplayMultipleChoiceQuestion } from '../components/display/DisplayMultipleChoiceQuestion';
import { DisplayLeaderboard } from '../components/display/DisplayLeaderboard';

export default function DisplayPage() {
  const { state } = useRealtime('display');

  if (!state) return <div className="bg-black min-h-screen text-white flex items-center justify-center text-4xl">Connecting...</div>;

  const { currentStage, players, leaderboard } = state;

  return (
    <div className="bg-black min-h-screen text-white font-sans overflow-hidden">

      {currentStage.type === 'question' && (
        <>
          {currentStage.answerOptions && currentStage.answerOptions.length > 0 ? (
            <DisplayMultipleChoiceQuestion stage={currentStage} />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
              <h1 
                className={`font-bold mb-12 leading-tight max-w-5xl ${
                  !currentStage.displayQuestionTextFontSize ? 'text-5xl md:text-7xl' : ''
                }`}
                style={{
                  fontSize: currentStage.displayQuestionTextFontSize 
                    ? `${currentStage.displayQuestionTextFontSize}px` 
                    : undefined
                }}
              >
                {currentStage.questionText}
              </h1>
              
              {currentStage.status === 'active' && currentStage.startTime && (
                 <Timer startTime={currentStage.startTime} duration={currentStage.timeLimitSeconds || 60} />
              )}

              {currentStage.status === 'revealed' && (
                <div className="mt-12 bg-yandex-green text-black p-8 rounded-2xl animate-fade-in">
                  <div className="text-xl mb-2 font-bold opacity-75">Правильный ответ:</div>
                  <div 
                    className={`font-bold ${
                      !currentStage.displayAnswerFontSize ? 'text-4xl md:text-5xl' : ''
                    }`}
                    style={{
                      fontSize: currentStage.displayAnswerFontSize 
                        ? `${currentStage.displayAnswerFontSize}px` 
                        : undefined
                    }}
                  >
                    {currentStage.referenceAnswer}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {currentStage.type === 'registration' && (
        <DisplayRegistration />
      )}

      {(currentStage.type === 'leaderboard' || currentStage.type === 'info') && (
        <DisplayLeaderboard 
          leaderboard={leaderboard || (players ? Object.values(players).sort((a, b) => b.score - a.score) : [])}
        />
      )}
    </div>
  );
}

function Timer({ startTime, duration }: { startTime: number, duration: number }) {
    // Simple self-updating timer component
    // In real app use requestAnimationFrame or state
    const elapsed = Math.max(0, (Date.now() - startTime) / 1000);
    const remaining = Math.max(0, Math.ceil(duration - elapsed));
    
    // We render static here, but parent causes re-render on state update?
    // Actually we need a local interval to animate countdown smoothly.
    // For brevity I'll assume 1s re-renders or add local state.
    // Let's add local state.
    const [val, setVal] = useState(remaining);
    
    useEffect(() => {
        const i = setInterval(() => {
            const e = Math.max(0, (Date.now() - startTime) / 1000);
            setVal(Math.max(0, Math.ceil(duration - e)));
        }, 100);
        return () => clearInterval(i);
    }, [startTime, duration]);

    return (
        <div className="text-9xl font-mono font-bold text-yandex-green">
            {val}
        </div>
    );
}
