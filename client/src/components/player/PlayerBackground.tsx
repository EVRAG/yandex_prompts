import React from 'react';

export const PlayerBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-white">
      <img
        src="/bg.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-bottom"
      />
    </div>
  );
};

