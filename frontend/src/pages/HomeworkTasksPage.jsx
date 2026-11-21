import React, { useState, useEffect } from 'react';
import { taskService } from '../services/taskService';
import { useAuth } from '../context/AuthContext';
import { TaskCreateModal } from '../components/tasks/TaskCreateModal';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import {
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  MessageSquare,
  AlertCircle,
  Save,
} from 'lucide-react';

export const HomeworkTasksPage = () => {
  const { user, role } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, completed
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [timeSpent, setTimeSpent] = useState('');
  const [actionError, setActionError] = useState('');

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await taskService.getTasks({ status: filterStatus });
      if (res.success) {
        setTasks(res.data);
      }
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [filterStatus]);

  // Handle student or teacher toggling completion status
  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, status: newStatus } : t))
      );
      await taskService.updateTask(task._id, { status: newStatus });
    } catch (err) {
      setActionError('Failed to update task status.');
      loadTasks(); // revert on failure
    }
  };

  const handleSaveNotes = async (taskId) => {
    try {
      await taskService.updateTask(taskId, {
        studentNotes: noteText,
        timeSpentMinutes: timeSpent ? Number(timeSpent) : 0,
      });
      setEditingNotesId(null);
      loadTasks();
    } catch (err) {
      setActionError('Failed to save homework notes.');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await taskService.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Failed to delete task.');
    }
  };

  const formatDueText = (dueDate, status) => {
    if (status === 'completed') return 'Completed';
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays === -1) return 'Overdue by 1 day';
    if (diffDays < -1) return `Overdue by ${Math.abs(diffDays)} days`;
    return `Due ${new Date(dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header & Controls - Matching PDF Screen 03 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {role === 'student' ? 'My homework' : 'Homework & Assignments'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {role === 'student'
              ? 'Check off assignments as you finish them and log your study minutes.'
              : 'Create, monitor, and sequence classroom curriculum tasks.'}
          </p>
        </div>

        {role === 'teacher' && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Assignment</span>
          </button>
        )}
      </div>

      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter Tabs - Exact Match to PDF Screen 03/05: All, Pending, Completed */}
      <div className="flex items-center space-x-2 bg-slate-100/80 p-1.5 rounded-2xl w-fit border border-slate-200">
        {[
          { id: 'all', label: 'All' },
          { id: 'pending', label: 'Pending' },
          { id: 'completed', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-5 py-2 rounded-xl text-xs font-semibold transition ${
              filterStatus === tab.id
                ? 'bg-white text-[#2563EB] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <LoadingSpinner text="Loading assignments..." />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No homework tasks in this view"
          description={
            filterStatus === 'all'
              ? 'There are currently no assignments scheduled.'
              : `There are no ${filterStatus} assignments at this moment.`
          }
        />
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const isDone = task.status === 'completed';
            const isEditing = editingNotesId === task._id;

            return (
              <div
                key={task._id}
                className={`bg-white border rounded-3xl p-5 sm:p-6 transition-all hover:shadow-sm ${
                  isDone ? 'border-slate-200 bg-slate-50/50' : 'border-slate-200 hover:border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Checkbox + Title + Meta */}
                  <div className="flex items-start space-x-4">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(task)}
                      className="mt-0.5 text-slate-300 hover:text-blue-600 transition shrink-0"
                      title={isDone ? 'Mark as Pending' : 'Mark as Done'}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-50" />
                      ) : (
                        <div className="w-6 h-6 rounded-lg border-2 border-slate-300 hover:border-blue-500 transition" />
                      )}
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4
                          className={`text-base font-bold ${
                            isDone ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </h4>
                        {task.batchName && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                            {task.batchName}
                          </span>
                        )}
                      </div>

                      {/* PDF Screen 03 meta format: Due today | Grade 8 */}
                      <p className="text-xs text-slate-500 font-medium">
                        {formatDueText(task.dueDate, task.status)} • {task.grade || 'Grade 8'} • {task.subject}
                      </p>

                      {task.description && (
                        <p className="text-xs text-slate-600 pt-1 leading-relaxed max-w-2xl">
                          {task.description}
                        </p>
                      )}

                      {/* Existing notes / time spent */}
                      {(task.studentNotes || task.timeSpentMinutes > 0) && (
                        <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          {task.timeSpentMinutes > 0 && (
                            <span className="inline-flex items-center space-x-1 text-slate-600 font-medium bg-slate-100 px-2.5 py-1 rounded-lg">
                              <Clock className="w-3.5 h-3.5 text-blue-600" />
                              <span>{task.timeSpentMinutes} mins spent</span>
                            </span>
                          )}
                          {task.studentNotes && (
                            <span className="italic text-slate-500">
                              Note: "{task.studentNotes}"
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Status Pill & Controls - Matching PDF Screen 03/05 */}
                  <div className="flex items-center space-x-3 shrink-0">
                    <Badge variant={isDone ? 'done' : 'pending'}>
                      {isDone ? 'Done' : 'Pending'}
                    </Badge>

                    {role === 'student' && !isEditing && (
                      <button
                        onClick={() => {
                          setEditingNotesId(task._id);
                          setNoteText(task.studentNotes || '');
                          setTimeSpent(task.timeSpentMinutes ? task.timeSpentMinutes.toString() : '');
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded-lg transition"
                        title="Add time spent or notes"
                      >
                        + Notes
                      </button>
                    )}

                    {role === 'teacher' && (
                      <button
                        onClick={() => handleDelete(task._id)}
                        className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Student Notes Form */}
                {isEditing && (
                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-8">
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Student Reflection / Notes
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Completed questions 1-10, found fractions problem #7 tricky"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Time (mins)
                      </label>
                      <input
                        type="number"
                        placeholder="30"
                        value={timeSpent}
                        onChange={(e) => setTimeSpent(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2 flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleSaveNotes(task._id)}
                        className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition flex items-center justify-center space-x-1"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingNotesId(null)}
                        className="px-2 py-2 text-slate-400 hover:text-slate-600 text-xs rounded-xl hover:bg-slate-100"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Teacher to create new assignment */}
      <TaskCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onTaskCreated={loadTasks}
      />
    </div>
  );
};
