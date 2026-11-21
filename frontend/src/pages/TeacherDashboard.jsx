import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { messageService } from '../services/messageService';
import { authService } from '../services/authService';
import { AISummaryCard } from '../components/ai/AISummaryCard';
import { TaskCreateModal } from '../components/tasks/TaskCreateModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Badge } from '../components/common/Badge';
import { Plus, Sparkles, MessageSquare, BookOpen, Users, CheckCircle, ArrowRight } from 'lucide-react';

export const TeacherDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedStudentForDigest, setSelectedStudentForDigest] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [taskRes, msgRes, studentRes] = await Promise.all([
        taskService.getTasks(),
        messageService.getMessages(),
        authService.getLinkedStudents(),
      ]);
      if (taskRes.success) setTasks(taskRes.data);
      if (msgRes.success) setMessages(msgRes.data);
      if (studentRes.success) {
        setStudents(studentRes.data);
        if (studentRes.data.length > 0) {
          setSelectedStudentForDigest(studentRes.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load teacher dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;

  if (loading) {
    return <LoadingSpinner text="Loading teacher classroom metrics..." />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Teacher Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Teacher Dashboard: {user?.name || 'Ms. Taylor'}
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Class: Grade 8, Section A • 28 Registered Students
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('messages')}
            className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-[#2563EB] border border-blue-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Message Composer</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Classroom Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <span className="text-3xl font-extrabold text-slate-900 block mb-1">
            {tasks.length}
          </span>
          <span className="text-xs font-semibold text-slate-500">Active Assignments</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <span className="text-3xl font-extrabold text-emerald-600 block mb-1">
            {completedCount}
          </span>
          <span className="text-xs font-semibold text-slate-500">Submissions Checked</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <span className="text-3xl font-extrabold text-amber-600 block mb-1">
            {pendingCount}
          </span>
          <span className="text-xs font-semibold text-slate-500">Pending Student Reviews</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <span className="text-3xl font-extrabold text-blue-600 block mb-1">
            {messages.length}
          </span>
          <span className="text-xs font-semibold text-slate-500">Parent Updates Sent</span>
        </div>
      </div>

      {/* AI Digest Section for Teachers */}
      {selectedStudentForDigest && (
        <AISummaryCard
          studentId={selectedStudentForDigest._id}
          studentName={selectedStudentForDigest.name}
          grade={selectedStudentForDigest.grade || 'Grade 8'}
        />
      )}

      {/* Recent Assignments Snapshot */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Current Assignments Overview</h3>
          <button
            onClick={() => onNavigate('homework')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>Manage All Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {tasks.slice(0, 4).map((task) => (
            <div
              key={task._id}
              className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs"
            >
              <div>
                <p className="font-bold text-slate-800 text-sm">{task.title}</p>
                <p className="text-slate-500 font-medium">
                  {task.subject} • Due {new Date(task.dueDate).toLocaleDateString()}
                </p>
              </div>
              <Badge variant={task.status === 'completed' ? 'done' : 'pending'}>
                {task.status === 'completed' ? 'Done' : 'Pending'}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Task Creation Modal */}
      <TaskCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onTaskCreated={loadData}
        students={students}
      />
    </div>
  );
};
