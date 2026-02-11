import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  // Base styles: Shape, typography, and motion
  const baseStyles = "relative px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
  
  const variants = {
    // Liquid Gradient with shadow glow
    primary: "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 border border-transparent",
    // Glass style
    secondary: "bg-white/60 dark:bg-white/5 backdrop-blur-md text-gray-700 dark:text-gray-200 border border-white/20 hover:bg-white/80 dark:hover:bg-white/10 shadow-sm hover:shadow-md",
    // Danger gradient
    danger: "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:-translate-y-0.5",
    // Subtle ghost
    ghost: "bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;