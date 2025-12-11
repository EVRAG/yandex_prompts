import { useState, useEffect } from 'react';
import { useRealtime } from '../hooks/useRealtime';
import { DisplayRegistration } from '../components/display/DisplayRegistration';
import { DisplayMultipleChoiceQuestion } from '../components/display/DisplayMultipleChoiceQuestion';
import { DisplayLeaderboard } from '../components/display/DisplayLeaderboard';
import { DisplayTextQuestion } from '../components/display/DisplayTextQuestion';
import { preloadMedia } from '../lib/preloadMedia';

export default function DisplayPage() {
  const { state, config } = useRealtime('display');

  // Preload all media used in game (images/videos)
  useEffect(() => {
    if (config?.stages) {
      const urls = config.stages.map((s) => s.imageUrl);
      preloadMedia(urls);
    }
  }, [config]);

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
