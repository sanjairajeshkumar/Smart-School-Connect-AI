import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Sparkles, Check, Edit3, Send, AlertTriangle, ArrowRight } from 'lucide-react';

export const AIDraftReviewModal = ({
  isOpen,
  onClose,
  originalDraft,
  aiDraft,
  aiModelUsed,
  onApproveAndSend,
  loading,
}) => {
  const [editedContent, setEditedContent] = useState(aiDraft || '');

  // Keep editedContent synced if aiDraft changes
  React.useEffect(() => {
    setEditedContent(aiDraft || '');
  }, [aiDraft]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mandatory Review: AI Rewritten Message"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        
        {/* Compliance / Policy banner */}
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-start space-x-3 text-xs text-blue-900">
          <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Human-in-the-Loop Teacher Review Required</p>
            <p className="text-blue-700">
              Generated via <span className="font-semibold">{aiModelUsed || 'AI Engine'}</span>. You can edit the text below. Nothing is sent to parents until you explicitly click "Approve & Send".
            </p>
          </div>
        </div>

        {/* Comparison: Original Draft */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Original Teacher Draft
          </label>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 italic">
            "{originalDraft}"
          </div>
        </div>

        {/* Editable AI-Rewritten Draft */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>AI-Enhanced Message (Editable)</span>
            </label>
            <span className="text-[11px] text-slate-400">Click below to make any adjustments</span>
          </div>
          <textarea
            rows="6"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-normal"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Discard / Back
          </button>

          <button
            type="button"
            disabled={loading || !editedContent.trim()}
            onClick={() => onApproveAndSend(editedContent)}
            className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-300 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/20 flex items-center space-x-2 transition"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? 'Sending Message...' : 'Approve & Send Message'}</span>
          </button>
        </div>

      </div>
    </Modal>
  );
};
