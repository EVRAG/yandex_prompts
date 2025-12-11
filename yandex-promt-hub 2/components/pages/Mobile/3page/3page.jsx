import React, { useState } from "react";
import s from "./3page.module.scss";
import Timer from "components/common/Timer";

const ThreePage = ({ name = "Имя", points = 0, timerSeconds = 30 }) => {
  const [answer, setAnswer] = useState("");

  const handleTextareaChange = (e) => {
    setAnswer(e.target.value);
  };

  const handleButtonClick = () => {
    // Функция для отправки данных на сервер
  };

  const isButtonActive = answer.trim().length > 0;

  return (
    <div className={s.root}>
      <div className={s.wrapper}>
        <div className={s.header}>
          <div className={s.left}>
            {name}
            <div className={s.points}>
              {points}
              <img src="/images/points.svg" alt="" />
            </div>
          </div>
          <div className={s.right}>
            <Timer seconds={timerSeconds} />
          </div>
        </div>
        <div className={s.content}>
          <img src="/images/placeholder.png" alt="" />
          <textarea
            placeholder="Ваш ответ..."
            className={s.textarea}
            value={answer}
            onChange={handleTextareaChange}
          />
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

export default ThreePage;
