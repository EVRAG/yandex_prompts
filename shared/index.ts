import rawConfig from './gameConfig.json';
import type { GameConfig } from './types/gameConfig';

export const gameConfig = rawConfig as GameConfig;

export * from './types/gameConfig';

