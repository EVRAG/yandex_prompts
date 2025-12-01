export type StageKind = 'waiting' | 'question' | 'leaderboard' | 'info';
export type QuestionContent = {
    type: 'text';
    prompt: string;
} | {
    type: 'image';
    prompt: string;
    assetUrl: string;
    caption?: string;
} | {
    type: 'video';
    prompt: string;
    assetUrl: string;
    autoplay?: boolean;
    caption?: string;
};
export type ScoringRule = {
    mode: 'manual';
    maxPoints: number;
    defaultPoints?: number;
    allowPartial?: boolean;
} | {
    mode: 'llm';
    prompt: string;
    maxPoints: number;
    model?: string;
    temperature?: number;
    metadata?: Record<string, unknown>;
};
export interface BaseStage {
    id: string;
    kind: StageKind;
    label: string;
    description?: string;
    screen?: 'clients' | 'display' | 'both';
}
export interface WaitingStage extends BaseStage {
    kind: 'waiting';
    message: string;
    cta?: string;
}
export interface InfoStage extends BaseStage {
    kind: 'info';
    headline: string;
    body: string;
}
export interface QuestionStage extends BaseStage {
    kind: 'question';
    round: 1 | 2 | 3;
    order: number;
    content: QuestionContent;
    responseType: 'text' | 'mcq' | 'multiline';
    scoring: ScoringRule;
}
export interface LeaderboardStage extends BaseStage {
    kind: 'leaderboard';
    options: {
        topN: number;
        highlightTop?: number;
        layout: 'full' | 'compact';
    };
}
export type GameStage = WaitingStage | InfoStage | QuestionStage | LeaderboardStage;
export interface GameConfig {
    metadata: {
        eventName: string;
        eventDate?: string;
        host?: string;
        supportContact?: string;
    };
    qr: {
        joinUrl: string;
        assetUrl?: string;
        instructions: string;
    };
    stages: GameStage[];
}
//# sourceMappingURL=gameConfig.d.ts.map