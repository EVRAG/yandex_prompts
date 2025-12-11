import React from "react";
import s from "./8page.module.scss";

const EightPage = ({
  name = "Имя",
  points = 0,
  points_add = 1,
  text = "Промпт содержит общую идею о коте в бассейне, но не упоминает о нырянии или обложке альбома Nevermind, что значительно снижает сходство.",
}) => {
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
          <div className={s.plusOne}>
            {points_add > 0 ? `+${points_add}` : points_add}
          </div>
          <div className={s.correctText}>{text}</div>
        </div>
        <div className={s.nextQuestionText}>
          Скоро появится <br /> следующий вопрос
        </div>
      </div>
      <img className={s.img} src="/images/bg_mobile.png" alt="bg" />
    </div>
  );
};

export default EightPage;
