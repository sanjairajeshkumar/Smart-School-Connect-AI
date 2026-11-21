import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { aiService } from '../../services/aiService';
import { Send, Bot, Sparkles, User, Loader2, AlertCircle } from 'lucide-react';

export const AIAssistantChat = ({ initialPrompt = '' }) => {
  const { user } = useAuth();
  const [provider, setProvider] = useState('groq'); // Default to high-speed Groq Cloud AI
  const [inputQuery, setInputQuery] = useState(initialPrompt);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hello ${user?.name || 'there'}! I am your Smart School AI Assistant. Ask me anything about academic classes, student enrollments, faculty, homework tasks, or schedules.`,
      provider: 'Smart School AI',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const quickQuestions = user?.role === 'super_admin'
    ? [
        'How many classes are active?',
        'How many students are enrolled?',
        'Who are the assigned teaching faculty?',
        'Summarize academic classes and schedules.',
      ]
    : user?.role === 'teacher'
    ? [
        'How many students are in Grade 8?',
        'What homework assignments are active?',
        'Draft an announcement for my class.',
        'Check upcoming period schedules.',
      ]
    : [
        'Summarize my homework for tomorrow.',
        'What tasks are currently pending?',
        'What is my homework completion progress?',
        'Any updates from Ms. Taylor?',
      ];

  const handleSend = async (textToSend = inputQuery) => {
    if (!textToSend.trim()) return;
    setError('');

    const newQuery = textToSend.trim();
    setMessages((prev) => [...prev, { role: 'user', text: newQuery }]);
    setInputQuery('');
    setLoading(true);

    try {
      const response = await aiService.askAssistant(newQuery, provider);
      if (response.success && response.data) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: response.data.text,
            provider: response.data.providerUsed,
            isFallback: response.data.isFallback,
          },
        ]);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Ask School AI Header & Provider Toggle - Matching PDF Screen 05 */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Ask School AI</h3>
            <p className="text-xs text-slate-500 mt-1">
              Grounded exclusively in your authorized school tasks, deadlines, and announcements.
            </p>
          </div>

          {/* Provider Toggle Buttons (PDF Screen 05 shows Gemini & NVIDIA Nemotron) */}
          <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setProvider('gemini')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                provider === 'gemini'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gemini
            </button>
            <button
              type="button"
              onClick={() => setProvider('nvidia')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                provider === 'nvidia'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              NVIDIA Nemotron
            </button>
            <button
              type="button"
              onClick={() => setProvider('groq')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                provider === 'groq'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Groq (Llama-3.3)
            </button>
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="pt-4 flex flex-wrap gap-2">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-xs px-3 py-1.5 rounded-full bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200 transition font-medium text-left"
            >
              {q}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Chat Messages Stream - Matching PDF Screen 05 style */}
        <div className="mt-6 space-y-4 min-h-[300px]">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-5 border transition-all ${
                msg.role === 'user'
                  ? 'bg-slate-50 border-slate-200 text-slate-900'
                  : 'bg-[#EEF2FF] border-blue-100 text-slate-900 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 flex items-center space-x-1.5">
                  {msg.role === 'user' ? (
                    <>
                      <User className="w-3.5 h-3.5 text-slate-600" />
                      <span>USER</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span className="text-[#2563EB]">AI ASSISTANT</span>
                    </>
                  )}
                </span>

                {msg.provider && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/80 text-blue-800 border border-blue-200/50">
                    {msg.provider}
                  </span>
                )}
              </div>

              <div className="text-sm leading-relaxed whitespace-pre-wrap font-normal">
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center space-x-3 text-xs text-blue-700">
              <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
              <span>Consulting {provider.toUpperCase()} with verified MongoDB context...</span>
            </div>
          )}
        </div>

        {/* Input area - Matching PDF Screen 05 */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center space-x-3">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !inputQuery.trim()}
            className="px-6 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-200 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition flex items-center space-x-2"
          >
            <span>Send</span>
          </button>
        </div>

      </div>
    </div>
  );
};
