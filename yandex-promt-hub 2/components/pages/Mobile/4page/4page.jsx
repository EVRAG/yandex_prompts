import React, { useState } from "react";
import s from "./4page.module.scss";
import Timer from "components/common/Timer";

const FourPage = ({
  name = "Имя",
  points = 0,
  timerSeconds = 30,
  questionNumber = 1,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);

  // Массив вариантов ответа
  const answers = [
    { text: "Вариант номер один", isCorrect: false },
    { text: "Вариант номер два", isCorrect: true },
    { text: "Вариант номер три", isCorrect: false },
    { text: "Вариант номер четыре", isCorrect: false },
  ];

  // Буквы для вариантов (А, Б, В, Г, Д, Е, ...)
  const getLetter = (index) => {
    return String.fromCharCode(1040 + index); // 1040 - это код буквы А в кириллице
  };

  const handleAnswerClick = (index) => {
    setSelectedAnswer(index);
  };

  const handleButtonClick = () => {
    if (selectedAnswer !== null) {
      const isCorrect = answers[selectedAnswer].isCorrect;
      console.log("Выбран ответ:", answers[selectedAnswer].text);
      console.log("Правильный:", isCorrect);
      setShowResult(true);
      // Функция для отправки данных на сервер
    }
  };

  const isButtonActive = selectedAnswer !== null;

  return (
    <div className={s.root}>
      <div className={s.header}>
        <div className={s.left}>
          {name}
          <div className={s.points}>
            {points}
            <img src="/images/points.svg" alt="" />
          </div>
        </div>
        <div className={s.right}>
          {questionNumber}/10
          <Timer seconds={timerSeconds} />
        </div>
      </div>
      {showResult && (
        <div className={s.overlay}>
          <div className={s.overlay_inner}>
            Ответ принят, <br /> ожидайте результат
          </div>
        </div>
      )}
      <div className={s.wrapper}>
        <div className={s.content}>
          <img src="/images/placeholder.png" alt="" />
          <div className={s.answers}>
            {answers.map((answer, index) => (
              <button
                key={index}
                className={`${s.answerCard} ${
                  selectedAnswer === index ? s.answerCard_selected : ""
                } ${
                  showResult && answer.isCorrect ? s.answerCard_correct : ""
                }`}
                onClick={() => handleAnswerClick(index)}
                disabled={showResult}
              >
                <span className={s.answerLetter}>{getLetter(index)}</span>
                <span className={s.answerText}>{answer.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <button
        className={`${s.button} ${isButtonActive ? s.active : ""}`}
        onClick={handleButtonClick}
      >
        Далее
      </button>
      <img className={s.img} src="/images/bg_mobile2.png" alt="bg" />
    </div>
  );
};

export default FourPage;
