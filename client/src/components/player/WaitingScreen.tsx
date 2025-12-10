import s from './WaitingScreen.module.scss';

interface WaitingScreenProps {
  playerName: string;
}

export function WaitingScreen({ playerName }: WaitingScreenProps) {
  return (
    <div className={s.root}>
      <div className={s.wrapper}>
        <img className={s.logo} src="/images/logo.svg" alt="logo" />
        <div className={s.content}>
          <div className={s.title}>
            {playerName}, ожидайте <br /> начала игры
          </div>
        </div>
      </div>
      <img className={s.img} src="/images/bg_mobile.png" alt="bg" />
    </div>
  );
}
