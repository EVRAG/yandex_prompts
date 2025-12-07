import { useState, useEffect } from 'react';
import { useRealtime } from '../hooks/useRealtime';
import { Registration } from '../components/player/Registration';
import { Question } from '../components/player/Question';
import { SERVER_URL } from '../lib/constants';

export default function PlayerPage() {
  const [playerId, setPlayerId] = useState(() => localStorage.getItem('playerId'));
  const { socket, state, isConnected } = useRealtime('player', playerId ? { playerId } : undefined);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (socket) {
      socket.on('registered', ({ playerId }: { playerId: string }) => {
        localStorage.setItem('playerId', playerId);
        setPlayerId(playerId);
        setIsRegistering(false);
      });

      socket.on('submitted', () => {
        // handled in component local state, but we could sync here
      });

      socket.on('error', (err: string) => {
        alert(err);
        setIsRegistering(false);
      });
    }
  }, [socket]);

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

  if (!playerId) {
    return <Registration onRegister={handleRegister} isSubmitting={isRegistering} />;
  }

  if (!state || !state.currentStage) {
    return <div className="flex items-center justify-center min-h-screen">Загрузка...</div>;
  }

  const { currentStage } = state;

  if (currentStage.type === 'registration' || currentStage.type === 'info') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">{currentStage.title}</h1>
        <p>Ожидайте начала игры...</p>
        <div className="mt-8 text-sm text-gray-500">
            {state.playerCount} участников онлайн
        </div>
      </div>
    );
  }

  if (currentStage.type === 'question') {
    return <Question stage={currentStage} onSubmit={handleSubmit} />;
  }

  if (currentStage.type === 'leaderboard') {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Игра завершена!</h1>
            <p>Смотрите результаты на главном экране.</p>
        </div>
    );
  }

  return <div>Unknown stage</div>;
}
