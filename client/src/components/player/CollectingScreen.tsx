import React from 'react';
import { StatusBadge, type Status } from '../StatusBadge';

interface CollectingScreenProps {
  status: Status;
}

export const CollectingScreen: React.FC<CollectingScreenProps> = ({ status }) => {
  return (
    <div className="relative isolate h-[100dvh] overflow-hidden bg-white px-4 sm:px-8 flex flex-col">
       <svg
        viewBox="0 0 1024 1024"
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-[42rem] w-[42rem] -translate-x-1/2 translate-y-1/2 mask-[radial-gradient(closest-side,white,transparent)]"
      >
        <circle r="512" cx="512" cy="512" fill="url(#railways-collecting-gradient)" fillOpacity="0.75" />
        <defs>
          <radialGradient id="railways-collecting-gradient">
            <stop stopColor="#7775D6" />
            <stop offset="1" stopColor="#E935C1" />
          </radialGradient>
        </defs>
      </svg>
      <div className="absolute inset-x-0 top-6 flex justify-center">
        <StatusBadge status={status} />
      </div>
      <div className="mx-auto flex flex-1 w-full max-w-5xl flex-col items-center justify-center text-center pb-10">
          <h2 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Спасибо! Собираем данные
          </h2>
          <p className="mt-6 max-w-2xl text-lg text-gray-600">
            Голосование закрыто. Мы считаем результаты и скоро объявим фаворита.
          </p>
      </div>
    </div>
  );
};

