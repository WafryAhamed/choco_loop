import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Send,
  Bot,
  User,
  Sparkles,
  CheckCircle2,
  Volume2,
  VolumeX } from
'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from 'sonner';
import { useSpeechRecognition, speak } from '../lib/useSpeechRecognition';
<<<<<<< HEAD
import { useInventory, createTask } from '../lib/useApi';
=======
import { useInventory, useTasksActive, createTask } from '../lib/useApi';
>>>>>>> fix-camera
import { executeVoiceCommand } from '../lib/commandParser';
interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  type?: 'status';
  taskId?: string;
}
export function TaskAssign() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textFallback, setTextFallback] = useState('');
  const [voiceReplies, setVoiceReplies] = useState(false);
<<<<<<< HEAD
  const [manualForm, setManualForm] = useState({
    type: 'Pick',
    product: '',
    source: '',
    dest: '',
    priority: 'Normal'
  });
  const { inventoryData } = useInventory();
=======
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualForm, setManualForm] = useState({
    type: 'Retrieve',
    product: '',
    quantity: 1,
    dest: '',
    priority: 'Normal'
  });
  const [manualError, setManualError] = useState('');
  const { inventoryData } = useInventory();
  const { activeTasks } = useTasksActive();
>>>>>>> fix-camera
  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error
  } = useSpeechRecognition();
  // Process a finalized command (from voice or text fallback)
  const processCommand = async (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    setMessages((prev) => [...prev, { role: 'user', text: clean }]);

    const result = await executeVoiceCommand(clean);

    setMessages((prev) => [
      ...prev,
      {
        role: 'ai',
        text: result.reply,
        type: result.parsed.intent !== 'unknown' ? 'status' : undefined,
        taskId: result.taskId,
      },
    ]);

    if (result.toast.type === 'success') toast.success(result.toast.message);
    else if (result.toast.type === 'error') toast.error(result.toast.message);
    else toast.info(result.toast.message);

    if (voiceReplies) speak(result.reply);
  };
  // When voice produces a final transcript, process it
  useEffect(() => {
    if (transcript) {
      processCommand(transcript);
      resetTranscript();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);
  // Surface recognition errors
  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);
  const handleMicClick = () => {
    if (isListening) stopListening();else
    startListening();
  };
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
<<<<<<< HEAD
    try {
      await createTask({
        type: manualForm.type,
        description: `${manualForm.type} ${manualForm.product || 'items'}${manualForm.source ? ' from ' + manualForm.source : ''}${manualForm.dest ? ' → ' + manualForm.dest : ''}`,
        product: manualForm.product,
        quantity: 12,
        source: 'web',
      });
      toast.success('Task assigned to robot — check the queue!');
    } catch {
      toast.error('Failed to create task');
    }
    setManualForm({
      type: 'Pick',
      product: '',
      source: '',
      dest: '',
      priority: 'Normal'
    });
=======
    if (isSubmitting) return; // Prevent duplicate submission
    
    setManualError('');
    const quantity = Number(manualForm.quantity);
    if (!quantity || !Number.isInteger(quantity) || quantity < 1) {
      setManualError('Quantity is required and must be a whole number of 1 or more.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createTask({
        taskType: manualForm.type,
        type: manualForm.type,
        description: `${manualForm.type} ${manualForm.product || 'items'} x${quantity}`,
        product: manualForm.product,
        quantity,
      });
      toast.success(`Task assigned — ${quantity} unit(s) of ${manualForm.product || 'items'} queued for ${manualForm.type}`);
      setManualForm({
        type: 'Retrieve',
        product: '',
        quantity: 1,
        dest: '',
        priority: 'Normal'
      });
    } catch (error) {
      console.error('Task creation error:', error);
      toast.error('Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
>>>>>>> fix-camera
  };
  const exampleCommands = [
    'Start the conveyor',
    'Stop the camera',
    "What's in stock",
    'How many milk chocolate left',
<<<<<<< HEAD
=======
    'Pick 3 white chocolate',
>>>>>>> fix-camera
    'Queue pick 10 dark chocolate',
    'Show active tasks',
    'System status',
    'Pause robot',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-text-primary mb-1">
          Assign Task
        </h1>
        <p className="text-text-secondary">
          Manually assign tasks or use the on-device voice assistant.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Manual Assignment */}
        <Card>
          <h2 className="text-xl font-serif font-semibold text-text-primary mb-6">
            Manual Assignment
          </h2>
          <form onSubmit={handleManualSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Task Type
              </label>
              <select
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                value={manualForm.type}
                onChange={(e) =>
<<<<<<< HEAD
                setManualForm({
                  ...manualForm,
                  type: e.target.value
                })
                }>
                
                <option>Pick</option>
                <option>Sort</option>
                <option>Pack</option>
                <option>Move</option>
                <option>Retrieve</option>
=======
                  setManualForm({
                    ...manualForm,
                    type: e.target.value
                  })
                }>
                <option>Retrieve</option>
                <option>Store</option>
>>>>>>> fix-camera
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Product SKU or Name
              </label>
              <input
                list="products-list"
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Search by SKU or Name..."
                value={manualForm.product}
                onChange={(e) =>
                  setManualForm({
                    ...manualForm,
                    product: e.target.value
                  })
                }
              />
              <datalist id="products-list">
                {inventoryData?.map(item => (
                  <option key={item.id} value={item.sku}>{item.name}</option>
                ))}
              </datalist>
            </div>

<<<<<<< HEAD
            <Input
              label="Source Bin"
              placeholder="e.g. A-01"
              value={manualForm.source}
              onChange={(e) =>
                setManualForm({
                  ...manualForm,
                  source: e.target.value
                })
              }
            />

            <div className="pt-4 border-t border-border">
              <Button type="submit" className="w-full">
                Assign to Robot
=======
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Quantity
              </label>
              <input
                type="number"
                min={1}
                step={1}
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter quantity"
                value={manualForm.quantity}
                onChange={(e) =>
                  setManualForm({
                    ...manualForm,
                    quantity: Number(e.target.value)
                  })
                }
              />
              {manualError && (
                <p className="mt-2 text-sm text-status-danger">{manualError}</p>
              )}
            </div>

            <div className="pt-4 border-t border-border">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating task...' : 'Assign Task'}
>>>>>>> fix-camera
              </Button>
            </div>
          </form>
        </Card>

        {/* Right: Voice Assistant */}
        <Card className="flex flex-col h-[600px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-xl font-serif font-semibold text-text-primary">
                  Voice Assistant
                </h2>
<<<<<<< HEAD
                <p className="text-xs text-status-success flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                  On-device voice recognition · Ready
=======
                <p className="text-xs text-status-success flex flex-wrap items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                  On-device voice recognition · Ready
                  <span className="mx-1">•</span>
                  {activeTasks?.length ?? 0} active tasks
>>>>>>> fix-camera
                </p>
              </div>
            </div>
            <button
              onClick={() => setVoiceReplies((v) => !v)}
              aria-label={
              voiceReplies ? 'Disable voice replies' : 'Enable voice replies'
              }
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${voiceReplies ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-hover'}`}>
              
              {voiceReplies ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>

          {/* Conversation History */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
            {messages.length === 0 ?
            <div className="h-full flex flex-col items-center justify-center text-center text-text-secondary space-y-4 opacity-80">
                <Bot size={48} className="text-border" />
                <p>
                  I'm ready to help manage the warehouse.
                  <br />
                  {isSupported ?
                'Tap the mic and speak a command.' :
                'Type a command below.'}
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {exampleCommands.map((cmd, i) =>
                <button
                  key={i}
                  onClick={() => processCommand(cmd)}
                  className="text-xs bg-surface border border-border px-3 py-1.5 rounded-full hover:border-primary hover:text-primary transition-colors">
                  
                      "{cmd}"
                    </button>
                )}
                </div>
              </div> :

            <AnimatePresence initial={false}>
                {messages.map((msg, i) =>
              <motion.div
                key={i}
                initial={{
                  opacity: 0,
                  y: 10,
                  scale: 0.95
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1
                }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                
                    <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-surface border border-border text-text-secondary' : 'bg-primary text-white'}`}>
                  
                      {msg.role === 'user' ?
                  <User size={16} /> :

                  <Bot size={16} />
                  }
                    </div>
                    <div
                  className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-surface border border-border text-text-primary rounded-tr-none' : 'bg-primary text-white rounded-tl-none'}`}>
                  
                      <p className="text-sm whitespace-pre-line">{msg.text}</p>
                      {msg.type === 'status' && msg.taskId &&
                  <div className="mt-2 bg-black/20 rounded p-2 flex items-center gap-2 text-xs">
                          <CheckCircle2 size={14} className="text-accent" />
                          <span>Task #{msg.taskId} created</span>
                        </div>
                  }
                    </div>
                  </motion.div>
              )}
              </AnimatePresence>
            }
          </div>

          {/* Live interim transcript */}
          {isListening && interimTranscript &&
          <p className="text-sm text-text-secondary italic text-center mb-2 px-4 truncate">
              "{interimTranscript}"
            </p>
          }

          {/* Mic Control */}
          <div className="pt-4 border-t border-border flex flex-col items-center justify-center">
            <div className="relative h-20 flex items-center justify-center w-full">
              {isListening ?
              <button
                onClick={handleMicClick}
                aria-label="Stop listening"
                className="flex items-center gap-1 h-12">
                
                  {[1, 2, 3, 4, 5].map((bar) =>
                <motion.div
                  key={bar}
                  className="w-2 bg-primary rounded-full"
                  animate={{
                    height: ['20%', '100%', '20%']
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.8,
                    delay: bar * 0.1,
                    ease: 'easeInOut'
                  }} />

                )}
                </button> :

              <motion.button
                whileHover={{
                  scale: 1.05
                }}
                whileTap={{
                  scale: 0.95
                }}
                onClick={handleMicClick}
                disabled={!isSupported}
                aria-label="Start voice command"
                className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors relative group disabled:opacity-40 disabled:cursor-not-allowed">
                
                  <div className="absolute inset-0 rounded-full bg-primary opacity-0 group-hover:opacity-20 scale-150 transition-all duration-500" />
                  {isSupported ? <Mic size={28} /> : <MicOff size={28} />}
                </motion.button>
              }
            </div>
            <p className="text-sm text-text-secondary mt-1 font-medium h-5">
              {isListening ?
              'Listening… tap to stop' :
              isSupported ?
              'Tap to speak' :
              'Voice not supported — type below'}
            </p>

            {/* Text fallback (always available) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                processCommand(textFallback);
                setTextFallback('');
              }}
              className="flex items-center gap-2 w-full mt-3">
              
              <input
                value={textFallback}
                onChange={(e) => setTextFallback(e.target.value)}
                placeholder="Or type a command…"
                aria-label="Type a command"
                className="flex-1 bg-background border border-border rounded-full px-4 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary" />
              
              <button
                type="submit"
                aria-label="Send command"
                disabled={!textFallback.trim()}
                className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-primary-dark transition-colors">
                
                <Send size={16} />
              </button>
            </form>
          </div>
        </Card>
      </div>
    </div>);

}