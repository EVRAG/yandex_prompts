import React, { useState } from "react";
import s from "./9page.module.scss";
import Timer from "components/common/Timer";

const NinePage = ({
  name = "Имя",
  points = 0,
  timerSeconds = 30,
  questionNumber = 1,
  dialogueText = `<strong>Леонардо.</strong> Слушай, Альберт, эта фейхоа — чёрт знает что. Я б её в «Тайную вечерю» не пустил.<br/><strong>Эйнштейн.</strong> А по-моему, она относительно вкусна. Всё зависит от системы отсчёта, Леонардо.<br/><strong>Леонардо.</strong> Система отсчёта? Да она на вкус как... как...<br/><strong>Эйнштейн.</strong> Как теория, не прошедшая проверку экспериментом?<br/><strong>Леонардо.</strong> Точно! Брось её в реку, Альберт.<br/><strong>Эйнштейн.</strong> (смеётся) Ладно, но сначала — нарисуй.`,
}) => {
  const [answer, setAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);

  const handleTextareaChange = (e) => {
    setAnswer(e.target.value);
  };

  const handleButtonClick = () => {
    // Функция для отправки данных на сервер
    setShowResult(true);
  };

  const isButtonActive = answer.trim().length > 0;

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
          <div
            className={s.dialogueText}
            dangerouslySetInnerHTML={{ __html: dialogueText }}
          />
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
        Отправить
      </button>
      <img className={s.img} src="/images/bg_mobile2.png" alt="bg" />
    </div>
  );
};

export default NinePage;
