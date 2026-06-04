import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Mic, Sparkles } from 'lucide-react';
import {
  getAssistantReply,
  suggestedQuestions } from
'../../lib/assistantEngine';
import { useSpeechRecognition } from '../../lib/useSpeechRecognition';
interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}
export function Chatbot() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
  {
    role: 'assistant',
    text: "Hi! I'm the Cacao Assistant. Ask me about stock, today's summary, tasks, or system health."
  }]
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  } = useSpeechRecognition();
  // Push final voice transcript into the input
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages, isTyping]);
  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [
    ...prev,
    {
      role: 'user',
      text: trimmed
    }]
    );
    setInput('');
    setIsTyping(true);
    setTimeout(
      async () => {
        const reply = await getAssistantReply(trimmed);
        setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: reply.text
        }]
        );
        setIsTyping(false);
      },
      700 + Math.random() * 500
    );
  };
  // Hidden on the login screen
  if (location.pathname === '/login') return null;
  return (
    <>
      {/* Launcher */}
      <AnimatePresence>
        {!isOpen &&
        <motion.button
          key="launcher"
          initial={{
            scale: 0,
            opacity: 0
          }}
          animate={{
            scale: 1,
            opacity: 1
          }}
          exit={{
            scale: 0,
            opacity: 0
          }}
          whileHover={{
            scale: 1.05
          }}
          whileTap={{
            scale: 0.95
          }}
          onClick={() => setIsOpen(true)}
          aria-label="Open Cacao Assistant"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30">
          
            <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
            <Bot size={26} />
          </motion.button>
        }
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen &&
        <motion.div
          key="panel"
          initial={{
            opacity: 0,
            scale: 0.85,
            y: 40,
            originX: 1,
            originY: 1
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            scale: 0.85,
            y: 40
          }}
          transition={{
            type: 'spring',
            stiffness: 320,
            damping: 28
          }}
          className="fixed bottom-6 right-6 z-50 w-[90vw] max-w-[380px] max-h-[70vh] bg-card border border-border rounded-2xl shadow-premium dark:shadow-premium-dark flex flex-col overflow-hidden"
          role="dialog"
          aria-label="Cacao Assistant chat">
          
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-serif font-semibold text-text-primary leading-tight">
                    Cacao Assistant
                  </h2>
                  <p className="text-[11px] text-status-success flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                    On-device · Ready
                  </p>
                </div>
              </div>
              <button
              onClick={() => setIsOpen(false)}
              aria-label="Close assistant"
              className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:bg-hover transition-colors">
              
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4">
            
              {messages.map((msg, i) =>
            <div
              key={i}
              className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              
                  <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-surface border border-border text-text-secondary' : 'bg-primary text-white'}`}>
                
                    {msg.role === 'user' ? null : <Bot size={14} />}
                  </div>
                  <div
                className={`max-w-[80%] p-3 rounded-2xl text-sm whitespace-pre-line ${msg.role === 'user' ? 'bg-surface border border-border text-text-primary rounded-tr-none' : 'bg-primary text-white rounded-tl-none'}`}>
                
                    {msg.text}
                  </div>
                </div>
            )}

              {isTyping &&
            <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
                    <Bot size={14} />
                  </div>
                  <div className="bg-primary/90 rounded-2xl rounded-tl-none p-3 flex items-center gap-1">
                    {[0, 1, 2].map((d) =>
                <motion.span
                  key={d}
                  className="w-1.5 h-1.5 rounded-full bg-white"
                  animate={{
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1,
                    delay: d * 0.2
                  }} />

                )}
                  </div>
                </div>
            }

              {/* Suggested questions only before any user message */}
              {messages.length === 1 && !isTyping &&
            <div className="flex flex-wrap gap-2 pt-2">
                  {suggestedQuestions.map((q) =>
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-xs bg-surface border border-border px-3 py-1.5 rounded-full text-text-secondary hover:border-primary hover:text-primary transition-colors">
                
                      {q}
                    </button>
              )}
                </div>
            }
            </div>

            {/* Input */}
            <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="p-3 border-t border-border bg-surface flex items-center gap-2">
            
              {isSupported &&
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              aria-label={
              isListening ? 'Stop listening' : 'Start voice input'
              }
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isListening ? 'bg-status-danger/10 text-status-danger' : 'text-text-secondary hover:bg-hover'}`}>
              
                  <Mic size={18} />
                </button>
            }
              <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? 'Listening…' : 'Ask me anything…'}
              aria-label="Message"
              className="flex-1 bg-background border border-border rounded-full px-4 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary" />
            
              <button
              type="submit"
              aria-label="Send message"
              disabled={!input.trim()}
              className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-primary-dark transition-colors">
              
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        }
      </AnimatePresence>
    </>);

}