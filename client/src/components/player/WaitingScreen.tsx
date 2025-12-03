import React from 'react';
import { StatusBadge, type Status } from '../StatusBadge';

interface WaitingScreenProps {
  status: Status;
}

export const WaitingScreen: React.FC<WaitingScreenProps> = ({ status }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-6 py-12 sm:py-32 lg:px-8 overscroll-none">
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
    </div>
  );
};

