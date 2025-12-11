import React, { useState, useEffect } from "react";
import s from "./1page.module.scss";

const OnePage = ({ name: externalName, setName: externalSetName }) => {
  const [internalName, setInternalName] = useState(externalName || "");
  const [hasError, setHasError] = useState(false);

  // Синхронизируем внутренний state с внешним пропом
  useEffect(() => {
    if (externalName !== undefined) {
      setInternalName(externalName);
    }
  }, [externalName]);

  // Используем внешний name и setName если передан, иначе внутренний
  const name = externalName !== undefined ? externalName : internalName;
  const setName = externalSetName || setInternalName;

  const handleInputChange = (e) => {
    const value = e.target.value;
    setName(value);
    // Убираем ошибку при изменении инпута
    if (hasError) {
      setHasError(false);
    }
  };

  const handleButtonClick = () => {
    // Проверяем длину имени при нажатии на кнопку
    if (name.length < 3) {
      setHasError(true);
    } else {
      // Функция для отправки данных на сервер
    }
  };

  const handleCloseWarning = () => {
    setHasError(false);
  };

  const isButtonActive = name.length > 0;

  return (
    <div className={s.root}>
      <div className={s.wrapper}>
        <img className={s.logo} src="/images/logo.svg" alt="logo" />
        <div className={s.content}>
          <div className={s.title}>Добро пожаловать</div>
          <input
            className={`${s.input} ${hasError ? s.input_error : ""}`}
            type="text"
            placeholder="Ваше имя"
            value={name}
            onChange={handleInputChange}
          />
          <button
            className={`${s.button} ${isButtonActive ? s.active : ""}`}
            onClick={handleButtonClick}
          >
            Начать
          </button>
          <div className={`${s.warning} ${hasError ? s.warning_visible : ""}`}>
            <div className={s.warning_content}>
              <img
                className={s.warning_close}
                src="/images/close.svg"
                alt=""
                onClick={handleCloseWarning}
              />
              <p>
                Упс, кажется, вы не прошли модерацию. <br />
                Попробуйте еще раз!
              </p>
            </div>
          </div>
        </div>
      </div>
      <img className={s.img} src="/images/bg_mobile.png" alt="bg" />
    </div>
  );
};

export default OnePage;
