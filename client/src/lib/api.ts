import type { AdminVotingSnapshot, VotingTask } from '@prompt-night/shared';
import { SERVER_URL } from './constants';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || 'Server error');
  }
  return res.json() as Promise<T>;
}

export const fetchVotingTask = () =>
  fetch(`${SERVER_URL}/config`).then(res => handleResponse<VotingTask>(res));

export const fetchAdminSnapshot = () =>
  fetch(`${SERVER_URL}/state`).then(res => handleResponse<AdminVotingSnapshot>(res));

export {};