import React, { useState, useEffect, useRef } from "react";
import s from "./Timer.module.scss";

const Timer = ({ seconds: initialSeconds, desktop = false }) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const animationRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    // Сброс при изменении initialSeconds
    setSeconds(initialSeconds);
    setProgress(0);
    startTimeRef.current = Date.now();

    // Очистка предыдущих интервалов
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Плавная анимация прогресса и обратного отсчета, синхронизированная с временем
    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const newProgress = Math.min((elapsed / initialSeconds) * 100, 100);
      setProgress(newProgress);

      // Синхронизируем seconds с прошедшим временем для точности
      const currentSeconds = Math.max(0, Math.floor(initialSeconds - elapsed));
      setSeconds(currentSeconds);

      if (newProgress < 100) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setSeconds(0);
        setProgress(100);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initialSeconds]);

  const formatTime = (totalSeconds) => {
    if (totalSeconds >= 60) {
      const minutes = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
        2,
        "0"
      )}`;
    }
    return `00:${String(totalSeconds).padStart(2, "0")}`;
  };

  const timeText = formatTime(seconds);

  return (
    <div className={`${s.timer} ${desktop ? s.timer_desktop : ""}`}>
      <div className={s.timer_bg} style={{ width: `${progress}%` }} />
      <div className={s.timer_text_container}>
        <span className={s.timer_text}>{timeText}</span>
      </div>
    </div>
  );
};

export default Timer;
