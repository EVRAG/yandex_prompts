import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { usePlayerRealtime } from '../hooks/usePlayerRealtime';
import { moderateNickname } from '../lib/api';

const statusColors: Record<'connecting' | 'online' | 'error', string> = {
  connecting: 'bg-yellow-200 text-black border-yellow-400/60',
  online: 'bg-emerald-200 text-emerald-900 border-emerald-400/60',
  error: 'bg-rose-200 text-rose-900 border-rose-400/60',
};

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
        <div className="rounded-3xl border border-black/10 bg-white p-6 text-center text-black/60">
          Ожидание сигнала от ведущего...
        </div>
      );
    }

    if (stage.kind === 'waiting') {
      return (
        <div className="rounded-3xl border border-black/10 bg-white p-6 text-center shadow-sm">
          <p className="text-lg font-semibold text-black">{stage.message}</p>
          {stage.cta && <p className="mt-2 text-sm text-black/60">{stage.cta}</p>}
        </div>
      );
    }

    if (stage.kind === 'info') {
      return (
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-black">{stage.headline}</h2>
          <p className="mt-2 text-black/70">{stage.body}</p>
        </div>
      );
    }

    if (stage.kind === 'leaderboard') {
      return (
        <div className="rounded-3xl border border-black/10 bg-white p-6 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-black">{stage.label}</h2>
          <p className="mt-2 text-black/70">Следите за экраном результатов!</p>
        </div>
      );
    }

    if (isQuestion) {
      return (
        <div className="space-y-4">
          <div className="rounded-3xl border border-black/10 bg-white p-6 relative overflow-hidden shadow-sm">
            {timeLeft !== null && (
              <div className="absolute top-4 right-4 rounded-full bg-black/90 text-yellow-300 px-3 py-1 text-sm font-mono border border-black/70">
                {timeLeft > 0 ? `${timeLeft}s` : 'Время вышло'}
              </div>
            )}
            <p className="text-xs uppercase tracking-[0.3em] text-black/50">
              Вопрос {questionContent.round}.{questionContent.order}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-black">{stage.label}</h2>
            <p className="mt-4 text-lg text-black/80">{questionContent.content.prompt}</p>
            {questionContent.content.type === 'image' && (
              <img
                src={questionContent.content.assetUrl}
                alt={questionContent.content.caption ?? 'Вопрос'}
                className="mt-4 w-full rounded-2xl border border-black/10 object-cover bg-black/5"
              />
            )}
            {questionContent.content.type === 'video' && (
              <video
                className="mt-4 w-full rounded-2xl border border-black/10 bg-black/5"
                controls
                autoPlay={questionContent.content.autoplay}
              >
                <source src={questionContent.content.assetUrl} />
              </video>
            )}
          </div>

          {isScoring ? (
            <div className="rounded-3xl border border-black/10 bg-white p-4 text-center shadow">
              <p className="text-lg font-semibold text-black">Вычисляем ваш балл...</p>
            </div>
          ) : hasSubmitted ? (
            <div className="rounded-3xl border border-yandex-green-700/30 bg-white p-4 text-center shadow">
              <p className="text-lg font-semibold text-yandex-green-700">
                {lastScore !== null ? `Ваш балл: ${lastScore}/10` : 'Ответ принят!'}
              </p>
              {activeSubmission?.notes && (
                <p className="text-sm text-yandex-green-700/70 mt-1">{activeSubmission.notes}</p>
              )}
              {!activeSubmission && (
                <p className="text-sm text-yandex-green-700/70 mt-1">Ждите следующий сигнал от ведущего.</p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 rounded-3xl border border-black/10 bg-white p-4 shadow">
              {questionContent.responseType === 'multiline' ? (
                <textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder={answerPlaceholder}
                  disabled={isTimeUp || isScoring}
                  className="min-h-[140px] w-full rounded-2xl border border-black/10 bg-black/5 p-3 text-black outline-none focus:border-black/40 disabled:opacity-50"
                />
              ) : (
                <input
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder={answerPlaceholder}
                  disabled={isTimeUp || isScoring}
                  className="w-full rounded-2xl border border-black/10 bg-black/5 p-3 text-black outline-none focus:border-black/40 disabled:opacity-50"
                />
              )}

              {isTimeUp ? (
                <div className="w-full rounded-2xl bg-rose-100 border border-rose-200 py-3 text-center text-lg font-semibold text-rose-700">
                  Упс, не успели(
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={isTimeUp || isScoring}
                  className="w-full rounded-2xl bg-black py-3 text-lg font-semibold text-yellow-300 disabled:cursor-not-allowed disabled:opacity-60 transition-opacity"
                >
                  Отправить ответ
                </button>
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
      <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
        <h3 className="text-sm uppercase tracking-[0.3em] text-black/50">Топ игроков</h3>
        <ul className="mt-4 space-y-2 text-black">
          {leaderboard.slice(0, 5).map((entry, index) => (
            <li key={entry.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3 font-medium">
                <span className="text-xs text-black/50">#{index + 1}</span>
                <span>{entry.name}</span>
              </div>
              <span className="font-semibold">{entry.score}</span>
            </li>
          ))}
          {leaderboard.length === 0 && (
            <li className="text-center text-sm text-black/50">Результатов еще нет</li>
          )}
        </ul>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FFEA00] px-4 py-8 text-black">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="flex items-center justify-between rounded-3xl border border-black/10 bg-white/90 p-4 shadow">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-black/50">Prompt Night</p>
            <p className="text-sm text-black/70">{player ? 'Добро пожаловать!' : 'Регистрация'}</p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusColors[connectionStatus]}`}>
            {connectionStatus === 'online' && 'Онлайн'}
            {connectionStatus === 'connecting' && 'Подключаемся'}
            {connectionStatus === 'error' && 'Ошибка'}
          </span>
        </header>

        {error && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {!player ? (
          <form onSubmit={handleRegister} className="space-y-4 rounded-3xl border border-black/10 bg-white/90 p-6 shadow">
            <h1 className="text-2xl font-semibold text-black">Введите имя</h1>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ваш ник"
              className="w-full rounded-2xl border border-black/10 bg-black/5 p-3 text-black outline-none focus:border-black/40"
            />
            {moderationError && (
              <p className="text-sm text-rose-500">{moderationError}</p>
            )}
            <button
              type="submit"
              disabled={registering || isModerating}
              className="w-full rounded-2xl bg-black py-3 text-lg font-semibold text-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {registering || isModerating ? 'Проверяем...' : 'Присоединиться'}
            </button>
          </form>
        ) : (
          <>
            <div className="rounded-3xl border border-black/10 bg-white/90 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-black/60">Игрок</p>
                  <h2 className="text-2xl font-semibold text-black">{player.name}</h2>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.3em] text-black/60">Очки</p>
                  <p className="text-2xl font-semibold text-black">{player.score}</p>
                </div>
              </div>
            </div>

            {renderStageContent()}
            {renderLeaderboard()}
          </>
        )}
      </div>
    </div>
  );
}
