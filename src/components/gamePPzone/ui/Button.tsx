import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth,
  className = '',
  ...props 
}) => {
  const baseStyle = "px-6 py-3 rounded-2xl font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer select-none";
  
  const variants = {
    // Primary is now Teal (Brand Color)
    primary: "bg-teal-700 text-white hover:bg-teal-800 shadow-lg shadow-teal-700/20",
    // Secondary is now Orange (Accent Color)
    secondary: "bg-orange text-white hover:bg-orange-hover shadow-lg shadow-orange/20",
    // Outline matches Teal theme
    outline: "border-2 border-teal-700 text-teal-700 hover:bg-teal-50",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${baseStyle} ${variants[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};