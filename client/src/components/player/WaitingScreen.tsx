import React from 'react';
import { StatusBadge, type Status } from '../StatusBadge';

interface WaitingScreenProps {
  status: Status;
}

export const WaitingScreen: React.FC<WaitingScreenProps> = ({ status }) => {
  return (
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-6 py-24 sm:py-32 lg:px-8">
      <div className="absolute inset-x-0 top-6 flex justify-center">
        <StatusBadge status={status} />
      </div>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
          Голосование скоро начнётся
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-gray-600">
          Следите за экраном — как только ведущий запустит голосование, здесь появятся варианты для выбора.
        </p>
      </div>
      <svg
        viewBox="0 0 1024 1024"
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-[28rem] w-[28rem] -translate-x-1/2 translate-y-1/2 mask-[radial-gradient(closest-side,white,transparent)]"
      >
        <circle r="512" cx="512" cy="512" fill="url(#railways-waiting-gradient)" fillOpacity="0.7" />
        <defs>
          <radialGradient id="railways-waiting-gradient">
            <stop stopColor="#7775D6" />
            <stop offset="1" stopColor="#E935C1" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
};

