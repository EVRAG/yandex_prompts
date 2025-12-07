import { useState, useEffect } from 'react';
import { useRealtime } from '../hooks/useRealtime';
import { ADMIN_SECRET } from '../lib/constants';

export default function AdminPage() {
  const [secret, setSecret] = useState(ADMIN_SECRET || localStorage.getItem('adminSecret') || '');
  const { socket, state, isConnected, config } = useRealtime('admin', { secret });

  useEffect(() => {
    if (secret) localStorage.setItem('adminSecret', secret);
  }, [secret]);

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

  const { currentStage, playerCount, players, leaderboard } = state;

  const handleReset = () => {
    if (confirm('Вы уверены? Это удалит всех игроков, все ответы и баллы. Игра вернется к начальному состоянию.')) {
      socket?.emit('reset');
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            Status: {isConnected ? 'Online' : 'Offline'} | Players: {playerCount}
          </div>
          <button
            onClick={handleReset}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-bold"
          >
            🔄 Сбросить всё
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Stages</h2>
          <div className="space-y-2">
            {config.stages.map(stage => (
              <div 
                key={stage.id}
                className={`p-3 rounded border flex justify-between items-center ${
                    currentStage.id === stage.id ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
                }`}
              >
                <div>
                  <div className="font-medium">{stage.title}</div>
                  <div className="text-xs text-gray-500">{stage.type}</div>
                </div>
                {currentStage.id === stage.id ? (
                  <span className="text-blue-600 font-bold text-sm">Active</span>
                ) : (
                  <button 
                    onClick={() => socket?.emit('stage:set', stage.id)}
                    className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm"
                  >
                    Activate
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Current Stage Control</h2>
            <div className="mb-4">
                <div className="font-bold text-lg">{currentStage.title}</div>
                <div className="text-gray-600 mb-2">Status: {currentStage.status}</div>
                {currentStage.timeLimitSeconds && (
                    <div className="text-sm text-gray-500">Time Limit: {currentStage.timeLimitSeconds}s</div>
                )}
            </div>

            <div className="flex gap-2">
                <button 
                    onClick={() => socket?.emit('stage:status', 'pending')}
                    className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded"
                >
                    Reset (Pending)
                </button>
                <button 
                    onClick={() => socket?.emit('stage:status', 'active')}
                    className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded"
                >
                    Start / Resume
                </button>
                <button 
                    onClick={() => socket?.emit('stage:status', 'locked')}
                    className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
                >
                    Lock
                </button>
                <button 
                    onClick={() => socket?.emit('stage:status', 'revealed')}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded"
                >
                    Reveal Answer
                </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-bold mb-4">Leaderboard Preview</h2>
              {/* Simple list of top 5 */}
              {(leaderboard || (players && Object.values(players).sort((a, b) => b.score - a.score)))
                ?.slice(0, 5)
                .map((p, i) => (
                    <div key={p.id} className="flex justify-between py-1 border-b last:border-0">
                        <span>{i + 1}. {p.name}</span>
                        <span className="font-mono">{p.score}</span>
                    </div>
                ))
              }
          </div>
        </div>
      </div>
    </div>
  );
}
