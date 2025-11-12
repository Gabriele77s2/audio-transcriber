
import React from 'react';

export const Spinner: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div>
      <p className="text-lg text-gray-300 font-medium">{message}</p>
    </div>
  );
};
