import type { VotingPhase } from '@prompt-night/shared';
import { useEffect, useMemo, useState } from 'react';
import { useAdminRealtime } from '../hooks/useAdminRealtime';

import { StatusBadge } from '../components/StatusBadge';

const phaseLabels: Record<VotingPhase, string> = {
  waiting: 'Ожидание',
  voting: 'Голосование',
  collecting: 'Сбор данных',
};

const formatTime = (seconds: number | null) => {
  if (seconds === null) return '—';
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.max(0, seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
};

export default function AdminPage() {
  const { snapshot, task, status, error, setPhase, refresh } = useAdminRealtime();
  const phase = snapshot?.phase ?? 'waiting';
  const [timeLeft, setTimeLeft] = useState<number | null>(snapshot?.timeLeftSeconds ?? null);

  useEffect(() => {
    if (!snapshot || snapshot.phase !== 'voting' || !snapshot.votingEndsAt) {
      setTimeLeft(null);
      return;
    }
    const tick = () => {
      setTimeLeft(Math.max(0, Math.ceil((snapshot.votingEndsAt! - Date.now()) / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [snapshot?.phase, snapshot?.votingEndsAt]);

  const results = useMemo(() => {
    if (!task) return [];
    const counts = snapshot?.results ?? [];
        return task.options.map(option => {
      const aggregated = counts.find(result => result.optionId === option.id);
      return {
        ...option,
        count: aggregated?.count ?? 0,
        percentage: aggregated?.percentage ?? 0,
      };
    });
  }, [snapshot?.results, task]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-10 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl bg-white px-6 py-5 shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-gray-500">Prompt Night · Admin</p>
              <p className="text-3xl font-semibold text-gray-900">
                {phase === 'voting'
                  ? 'Голосование запущено'
                  : phase === 'collecting'
                    ? 'Собираем результаты'
                    : 'Команда готова к старту'}
              </p>
              <p className="mt-1 text-base text-gray-600">
                {phase === 'voting'
                  ? 'Следите за таймером и статистикой по вариантам.'
                  : phase === 'collecting'
                    ? 'Закройте раунд, когда будете готовы объявить победителя.'
                    : 'Запустите голосование, когда участники готовы.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={status} />
              <button
                className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400"
                onClick={refresh}
              >
                Синхронизировать
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-gray-500">Этап</p>
              <p className="text-2xl font-semibold text-gray-900">{phaseLabels[phase]}</p>
              <p className="text-sm text-gray-500">
                {phase === 'voting'
                  ? `Осталось ${formatTime(timeLeft)}`
                  : phase === 'collecting'
                    ? 'Голоса закрыты, можно объявлять результаты'
                    : 'Все участники видят экран ожидания'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['waiting', 'voting', 'collecting'] as VotingPhase[]).map(targetPhase => (
                <button
                  key={targetPhase}
                  onClick={() => setPhase(targetPhase)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    phase === targetPhase
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {phaseLabels[targetPhase]}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3ем] text-gray-500">Статистика</p>
              <p className="text-2xl font-semibold text-gray-900">Голоса по вариантам</p>
            </div>
            <div className="text-sm text-gray-600">
              Всего голосов:{' '}
              <span className="font-semibold text-gray-900">{snapshot?.totalVotes ?? 0}</span>
            </div>
          </div>
          {!task ? (
            <p className="mt-4 text-sm text-gray-500">Загружаем описание задания…</p>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {results.map(option => (
                    <div
                      key={option.id}
                      className="rounded-3xl border border-gray-200 bg-gray-50 p-4 shadow-inner"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-semibold text-gray-900">{option.title}</p>
                          {(option.pairNames || option.description) && (
                            <p className="text-sm text-gray-500">
                              {option.pairNames ?? option.description}
                            </p>
                          )}
                          {option.pairOrg && (
                            <p className="text-sm text-gray-400">{option.pairOrg}</p>
                          )}
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{option.count}</span>
                      </div>
                      <div className="mt-3 h-3 rounded-full bg-white/80">
                        <div
                          className="h-3 rounded-full bg-gray-900 transition-all"
                          style={{ width: `${option.percentage}%` }}
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-600">{option.percentage}% от голосов</p>
                    </div>
                  ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

