import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, X, Minimize2, Maximize2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const AIAssistant = () => {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: "Hello! I'm your Intelligent SQL Agent. Ask me anything about your assets in English or Tamil!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimize] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleExecuteSQL = async (sql) => {
    try {
      const response = await api.post('/ai/execute-confirmed', { sql });
      if (response.data.success) {
        setMessages(prev => [...prev, { sender: 'ai', text: "✅ Action executed successfully!" }]);
      } else {
        setMessages(prev => [...prev, { sender: 'ai', text: `❌ Execution failed: ${response.data.error}` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: "❌ Connection error during execution." }]);
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
      const { answer, data, sql, needs_confirmation } = response.data;

      const aiMsg = {
        sender: 'ai',
        text: answer,
        data,
        sql,
        needs_confirmation
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'ai', text: "Sorry, I encountered an error connecting to the AI brain." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white dark:bg-slate-900 w-[450px] h-[650px] rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <Bot size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">AI SQL Agent</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Mode</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setIsMinimize(true)} className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"><Minimize2 size={16} /></button>
                <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg"><X size={16} /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              {messages.map((msg, index) => (
                <div key={index} className={`flex flex-col gap-3 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      msg.sender === 'user' ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-blue-600 text-white shadow-md'
                    }`}>
                      {msg.sender === 'user' ? <User size={16} /> : <Sparkles size={16} />}
                    </div>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20 rounded-tr-none"
                        : "bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm rounded-tl-none"
                    }`}>
                      {msg.text.replace(/\[SQL\].*?\[\/SQL\]/gs, '').trim()}
                    </div>
                  </div>

                  {/* SQL Block */}
                  {msg.sql && (
                    <div className="ml-11 w-full max-w-[80%] overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="bg-slate-800 px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between items-center">
                        <span>Generated Query</span>
                        {msg.needs_confirmation && <span className="text-orange-400">Needs Confirmation</span>}
                      </div>
                      <pre className="p-4 bg-slate-900 text-blue-300 text-xs font-mono overflow-x-auto">
                        {msg.sql}
                      </pre>
                      {msg.needs_confirmation && (
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/10 border-t border-orange-100 dark:border-orange-800 flex justify-end">
                          <button
                            onClick={() => handleExecuteSQL(msg.sql)}
                            className="px-4 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                          >
                            Execute Action
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Data Table */}
                  {msg.data && Array.isArray(msg.data) && msg.data.length > 0 && (
                    <div className="ml-11 w-full max-w-[90%] overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                          <tr>
                            {Object.keys(msg.data[0]).map(key => (
                              <th key={key} className="px-3 py-2 font-bold text-slate-400 uppercase tracking-tighter">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800 bg-white dark:bg-slate-950">
                          {msg.data.map((row, i) => (
                            <tr key={i}>
                              {Object.values(row).map((val, j) => (
                                <td key={j} className="px-3 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">{String(val)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
                    <Sparkles size={16} className="animate-spin" />
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl flex gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
              <form onSubmit={sendMessage} className="relative">
                <input
                  type="text"
                  className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl pl-5 pr-12 py-3.5 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                  placeholder="Ask about assets, maintenance..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">
                  <Send size={18} />
                </button>
              </form>
              <p className="text-[9px] text-center text-slate-400 mt-3 font-bold uppercase tracking-widest">Powered by GPT-5 • Intelligent Database Agent</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => { setIsOpen(true); setIsMinimize(false); }}
        className={cn(
          "w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40 hover:scale-105 transition-all group relative",
          isOpen && !isMinimized ? 'hidden' : ''
        )}
      >
        <Sparkles size={28} className="group-hover:rotate-12 transition-transform" />
        {messages.length > 0 && !isOpen && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white dark:border-slate-950 rounded-full flex items-center justify-center text-[10px] font-bold">
            !
          </div>
        )}
      </button>
    </div>
  );
};

export default AIAssistant;
