import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { usePlayerRealtime } from '../hooks/usePlayerRealtime';
import { moderateNickname } from '../lib/api';
import RegistrationScreen from '../components/player/RegistrationScreen';
import PlayerBackground from '../components/player/PlayerBackground';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { TimerPill } from '../components/ui/TimerPill';

const QUESTION_PROGRESS_KEY = 'prompt-night-question-progress';

type QuestionRecord = {
  startedAt: number;
  submitted: boolean;
};

const readQuestionRecords = (): Record<string, QuestionRecord> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(QUESTION_PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, QuestionRecord>) : {};
  } catch {
    return {};
  }
};

const persistQuestionRecords = (records: Record<string, QuestionRecord>) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(QUESTION_PROGRESS_KEY, JSON.stringify(records));
};

export default function PlayerPage() {
  const {
    connectionStatus,
    stage,
    stageId,
    leaderboard,
    player,
    defaultName,
    registering,
    submissionStatus,
    lastSubmission,
    error,
    register,
    submitAnswer,
    resetPlayer,
    questionContent,
  } = usePlayerRealtime();

  const [name, setName] = useState(defaultName);
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [isModerating, setIsModerating] = useState(false);
  const questionRecordsRef = useRef<Record<string, QuestionRecord>>(readQuestionRecords());
  const saveQuestionRecord = useCallback((stageId: string, record: QuestionRecord) => {
    questionRecordsRef.current = {
      ...questionRecordsRef.current,
      [stageId]: record,
    };
    persistQuestionRecords(questionRecordsRef.current);
  }, []);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setName(defaultName);
  }, [defaultName]);

  useEffect(() => {
    setAnswer('');
    setHasSubmitted(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!stage || stage.kind !== 'question' || !stageId) {
      setTimeLeft(null);
      return;
    }

    let record = questionRecordsRef.current[stageId];
    if (!record) {
      record = { startedAt: Date.now(), submitted: false };
      questionRecordsRef.current[stageId] = record;
      persistQuestionRecords(questionRecordsRef.current);
    }

    setHasSubmitted(record.submitted);

    if (record.submitted) {
      setTimeLeft(null);
      return;
    }

    if (questionContent?.duration) {
      const elapsed = Math.floor((Date.now() - record.startedAt) / 1000);
      const initialTime = Math.max(questionContent.duration - elapsed, 0);
      setTimeLeft(initialTime);

      if (initialTime > 0) {
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev === null) return prev;
            if (prev <= 1) {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      setTimeLeft(null);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [stage, stageId, questionContent, saveQuestionRecord]);

  useEffect(() => {
    if (
      submissionStatus === 'success' &&
      stage &&
      stage.kind === 'question' &&
      stageId &&
      lastSubmission &&
      lastSubmission.stageId === stageId
    ) {
      const existing = questionRecordsRef.current[stageId] ?? {
        startedAt: Date.now(),
        submitted: false,
      };
      if (!existing.submitted) {
        questionRecordsRef.current[stageId] = { ...existing, submitted: true };
        persistQuestionRecords(questionRecordsRef.current);
      }
      setHasSubmitted(true);
      setTimeLeft(null);
    }
  }, [submissionStatus, stage, stageId, lastSubmission]);

  const isQuestion = stage?.kind === 'question' && questionContent;
  const isTimeUp = timeLeft === 0;
  const isScoring = submissionStatus === 'scoring';
  const activeSubmission =
    lastSubmission && stage?.id === lastSubmission.stageId ? lastSubmission : null;
  const lastScore = activeSubmission?.score ?? null;

  const answerPlaceholder = useMemo(() => {
    if (!questionContent) return 'Введите ответ';
    return questionContent.responseType === 'multiline' ? 'Введите развернутый ответ' : 'Введите ответ';
  }, [questionContent]);

  const handleRegister = async (evt: React.FormEvent) => {
    evt.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setModerationError('Введите никнейм.');
      return;
    }
    setModerationError(null);
    setIsModerating(true);
    try {
      const result = await moderateNickname(trimmed);
      if (!result.allowed) {
        setModerationError(result.reason ?? 'Никнейм не прошёл модерацию.');
        return;
      }
      register(trimmed);
    } catch (err) {
      setModerationError('Не удалось проверить никнейм. Попробуйте ещё раз.');
    } finally {
      setIsModerating(false);
    }
  };

  const handleSubmit = (evt: React.FormEvent) => {
    evt.preventDefault();
    if (isTimeUp || hasSubmitted || isScoring) return;
    submitAnswer(answer);
  };

  const renderStageContent = () => {
    if (!stage) {
      return (
        <Card className="p-6 text-center text-[#3e2989]/60 font-[family-name:var(--font-sans)]">
          <p className="text-base font-semibold">Ожидание сигнала от ведущего...</p>
        </Card>
      );
    }

    if (stage.kind === 'waiting') {
      return (
        <Card className="p-6 text-center font-[family-name:var(--font-sans)]">
          <p className="text-lg font-semibold text-[#3e2989]">{stage.message}</p>
          {stage.cta && <p className="mt-2 text-sm text-[#3e2989]/60">{stage.cta}</p>}
        </Card>
      );
    }

    if (stage.kind === 'info') {
      return (
        <Card className="p-6 font-[family-name:var(--font-sans)]">
          <h2 className="text-xl font-semibold text-[#3e2989]">{stage.headline}</h2>
          <p className="mt-2 text-[#3e2989]/70">{stage.body}</p>
        </Card>
      );
    }

    if (stage.kind === 'leaderboard') {
      return (
        <Card className="p-6 text-center font-[family-name:var(--font-sans)]">
          <h2 className="text-xl font-semibold text-[#3e2989]">{stage.label}</h2>
          <p className="mt-2 text-[#3e2989]/70">Следите за экраном результатов!</p>
        </Card>
      );
    }

    if (isQuestion) {
      return (
        <div className="space-y-4">
          <Card className="p-6 relative overflow-hidden font-[family-name:var(--font-sans)]">
            {timeLeft !== null && <TimerPill value={timeLeft} className="absolute top-4 right-4" />}
            <p className="text-xs uppercase tracking-[0.2em] text-[#3e2989]/50">
              Вопрос {questionContent.round}.{questionContent.order}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#3e2989]">{stage.label}</h2>
            <p className="mt-4 text-lg text-[#3e2989]/80">{questionContent.content.prompt}</p>
            {questionContent.content.type === 'image' && (
              <img
                src={questionContent.content.assetUrl}
                alt={questionContent.content.caption ?? 'Вопрос'}
                className="mt-4 w-full rounded-xl border border-black/5 object-cover bg-black/5"
              />
            )}
            {questionContent.content.type === 'video' && (
              <video
                className="mt-4 w-full rounded-xl border border-black/5 bg-black/5"
                controls
                autoPlay={questionContent.content.autoplay}
              >
                <source src={questionContent.content.assetUrl} />
              </video>
            )}
          </Card>

          {isScoring ? (
            <Card className="p-4 text-center">
              <p className="text-lg font-semibold text-[#3e2989] font-[family-name:var(--font-sans)]">
                Вычисляем ваш балл...
              </p>
            </Card>
          ) : hasSubmitted ? (
            <Card className="p-4 text-center border border-[#4DBE55]/30">
              <p className="text-lg font-semibold text-[#4DBE55] font-[family-name:var(--font-sans)]">
                {lastScore !== null ? `Ваш балл: ${lastScore}/10` : 'Ответ принят!'}
              </p>
              {activeSubmission?.notes && (
                <p className="text-sm text-[#4DBE55]/70 mt-1 font-[family-name:var(--font-sans)]">
                  {activeSubmission.notes}
                </p>
              )}
              {!activeSubmission && (
                <p className="text-sm text-[#4DBE55]/70 mt-1 font-[family-name:var(--font-sans)]">
                  Ждите следующий сигнал от ведущего.
                </p>
              )}
            </Card>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-3 bg-white rounded-[12px] p-4 font-[family-name:var(--font-sans)]"
            >
              {questionContent.responseType === 'multiline' ? (
                <textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder={answerPlaceholder}
                  disabled={isTimeUp || isScoring}
                  className="min-h-[140px] w-full rounded-xl border border-[#3e2989]/10 bg-[#3e2989]/5 p-3 text-[#3e2989] outline-none focus:border-[#3e2989]/40 disabled:opacity-50 placeholder:text-[#3e2989]/40"
                />
              ) : (
                <input
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder={answerPlaceholder}
                  disabled={isTimeUp || isScoring}
                  className="w-full rounded-xl border border-[#3e2989]/10 bg-[#3e2989]/5 p-3 text-[#3e2989] outline-none focus:border-[#3e2989]/40 disabled:opacity-50 placeholder:text-[#3e2989]/40"
                />
              )}

              {isTimeUp ? (
                <Badge className="w-full justify-center py-3 text-lg" tone="danger">
                  Упс, не успели(
                </Badge>
              ) : (
                <Button type="submit" disabled={isTimeUp || isScoring} size="lg" fullWidth>
                  Отправить ответ
                </Button>
              )}
            </form>
          )}
        </div>
      );
    }

    return null;
  };

  const renderLeaderboard = () => {
    if (stage?.kind !== 'leaderboard') return null;
    
    return (
      <Card className="p-5 font-[family-name:var(--font-sans)]">
        <h3 className="text-sm uppercase tracking-[0.2em] text-[#3e2989]/50">Топ игроков</h3>
        <ul className="mt-4 space-y-2 text-[#3e2989]">
          {leaderboard.slice(0, 5).map((entry, index) => (
            <li key={entry.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3 font-medium">
                <span className="text-xs text-[#3e2989]/50">#{index + 1}</span>
                <span>{entry.name}</span>
              </div>
              <span className="font-semibold">{entry.score}</span>
            </li>
          ))}
          {leaderboard.length === 0 && (
            <li className="text-center text-sm text-[#3e2989]/50">Результатов еще нет</li>
          )}
        </ul>
      </Card>
    );
  };

  if (!player) {
    return (
      <RegistrationScreen
        name={name}
        setName={setName}
        handleRegister={handleRegister}
        registering={registering}
        isModerating={isModerating}
        moderationError={moderationError || error}
      />
    );
  }

  return (
    <PlayerBackground>
      <div className="w-full flex flex-col gap-4">
        <Card className="flex items-center justify-between p-4 font-[family-name:var(--font-sans)]">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#3e2989]/50">Prompt Night</p>
              <p className="text-sm text-[#3e2989]">Игрок</p>
            </div>
            <StatusBadge status={connectionStatus} />
          </div>
          <Button variant="ghost" size="md" onClick={resetPlayer}>
            Выйти
          </Button>
        </Card>

        {error && (
          <div className="bg-rose-50 rounded-[12px] border border-rose-200 p-4 text-sm text-rose-700 font-[family-name:var(--font-sans)]">
            {error}
          </div>
        )}

        <Card className="p-5 font-[family-name:var(--font-sans)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#3e2989]/60">Игрок</p>
              <h2 className="text-2xl font-semibold text-[#3e2989]">{player.name}</h2>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-[#3e2989]/60">Очки</p>
              <p className="text-2xl font-semibold text-[#3e2989]">{player.score}</p>
            </div>
          </div>
        </Card>

        {renderStageContent()}
        {renderLeaderboard()}
      </div>
    </PlayerBackground>
  );
}
