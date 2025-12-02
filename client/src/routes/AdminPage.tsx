import type { GameStage, QuestionStage } from '@prompt-night/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdminRealtime } from '../hooks/useAdminRealtime';
import type { StageTarget } from '../types/realtime';

type QuestionStageWithTimer = QuestionStage & { duration?: number };
const isQuestionStage = (stage: GameStage): stage is QuestionStageWithTimer =>
  stage.kind === 'question';

const statusStyles: Record<'connecting' | 'online' | 'error', string> = {
  connecting: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
  online: 'bg-yandex-green-50 text-yandex-green-700 ring-1 ring-inset ring-yandex-green-700/20',
  error: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20',
};

const SCENARIO_STORAGE_KEY = 'prompt-night-scenario';

const kindLabel: Record<GameStage['kind'], string> = {
  question: 'Раунд / Вопрос',
  waiting: 'Экран ожидания',
  info: 'Информационный экран',
  leaderboard: 'Таблица лидеров',
};

const kindBadgeStyles: Record<GameStage['kind'], string> = {
  question: 'bg-yandex-green-50 text-yandex-green-700 ring-yandex-green-700/20',
  waiting: 'bg-gray-50 text-gray-700 ring-gray-600/20',
  info: 'bg-gray-50 text-gray-700 ring-gray-600/20',
  leaderboard: 'bg-gray-50 text-gray-700 ring-gray-600/20',
};

const formatTime = (value: number) =>
  new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(value);

const readScenario = (baseIds: string[]) => {
  if (typeof window === 'undefined') return baseIds;
  try {
    const stored = localStorage.getItem(SCENARIO_STORAGE_KEY);
    if (!stored) return baseIds;
    const parsed = JSON.parse(stored) as string[];
    const filtered = parsed.filter(id => baseIds.includes(id));
    const missing = baseIds.filter(id => !filtered.includes(id));
    return [...filtered, ...missing];
  } catch {
    return baseIds;
  }
};

