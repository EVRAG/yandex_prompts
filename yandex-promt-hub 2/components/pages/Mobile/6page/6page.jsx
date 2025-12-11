import React from "react";
import s from "./6page.module.scss";

const SixPage = ({ name = "Имя", points = 0, points_add = 1 }) => {
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
          <div className={s.plusOne}>+{points_add}</div>
          <div className={s.correctText}>
            Ваш ответ <br /> правильный
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

export default SixPage;
