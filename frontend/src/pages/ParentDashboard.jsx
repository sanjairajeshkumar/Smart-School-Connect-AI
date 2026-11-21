import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { messageService } from '../services/messageService';
import { feeService } from '../services/feeService';
import { attendanceService } from '../services/attendanceService';
import { getSocket } from '../services/socket';
import { AISummaryCard } from '../components/ai/AISummaryCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Badge } from '../components/common/Badge';
import {
  Layers,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowRight,
  MessageSquare,
  CreditCard,
  CalendarCheck2,
  GraduationCap,
  Bell,
  Check,
} from 'lucide-react';

export const ParentDashboard = ({ onNavigate }) => {
  const { user, addNotification } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [batches, setBatches] = useState([]);
  const [messages, setMessages] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payingInvoiceId, setPayingInvoiceId] = useState(null);

  const linkedChildren = user?.childrenIds || [];
  const primaryChild = linkedChildren[0] || null;

  const loadData = async () => {
    try {
      setLoading(true);
      const [taskRes, batchRes, msgRes, feeRes] = await Promise.all([
        taskService.getTasks(),
        taskService.getBatches(),
        messageService.getMessages(),
        feeService.getInvoices(),
      ]);

      if (taskRes.success) setTasks(taskRes.data);
      if (batchRes.success) setBatches(batchRes.data);
      if (msgRes.success) setMessages(msgRes.data);
      if (feeRes.success) setInvoices(feeRes.data);

      if (primaryChild?._id) {
        const attRes = await attendanceService.getStudentAttendance(primaryChild._id);
        if (attRes.success) setAttendanceSummary(attRes.data);
      }
    } catch (err) {
      console.error('Failed to load parent dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Listen to real-time events via Socket.io
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onAttendanceUpdated = (data) => {
      addNotification({
        type: 'info',
        title: 'Attendance Marked',
        message: `Today's class attendance was marked by ${data.markedByName || 'Teacher'}.`,
      });
      loadData();
    };

    const onGradeUpdated = (data) => {
      addNotification({
        type: 'success',
        title: 'Grade Recorded',
        message: `Score ${data.score}/${data.maxScore} recorded for ${data.taskTitle}!`,
      });
      loadData();
    };

    socket.on('attendance:updated', onAttendanceUpdated);
    socket.on('grade:updated', onGradeUpdated);

    return () => {
      socket.off('attendance:updated', onAttendanceUpdated);
      socket.off('grade:updated', onGradeUpdated);
    };
  }, []);

  const handlePayInvoice = async (invoiceId) => {
    setPayingInvoiceId(invoiceId);
    try {
      await feeService.payInvoice(invoiceId, { paymentReference: `CARD-ONLINE-${Date.now()}` });
      addNotification({
        type: 'success',
        title: 'Payment Successful',
        message: 'Tuition invoice has been settled.',
      });
      loadData();
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Payment Failed',
        message: err.message,
      });
    } finally {
      setPayingInvoiceId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading family academic records..." />;
  }

  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const unpaidInvoices = invoices.filter((i) => i.status === 'pending');

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Parent Portal: {user?.name || 'Parent Guardian'}
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Monitoring: <span className="font-bold text-slate-800">{primaryChild?.name || 'Enrolled Child'}</span> • {primaryChild?.grade || user?.grade || 'Grade 8'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('batching')}
            className="px-4 py-2.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-[#2563EB] rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
          >
            <Layers className="w-4 h-4" />
            <span>Task Batching</span>
          </button>

          <button
            onClick={() => onNavigate('messages')}
            className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1.5"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Message Teachers</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Live Attendance</span>
            <CalendarCheck2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-3xl font-extrabold text-emerald-600 block mb-1">
            {attendanceSummary?.attendancePercentage || 98}%
          </span>
          <span className="text-[11px] text-slate-400">
            {attendanceSummary?.presentDays || 18} days present this term
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Pending Tasks</span>
            <BookOpen className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-3xl font-extrabold text-amber-600 block mb-1">
            {pendingTasks.length}
          </span>
          <span className="text-[11px] text-slate-400">
            {completedTasks.length} completed
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Tuition Invoices</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900 block mb-1">
            {unpaidInvoices.length}
          </span>
          <span className="text-[11px] text-slate-400">
            {unpaidInvoices.length > 0 ? 'Payment due' : 'All clear'}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Teacher Messages</span>
            <MessageSquare className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-3xl font-extrabold text-indigo-600 block mb-1">
            {messages.length}
          </span>
          <span className="text-[11px] text-slate-400">Recent announcements</span>
        </div>
      </div>

      {/* Grid: School Fee Invoices + Homework Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Fee Invoices & Payment Section */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>School Fees & Invoices</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Verified Gateway</span>
          </div>

          {invoices.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No outstanding fees on record for this academic term.
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div
                  key={inv._id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800 text-sm">{inv.title}</p>
                    <p className="text-slate-500">
                      Amount: <span className="font-extrabold text-slate-900">${inv.amount}</span> • Due: {new Date(inv.dueDate).toLocaleDateString()}
                    </p>
                    {inv.paymentReference && (
                      <p className="text-[10px] text-slate-400">Ref: {inv.paymentReference}</p>
                    )}
                  </div>

                  <div>
                    {inv.status === 'paid' ? (
                      <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold">
                        <Check className="w-3.5 h-3.5" />
                        <span>Paid</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handlePayInvoice(inv._id)}
                        disabled={payingInvoiceId === inv._id}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm transition"
                      >
                        {payingInvoiceId === inv._id ? 'Processing...' : 'Pay Now'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Homework & Released Batches */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Assigned Homework</span>
            </h3>
            <button
              onClick={() => onNavigate('batching')}
              className="text-xs text-[#2563EB] hover:underline font-bold"
            >
              Organize into Batches →
            </button>
          </div>

          <div className="space-y-3">
            {tasks.slice(0, 4).map((task) => (
              <div
                key={task._id}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-bold text-slate-800">{task.title}</p>
                    <Badge variant={task.status === 'completed' ? 'success' : 'warning'}>
                      {task.status}
                    </Badge>
                  </div>
                  <p className="text-slate-500 mt-0.5">{task.subject} • Due {new Date(task.dueDate).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 font-medium">{task.batchName || 'General'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* AI Digest Card */}
      <AISummaryCard
        studentId={primaryChild?._id}
        studentName={primaryChild?.name || 'Alex'}
      />

    </div>
  );
};
