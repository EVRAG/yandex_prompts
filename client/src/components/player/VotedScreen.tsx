import React from 'react';
import { StatusBadge, type Status } from '../StatusBadge';
import type { VotingTask } from '@prompt-night/shared';

interface VotedScreenProps {
  status: Status;
  task: VotingTask;
  selectedOptionId: string;
}

export const VotedScreen: React.FC<VotedScreenProps> = ({ status, task, selectedOptionId }) => {
  const chosen = task.options.find(
    (option: VotingTask['options'][number]) => option.id === selectedOptionId,
  );
  
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden px-4 sm:px-8 overscroll-none">
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

