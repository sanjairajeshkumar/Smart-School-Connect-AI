import React, { useState } from 'react';
import { aiService } from '../../services/aiService';
import { messageService } from '../../services/messageService';
import { AIDraftReviewModal } from './AIDraftReviewModal';
import { Sparkles, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export const TeacherMessageComposer = ({ onMessageSent, recentMessages = [], students = [] }) => {
  const [recipientOption, setRecipientOption] = useState('all_grade_parents');
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [subject, setSubject] = useState('Homework Reminder');
  const [messageText, setMessageText] = useState('Please remind your child to complete the math worksheet by tomorrow.');
  const [selectedTone, setSelectedTone] = useState('Encouraging');
  const [preferredProvider, setPreferredProvider] = useState('groq');

  // AI Review Modal State
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [aiDraft, setAiDraft] = useState('');
  const [aiModelUsed, setAiModelUsed] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const tones = ['Encouraging', 'Clear & Direct', 'Urgent Reminder', 'Polite & Warm'];

  // 1. AI Rewrite Request
  const handleImproveWithAI = async () => {
    if (!messageText.trim()) {
      setErrorMessage('Please type a draft message before requesting AI rewriting.');
      return;
    }
    setErrorMessage('');
    setLoadingAi(true);

    try {
      const audience = recipientOption === 'all_grade_parents' ? 'Grade 8 Parents' : 'Parent';
      const result = await aiService.rewriteDraft({
        draft: messageText,
        tone: selectedTone,
        audience,
        subject,
        preferredProvider,
      });

      if (result.success && result.data) {
        setAiDraft(result.data.text);
        setAiModelUsed(result.data.providerUsed);
        setIsReviewOpen(true); // Opens mandatory teacher review modal!
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'AI rewriting failed.');
    } finally {
      setLoadingAi(false);
    }
  };

  // 2. Direct Send or Approved Send from Modal
  const handleSendMessage = async (finalContent = messageText, wasAiApproved = false) => {
    if (!finalContent.trim()) {
      setErrorMessage('Message content cannot be empty.');
      return;
    }
    setErrorMessage('');
    setSending(true);

    try {
      await messageService.sendMessage({
        recipientRole: recipientOption === 'all_grade_parents' ? 'all_grade_parents' : 'parent',
        recipientId: recipientOption !== 'all_grade_parents' ? selectedRecipientId : null,
        subject,
        content: finalContent,
        originalDraft: wasAiApproved ? messageText : '',
        aiRewritten: wasAiApproved,
        aiModelUsed: wasAiApproved ? aiModelUsed : '',
        grade: 'Grade 8',
      });

      setStatusMessage('Message successfully sent to parent(s)!');
      setIsReviewOpen(false);
      setMessageText('');
      setAiDraft('');
      if (onMessageSent) onMessageSent();

      setTimeout(() => setStatusMessage(''), 5000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to deliver message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Compose Card - Matching PDF Screen 04 */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Send a parent update</h3>

        {statusMessage && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-5">
          {/* Recipients - matching PDF */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Recipients
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={recipientOption}
                onChange={(e) => setRecipientOption(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 font-medium"
              >
                <option value="all_grade_parents">Grade 8 - Parents (Broadcast to all)</option>
                <option value="specific_parent">Specific Student's Parent</option>
              </select>

              {recipientOption === 'specific_parent' && (
                <select
                  value={selectedRecipientId}
                  onChange={(e) => setSelectedRecipientId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                >
                  <option value="">Select Student / Parent</option>
                  {students.map((s) => (
                    <option key={s._id} value={s.parentId?._id || s.parentId || s._id}>
                      {s.name}'s Parents
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* AI Settings Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#2563EB]" />
              <span className="text-xs font-semibold text-slate-700">AI Assistant Tone:</span>
              <div className="flex flex-wrap gap-1">
                {tones.map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => setSelectedTone(tone)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      selectedTone === tone
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            {/* Provider indicator */}
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-medium">
              <span>Provider:</span>
              <select
                value={preferredProvider}
                onChange={(e) => setPreferredProvider(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs text-slate-700 font-semibold"
              >
                <option value="groq">Groq (Llama-3.3)</option>
                <option value="gemini">Gemini Flash</option>
                <option value="nvidia">NVIDIA Nemotron</option>
              </select>
            </div>
          </div>

          {/* Message Area - matching PDF Screen 04 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Message
            </label>
            <textarea
              rows="5"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Please remind your child to complete the math worksheet by tomorrow."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition leading-relaxed text-slate-800"
            />
          </div>

          {/* Buttons: Improve with AI & Send message (PDF Screen 04) */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              disabled={loadingAi || !messageText.trim()}
              onClick={handleImproveWithAI}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#2563EB] font-semibold text-sm transition flex items-center justify-center space-x-2"
            >
              {loadingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Improve with AI</span>
            </button>

            <button
              type="button"
              disabled={sending || !messageText.trim()}
              onClick={() => handleSendMessage(messageText, false)}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center space-x-2"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Send message</span>
            </button>
          </div>
        </div>

        {/* Recent Messages Card - matching PDF Screen 04 */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Recent messages
          </h4>
          <div className="space-y-2">
            {recentMessages.length > 0 ? (
              recentMessages.slice(0, 3).map((msg) => (
                <div
                  key={msg._id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-800">{msg.subject || 'Homework reminder'}</p>
                    <p className="text-slate-500 line-clamp-1">{msg.content}</p>
                  </div>
                  <div className="text-right text-[11px] text-slate-400 shrink-0 ml-3">
                    <span className="font-medium text-slate-600">{msg.recipientName}</span>
                    <p>{new Date(msg.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500">
                Homework reminder | Sent to 28 parents
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mandatory Teacher AI Review Modal */}
      <AIDraftReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        originalDraft={messageText}
        aiDraft={aiDraft}
        aiModelUsed={aiModelUsed}
        onApproveAndSend={(approvedText) => handleSendMessage(approvedText, true)}
        loading={sending}
      />
    </div>
  );
};
