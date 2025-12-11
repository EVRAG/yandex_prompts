import { useState } from 'react';
import { useRealtime } from '../hooks/useRealtime';

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const { socket, state, isConnected, config } = useRealtime('admin', { secret });

  if (!secret) {
    return (
      <div className="p-4">
        <input 
            type="password" 
            placeholder="Secret" 
            onChange={e => setSecret(e.target.value)} 
            className="border p-2"
        />
      </div>
    );
  }

  if (!state || !config) {
    return (
      <div className="p-4">
        <div>Connecting...</div>
        <div className="text-sm text-gray-500 mt-2">
          State: {state ? '✓' : '✗'} | Config: {config ? '✓' : '✗'} | Connected: {isConnected ? '✓' : '✗'}
        </div>
      </div>
    );
  }

  const { currentStage, playerCount } = state;

  const handleReset = () => {
    if (confirm('Вы уверены? Это удалит всех игроков, все ответы и баллы. Игра вернется к начальному состоянию.')) {
      socket?.emit('reset');
    }
  };

  const handleStartStage = (stageId: string) => {
    socket?.emit('stage:set', stageId);
    socket?.emit('stage:status', 'active');
  };

  const renderStageCard = (stage: typeof config.stages[0], buttonText: string) => {
    const isActive = currentStage.id === stage.id && currentStage.status === 'active';
    return (
      <li key={stage.id} className={`col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow-sm ${
        isActive ? 'ring-4 ring-blue-500 ring-offset-2' : ''
      }`}>
        <div className="flex w-full items-center justify-between space-x-6 p-6">
          <div className="flex-1 truncate">
            <div className="flex items-center space-x-3">
              <h3 className="truncate text-sm font-medium text-gray-900">{stage.title}</h3>
              {isActive && (
                <span className="inline-flex shrink-0 items-center rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  Активен
                </span>
              )}
            </div>
            <p className="mt-1 truncate text-sm text-gray-500">
              {stage.questionText || (stage.type === 'registration' ? 'Экран регистрации игроков' : stage.type === 'leaderboard' ? 'Таблица результатов' : 'Нет описания')}
            </p>
            {stage.timeLimitSeconds && (
              <p className="mt-1 text-xs text-gray-400">
                Время: {stage.timeLimitSeconds}с
              </p>
            )}
          </div>
        </div>
        <div>
          <div className="-mt-px flex divide-x divide-gray-200">
            <div className="flex w-0 flex-1">
              <button
                onClick={() => handleStartStage(stage.id)}
                disabled={isActive}
                className={`relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold ${
                  isActive
                    ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                    : 'text-gray-900 hover:bg-gray-50'
                }`}
              >
                <svg
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0zm10-3a1 1 0 011 1v5a1 1 0 11-2 0V8a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {isActive ? 'Запущен' : buttonText}
              </button>
            </div>
          </div>
        </div>
      </li>
    );
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            Status: {isConnected ? 'Online' : 'Offline'} | Players: {playerCount}
            {currentStage.type !== 'registration' && currentStage.type !== 'leaderboard' && (
              <span className="ml-2 text-blue-600">| Активен: {currentStage.title}</span>
            )}
          </div>
          <button
            onClick={handleReset}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-bold"
          >
            🔄 Сбросить всё
          </button>
        </div>
      </div>

      <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {config.stages.map(stage => {
          let buttonText = 'Запуск';
          if (stage.type === 'question') buttonText = 'Запуск вопроса';
          else if (stage.type === 'registration') buttonText = 'Запуск регистрации';
          else if (stage.type === 'leaderboard') buttonText = 'Показать результаты';
          else if (stage.type === 'info') buttonText = 'Показать';

          return renderStageCard(stage, buttonText);
        })}
      </ul>
    </div>
  );
}
