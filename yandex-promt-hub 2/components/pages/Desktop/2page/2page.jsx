import React, { useState } from "react";
import s from "./2page.module.scss";
import Timer from "components/common/Timer";

const defaultAnswers = [
  { text: "Вариант номер один", isCorrect: false },
  { text: "Вариант номер два", isCorrect: true },
  { text: "Вариант номер три", isCorrect: false },
  { text: "Вариант номер четыре", isCorrect: false },
];

const TwoPage = ({
  showRightAnswer = false,
  answers = defaultAnswers,
  seconds = 30,
}) => {
  // Находим индекс правильного ответа
  const correctAnswerIndex = answers.findIndex((answer) => answer.isCorrect);

  // Буквы для вариантов (А, Б, В, Г, Д, Е, ...)
  const getLetter = (index) => {
    return String.fromCharCode(1040 + index); // 1040 - это код буквы А в кириллице
  };

  return (
    <div className={s.root}>
      <div className={s.wrapper}>
        <div className={s.content}>
          <div className={s.leftSection}>
            <div className={s.timerWrapper}>
              <Timer seconds={seconds} desktop={true} />
            </div>
            <img className={s.image} src="/images/placeholder.png" alt="" />
          </div>
          <div className={s.rightSection}>
            <img className={s.img} src="/images/bg_desktop.png" alt="bg" />
            <h2 className={s.title}>
              {showRightAnswer ? "Правильный ответ" : "Какой правильный ответ?"}
            </h2>
            <div className={s.answers}>
              {answers.map((answer, index) => {
                const isCorrectAnswer =
                  showRightAnswer && index === correctAnswerIndex;
                const isInactive =
                  showRightAnswer && index !== correctAnswerIndex;

                return (
                  <button
                    key={index}
                    className={`${s.answerCard} ${
                      isCorrectAnswer ? s.answerCard_selected : ""
                    } ${isInactive ? s.answerCard_inactive : ""}`}
                    disabled={true}
                  >
                    <span className={s.answerLetter}>{getLetter(index)}</span>
                    <span className={s.answerText}>{answer.text}</span>
                  </button>
                );
              })}
            </div>
            <div className={s.qrSection}>
              <div className={s.qrBox}>
                <p className={s.qrText}>
                  Отсканируйте qr-код, <br />
                  чтобы участвовать
                </p>
                <img className={s.qrCode} src="/images/qr.png" alt="QR code" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoPage;
