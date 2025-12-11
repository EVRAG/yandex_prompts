import { useState, useEffect } from 'react';
import { useRealtime } from '../hooks/useRealtime';
import { DisplayRegistration } from '../components/display/DisplayRegistration';
import { DisplayMultipleChoiceQuestion } from '../components/display/DisplayMultipleChoiceQuestion';
import { DisplayLeaderboard } from '../components/display/DisplayLeaderboard';
import { DisplayTextQuestion } from '../components/display/DisplayTextQuestion';

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
            <DisplayTextQuestion stage={currentStage} />
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
