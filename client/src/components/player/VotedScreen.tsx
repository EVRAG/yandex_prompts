import React from 'react';
import { StatusBadge, type Status } from '../StatusBadge';
import type { VotingTask } from '@prompt-night/shared';

interface VotedScreenProps {
  status: Status;
  task: VotingTask;
  selectedOptionId: string;
}

export const VotedScreen: React.FC<VotedScreenProps> = ({ status, task, selectedOptionId }) => {
  const chosen = task.options.find(option => option.id === selectedOptionId);
  
  return (
    <div className="relative isolate flex h-[100dvh] flex-col overflow-hidden bg-white px-4 sm:px-8">
      <svg
        viewBox="0 0 1024 1024"
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-[42rem] w-[42rem] -translate-x-1/2 translate-y-1/2 mask-[radial-gradient(closest-side,white,transparent)]"
      >
        <circle r="512" cx="512" cy="512" fill="url(#railways-voted-gradient)" fillOpacity="0.75" />
        <defs>
          <radialGradient id="railways-voted-gradient">
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
            Спасибо за ваш голос!
          </h2>
          <p className="mt-6 max-w-2xl text-lg text-gray-600">
            Вы выбрали{' '}
            <span className="font-semibold text-gray-900">
              {chosen?.title ?? 'выбранный вариант'}
            </span>
            . Оставайтесь на связи — скоро объявим результаты.
          </p>
      </div>
    </div>
  );
};

