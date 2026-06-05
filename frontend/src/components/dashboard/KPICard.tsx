import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import type { LucideIcon } from 'lucide-react';
interface KPICardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
  data: {
    value: number;
  }[];
  delay?: number;
}
export function KPICard({
  title,
  value,
  prefix = '',
  suffix = '',
  icon: Icon,
  data,
  delay = 0
}: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1500;
    const incrementTime = 30;
    const steps = duration / incrementTime;
    const increment = end / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, incrementTime);
    return () => clearInterval(timer);
  }, [value]);
  return (
    <motion.div
      initial={{
        y: 20,
        opacity: 0
      }}
      animate={{
        y: 0,
        opacity: 1
      }}
      transition={{
        duration: 0.5,
        delay
      }}
      whileHover={{
        y: -4,
        transition: {
          duration: 0.2
        }
      }}>
      
      <Card className="flex flex-col h-full relative overflow-hidden group">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Icon size={24} />
          </div>
          <div className="w-24 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true} />
                
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-text-secondary mb-1">
            {title}
          </p>
          <h3 className="text-3xl font-serif font-bold text-text-primary">
            {prefix}
            {displayValue.toLocaleString()}
            {suffix}
          </h3>
        </div>

        {/* Subtle decorative accent line on hover */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
      </Card>
    </motion.div>);

}