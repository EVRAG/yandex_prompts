import React, { useState } from "react";
import s from "./2page.module.scss";

const TwoPage = ({ name = "Имя" }) => {
  return (
    <div className={s.root}>
      <div className={s.wrapper}>
        <img className={s.logo} src="/images/logo.svg" alt="logo" />
        <div className={s.content}>
          <div className={s.title}>
            {name}, ожидайте <br /> начала игры
          </div>
        </div>
      </div>
      <img className={s.img} src="/images/bg_mobile.png" alt="bg" />
    </div>
  );
};

export default TwoPage;
