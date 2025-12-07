import { useState, useEffect } from 'react';
import { useRealtime } from '../hooks/useRealtime';

export default function DisplayPage() {
  const { state } = useRealtime('display');

  if (!state) return <div className="bg-black min-h-screen text-white flex items-center justify-center text-4xl">Connecting...</div>;

  const { currentStage, players } = state;

  return (
    <div className="bg-black min-h-screen text-white font-sans overflow-hidden">
      <div className="absolute top-4 right-4 text-gray-500">
        Stage: {currentStage.title}
      </div>

      {currentStage.type === 'question' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-12 leading-tight max-w-5xl">
            {currentStage.questionText}
          </h1>
          
          {currentStage.status === 'active' && currentStage.startTime && (
             <Timer startTime={currentStage.startTime} duration={currentStage.timeLimitSeconds || 60} />
          )}

          {currentStage.status === 'revealed' && (
            <div className="mt-12 bg-yandex-green text-black p-8 rounded-2xl animate-fade-in">
              <div className="text-xl mb-2 font-bold opacity-75">Правильный ответ:</div>
              <div className="text-4xl md:text-5xl font-bold">
                {currentStage.referenceAnswer}
              </div>
            </div>
          )}
        </div>
      )}

      {(currentStage.type === 'leaderboard' || currentStage.type === 'registration' || currentStage.type === 'info') && (
         <div className="flex flex-col items-center justify-center min-h-screen p-8">
            <h1 className="text-4xl font-bold mb-8">Турнирная таблица</h1>
            <div className="w-full max-w-3xl">
                {players && Object.values(players)
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 10)
                    .map((p, i) => (
                        <div key={p.id} className="flex justify-between items-center py-4 border-b border-gray-800 text-2xl">
                            <div className="flex items-center gap-4">
                                <span className="w-8 text-gray-500 font-mono">{i + 1}</span>
                                <span>{p.name}</span>
                            </div>
                            <span className="font-bold text-yandex-green">{p.score}</span>
                        </div>
                    ))
                }
            </div>
         </div>
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
