import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';
export function Login() {
  const [email, setEmail] = useState('admin@chocoloop.com');
  const [password, setPassword] = useState('admin123');
  const { login } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      const result = await login(email, password);
      if (result && result.success) {
        toast.success('Successfully logged in');
        navigate('/dashboard');
      } else {
        toast.error(result?.error || 'Invalid email or password');
      }
    } else {
      toast.error('Please enter both email and password');
    }
  };
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-dark relative overflow-hidden items-center justify-center p-12">
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
            'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}>
        </div>

        <div className="relative z-10 text-center">
          <motion.div
            initial={{
              scale: 0.8,
              opacity: 0
            }}
            animate={{
              scale: 1,
              opacity: 1
            }}
            transition={{
              duration: 0.5
            }}
            className="w-24 h-24 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-accent/20 p-2">
            
            <img src="/LOGO.png" alt="ChocoLoop Logo" className="w-full h-full object-contain rounded-xl" />
          </motion.div>
          <motion.h1
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
              delay: 0.1
            }}
            className="text-5xl font-serif font-bold text-white mb-4">
            
            ChocoLoop
          </motion.h1>
          <motion.p
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
              delay: 0.2
            }}
            className="text-sidebar-text text-xl max-w-md mx-auto">
            
            Smart Chocolate Warehouse Management System
          </motion.p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-serif font-bold text-text-primary mb-2">
              Welcome back
            </h2>
            <p className="text-text-secondary">
              Please enter your details to sign in.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{
                x: -20,
                opacity: 0
              }}
              animate={{
                x: 0,
                opacity: 1
              }}
              transition={{
                duration: 0.4,
                delay: 0.3
              }}>
              
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail size={18} />}
                placeholder="admin@warehouse.local"
                required />
              
            </motion.div>

            <motion.div
              initial={{
                x: -20,
                opacity: 0
              }}
              animate={{
                x: 0,
                opacity: 1
              }}
              transition={{
                duration: 0.4,
                delay: 0.4
              }}>
              
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock size={18} />}
                placeholder="••••••••"
                required />
              
            </motion.div>

            <motion.div
              initial={{
                opacity: 0
              }}
              animate={{
                opacity: 1
              }}
              transition={{
                duration: 0.4,
                delay: 0.5
              }}
              className="flex items-center justify-between">
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-border text-primary focus:ring-primary" />
                
                <span className="text-sm text-text-secondary">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() =>
                  toast.info('Contact your warehouse admin to reset your password.')
                }
                className="text-sm text-primary hover:text-primary-dark font-medium">
                Forgot password?
              </button>
            </motion.div>

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
                duration: 0.4,
                delay: 0.6
              }}>
              
              <Button type="submit" className="w-full" size="lg">
                Sign in
              </Button>
            </motion.div>
          </form>
        </div>
      </div>
    </div>);

}