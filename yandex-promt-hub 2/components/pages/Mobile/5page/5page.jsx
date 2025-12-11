import React from "react";
import s from "./5page.module.scss";

const FivePage = ({
  currentUserName = "Максим",
  leaderboard = [
    { name: "Дмитрий С.", score: 150, isCurrentUser: false },
    { name: "Игорь Т.", score: 132, isCurrentUser: false },
    { name: "Сергей В.", score: 122, isCurrentUser: false },
    { name: "Максим", score: 132, isCurrentUser: true },
    { name: "Андрей Л.", score: 99, isCurrentUser: false },
    { name: "Андрей Л.", score: 99, isCurrentUser: false },
    { name: "Андрей Л.", score: 99, isCurrentUser: false },
    { name: "Андрей Л.", score: 99, isCurrentUser: false },
    { name: "Андрей Л.", score: 99, isCurrentUser: false },
    { name: "Андрей Л.", score: 99, isCurrentUser: false },
  ],
}) => {
  const getMedalIcon = (position) => {
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
            <div className={s.thankYou_line1}>{currentUserName}, спасибо</div>
            <div className={s.thankYou_line2}>за участие</div>
          </div>
          <div className={s.resultsText}>
            <div>Результаты смотри</div>
            <div>в турнирной таблице</div>
          </div>
          <div className={s.leaderboard}>
            {leaderboard.map((user, index) => {
              const position = index + 1;
              const isTopFour = position <= 4;
              const isCurrentUser = user.isCurrentUser;

              return (
                <div
                  key={index}
                  className={`${s.leaderboardItem} ${
                    isCurrentUser ? s.leaderboardItem_current : ""
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
                      {user.score}{" "}
                      <img
                        src={
                          isCurrentUser
                            ? "/images/points.svg"
                            : "/images/points_black.svg"
                        }
                        alt=""
                      />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <img className={s.img} src="/images/bg_mobile.png" alt="bg" />
    </div>
  );
};

export default FivePage;
