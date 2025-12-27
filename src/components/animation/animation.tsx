'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, HTMLAttributes } from 'react';

// Fade In Animation Component
export const FadeIn = ({ children, delay = 0, duration = 0.6, ...props }: { 
  children: ReactNode; 
  delay?: number; 
  duration?: number; 
} & HTMLAttributes<HTMLDivElement>) => (
  <motion.div
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true }}
    transition={{ delay, duration }}
    {...props}
  >
    {children}
  </motion.div>
);

// Stagger Container for Animations
export const StaggerContainer = ({ children, ...props }: { 
  children: ReactNode; 
} & HTMLAttributes<HTMLDivElement>) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    variants={{
      visible: { transition: { staggerChildren: 0.1 } },
      hidden: { transition: { staggerChildren: 0.1 } }
    }}
    {...props}
  >
    {children}
  </motion.div>
);

// Slide In Animation Component
export const SlideIn = ({ 
  children, 
  direction = 'up', 
  delay = 0, 
  duration = 0.6 
}: { 
  children: ReactNode; 
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number; 
  duration?: number; 
}) => {
  const directions = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: -20 },
    right: { x: 20 }
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration }}
    >
      {children}
    </motion.div>
  );
};

// Stagger Item Component
export const StaggerItem = ({ children, ...props }: { 
  children: ReactNode; 
} & HTMLAttributes<HTMLDivElement>) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }}
    {...props}
  >
    {children}
  </motion.div>
);

// Reveal Animation Component
export const Reveal = ({ children, ...props }: { 
  children: ReactNode; 
} & HTMLAttributes<HTMLDivElement>) => (
  <div className="relative overflow-hidden">
    <motion.div
      initial={{ y: "100%" }}
      whileInView={{ y: "0%" }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      {...props}
    >
      {children}
    </motion.div>
  </div>
);

// Scale In Animation Component
export const ScaleIn = ({ children, delay = 0, ...props }: { 
  children: ReactNode; 
  delay?: number; 
} & HTMLAttributes<HTMLDivElement>) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    whileInView={{ scale: 1, opacity: 1 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    {...props}
  >
    {children}
  </motion.div>
);

// Blur In Animation Component
export const BlurIn = ({ children, delay = 0, ...props }: { 
  children: ReactNode; 
  delay?: number; 
} & HTMLAttributes<HTMLDivElement>) => (
  <motion.div
    initial={{ 
      opacity: 0, 
      filter: "blur(4px)",
      transform: "scale(0.95)"
    }}
    whileInView={{ 
      opacity: 1, 
      filter: "blur(0px)",
      transform: "scale(1)"
    }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    {...props}
  >
    {children}
  </motion.div>
);

// Floating Animation Component
export const Float = ({ children, duration = 3, ...props }: { 
  children: ReactNode; 
  duration?: number; 
} & HTMLAttributes<HTMLDivElement>) => (
  <motion.div
    animate={{ 
      y: [0, -10, 0],
    }}
    transition={{ 
      duration,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    {...props}
  >
    {children}
  </motion.div>
);

// Pull Apart Animation Component
export const PullApart = ({ children, ...props }: { 
  children: ReactNode; 
} & HTMLAttributes<HTMLDivElement>) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8, x: 0 }}
    whileInView={{ opacity: 1, scale: 1, x: 0 }}
    viewport={{ once: true }}
    whileHover={{ x: [0, -5, 5, 0] }}
    transition={{ duration: 0.4 }}
    {...props}
  >
    {children}
  </motion.div>
);