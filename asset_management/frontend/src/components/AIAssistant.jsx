import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, X, Minimize2 } from 'lucide-react';
import { cn } from '../lib/utils';

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: "Hello! I'm your Intelligent SQL Agent. Ask me anything about your assets in English or Tamil!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimize] = useState(false);
  const chatEndRef = useRef(null);
  const containerRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, loading, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && containerRef.current && !containerRef.current.contains(event.target)) {
         if (!event.target.closest('.ai-trigger-btn')) {
            setIsOpen(false);
         }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleExecuteSQL = async (sql) => {
    try {
      const response = await api.post('/ai/execute-confirmed', { sql });
      if (response.data?.success) {
        setMessages(prev => [...prev, { sender: 'ai', text: "✅ Action executed successfully!" }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: "❌ Execution failed." }]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/ai/chat', { message: input });
      if (response.data) {
        const { answer, data, sql, needs_confirmation } = response.data;
        setMessages(prev => [...prev, {
          sender: 'ai',
          text: answer || "I couldn't generate a text response.",
          data,
          sql,
          needs_confirmation
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'ai', text: "I'm having trouble reaching my brain. Please check your connection." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 w-[400px] md:w-[450px] h-[600px] rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden mb-4"
          >
            <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white"><Bot size={22} /></div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Smart Agent</h3>
                  <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Online</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsMinimize(true)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><Minimize2 size={18} /></button>
                <button onClick={() => setIsOpen(false)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><X size={20} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              {messages.map((msg, index) => (
                <div key={index} className={cn("flex flex-col gap-3", msg.sender === 'user' ? "items-end" : "items-start")}>
                  <div className={cn("flex gap-3", msg.sender === 'user' && "flex-row-reverse")}>
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      msg.sender === 'user' ? "bg-slate-200 text-slate-600" : "bg-blue-600 text-white")}>
                      {msg.sender === 'user' ? <User size={16} /> : <Sparkles size={16} />}
                    </div>
                    <div className={cn("max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                      msg.sender === 'user'
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none")}>
                      {msg.text.replace(/\[SQL\].*?\[\/SQL\]/gs, '').trim()}
                    </div>
                  </div>
                  {msg.data && (
                    <div className="ml-10 w-full max-w-[90%] overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800 p-1">
                      <table className="w-full text-left text-[10px]">
                        <thead><tr>{Object.keys(msg.data[0] || {}).map(k => <th key={k} className="p-2 text-slate-400 uppercase">{k}</th>)}</tr></thead>
                        <tbody>{msg.data.map((r, i) => <tr key={i}>{Object.values(r).map((v, j) => <td key={j} className="p-2 text-slate-600 dark:text-slate-400">{String(v)}</td>)}</tr>)}</tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
              {loading && <div className="flex gap-2 ml-10"><div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" /><div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-75" /></div>}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
              <form onSubmit={sendMessage} className="relative">
                <input
                  type="text"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-5 pr-12 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600"><Send size={20} /></button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => { setIsOpen(!isOpen); setIsMinimize(false); }}
        className={cn("ai-trigger-btn w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-105 transition-all group relative", (isOpen && !isMinimized) && "hidden")}
      >
        <Sparkles size={28} />
      </button>
    </div>
  );
};

export default AIAssistant;
