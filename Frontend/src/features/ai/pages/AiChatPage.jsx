import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../../services/api';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Alert } from '../../../components/common/LayoutComponents';
import {
  BotMessageSquare,
  User,
  Send,
  Trash2,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

export const AiChatPage = () => {
  const [searchParams] = useSearchParams();
  const initialPrompt = searchParams.get('prompt') || '';

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState(initialPrompt);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get('/ai/chat-history');
      const loaded = res.data || [];
      if (loaded.length === 0) {
        // Initial welcome message from MoneyTrace Agent
        setMessages([
          {
            role: 'assistant',
            content: `Hello! I am **MoneyTrace Agent**, your personal transaction intelligence assistant.\n\nI can analyze your ledger for rapid fund movement, explain flagged risk scores, trace counterparties, and clarify AML monitoring principles.\n\n*All factual transaction insights are grounded exclusively in your imported records.*`,
            timestamp: new Date(),
          },
        ]);
      } else {
        setMessages(loaded);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSendMessage = async (customText) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setError('');

    try {
      setLoading(true);
      const res = await api.post('/ai/chat', { message: textToSend.trim() });
      const assistantMsg = {
        role: 'assistant',
        content: res.data.message,
        metadata: res.data.metadata,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(err.message || 'Failed to generate response. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await api.delete('/ai/chat-history');
      setMessages([
        {
          role: 'assistant',
          content: 'Chat history cleared. How can I assist with your transaction analysis today?',
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      alert(err.message || 'Failed to clear chat history');
    }
  };

  const promptSuggestions = [
    'Find unusual transactions in my ledger',
    'Summarize my total income and expenses',
    'Why was TXN1020 flagged with high risk?',
    'What does rapid fund movement mean?',
    'Where did the money from TXN1020 go?',
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)]">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-md">
            <BotMessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              MoneyTrace Agent
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full">
                DB-Grounded
              </span>
            </h1>
            <p className="text-[11px] text-slate-500">
              Transaction Intelligence & Suspicious Pattern Explainer
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          icon={Trash2}
          onClick={handleClearHistory}
          className="text-slate-500 hover:text-red-600"
        >
          Clear Chat
        </Button>
      </div>

      {/* Strict Regulatory Disclaimer Banner */}
      <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2 shrink-0">
        <ShieldCheck className="w-3.5 h-3.5 text-brand-600 shrink-0" />
        <span>
          MoneyTrace Agent never invents transactions. All data is verified from your database. Analysis reflects risk indicators only, not legal black-money determinations.
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 overflow-y-auto shadow-card space-y-4">
        {historyLoading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading conversation history...</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <BotMessageSquare className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-subtle ${
                    isUser
                      ? 'bg-brand-600 text-white rounded-tr-none'
                      : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-line break-words font-sans">
                    {msg.content}
                  </div>
                  <span
                    className={`block text-[9px] mt-1.5 font-mono ${
                      isUser ? 'text-brand-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <BotMessageSquare className="w-3.5 h-3.5" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
              <span className="font-medium">Querying ledger records & analyzing patterns...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <Alert type="error" title="Assistant Error">
          {error}
        </Alert>
      )}

      {/* Suggested Inquiries Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        <span className="text-[11px] font-bold uppercase text-slate-400 shrink-0">Ask:</span>
        {promptSuggestions.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            className="text-[11px] font-medium text-slate-600 hover:text-brand-700 bg-white hover:bg-brand-50 border border-slate-200 hover:border-brand-300 px-3 py-1.5 rounded-full whitespace-nowrap transition-colors shadow-subtle"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 shrink-0 bg-white p-2 rounded-xl border border-slate-300 shadow-card focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask MoneyTrace Agent (e.g. 'Analyze TXN1020' or 'Find unusual transactions')..."
          className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={loading}
          disabled={!inputMessage.trim()}
          icon={Send}
        >
          Ask AI
        </Button>
      </form>
    </div>
  );
};
