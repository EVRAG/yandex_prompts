export type VoteOption = {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  pairNames?: string;
  pairOrg?: string;
};

export type VotingPhase = 'waiting' | 'voting' | 'collecting';

export interface VotingTask {
  id: string;
  title: string;
  instructions: string;
  durationSeconds: number;
  options: VoteOption[];
}

export type VoteResult = {
  optionId: string;
  title: string;
  count: number;
  percentage: number;
};

export interface VotingSnapshot {
  phase: VotingPhase;
  task: VotingTask;
  votingEndsAt: number | null;
  timeLeftSeconds: number | null;
  updatedAt: number;
}

export interface AdminVotingSnapshot extends VotingSnapshot {
  totalVotes: number;
  results: VoteResult[];
}

export const votingTask: VotingTask = {
  id: 'railways-showdown',
  title: 'Выберите любимую пару',
  instructions: 'Оцените представленные пары и нажмите «Выбрать» у фаворита. Голос можно отправить только один раз.',
  durationSeconds: 180,
  options: [
    {
      id: 'pair-1',
      title: 'Пара №1',
      pairNames: 'Магаляс Фёдор и Ковалева Мария',
      pairOrg: 'ОП Спб',
      imageUrl: 'https://storage.yandexcloud.net/voting-ett/001.jpeg',
    },
    {
      id: 'pair-2',
      title: 'Пара №2',
      pairNames: 'Цветкова Яна и Рябчук Вячеслав',
      pairOrg: 'ОП Гранд',
      imageUrl: 'https://storage.yandexcloud.net/voting-ett/002.jpeg',
    },
    {
      id: 'pair-3',
      title: 'Пара №3',
      pairNames: 'Казарин Богдан и Рязанова Екатерина',
      pairOrg: 'ОП МООО «РСО»',
      imageUrl: 'https://storage.yandexcloud.net/voting-ett/003.jpeg',
    },
    {
      id: 'pair-4',
      title: 'Пара №4',
      pairNames: 'Гохвейс Паула и Григоров Александр',
      pairOrg: 'ОП ТТЖТ',
      imageUrl: 'https://storage.yandexcloud.net/voting-ett/004.jpeg',
    },
    {
      id: 'pair-5',
      title: 'Пара №5',
      pairNames: 'Козырьков Вадим и Козырькова Елизавета',
      pairOrg: 'ОП СМФ',
      imageUrl: 'https://storage.yandexcloud.net/voting-ett/005.jpeg',
    },
    {
      id: 'pair-6',
      title: 'Пара №6',
      pairNames: 'Халиуллина Алсу и Ситник Данила',
      pairOrg: 'ОП МСК',
      imageUrl: 'https://storage.yandexcloud.net/voting-ett/006.jpeg',
    },
  ],
};

