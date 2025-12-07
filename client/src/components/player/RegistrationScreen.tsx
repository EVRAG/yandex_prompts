import React from 'react';
import PlayerBackground from './PlayerBackground';

interface RegistrationScreenProps {
  name: string;
  setName: (name: string) => void;
  handleRegister: (evt: React.FormEvent) => void;
  registering: boolean;
  isModerating: boolean;
  moderationError: string | null;
}

export default function RegistrationScreen({
  name,
  setName,
  handleRegister,
  registering,
  isModerating,
  moderationError
}: RegistrationScreenProps) {
  return (
    <PlayerBackground>
      <div className="w-full flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-[21px] font-medium text-white text-center tracking-[0.21px] mb-8 font-[family-name:var(--font-sans)]">
          Добро пожаловать
        </h1>

        <form onSubmit={handleRegister} className="w-full flex flex-col gap-4 items-center">
          <div className="w-full max-w-[308px] bg-white rounded-[12px] p-4 flex flex-col justify-center min-h-[64px]">
              <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ваше имя"
              className="w-full text-[17px] text-[#3e2989] placeholder:text-[#3e2989]/40 outline-none bg-transparent font-[family-name:var(--font-sans)]"
              disabled={registering || isModerating}
            />
          </div>
            
            {moderationError && (
              <p className="text-rose-400 text-sm text-center">{moderationError}</p>
            )}

          <button 
            type="submit"
            disabled={registering || isModerating}
            className="w-full max-w-[308px] h-[64px] bg-[#7a55ff] rounded-[100px] flex items-center justify-center text-white text-[21px] font-medium tracking-[0.21px] disabled:opacity-50 hover:opacity-90 transition-opacity font-[family-name:var(--font-sans)]"
          >
            {registering || isModerating ? '...' : 'Начать'}
          </button>
        </form>
      </div>
    </PlayerBackground>
  );
}

