import { useState, useEffect, useRef } from 'react';
import s from './Timer.module.scss';

interface TimerProps {
  seconds: number;
  startTime?: number; // timestamp когда таймер начался
  desktop?: boolean; // desktop mode for larger timer
}

export function Timer({ seconds: initialSeconds, startTime: externalStartTime, desktop = false }: TimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [progress, setProgress] = useState(100);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef(externalStartTime || Date.now());

  useEffect(() => {
    if (externalStartTime) {
      startTimeRef.current = externalStartTime;
      const elapsed = (Date.now() - externalStartTime) / 1000;
      const elapsedPercent = Math.min((elapsed / initialSeconds) * 100, 100);
      const currentProgress = 100 - elapsedPercent;
      const currentSeconds = Math.max(0, Math.ceil(initialSeconds - elapsed));
      setProgress(Math.max(0, currentProgress));
      setSeconds(currentSeconds);
    } else {
      setSeconds(initialSeconds);
      setProgress(100);
      startTimeRef.current = Date.now();
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const animate = () => {
      const now = Date.now();
      const elapsed = (now - startTimeRef.current) / 1000;
      const elapsedPercent = Math.min((elapsed / initialSeconds) * 100, 100);
      const newProgress = 100 - elapsedPercent;
      
      setProgress(Math.max(0, newProgress));

      const currentSeconds = Math.max(0, Math.ceil(initialSeconds - elapsed));
      setSeconds(currentSeconds);

      if (newProgress > 0 && currentSeconds > 0) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setSeconds(0);
        setProgress(0);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initialSeconds, externalStartTime]);

  const formatTime = (totalSeconds: number) => {
    if (totalSeconds >= 60) {
      const minutes = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `00:${String(totalSeconds).padStart(2, '0')}`;
  };

  const timeText = formatTime(seconds);

  return (
    <div className={`${s.timer} ${desktop ? s.timer_desktop : ''}`}>
      <div className={s.timer_bg} style={{ width: `${progress}%` }} />
      <div className={s.timer_text_container}>
        <span className={s.timer_text}>{timeText}</span>
      </div>
    </div>
  );
}
