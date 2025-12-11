import React from "react";
import s from "./7page.module.scss";

const SevenPage = ({ name = "Имя", points = 0 }) => {
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
        </div>
        <div className={s.content}>
          <div className={s.correctText}>
            Ваш ответ <br /> неверный
          </div>
        </div>
        <div className={s.nextQuestionText}>
          Скоро появится <br /> следующий вопрос
        </div>
      </div>
      <img className={s.img} src="/images/bg_mobile.png" alt="bg" />
    </div>
  );
};

export default SevenPage;
