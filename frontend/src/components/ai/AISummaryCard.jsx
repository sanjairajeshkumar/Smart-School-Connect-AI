import React, { useState } from 'react';
import { aiService } from '../../services/aiService';
import { Sparkles, FileText, Loader2, BarChart2, CheckCircle, Clock } from 'lucide-react';

export const AISummaryCard = ({ studentId, studentName = 'Student', grade = 'Grade 8' }) => {
  const [digest, setDigest] = useState('');
  const [providerUsed, setProviderUsed] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('groq');

  const handleGenerateDigest = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await aiService.getStudentDigest(studentId, selectedProvider);
      if (res.success && res.data) {
        setDigest(res.data.text);
        setProviderUsed(res.data.providerUsed);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate AI digest.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-[#2563EB]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Academic Progress Digest</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Performance & Homework Digest for {studentName}
          </h3>
          <p className="text-xs text-slate-500 max-w-xl">
            Quickly summarize completed assignments, time spent, overdue alerts, and pending work without manually reading through raw logs.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="groq">Groq (Llama-3.3)</option>
            <option value="gemini">Google Gemini</option>
            <option value="nvidia">NVIDIA Nemotron</option>
          </select>

          <button
            onClick={handleGenerateDigest}
            disabled={loading}
            className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-200 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 transition flex items-center space-x-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart2 className="w-4 h-4" />}
            <span>{digest ? 'Refresh Digest' : 'Generate Digest'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      {loading && (
        <div className="p-8 bg-slate-50 rounded-2xl flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
          <p className="text-xs text-slate-500 font-medium">
            Analyzing student task history, completion minutes, and teacher notes...
          </p>
        </div>
      )}

      {digest && !loading && (
        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-6 text-sm text-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Grounded School Digest</span>
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Provider: {providerUsed}
            </span>
          </div>

          <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
            {digest}
          </div>
        </div>
      )}
    </div>
  );
};
