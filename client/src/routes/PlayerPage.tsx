import { usePlayerRealtime } from '../hooks/usePlayerRealtime';
import { WaitingScreen } from '../components/player/WaitingScreen';
import { VotingScreen } from '../components/player/VotingScreen';
import { CollectingScreen } from '../components/player/CollectingScreen';
import { VotedScreen } from '../components/player/VotedScreen';

export default function PlayerPage() {
  const { status, task, snapshot, selectedOptionId, voteStatus, error, vote, clearError } =
    usePlayerRealtime();

  const phase = snapshot?.phase ?? 'waiting';

  if (phase === 'waiting' || !task || !snapshot) {
    return <WaitingScreen status={status} />;
  }

  if (phase === 'collecting') {
    return <CollectingScreen status={status} />;
  }

  if (selectedOptionId) {
    return (
      <VotedScreen 
        status={status} 
        task={task} 
        selectedOptionId={selectedOptionId} 
      />
    );
  }

  return (
    <VotingScreen
      status={status}
      task={task}
      voteStatus={voteStatus}
      vote={vote}
      error={error}
      clearError={clearError}
    />
  );
}
