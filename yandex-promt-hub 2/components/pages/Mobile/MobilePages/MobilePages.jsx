import React, { useState } from "react";
import OnePage from "../1page";
import TwoPage from "../2page";
import ThreePage from "../3page";
import FourPage from "../4page";
import FivePage from "../5page";
import SixPage from "../6page";
import SevenPage from "../7page";
import EightPage from "../8page";
import NinePage from "../9page";

const defaultLeaderboard = [
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
];

const MobilePages = ({}) => {
  // Менять страницу зависимости от цифры в стейте
  // Например: socket.on('pageChange', (pageNumber) => setInternalCurrentPage(pageNumber))
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);

  // Общие стейты для всех страниц

  // Например: socket.on('userName', (userName) => setName(userName))
  // Подключить сокет для обновления имени пользователя
  const [name, setName] = useState("");

  // Например: socket.on('userPoints', (userPoints) => setPoints(userPoints))
  // Подключить сокет для обновления очков пользователя
  const [points, setPoints] = useState(0);

  // Например: socket.on('timerUpdate', (seconds) => setTimerSeconds(seconds))
  // Подключить сокет для обновления времени таймера
  const [timerSeconds, setTimerSeconds] = useState(30);

  // Например: socket.on('leaderboardUpdate', (newLeaderboard) => setLeaderboard(newLeaderboard))
  // Подключить сокет для обновления рейтинга
  const [leaderboard, setLeaderboard] = useState(defaultLeaderboard);

  const renderPage = () => {
    switch (internalCurrentPage) {
      case 1:
        return <OnePage name={name} setName={setName} />;
      case 2:
        return <TwoPage name={name} />;
      case 3:
        return (
          <ThreePage name={name} points={points} timerSeconds={timerSeconds} />
        );
      case 4:
        return (
          <FourPage name={name} points={points} timerSeconds={timerSeconds} />
        );
      case 5:
        return <FivePage currentUserName={name} leaderboard={leaderboard} />;
      case 6:
        return (
          <SixPage
            name={name}
            points={points}
            points_add={1}
          />
        );
      case 7:
        return <SevenPage name={name} points={points} />;
      case 8:
        return (
          <EightPage
            name={name}
            points={points}
            points_add={1}
          />
        );
      case 9:
        return (
          <NinePage
            name={name}
            points={points}
            timerSeconds={timerSeconds}
            questionNumber={1}
          />
        );
      default:
        return <OnePage name={name} setName={setName} />;
    }
  };

  return <>{renderPage()}</>;
};

export default MobilePages;
