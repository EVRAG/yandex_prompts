import { usePlayerRealtime } from '../hooks/usePlayerRealtime';
import { WaitingScreen } from '../components/player/WaitingScreen';
import { VotingScreen } from '../components/player/VotingScreen';
import { CollectingScreen } from '../components/player/CollectingScreen';
import { VotedScreen } from '../components/player/VotedScreen';
import { PlayerBackground } from '../components/player/PlayerBackground';

export default function PlayerPage() {
  const { status, task, snapshot, selectedOptionId, voteStatus, error, vote, clearError } =
    usePlayerRealtime();

  const phase = snapshot?.phase ?? 'waiting';

  let content;
  if (phase === 'waiting' || !task || !snapshot) {
    content = <WaitingScreen status={status} />;
  } else if (phase === 'collecting') {
    content = <CollectingScreen status={status} />;
  } else if (selectedOptionId) {
    content = (
      <VotedScreen 
        status={status} 
        task={task} 
        selectedOptionId={selectedOptionId} 
      />
    );
  } else {
    content = (
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

  return (
    <>
      <PlayerBackground />
      {content}
    </>
  );
}
