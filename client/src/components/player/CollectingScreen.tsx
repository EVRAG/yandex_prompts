import React from 'react';
import { StatusBadge, type Status } from '../StatusBadge';

interface CollectingScreenProps {
  status: Status;
}

export const CollectingScreen: React.FC<CollectingScreenProps> = ({ status }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden px-4 sm:px-8 overscroll-none">
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

