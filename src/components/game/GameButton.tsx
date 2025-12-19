import React from 'react';

interface GameButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const GameButton: React.FC<GameButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyle = "font-bold rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 shadow-[0_4px_0px_0px_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[4px]";

  const variants = {
    primary: `text-[#F4EBD9] hover:brightness-110`,
    secondary: `text-[#3D2C1E] bg-[#E6D5B8] border-2 border-[#634832] hover:bg-[#F4EBD9]`,
    outline: `bg-transparent border-2 border-[#C08261] text-[#3D2C1E] shadow-none active:translate-y-0 hover:bg-[#C08261]/10`,
  };

  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-xl",
  };

  const styleObj = variant === 'primary' ? { backgroundColor: '#C08261' } : {}; // Terra Cotta color

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      style={styleObj}
      {...props}
    >
      {children}
    </button>
  );
};