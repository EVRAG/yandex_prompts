import { useState, useEffect } from 'react';
import { useRealtime } from '../hooks/useRealtime';
import { Registration } from '../components/player/Registration';
import { Question } from '../components/player/Question';
import { SERVER_URL } from '../lib/constants';

export default function PlayerPage() {
  const [playerId, setPlayerId] = useState(() => localStorage.getItem('playerId'));
  const { socket, state, isConnected } = useRealtime('player', playerId ? { playerId } : undefined);
  const [isRegistering, setIsRegistering] = useState(false);
  const [submittedStages, setSubmittedStages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (socket) {
      socket.on('registered', ({ playerId }: { playerId: string }) => {
        localStorage.setItem('playerId', playerId);
        setPlayerId(playerId);
        setIsRegistering(false);
        setSubmittedStages(new Set()); // Reset submitted stages on new registration
      });

      socket.on('submitted', ({ stageId }: { stageId?: string }) => {
        // Track which stages this player has submitted to
        if (stageId) {
          setSubmittedStages(prev => new Set([...prev, stageId]));
        }
      });

      socket.on('error', (err: string) => {
        alert(err);
        setIsRegistering(false);
      });

      // Handle reset event - clear local state
      socket.on('reset', () => {
        console.log('[player] Reset received, clearing local state');
        localStorage.removeItem('playerId');
        setPlayerId(null);
        setSubmittedStages(new Set());
      });

      socket.on('state:update', (newState) => {
        // If we have playerId but no currentPlayer in state, player was removed (reset)
        if (playerId && !newState.currentPlayer && newState.currentStage?.type === 'registration') {
          // Clear localStorage and allow re-registration
          localStorage.removeItem('playerId');
          setPlayerId(null);
          setSubmittedStages(new Set());
        }
      });
    }
  }, [socket, playerId]);

  const handleRegister = async (name: string) => {
    setIsRegistering(true);
    // Moderate via REST
    try {
      const res = await fetch(`${SERVER_URL}/moderate/nickname`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: name }),
      });
      const data = await res.json();
      if (data.allowed) {
        // If allowed, connect/register via socket
        if (socket && isConnected) {
          socket.emit('register', { name });
        } else {
            // Wait for connection? Or just fail?
            // Ideally we should be connected to socket even before reg, just without auth.
            // My useRealtime implementation connects immediately.
            socket?.emit('register', { name });
        }
      } else {
        alert(`Никнейм недопустим: ${data.reason}`);
        setIsRegistering(false);
      }
    } catch (e) {
      alert('Ошибка соединения');
      setIsRegistering(false);
    }
  };

  const handleSubmit = (answer: string) => {
    socket?.emit('submit', { answer });
  };

  if (!state || !state.currentStage) {
    return <div className="flex items-center justify-center min-h-screen">Загрузка...</div>;
  }

  const { currentStage, currentPlayer } = state;

  // If no playerId or player doesn't exist on server (after reset), show registration
  // Also show registration if stage is registration and player not registered
  if (!playerId || !currentPlayer || (currentStage.type === 'registration' && !currentPlayer)) {
    return <Registration onRegister={handleRegister} isSubmitting={isRegistering} />;
  }

  // Score display component
  const ScoreDisplay = () => {
    if (!currentPlayer) return null;
    return (
      <div className="fixed top-4 right-4 bg-white rounded-lg shadow-md px-4 py-2 border-2 border-yandex-green z-50">
        <div className="text-sm text-gray-600">Ваши баллы</div>
        <div className="text-2xl font-bold text-yandex-green">{currentPlayer.score}</div>
      </div>
    );
  };

  if (currentStage.type === 'registration' || currentStage.type === 'info') {
    return (
      <>
        <ScoreDisplay />
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <h1 className="text-2xl font-bold mb-4">{currentStage.title}</h1>
          <p>Ожидайте начала игры...</p>
          <div className="mt-8 text-sm text-gray-500">
              {state.playerCount} участников онлайн
          </div>
        </div>
      </>
    );
  }

  if (currentStage.type === 'question') {
    const hasSubmitted = submittedStages.has(currentStage.id);
    return (
      <>
        <ScoreDisplay />
        <Question stage={currentStage} onSubmit={handleSubmit} hasSubmitted={hasSubmitted} />
      </>
    );
  }

  if (currentStage.type === 'leaderboard') {
    const leaderboard = state.leaderboard || [];
    return (
      <>
        <ScoreDisplay />
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-3xl font-bold mb-8 text-center">Турнирная таблица</h1>
          <div className="w-full max-w-2xl">
            {leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((p, i) => {
                  const isCurrentPlayer = currentPlayer && p.id === currentPlayer.id;
                  return (
                    <div
                      key={p.id}
                      className={`flex justify-between items-center py-3 px-4 rounded-lg border ${
                        isCurrentPlayer
                          ? 'bg-yandex-green-50 border-yandex-green-300 font-semibold'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`w-8 text-center font-mono ${isCurrentPlayer ? 'text-yandex-green-700' : 'text-gray-500'}`}>
                          {i + 1}
                        </span>
                        <span className={isCurrentPlayer ? 'text-yandex-green-700' : 'text-gray-900'}>
                          {p.name}
                          {isCurrentPlayer && ' (Вы)'}
                        </span>
                      </div>
                      <span className={`font-bold text-lg ${isCurrentPlayer ? 'text-yandex-green-700' : 'text-gray-900'}`}>
                        {p.score}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Результаты пока недоступны
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return <div>Unknown stage</div>;
}
