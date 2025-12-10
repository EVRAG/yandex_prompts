import s from './DisplayLeaderboard.module.scss';

interface DisplayLeaderboardProps {
  leaderboard: Array<{ id: string; name: string; score: number }>;
}

export function DisplayLeaderboard({ leaderboard }: DisplayLeaderboardProps) {
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

  // Ограничиваем до топ-10
  const topLeaderboard = leaderboard.slice(0, 10);

  return (
    <div className={s.root}>
      <div className={s.wrapper}>
        <div className={s.content}>
          <div className={s.leftSection}>
            <div className={s.titleSection}>
              <div className={s.laurelIcon}>
                <img src="/images/tournament.svg" alt="laurel" />
              </div>
              <h1 className={s.title}>
                Турнирная <br /> таблица
              </h1>
            </div>
          </div>
          <div className={s.rightSection}>
            <div className={s.leaderboard}>
              {topLeaderboard.length > 0 ? (
                topLeaderboard.map((user, index) => {
                  const position = index + 1;
                  const isTopFour = position <= 4;

                  return (
                    <div key={user.id} className={s.leaderboardItem}>
                      {isTopFour && (
                        <div className={s.medalIcon}>
                          {getMedalIcon(position)}
                        </div>
                      )}
                      {!isTopFour && (
                        <span className={s.positionNumber}>{position}</span>
                      )}
                      <span className={s.leaderboardItem_name}>{user.name}</span>
                      <span className={s.leaderboardItem_score}>
                        {user.score} <img src="/images/points_black.svg" alt="" />
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className={s.emptyState}>Результаты пока недоступны</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <img className={s.img} src="/images/bg_desktop.png" alt="bg" />
    </div>
  );
}
