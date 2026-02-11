import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">{label}</label>}
      <input
        className={`w-full px-4 py-3 bg-white/50 dark:bg-black/20 backdrop-blur-sm border rounded-xl shadow-sm 
        text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
        focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white/80 dark:focus:bg-black/40
        transition-all duration-300
        ${error ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-200/60 dark:border-white/10'} 
        ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 ml-1 text-xs font-medium text-red-500 animate-pulse">{error}</p>}
    </div>
  );
};

export default Input;