import type { GameConfig } from '@prompt-night/shared';
import type { AdminSnapshot } from '../types/realtime';
import { ADMIN_SECRET, SERVER_URL } from './constants';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || 'Server error');
  }
  return res.json() as Promise<T>;
}

const adminHeaders =
  ADMIN_SECRET && ADMIN_SECRET.length > 0
    ? {
        'x-admin-secret': ADMIN_SECRET,
      }
    : undefined;

export const fetchGameConfig = () =>
  fetch(`${SERVER_URL}/config`).then(res => handleResponse<GameConfig>(res));

export const fetchAdminSnapshot = () =>
  fetch(`${SERVER_URL}/state`, {
    headers: adminHeaders,
  }).then(res => handleResponse<AdminSnapshot>(res));

export const moderateNickname = (nickname: string) =>
  fetch(`${SERVER_URL}/moderate/nickname`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nickname }),
  }).then(res => handleResponse<{ allowed: boolean; reason?: string }>(res));

