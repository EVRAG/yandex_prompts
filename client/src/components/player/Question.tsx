import { useState, useEffect } from 'react';
import type { GameStage } from '@prompt-night/shared';

interface QuestionProps {
  stage: GameStage;
  onSubmit: (answer: string) => void;
  hasSubmitted?: boolean; // Pass from parent to track submission status
}

export function Question({ stage, onSubmit, hasSubmitted = false }: QuestionProps) {
  const [answer, setAnswer] = useState('');
  const [localSubmitted, setLocalSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  // Reset local state when stage changes
  useEffect(() => {
    setLocalSubmitted(false);
    setAnswer('');
  }, [stage.id]);

  useEffect(() => {
    if (stage.status === 'active' && stage.startTime && stage.timeLimitSeconds) {
      const interval = setInterval(() => {
        const elapsed = (Date.now() - stage.startTime!) / 1000;
        const remaining = Math.max(0, Math.ceil(stage.timeLimitSeconds! - elapsed));
        setTimeLeft(remaining);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(null);
    }
  }, [stage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim() && !localSubmitted && !hasSubmitted) {
      onSubmit(answer.trim());
      setLocalSubmitted(true);
    }
  };

  // Check if user has already submitted for this stage
  const isSubmitted = localSubmitted || hasSubmitted;

  if (stage.status === 'locked' || stage.status === 'revealed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-xl font-bold mb-4">Время вышло!</h2>
        <p>Ожидайте результатов...</p>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-xl font-bold mb-4">Ответ принят!</h2>
        <p>Ожидайте результатов...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="mb-4 text-lg font-bold text-gray-500">{stage.title}</div>
      <h1 className="text-2xl font-bold mb-6 text-center">{stage.questionText}</h1>
      
      {timeLeft !== null && (
        <div className="text-4xl font-mono mb-6 text-yandex-green-700">
          {timeLeft}с
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Ваш ответ..."
          className="border p-2 rounded text-lg h-32"
          disabled={isSubmitted}
        />
        <button
          type="submit"
          disabled={!answer.trim() || isSubmitted}
          className="bg-yandex-green text-white p-2 rounded text-lg font-bold disabled:opacity-50"
        >
          {isSubmitted ? 'Отправлено' : 'Отправить'}
        </button>
      </form>
    </div>
  );
}
