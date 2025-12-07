import { QRCodeCanvas } from 'qrcode.react';
import { useDisplayRealtime } from '../hooks/useDisplayRealtime';
import { StatusBadge } from '../components/StatusBadge';
import { Card } from '../components/ui/Card';

export default function DisplayPage() {
  const { config, snapshot, status, error } = useDisplayRealtime();
  const stage = snapshot?.stage;

  const leaderboard = snapshot?.leaderboard ?? [];
  const qrUrl = config?.qr.joinUrl ?? '';

  const isRegistration = stage?.kind === 'waiting' && stage.id.includes('waiting_lobby'); // Simple heuristic, ideally check specific config ID
  const isLeaderboard = stage?.kind === 'leaderboard';

  const renderStage = () => {
    if (!stage) {
      return <p className="text-center text-black/50">Ожидаем сигнала от ведущего...</p>;
    }

    if (stage.kind === 'waiting') {
      return (
        <div className="flex h-full flex-col items-center justify-center text-center text-black">
          <h1 className="text-5xl font-bold tracking-tight">{stage.label}</h1>
          <p className="mt-4 text-2xl text-black/70">{stage.message}</p>
        </div>
      );
    }

    if (stage.kind === 'info') {
      return (
        <div className="flex h-full flex-col items-center justify-center text-center text-black">
          <p className="text-sm uppercase tracking-[0.4em] text-black/50">{stage.label}</p>
          <h1 className="mt-4 text-5xl font-bold">{stage.headline}</h1>
          <p className="mt-4 max-w-3xl text-2xl text-black/70">{stage.body}</p>
        </div>
      );
    }

    if (stage.kind === 'leaderboard') {
      return (
        <div className="flex h-full flex-col items-center justify-center text-center text-black">
          <h1 className="text-5xl font-bold mb-8">{stage.label}</h1>
          <div className="w-full max-w-4xl">
            <div className="rounded-3xl border border-black/10 bg-white p-6 shadow">
              <ul className="space-y-4">
                {leaderboard.slice(0, stage.options.topN).map((entry, idx) => (
                  <li key={entry.id} className="flex items-center justify-between text-2xl">
                    <div className="flex items-center gap-6">
                      <span
                        className={`flex h-12 w-12 items-center justify-center rounded-full font-bold ${
                          idx < 3 ? 'bg-[#FFEA00] text-black' : 'bg-black/5 text-black'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-medium">{entry.name}</span>
                    </div>
                    <span className="font-bold">{entry.score}</span>
                  </li>
                ))}
                {leaderboard.length === 0 && (
                  <li className="text-center text-black/50">Нет результатов</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      );
    }

    if (stage.kind === 'question') {
      return (
        <div className="flex h-full flex-col justify-center text-black">
          <p className="text-sm uppercase tracking-[0.4em] text-black/50">
            Вопрос {stage.round}.{stage.order}
          </p>
          <h1 className="mt-2 text-5xl font-bold">{stage.label}</h1>
          <p className="mt-6 text-3xl text-black/80">{stage.content.prompt}</p>
          {stage.content.type === 'image' && (
            <img
              src={stage.content.assetUrl}
              alt={stage.content.caption ?? 'question asset'}
              className="mt-6 max-h-[500px] w-full rounded-3xl object-contain bg-black/5"
            />
          )}
          {stage.content.type === 'video' && (
            <video
              className="mt-6 w-full max-h-[500px] rounded-3xl bg-black/5"
              autoPlay={stage.content.autoplay}
              controls
              loop
            >
              <source src={stage.content.assetUrl} />
            </video>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-[#FFEA00] px-6 py-8 text-black">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 h-[calc(100vh-4rem)]">
        <Card className="flex items-center justify-between shrink-0 rounded-3xl border border-black/10 bg-white/90 p-6 shadow">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-black/50">Prompt Night</p>
            <h1 className="text-3xl font-bold text-black">
              {config?.metadata.eventName ?? 'Display'}
            </h1>
          </div>
          <StatusBadge status={status} />
        </Card>

        {error && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {isLeaderboard ? (
          <div className="flex-1 flex items-center justify-center">
            {renderStage()}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[3fr,1fr] flex-1 min-h-0">
            <section className="rounded-3xl border border-black/10 bg-white p-8 flex flex-col justify-center overflow-hidden shadow-sm">
              {renderStage()}
            </section>

            {isRegistration && (
              <aside className="flex flex-col gap-6 justify-center">
                <div className="rounded-3xl border border-black/10 bg-white p-8 text-center shadow-sm">
                  <p className="text-sm uppercase tracking-[0.4em] text-black/50 mb-6">Присоединяйся</p>
                  <div className="flex justify-center p-4 bg-black/5 rounded-2xl">
                    <QRCodeCanvas value={qrUrl || 'https://example.com'} size={240} />
                  </div>
                  <p className="mt-6 text-xl font-semibold text-black">{config?.qr.instructions}</p>
                  <p className="mt-2 text-sm text-black/70 font-mono">{qrUrl}</p>
                </div>
              </aside>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
