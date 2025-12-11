import React, { useState } from "react";
import OnePage from "../1page";
import TwoPage from "../2page";
import ThreePage from "../3page";

const defaultLeaderboard = [
  { name: "Дмитрий С.", score: 150, isCurrentUser: false },
  { name: "Игорь Т.", score: 132, isCurrentUser: false },
  { name: "Сергей В.", score: 122, isCurrentUser: false },
  { name: "Андрей Л.", score: 132, isCurrentUser: false },
  { name: "Андрей Л.", score: 99, isCurrentUser: false },
  { name: "Андрей Л.", score: 99, isCurrentUser: false },
  { name: "Андрей Л.", score: 99, isCurrentUser: false },
  { name: "Андрей Л.", score: 99, isCurrentUser: false },
  { name: "Андрей Л.", score: 99, isCurrentUser: false },
  { name: "Андрей Л.", score: 99, isCurrentUser: false },
];

const defaultAnswers = [
  { text: "Вариант номер один", isCorrect: false },
  { text: "Вариант номер два", isCorrect: true },
  { text: "Вариант номер три", isCorrect: false },
  { text: "Вариант номер четыре", isCorrect: false },
];

const DesktopPages = ({}) => {
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

  // Например: socket.on('showAnswer', () => setShowRightAnswer(true))
  // Подключить сокет для показа правильного ответа
  // Установить в true когда нужно показать правильный ответ на странице викторины
  const [showRightAnswer, setShowRightAnswer] = useState(false);

  // Например: socket.on('answersUpdate', (newAnswers) => setAnswers(newAnswers))
  // Подключить сокет для обновления вариантов ответа
  const [answers, setAnswers] = useState(defaultAnswers);

  // Например: socket.on('leaderboardUpdate', (newLeaderboard) => setLeaderboard(newLeaderboard))
  // Подключить сокет для обновления рейтинга
  const [leaderboard, setLeaderboard] = useState(defaultLeaderboard);

  const renderPage = () => {
    switch (internalCurrentPage) {
      case 1:
        return <OnePage />;
      case 2:
        return (
          <TwoPage
            showRightAnswer={showRightAnswer}
            answers={answers}
            seconds={timerSeconds}
          />
        );
      case 3:
        return <ThreePage leaderboard={leaderboard} />;
      default:
        return <OnePage />;
    }
  };

  return <>{renderPage()}</>;
};

export default DesktopPages;
