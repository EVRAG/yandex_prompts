import React, { useState } from 'react';
import { StatusBadge, type Status } from '../StatusBadge';
import type { VotingTask } from '@prompt-night/shared';

interface VotingScreenProps {
  status: Status;
  task: VotingTask;
  voteStatus: 'idle' | 'sending' | 'submitted' | 'error';
  vote: (optionId: string) => void;
  error: string | null;
  clearError: () => void;
}

export const VotingScreen: React.FC<VotingScreenProps> = ({ status, task, voteStatus, vote, error, clearError }) => {
  const [pendingOption, setPendingOption] = useState<{ id: string; title: string } | null>(null);

  return (
    <div className="relative isolate z-10 min-h-[100dvh] px-4 py-10 sm:px-8 overscroll-y-none">
      <div className="absolute inset-x-0 top-6 flex justify-center">
        <StatusBadge status={status} />
      </div>
      <div className="mx-auto flex min-h-[80vh] w-full max-w-5xl flex-col items-center pt-24 text-center">
          <div className="mb-10">
            <p className="text-3xl font-semibold text-gray-900">Проголосуйте за вашу любимую пару</p>
            <p className="mt-2 text-base text-gray-600">
              Выберите понравившуюся концепцию и нажмите «Выбрать», чтобы засчитать голос.
            </p>
          </div>
          {error && (
            <div className="mb-6 flex items-start justify-between rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 w-full max-w-md">
              <span>{error}</span>
              <button
                type="button"
                className="text-rose-500 underline ml-2"
                onClick={() => clearError()}
              >
                Закрыть
              </button>
            </div>
          )}
        
          <div className="space-y-6 w-full">
            <ul role="list" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {task.options.map(option => {
                const isSending = voteStatus === 'sending';
                return (
                  <li
                    key={option.id}
                    className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-2xl bg-white text-center shadow-2xl shadow-black/15"
                  >
                    <div className="flex flex-1 flex-col p-4">
                      <div className="relative w-full overflow-hidden rounded-xl bg-gray-300 outline outline-1 -outline-offset-1 outline-black/5">
                        <img
                          src={option.imageUrl}
                          alt={option.title}
                          className="w-full object-cover"
                        />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-gray-900">{option.title}</h3>
                      <dl className="mt-3 flex grow flex-col gap-1 text-base text-gray-700">
                        <dd className="font-semibold text-gray-900">
                          {option.pairNames ?? option.description ?? 'Участники уточняются'}
                        </dd>
                        {option.pairOrg && <dd className="font-medium">{option.pairOrg}</dd>}
                      </dl>
                    </div>
                    <div>
                      <div className="-mt-px flex">
                        <button
                          type="button"
                          className="relative inline-flex w-full items-center justify-center gap-x-3 rounded-b-lg border border-transparent py-4 text-base font-semibold text-gray-900 transition hover:bg-gray-50 disabled:text-gray-400"
                          disabled={isSending}
                          onClick={() =>
                            setPendingOption({
                              id: option.id,
                              title: option.title,
                            })
                          }
                        >
                          {isSending ? 'Отправляем...' : 'Выбрать'}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
      </div>
      
      {pendingOption && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 text-left shadow-2xl">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="size-6 text-amber-600">
                <path d="M12 6v6" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="17" r="0.75" />
              </svg>
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-lg font-semibold text-gray-900">Вы уверены?</h3>
              <p className="mt-2 text-base text-gray-600">
                Голос за «{pendingOption.title}» нельзя будет изменить после подтверждения.
              </p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="inline-flex justify-center rounded-md bg-gray-900 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
                onClick={() => {
                  vote(pendingOption.id);
                  setPendingOption(null);
                }}
              >
                Подтвердить
              </button>
              <button
                type="button"
                className="inline-flex justify-center rounded-md bg-white px-4 py-3 text-base font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                onClick={() => setPendingOption(null)}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

