import { useState, useEffect } from 'react';
import { useRealtime } from '../hooks/useRealtime';
import { Registration } from '../components/player/Registration';
import { TextQuestion } from '../components/player/TextQuestion';
import { MultipleChoiceQuestion } from '../components/player/MultipleChoiceQuestion';
import { WaitingScreen } from '../components/player/WaitingScreen';
import { Leaderboard } from '../components/player/Leaderboard';
import { SERVER_URL } from '../lib/constants';

export default function PlayerPage() {
  const [playerId, setPlayerId] = useState(() => localStorage.getItem('playerId'));
  const { socket, state, isConnected, config } = useRealtime('player', playerId ? { playerId } : undefined);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [submittedStages, setSubmittedStages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (socket) {
      socket.on('registered', ({ playerId }: { playerId: string }) => {
        localStorage.setItem('playerId', playerId);
        setPlayerId(playerId);
        setIsRegistering(false);
        setRegistrationError(null);
        setSubmittedStages(new Set()); // Reset submitted stages on new registration
      });

      socket.on('submitted', ({ stageId }: { stageId?: string }) => {
        // Track which stages this player has submitted to
        if (stageId) {
          setSubmittedStages(prev => new Set([...prev, stageId]));
        }
      });

      socket.on('error', (err: string) => {
        setRegistrationError(err);
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
    setRegistrationError(null);
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
        setRegistrationError(`Никнейм недопустим: ${data.reason}`);
        setIsRegistering(false);
      }
    } catch (e) {
      setRegistrationError('Ошибка соединения');
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
    return (
      <Registration 
        onRegister={handleRegister} 
        isSubmitting={isRegistering} 
        error={registrationError}
        onErrorDismiss={() => setRegistrationError(null)}
      />
    );
  }

  if (currentStage.type === 'registration' || currentStage.type === 'info') {
    return <WaitingScreen playerName={currentPlayer?.name || 'Игрок'} />;
  }

  if (currentStage.type === 'question') {
    const hasSubmitted = submittedStages.has(currentStage.id);
    
    // Определяем номер вопроса: находим индекс в массиве stages конфига
    const questionNumber = config?.stages
      .filter(s => s.type === 'question')
      .findIndex(s => s.id === currentStage.id) ?? -1;
    const displayNumber = questionNumber >= 0 ? questionNumber + 1 : null;
    
    // Определяем тип вопроса: если есть answerOptions - множественный выбор, иначе - текстовый ввод
    const hasAnswerOptions = currentStage.answerOptions && currentStage.answerOptions.length > 0;
    
    if (hasAnswerOptions) {
      return (
        <MultipleChoiceQuestion
          stage={currentStage}
          onSubmit={handleSubmit}
          playerName={currentPlayer?.name || 'Игрок'}
          playerScore={currentPlayer?.score || 0}
          hasSubmitted={hasSubmitted}
          questionNumber={displayNumber}
        />
      );
    } else {
      return (
        <TextQuestion
          stage={currentStage}
          onSubmit={handleSubmit}
          playerName={currentPlayer?.name || 'Игрок'}
          playerScore={currentPlayer?.score || 0}
          hasSubmitted={hasSubmitted}
          questionNumber={displayNumber}
        />
      );
    }
  }

  if (currentStage.type === 'leaderboard') {
    const leaderboard = state.leaderboard || [];
    return (
      <Leaderboard
        playerName={currentPlayer?.name || 'Игрок'}
        leaderboard={leaderboard}
        currentPlayerId={currentPlayer?.id}
      />
    );
  }

  return <div>Unknown stage</div>;
}
