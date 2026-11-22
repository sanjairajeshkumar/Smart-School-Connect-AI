import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { taskService } from '../../services/taskService';
import { compressImage } from '../../utils/imageUtils';
import {
  Upload,
  Camera,
  Image as ImageIcon,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  FileCheck,
} from 'lucide-react';

export const StudentWorkSubmitModal = ({
  isOpen,
  onClose,
  task,
  onSubmitted,
}) => {
  const [submissionText, setSubmissionText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [timeSpentMinutes, setTimeSpentMinutes] = useState('30');
  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [previewEnlarged, setPreviewEnlarged] = useState(false);

  useEffect(() => {
    if (task?.submission) {
      setSubmissionText(task.submission.content || '');
      setAttachmentUrl(task.submission.attachmentUrl || '');
      setTimeSpentMinutes(task.submission.timeSpentMinutes?.toString() || '30');
    } else {
      setSubmissionText('');
      setAttachmentUrl('');
      setTimeSpentMinutes('30');
    }
    setError('');
  }, [task]);

  if (!task) return null;

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setCompressing(true);
    try {
      const compressedDataUrl = await compressImage(file, 1600, 0.82);
      setAttachmentUrl(compressedDataUrl);
    } catch (err) {
      setError(err.message || 'Failed to process selected image.');
    } finally {
      setCompressing(false);
    }
  };

  const handleRemovePhoto = () => {
    setAttachmentUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!attachmentUrl && !submissionText.trim()) {
      setError('Please either upload a photo of your work or type your solution text before turning in.');
      return;
    }

    setSubmitting(true);
    try {
      await taskService.submitAssignment(task._id, {
        content: submissionText.trim(),
        attachmentUrl: attachmentUrl || '',
        timeSpentMinutes: Number(timeSpentMinutes) || 0,
      });

      if (onSubmitted) onSubmitted();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const isGraded = task.submission?.status === 'graded';
  const isSubmitted = task.submission?.status === 'submitted';

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Turn In Homework: ${task.title}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Assignment Overview Pill */}
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center justify-between text-slate-700">
            <div>
              <span className="font-bold text-blue-900 block text-sm">{task.subject}</span>
              <span className="text-[11px] text-blue-700">
                Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Today'} • Max: {task.maxScore || 100} pts
              </span>
            </div>
            {isGraded ? (
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold border border-emerald-200">
                Graded ({task.submission.score}/{task.submission.maxScore})
              </span>
            ) : isSubmitted ? (
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg font-bold border border-amber-200">
                Under Review
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg font-bold">
                Pending Turn-In
              </span>
            )}
          </div>

          {task.description && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="font-semibold text-slate-500 block uppercase tracking-wider text-[10px] mb-0.5">
                Teacher Instructions
              </span>
              <p className="text-slate-800 text-xs whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Photo Upload Section */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Upload Photo of Your Work</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Notebook, worksheet, or solved paper</span>
            </label>

            {attachmentUrl ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white">
                  <img
                    src={attachmentUrl}
                    alt="Homework preview"
                    className="w-full max-h-56 object-contain mx-auto"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setPreviewEnlarged(true)}
                      className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Zoom Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                  <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Photo attached & ready for teacher</span>
                  </span>
                  <label className="text-blue-600 font-bold hover:underline cursor-pointer">
                    Replace Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 transition rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer text-center space-y-2 bg-slate-50/50">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {compressing ? (
                  <div className="flex flex-col items-center space-y-2">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    <span className="text-xs font-semibold text-slate-600">Processing photo...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs">
                        Click or tap to snap / upload photo of your work
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Accepts notebook snapshots, mobile photos, or screenshots (PNG, JPG)
                      </p>
                    </div>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Student Notes / Answers */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-700 text-xs">
              Solution Notes / Written Explanation (Optional)
            </label>
            <textarea
              rows="3"
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              placeholder="Type your answers, thoughts, or comments for your teacher..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Time spent */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-700 text-xs flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Minutes Spent on this Homework</span>
            </label>
            <input
              type="number"
              min="0"
              max="600"
              value={timeSpentMinutes}
              onChange={(e) => setTimeSpentMinutes(e.target.value)}
              className="w-full sm:w-36 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Teacher Feedback Banner if already graded */}
          {isGraded && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
              <span className="font-bold text-emerald-900 block text-xs">
                Teacher Review Received: {task.submission.score} / {task.submission.maxScore} points
              </span>
              {task.submission.feedback && (
                <p className="text-emerald-800 text-xs italic">
                  "{task.submission.feedback}"
                </p>
              )}
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || compressing}
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md shadow-blue-500/20 flex items-center space-x-2 transition cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Work...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>{isSubmitted ? 'Update Submitted Work' : 'Turn In Work & Submit for Review'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Enlarged Photo Lightbox Modal */}
      {previewEnlarged && attachmentUrl && (
        <div
          className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewEnlarged(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl p-4 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h4 className="font-bold text-slate-900 text-sm">Full Work Photo: {task.title}</h4>
              <button
                type="button"
                onClick={() => setPreviewEnlarged(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <img
              src={attachmentUrl}
              alt="Full size homework work"
              className="max-h-[75vh] w-auto mx-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </>
  );
};
