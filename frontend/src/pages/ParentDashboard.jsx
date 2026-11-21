import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { messageService } from '../services/messageService';
import { AISummaryCard } from '../components/ai/AISummaryCard';
import { StudentPinModal } from '../components/auth/StudentPinModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Badge } from '../components/common/Badge';
import {
  Layers,
  Sparkles,
  BookOpen,
  CheckCircle,
  Clock,
  ArrowRight,
  MessageSquare,
  KeyRound,
} from 'lucide-react';

export const ParentDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [batches, setBatches] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [taskRes, batchRes, msgRes] = await Promise.all([
          taskService.getTasks(),
          taskService.getBatches(),
          messageService.getMessages(),
        ]);
        if (taskRes.success) setTasks(taskRes.data);
        if (batchRes.success) setBatches(batchRes.data);
        if (msgRes.success) setMessages(msgRes.data);
      } catch (err) {
        console.error('Failed to load parent dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const totalMinutes = tasks.reduce((sum, t) => sum + (t.timeSpentMinutes || 0), 0);
  const studentId = tasks[0]?.assignedStudentId?._id || tasks[0]?.assignedStudentId;

  if (loading) {
    return <LoadingSpinner text="Loading child progress records..." />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Header with Switch to Student View */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Parent Portal: Sarah Johnson
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Monitoring Alex Johnson • Grade 8, Section A
          </p>
        </div>

        {/* Student View quick toggle via PIN */}
        <button
          onClick={() => setIsPinModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-[#2563EB] rounded-xl text-xs font-bold transition"
        >
          <KeyRound className="w-4 h-4" />
          <span>Switch to Alex's Student View</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <span className="text-3xl font-extrabold text-slate-900 block mb-1">
            {completedTasks.length} / {tasks.length}
          </span>
          <span className="text-xs font-semibold text-slate-500">Tasks Completed</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <span className="text-3xl font-extrabold text-amber-600 block mb-1">
            {pendingTasks.length}
          </span>
          <span className="text-xs font-semibold text-slate-500">Pending Tasks</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <span className="text-3xl font-extrabold text-blue-600 block mb-1">
            {totalMinutes}m
          </span>
          <span className="text-xs font-semibold text-slate-500">Total Study Time</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <span className="text-3xl font-extrabold text-purple-600 block mb-1">
            {batches.length}
          </span>
          <span className="text-xs font-semibold text-slate-500">Active Batches</span>
        </div>
      </div>

      {/* Task Batching & Sequencing Promo Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/60 rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-blue-700 border border-blue-100">
            <Layers className="w-3.5 h-3.5" />
            <span>Parent Task Batching & Sequencing</span>
          </span>
          <h3 className="text-lg font-bold text-slate-900">
            Organize Alex's Homework into Manageable Batches
          </h3>
          <p className="text-xs text-slate-600 max-w-xl">
            Split larger homework lists into 2-step batches. Release the first batch today, and keep the remaining assignments locked until the first batch is done!
          </p>
        </div>

        <button
          onClick={() => onNavigate('batching')}
          className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition shrink-0"
        >
          Manage Batches →
        </button>
      </div>

      {/* Grounded AI Progress Summary Card */}
      <AISummaryCard
        studentId={studentId}
        studentName="Alex Johnson"
        grade="Grade 8"
      />

      {/* Student PIN Modal */}
      <StudentPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
      />
    </div>
  );
};
