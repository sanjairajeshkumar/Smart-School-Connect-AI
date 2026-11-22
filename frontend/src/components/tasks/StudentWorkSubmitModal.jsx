import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { taskService } from '../../services/taskService';
import { compressMultipleImages } from '../../utils/imageUtils';
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
  Plus,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react';

export const StudentWorkSubmitModal = ({
  isOpen,
  onClose,
  task,
  onSubmitted,
}) => {
  const [submissionText, setSubmissionText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [timeSpentMinutes, setTimeSpentMinutes] = useState('30');
  const [compressing, setCompressing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [previewEnlargedIndex, setPreviewEnlargedIndex] = useState(null);

  const fileInputRef = useRef(null);
  const addMoreInputRef = useRef(null);

  useEffect(() => {
    if (task?.submission) {
      setSubmissionText(task.submission.content || '');
      setTimeSpentMinutes(task.submission.timeSpentMinutes?.toString() || '30');

      if (Array.isArray(task.submission.attachments) && task.submission.attachments.length > 0) {
        setAttachments(task.submission.attachments);
      } else if (task.submission.attachmentUrl) {
        setAttachments([task.submission.attachmentUrl]);
      } else {
        setAttachments([]);
      }
    } else {
      setSubmissionText('');
      setAttachments([]);
      setTimeSpentMinutes('30');
    }
    setError('');
    setProgressText('');
    setPreviewEnlargedIndex(null);
  }, [task]);

  if (!task) return null;

  const handleFilesSelect = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError('');
    setCompressing(true);
    setProgressText(`Preparing ${files.length} ${files.length === 1 ? 'photo' : 'photos'}...`);
    try {
      const compressedImages = await compressMultipleImages(
        files,
        1200,
        0.75,
        (current, total) => {
          setProgressText(`Optimizing page ${current} of ${total}...`);
        }
      );
      if (compressedImages.length === 0) {
        setError('No valid image files found.');
      } else {
        setAttachments((prev) => [...prev, ...compressedImages]);
      }
    } catch (err) {
      setError(err.message || 'Failed to process selected photos.');
    } finally {
      setCompressing(false);
      setProgressText('');
      // Reset input value so same files can be re-selected if needed
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (indexToRemove) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (previewEnlargedIndex === indexToRemove) {
      setPreviewEnlargedIndex(null);
    } else if (previewEnlargedIndex > indexToRemove) {
      setPreviewEnlargedIndex(previewEnlargedIndex - 1);
    }
  };

  const handleClearAllPhotos = () => {
    setAttachments([]);
    setPreviewEnlargedIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (attachments.length === 0 && !submissionText.trim()) {
      setError('Please upload at least one photo of your work or type your solution text before turning in.');
      return;
    }

    setSubmitting(true);
    try {
      await taskService.submitAssignment(task._id, {
        content: submissionText.trim(),
        attachments,
        attachmentUrl: attachments[0] || '',
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Upload Photos of Your Work</span>
              </label>
              <span className="text-[11px] text-slate-400 font-normal">
                {attachments.length > 0
                  ? `${attachments.length} ${attachments.length === 1 ? 'page attached' : 'pages attached'}`
                  : 'Multiple photos supported (Page 1, 2, ...)'}
              </span>
            </div>

            {attachments.length > 0 ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                {/* Multi-photo grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {attachments.map((photo, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white shadow-2xs aspect-[4/3] flex items-center justify-center"
                    >
                      <img
                        src={photo}
                        alt={`Homework Page ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Page badge */}
                      <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-slate-900/75 backdrop-blur-xs text-white text-[10px] font-bold rounded-md">
                        Page {idx + 1}
                      </div>

                      {/* Hover action overlay */}
                      <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setPreviewEnlargedIndex(idx)}
                          className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                          title="Zoom page"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                          title="Remove this page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gallery controls / Add more photos */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => addMoreInputRef.current?.click()}
                      disabled={compressing}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold text-[11px] flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Another Photo / Page</span>
                    </button>
                    <input
                      ref={addMoreInputRef}
                      type="file"
                      accept="image/*,.png,.jpg,.jpeg,.webp"
                      multiple
                      onChange={handleFilesSelect}
                      className="hidden"
                    />

                    {compressing && (
                      <span className="text-[11px] text-blue-600 font-semibold flex items-center space-x-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>{progressText || 'Optimizing photo...'}</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleClearAllPhotos}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 transition rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer text-center space-y-2 bg-slate-50/50">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.png,.jpg,.jpeg,.webp"
                  multiple
                  onChange={handleFilesSelect}
                  className="hidden"
                />
                {compressing ? (
                  <div className="flex flex-col items-center space-y-2">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    <span className="text-xs font-semibold text-slate-700">
                      {progressText || 'Optimizing photo(s)...'}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs">
                        Click or tap to snap / upload photos of your work
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Accepts notebook snapshots, mobile photos, or worksheets (PNG, JPG) • You can select multiple photos
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
      {previewEnlargedIndex !== null && attachments[previewEnlargedIndex] && (
        <div
          className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewEnlargedIndex(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-3xl p-4 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Full Work Photo: {task.title}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Page {previewEnlargedIndex + 1} of {attachments.length}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewEnlargedIndex(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="relative flex-1 flex items-center justify-center min-h-[300px] max-h-[70vh] bg-slate-50 rounded-2xl overflow-hidden p-2">
              <img
                src={attachments[previewEnlargedIndex]}
                alt={`Full homework page ${previewEnlargedIndex + 1}`}
                className="max-h-[68vh] w-auto mx-auto object-contain rounded-xl"
              />

              {attachments.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewEnlargedIndex((prev) =>
                        prev > 0 ? prev - 1 : attachments.length - 1
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center transition shadow-md cursor-pointer"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewEnlargedIndex((prev) =>
                        prev < attachments.length - 1 ? prev + 1 : 0
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center transition shadow-md cursor-pointer"
                    title="Next page"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
