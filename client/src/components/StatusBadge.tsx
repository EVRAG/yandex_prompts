import React from 'react';

export type Status = 'connecting' | 'online' | 'error';

interface StatusBadgeProps {
  status: Status;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const base = 'inline-flex items-center gap-x-1.5 rounded-full px-3 py-1 text-xs font-semibold';

  if (status === 'online') {
    return (
      <span className={`${base} bg-green-100 text-green-700`}>
        <svg viewBox="0 0 6 6" aria-hidden="true" className="h-1.5 w-1.5 fill-green-500">
          <circle r={3} cx={3} cy={3} />
        </svg>
        Онлайн
      </span>
    );
  }

  if (status === 'connecting') {
    return (
      <span className={`${base} bg-yellow-100 text-yellow-800`}>
        <svg viewBox="0 0 6 6" aria-hidden="true" className="h-1.5 w-1.5 fill-yellow-500">
          <circle r={3} cx={3} cy={3} />
        </svg>
        Подключение...
      </span>
    );
  }

  return (
    <span className={`${base} bg-red-100 text-red-700`}>
      <svg viewBox="0 0 6 6" aria-hidden="true" className="h-1.5 w-1.5 fill-red-500">
        <circle r={3} cx={3} cy={3} />
      </svg>
      Оффлайн
    </span>
  );
};

