import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { taskService } from '../../services/taskService';
import { Loader2, Calendar, BookOpen, AlertCircle } from 'lucide-react';

export const TaskCreateModal = ({ isOpen, onClose, onTaskCreated, students = [] }) => {
  const [formData, setFormData] = useState({
    title: '',
    subject: 'Mathematics',
    description: '',
    grade: 'Grade 8',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    priority: 'medium',
    assignedStudentId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const subjects = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Art', 'Physical Education'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Please provide a task title');
      return;
    }

    try {
      setLoading(true);
      await taskService.createTask({
        ...formData,
        assignedStudentId: formData.assignedStudentId || null,
      });
      onTaskCreated();
      onClose();
      setFormData({
        title: '',
        subject: 'Mathematics',
        description: '',
        grade: 'Grade 8',
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        priority: 'medium',
        assignedStudentId: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Assignment">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Task Title
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Math - Fractions or Science - Chapter 4"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Subject
            </label>
            <select
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              {subjects.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Due Date
            </label>
            <input
              type="date"
              required
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Assign To
            </label>
            <select
              value={formData.assignedStudentId}
              onChange={(e) => setFormData({ ...formData, assignedStudentId: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              <option value="">Entire Grade 8 Class</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name} ({student.grade || 'Grade 8'})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Instructions / Problem Details
          </label>
          <textarea
            rows="3"
            placeholder="Provide homework instructions, textbook page numbers, or submission requirements..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl shadow-md shadow-blue-500/20 flex items-center space-x-2 transition"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Assign Homework</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
