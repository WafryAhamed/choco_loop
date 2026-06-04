import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}
export function Card({
  children,
  className = '',
  noPadding = false,
  ...props
}: CardProps) {
  return (
    <motion.div
      className={`bg-card rounded-xl border border-border shadow-premium dark:shadow-premium-dark overflow-hidden ${noPadding ? '' : 'p-6'} ${className}`}
      {...props}>
      
      {children}
    </motion.div>);

}