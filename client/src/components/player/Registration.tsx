import { useState } from 'react';
import s from './Registration.module.scss';

interface RegistrationProps {
  onRegister: (name: string) => void;
  isSubmitting?: boolean;
  error?: string | null;
  onErrorDismiss?: () => void;
}

export function Registration({ onRegister, isSubmitting, error, onErrorDismiss }: RegistrationProps) {
  const [name, setName] = useState('');
  const [hasError, setHasError] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    // Убираем ошибку при изменении инпута
    if (hasError) {
      setHasError(false);
    }
  };

  const handleButtonClick = () => {
    // Проверяем длину имени при нажатии на кнопку
    if (name.trim().length < 3) {
      setHasError(true);
    } else {
      onRegister(name.trim());
    }
  };

  const handleCloseWarning = () => {
    setHasError(false);
    if (error && onErrorDismiss) {
      onErrorDismiss();
    }
  };

  const isButtonActive = name.trim().length >= 3 && !isSubmitting;
  const showWarning = hasError || error;

  return (
    <div className={s.root}>
      <div className={s.wrapper}>
        <img className={s.logo} src="/images/logo.svg" alt="logo" />
        <div className={s.content}>
          <div className={s.title}>Добро пожаловать</div>
          <input
            className={`${s.input} ${hasError ? s.input_error : ''}`}
            type="text"
            placeholder="Ваше имя"
            value={name}
            onChange={handleInputChange}
            disabled={isSubmitting}
          />
          <button
            className={`${s.button} ${isButtonActive ? s.active : ''}`}
            onClick={handleButtonClick}
            disabled={!isButtonActive}
          >
            {isSubmitting ? 'Проверка...' : 'Начать'}
          </button>
          <div className={`${s.warning} ${showWarning ? s.warning_visible : ''}`}>
            <div className={s.warning_content}>
              <img
                className={s.warning_close}
                src="/images/close.svg"
                alt=""
                onClick={handleCloseWarning}
              />
              <p>
                {error ? (
                  <>
                    Упс, кажется, вы не прошли модерацию. <br />
                    Попробуйте еще раз!
                  </>
                ) : (
                  'Имя должно содержать минимум 3 символа'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
      <img className={s.img} src="/images/bg_mobile.png" alt="bg" />
    </div>
  );
}
