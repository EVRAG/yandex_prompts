import { useEffect, useMemo, useState } from 'react';
import { useDisplayRealtime } from '../hooks/useDisplayRealtime';

const getPhaseMessage = (phase: string) => {
  switch (phase) {
    case 'waiting':
      return {
        title: 'Подготовка к голосованию',
        subtitle: 'Сканируйте QR-код и подключайтесь к игре.',
      };
    case 'voting':
      return {
        title: 'Голосование открыто',
        subtitle: 'Выберите любимый концепт в своём телефоне.',
      };
    case 'collecting':
      return {
        title: 'Идёт подсчёт голосов',
        subtitle: 'Скоро объявим фаворита Railways.',
      };
    default:
      return {
        title: 'Подключаемся…',
        subtitle: 'Оставайтесь на связи.',
      };
  }
};

export default function DisplayPage() {
  const { task, snapshot } = useDisplayRealtime();
  const phase = snapshot?.phase ?? 'waiting';
  const message = getPhaseMessage(phase);
  const options = task?.options ?? [];
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

  const formattedTime = useMemo(() => {
    if (timeLeft === null) return '—';
    const m = Math.floor(timeLeft / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.max(0, timeLeft % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}`;
  }, [timeLeft]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black px-10 py-12 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-gray-400">Prompt Night · Railways</p>
            <p className="text-6xl font-semibold">{message.title}</p>
            <p className="mt-3 text-2xl text-gray-300">{message.subtitle}</p>
          </div>
          {phase === 'voting' && (
            <div className="rounded-3xl border border-white/10 px-8 py-4 text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-gray-400">Осталось</p>
              <p className="text-5xl font-mono">{formattedTime}</p>
            </div>
          )}
        </header>

        {phase === 'waiting' && (
          <section className="rounded-3xl border border-white/10 bg-white/5 px-8 py-12 text-center">
            <p className="text-4xl text-gray-100">Сканируйте QR и приготовьтесь к выбору.</p>
            <p className="mt-4 text-2xl text-gray-400">Ведущий запустит голосование совсем скоро.</p>
          </section>
        )}

        {phase === 'voting' && (
          <section className="grid gap-8 md:grid-cols-2">
            {options.map(option => (
              <article key={option.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
                <img
                  src={option.imageUrl}
                  alt={option.title}
                  className="h-80 w-full rounded-2xl object-cover"
                />
                <div className="mt-5 flex items-start justify-between">
                  <div>
                    <p className="text-3xl font-semibold">{option.title}</p>
                    {option.description && (
                      <p className="mt-2 text-lg text-gray-300">{option.description}</p>
                    )}
                  </div>
                  <span className="rounded-full bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-gray-200">
                    Голосуйте
                  </span>
                </div>
              </article>
            ))}
          </section>
        )}

        {phase === 'collecting' && (
          <section className="rounded-3xl border border-white/10 bg-white/5 px-8 py-12 text-center">
            <p className="text-5xl font-semibold text-white">Собираем данные</p>
            <p className="mt-4 text-2xl text-gray-300">Победитель будет объявлен с минуты на минуту.</p>
          </section>
        )}
      </div>
    </div>
  );
}
