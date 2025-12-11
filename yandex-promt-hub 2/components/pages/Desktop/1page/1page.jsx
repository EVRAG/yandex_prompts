import React, { useState } from "react";
import s from "./1page.module.scss";

const OnePage = () => {
  return (
    <div className={s.root}>
      <div className={s.wrapper}>
        <img className={s.logo} src="/images/logo.svg" alt="logo" />
        <div className={s.content}>
          <div className={s.qrWrapper}>
            <img className={s.qr} src="/images/qr.png" alt="qr" />
          </div>
          <p className={s.title}>
            Отсканируйте qr-код, <br />
            чтобы участвовать
          </p>
        </div>
      </div>
      <img className={s.img} src="/images/bg_desktop.png" alt="bg" />
    </div>
  );
};

export default OnePage;