export default function AdminPage() {
  const { config, snapshot, status, error, setStage, refresh } = useAdminRealtime();
  const [scenarioOrder, setScenarioOrder] = useState<string[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    if (!config) return;
    const ids = config.stages.map(stage => stage.id);
    setScenarioOrder(prev => {
      if (!prev.length) return readScenario(ids);
      const filtered = prev.filter(id => ids.includes(id));
      const missing = ids.filter(id => !filtered.includes(id));
      const next = [...filtered, ...missing];
      localStorage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [config]);

  const stageById = useMemo(() => {
    if (!config) return new Map<string, GameStage>();
    return new Map(config.stages.map(stage => [stage.id, stage]));
  }, [config]);

  const orderedStages = useMemo(() => {
    if (!config) return [];
    const map = new Map(config.stages.map(stage => [stage.id, stage]));
    return scenarioOrder.map(id => map.get(id)).filter(Boolean) as GameStage[];
  }, [config, scenarioOrder]);

  const players = useMemo(() => {
    if (!snapshot) return [];
    return [...snapshot.players].sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt);
  }, [snapshot]);

  const onlineCount = players.filter(player => player.isOnline).length;

  const playerMap = useMemo(() => {
    if (!snapshot) return new Map<string, string>();
    return new Map(snapshot.players.map(player => [player.id, player.name]));
  }, [snapshot]);

  const recentSubmissions = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.submissions.slice(-8).reverse();
  }, [snapshot]);

  const reorderScenario = useCallback((fromId: string, toId: string) => {
    setScenarioOrder(prev => {
      const next = [...prev];
      const fromIndex = next.indexOf(fromId);
      const toIndex = next.indexOf(toId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, fromId);
      localStorage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const handleDragStart = (stageId: string) => setDraggingId(stageId);
  const handleDragEnter = (stageId: string) => {
    if (!draggingId || draggingId === stageId) return;
    reorderScenario(draggingId, stageId);
  };
  const handleDragEnd = () => setDraggingId(null);

  const handleStage = (target: StageTarget, stageId: string) => {
    setStage(target, stageId);
  };

  const handleStageBoth = (stageId: string) => {
    setStage('client', stageId);
    setStage('display', stageId);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                {config?.metadata.eventName ?? 'Админ-панель'}
              </h1>
              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[status]}`}>
                {status === 'online' ? 'Online' : status === 'connecting' ? 'Connecting' : 'Error'}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {config?.metadata.eventDate ?? 'Дата не задана'} · Игроков: {players.length} ({onlineCount} online)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={refresh}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Обновить
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Ошибка соединения</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Сценарий</h2>
              <div className="text-xs text-gray-500">
                Клиент: <span className="font-medium text-gray-900">{snapshot?.clientStage?.label ?? '—'}</span> · 
                Экран: <span className="font-medium text-gray-900">{snapshot?.displayStage?.label ?? '—'}</span>
              </div>
            </div>

            <ul role="list" className="grid grid-cols-1 gap-6">
              {orderedStages.map((stage, index) => {
                const isClientActive = snapshot?.clientStageId === stage.id;
                const isDisplayActive = snapshot?.displayStageId === stage.id;
                const isActive = isClientActive || isDisplayActive;
                
                return (
                  <li
                    key={stage.id}
                    draggable
                    onDragStart={() => handleDragStart(stage.id)}
                    onDragEnter={() => handleDragEnter(stage.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={e => e.preventDefault()}
                    className={`col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow-sm transition-all ${
                      isActive ? 'ring-2 ring-yandex-green' : 'ring-1 ring-gray-900/5'
                    } ${draggingId === stage.id ? 'scale-[1.02] shadow-lg z-10' : ''}`}
                  >
                    <div className="flex w-full items-start justify-between space-x-6 p-6">
                      <div className="flex-1 truncate">
                        <div className="flex items-center space-x-3">
                          <h3 className="truncate text-sm font-medium text-gray-900">{stage.label}</h3>
                          <span className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${kindBadgeStyles[stage.kind]}`}>
                            {kindLabel[stage.kind]}
                          </span>
                          {isClientActive && (
                            <span className="inline-flex shrink-0 items-center rounded-full bg-yandex-green-50 px-1.5 py-0.5 text-xs font-medium text-yandex-green-700 ring-1 ring-inset ring-yandex-green-700/20">
                              Клиент
                            </span>
                          )}
                          {isDisplayActive && (
                            <span className="inline-flex shrink-0 items-center rounded-full bg-sky-50 px-1.5 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-600/20">
                              Экран
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate text-sm text-gray-500">{stage.description || 'Нет описания'}</p>
                        {isQuestionStage(stage) && (
                          <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded-md border border-gray-100 whitespace-normal">
                            <p className="font-medium">{stage.content.prompt}</p>
                            {stage.duration && (
                              <p className="text-xs text-gray-500 mt-1">⏱ {stage.duration}s</p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500">
                        {index + 1}
                      </div>
                    </div>
                    
                    <div>
                      <div className="-mt-px flex divide-x divide-gray-200">
                        <div className="flex w-0 flex-1">
                          <button
                            onClick={() => handleStageBoth(stage.id)}
                            className={`relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-2 rounded-bl-lg border border-transparent py-4 text-sm font-semibold focus:z-10 ${
                              isClientActive && isDisplayActive
                                ? 'bg-yandex-green-50 text-yandex-green-700'
                                : 'text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            <span className={isClientActive && isDisplayActive ? 'text-yandex-green-700' : 'text-yandex-green-700'}>
                              Везде
                            </span>
                          </button>
                        </div>
                        <div className="-ml-px flex w-0 flex-1">
                          <button
                            onClick={() => handleStage('client', stage.id)}
                            className={`relative inline-flex w-0 flex-1 items-center justify-center gap-x-2 border border-transparent py-4 text-sm font-semibold focus:z-10 ${
                              isClientActive 
                                ? 'bg-yandex-green-50 text-yandex-green-700' 
                                : 'text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            Клиент
                          </button>
                        </div>
                        <div className="-ml-px flex w-0 flex-1">
                          <button
                            onClick={() => handleStage('display', stage.id)}
                            className={`relative inline-flex w-0 flex-1 items-center justify-center gap-x-2 rounded-br-lg border border-transparent py-4 text-sm font-semibold focus:z-10 ${
                              isDisplayActive
                                ? 'bg-yandex-green-50 text-yandex-green-700'
                                : 'text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            Экран
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
              
              {orderedStages.length === 0 && (
                <li className="col-span-1 rounded-lg bg-white p-12 text-center shadow-sm ring-1 ring-gray-900/5">
                  <p className="text-sm text-gray-500">Сценарий пуст</p>
                </li>
              )}
            </ul>
          </div>

          {/* Stats & Feeds Row */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Players Card */}
            <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-4">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Топ игроков</h3>
              </div>
              <ul role="list" className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {players.slice(0, 8).map((player) => (
                  <li key={player.id} className="flex justify-between gap-x-6 px-4 py-4 hover:bg-gray-50">
                    <div className="flex min-w-0 gap-x-4">
                      <div className="min-w-0 flex-auto">
                        <p className="text-sm font-semibold leading-6 text-gray-900">{player.name}</p>
                        <p className="mt-1 truncate text-xs leading-5 text-gray-500">
                          {player.isOnline ? 'Online' : `Last seen ${formatTime(player.lastActive)}`}
                        </p>
                      </div>
                    </div>
                    <div className="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
                      <p className="text-sm leading-6 text-gray-900 font-bold">{player.score}</p>
                      {player.isOnline ? (
                        <div className="mt-1 flex items-center gap-x-1.5">
                          <div className="flex-none rounded-full bg-yandex-green p-1">
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          </div>
                          <p className="text-xs leading-5 text-gray-500">Online</p>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs leading-5 text-gray-500">Offline</p>
                      )}
                    </div>
                  </li>
                ))}
                {players.length === 0 && (
                  <li className="px-4 py-8 text-center text-sm text-gray-500">Игроков пока нет</li>
                )}
              </ul>
            </div>

            {/* Activity Feed */}
            <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-4">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Последние ответы</h3>
              </div>
              <ul role="list" className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {recentSubmissions.map((item) => {
                  const playerName = playerMap.get(item.playerId) ?? 'Неизвестно';
                  const stage = stageById.get(item.stageId);
                  return (
                    <li key={item.id} className="px-4 py-4 hover:bg-gray-50">
                      <div className="flex justify-between gap-x-4 mb-1">
                        <p className="text-sm font-medium text-gray-900">{playerName}</p>
                        <p className="text-xs text-gray-500">{formatTime(item.createdAt)}</p>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{item.answer}</p>
                      {stage && (
                        <p className="mt-1 text-xs text-indigo-500 font-medium">{stage.label}</p>
                      )}
                    </li>
                  );
                })}
                {recentSubmissions.length === 0 && (
                  <li className="px-4 py-8 text-center text-sm text-gray-500">Ответов пока нет</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
