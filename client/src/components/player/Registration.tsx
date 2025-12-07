import { useState } from 'react';

interface RegistrationProps {
  onRegister: (name: string) => void;
  isSubmitting?: boolean;
}

export function Registration({ onRegister, isSubmitting }: RegistrationProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onRegister(name.trim());
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Регистрация</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ваше имя"
          className="border p-2 rounded text-lg"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={!name.trim() || isSubmitting}
          className="bg-yandex-green text-white p-2 rounded text-lg font-bold disabled:opacity-50"
        >
          {isSubmitting ? 'Проверка...' : 'Войти'}
        </button>
      </form>
    </div>
  );
}
