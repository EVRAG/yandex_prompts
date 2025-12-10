import s from './Leaderboard.module.scss';

interface LeaderboardProps {
  playerName: string;
  leaderboard: Array<{ id: string; name: string; score: number }>;
  currentPlayerId?: string;
}

export function Leaderboard({ playerName, leaderboard, currentPlayerId }: LeaderboardProps) {
  const getMedalIcon = (position: number) => {
    if (position === 1) {
      return <img src="/images/1.svg" alt="1 место" />;
    } else if (position === 2) {
      return <img src="/images/2.svg" alt="2 место" />;
    } else if (position === 3) {
      return <img src="/images/3.svg" alt="3 место" />;
    } else if (position === 4) {
      return <img src="/images/4.svg" alt="4 место" />;
    }
    return null;
  };

  return (
    <div className={s.root}>
      <div className={s.wrapper}>
        <img className={s.logo} src="/images/logo.svg" alt="logo" />
        <div className={s.content}>
          <div className={s.thankYou}>
            <div className={s.thankYou_line1}>{playerName}, спасибо</div>
            <div className={s.thankYou_line2}>за участие</div>
          </div>
          <div className={s.resultsText}>
            <div>Результаты смотри</div>
            <div>в турнирной таблице</div>
          </div>
          <div className={s.leaderboard}>
            {leaderboard.length > 0 ? (
              leaderboard.map((user, index) => {
                const position = index + 1;
                const isTopFour = position <= 4;
                const isCurrentUser = currentPlayerId && user.id === currentPlayerId;

                return (
                  <div
                    key={user.id}
                    className={`${s.leaderboardItem} ${
                      isCurrentUser ? s.leaderboardItem_current : ''
                    }`}
                  >
                    {isTopFour && (
                      <div className={s.medalIcon}>{getMedalIcon(position)}</div>
                    )}
                    <div className={s.leaderboardItem_content}>
                      {!isTopFour && (
                        <span className={s.leaderboardItem_position}>
                          {position}
                        </span>
                      )}
                      <span className={s.leaderboardItem_name}>{user.name}</span>
                      <span className={s.leaderboardItem_score}>
                        {user.score}{' '}
                        <img
                          src={
                            isCurrentUser
                              ? '/images/points.svg'
                              : '/images/points_black.svg'
                          }
                          alt=""
                        />
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={s.emptyState}>Результаты пока недоступны</div>
            )}
          </div>
        </div>
      </div>
      <img className={s.img} src="/images/bg_mobile.png" alt="bg" />
    </div>
  );
}
