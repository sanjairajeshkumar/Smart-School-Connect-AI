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
import { TaskBatchManager } from '../components/tasks/TaskBatchManager';
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
  Award,
  DollarSign,
  ShieldCheck,
  FileText,
  AlertCircle,
} from 'lucide-react';

export const ParentDashboard = ({ activeTab = 'overview', onNavigate }) => {
  const { user, addNotification } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [batches, setBatches] = useState([]);
  const [messages, setMessages] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payingInvoiceId, setPayingInvoiceId] = useState(null);

  // Homework tab filtering
  const [homeworkFilter, setHomeworkFilter] = useState('all');

  // Pay online modal state
  const [selectedInvoiceToPay, setSelectedInvoiceToPay] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [cardLast4, setCardLast4] = useState('4242');

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

    const onInvoiceCreated = (data) => {
      addNotification({
        type: 'info',
        title: 'New Fee Invoice',
        message: `A tuition invoice of $${data.amount} has been issued: ${data.title}`,
      });
      loadData();
    };

    socket.on('attendance:updated', onAttendanceUpdated);
    socket.on('grade:updated', onGradeUpdated);
    socket.on('invoice:created', onInvoiceCreated);

    return () => {
      socket.off('attendance:updated', onAttendanceUpdated);
      socket.off('grade:updated', onGradeUpdated);
      socket.off('invoice:created', onInvoiceCreated);
    };
  }, []);

  const handlePayInvoice = async (invoiceId) => {
    setPayingInvoiceId(invoiceId);
    try {
      const ref = `CARD-ONLINE-${Date.now().toString().slice(-6)}`;
      await feeService.payInvoice(invoiceId, { paymentReference: ref });
      addNotification({
        type: 'success',
        title: 'Tuition Payment Confirmed',
        message: `Receipt generated with reference #${ref}. Invoice marked settled.`,
      });
      setSelectedInvoiceToPay(null);
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
  const paidInvoices = invoices.filter((i) => i.status === 'paid');
  const totalBilled = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const outstandingBalance = unpaidInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  // 1. DEDICATED VIEW: FOCUS BATCHING STUDIO
  if (activeTab === 'batching') {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Focus Batching Studio
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Curate and sequence learning batches for <span className="font-bold text-slate-800">{primaryChild?.name || 'Alex Parker'}</span> to eliminate academic overload.
            </p>
          </div>
          <button
            onClick={() => onNavigate('overview')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition w-fit"
          >
            ← Return to Child Overview
          </button>
        </div>

        <TaskBatchManager
          tasks={tasks}
          batches={batches}
          onRefresh={loadData}
          studentName={primaryChild?.name || 'Alex Parker'}
          studentId={primaryChild?._id}
        />
      </div>
    );
  }

  // 2. DEDICATED VIEW: HOMEWORK & GRADES
  if (activeTab === 'homework') {
    const filteredTasks = tasks.filter((task) => {
      if (homeworkFilter === 'pending') return task.status === 'pending';
      if (homeworkFilter === 'completed') return task.status === 'completed';
      return true;
    });

    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Homework, Submissions & Grades
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Live curriculum assignments, teacher review scores, and written academic remarks for <span className="font-bold text-slate-800">{primaryChild?.name || 'Alex Parker'}</span>.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigate('batching')}
              className="px-4 py-2.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-[#2563EB] rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
            >
              <Layers className="w-4 h-4" />
              <span>Organize into Batches</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 bg-slate-100/80 p-1.5 rounded-2xl w-fit border border-slate-200">
          {[
            { id: 'all', label: `All Tasks (${tasks.length})` },
            { id: 'pending', label: `Pending (${pendingTasks.length})` },
            { id: 'completed', label: `Completed & Graded (${completedTasks.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setHomeworkFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                homeworkFilter === tab.id
                  ? 'bg-white text-[#2563EB] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Task Cards */}
        {filteredTasks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-sm">
            No assignments match the selected filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const isDone = task.status === 'completed';
              const submission = task.submission;
              const isGraded = submission?.status === 'graded';

              return (
                <div
                  key={task._id}
                  className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4 transition hover:border-slate-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2.5 flex-wrap">
                        <span className="text-base font-bold text-slate-900">{task.title}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {task.subject}
                        </span>
                        {task.batchName && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            {task.batchName}
                          </span>
                        )}
                        <span className="text-xs text-slate-400">
                          Max: {task.maxScore || 100} pts
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center space-x-4 text-xs text-slate-400 pt-1">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</span>
                        </span>
                        <span>Assigned by: {task.teacherName || 'Faculty Teacher'}</span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Badge variant={isDone ? 'success' : 'warning'}>
                        {isDone ? 'Completed' : 'Pending Turn-In'}
                      </Badge>
                    </div>
                  </div>

                  {/* Teacher Feedback Banner if Graded */}
                  {isGraded && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start space-x-3 text-xs">
                      <Award className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-emerald-900 text-sm">
                            Official Score: {submission.score} / {submission.maxScore || 100} ({Math.round(((submission.score || 0) / (submission.maxScore || 100)) * 100)}%)
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded font-bold text-[10px]">
                            VERIFIED
                          </span>
                        </div>
                        {submission.feedback && (
                          <p className="text-emerald-800 italic">
                            Teacher Feedback: "{submission.feedback}"
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Student Submission snapshot if turned in */}
                  {submission && (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs space-y-1">
                      <span className="font-bold text-slate-700">Submitted Work Content:</span>
                      <p className="text-slate-600">{submission.content || 'Submission turned in.'}</p>
                      {submission.timeSpentMinutes > 0 && (
                        <span className="text-[11px] text-slate-400 block pt-1">
                          ⏱ {submission.timeSpentMinutes} minutes logged on assignment
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // 3. DEDICATED VIEW: SCHOOL FEES & INVOICING
  if (activeTab === 'fees') {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            School Tuition & Invoices
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Official billing statements, payment receipts, and digital settlement portal for <span className="font-bold text-slate-800">{primaryChild?.name || 'Alex Parker'}</span>.
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 block mb-1">Total Academic Billed</span>
            <span className="text-3xl font-extrabold text-slate-900 block">${totalBilled.toLocaleString()}</span>
            <span className="text-[11px] text-slate-400 mt-1 block">{invoices.length} total invoice statements</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 block mb-1">Settled / Paid to Date</span>
            <span className="text-3xl font-extrabold text-emerald-600 block">${totalPaid.toLocaleString()}</span>
            <span className="text-[11px] text-emerald-600 font-medium mt-1 block">{paidInvoices.length} settled statements</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 block mb-1">Outstanding Balance Due</span>
            <span className={`text-3xl font-extrabold block ${outstandingBalance > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              ${outstandingBalance.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {outstandingBalance > 0 ? `${unpaidInvoices.length} invoices pending payment` : 'All accounts settled'}
            </span>
          </div>
        </div>

        {/* Invoices List */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Tuition Statements & Receipts</span>
            </h3>
            <span className="text-xs px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-xl border border-emerald-200 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Direct Bank Settlement</span>
            </span>
          </div>

          {invoices.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No fee invoices issued on record for this academic term.
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((inv) => (
                <div
                  key={inv._id}
                  className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-base text-slate-900">{inv.title}</span>
                      <Badge variant={inv.status === 'paid' ? 'success' : 'warning'}>
                        {inv.status === 'paid' ? 'Paid & Settled' : 'Payment Due'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      Amount: <span className="font-extrabold text-slate-900 text-sm">${inv.amount} {inv.currency || 'USD'}</span> • Due Date: {new Date(inv.dueDate).toLocaleDateString()}
                    </p>
                    {inv.paymentReference && (
                      <p className="text-[11px] text-slate-400">
                        Transaction Ref: <span className="font-mono font-bold text-slate-700">{inv.paymentReference}</span>
                        {inv.paidAt && ` • Settled on ${new Date(inv.paidAt).toLocaleDateString()}`}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    {inv.status === 'paid' ? (
                      <span className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Paid Receipt</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => setSelectedInvoiceToPay(inv)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center space-x-1.5"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Pay Invoice Online</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal: Interactive Online Tuition Payment */}
        {selectedInvoiceToPay && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Online Tuition Settlement</h3>
                  <p className="text-xs text-slate-500">Fast, encrypted school payment gateway</p>
                </div>
                <button
                  onClick={() => setSelectedInvoiceToPay(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="text-xs text-slate-500 font-medium">Invoice Description</span>
                <p className="font-bold text-slate-900 text-sm">{selectedInvoiceToPay.title}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 mt-2">
                  <span className="text-xs text-slate-600">Total Payable:</span>
                  <span className="text-xl font-extrabold text-slate-900">
                    ${selectedInvoiceToPay.amount} {selectedInvoiceToPay.currency || 'USD'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`p-3 rounded-xl border text-xs font-bold text-center transition ${
                      paymentMethod === 'credit_card'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    💳 Card (•••• 4242)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`p-3 rounded-xl border text-xs font-bold text-center transition ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🏦 Instant Bank Pay
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>256-bit encrypted school payment gateway with immediate receipt.</span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceToPay(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={payingInvoiceId === selectedInvoiceToPay._id}
                  onClick={() => handlePayInvoice(selectedInvoiceToPay._id)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5"
                >
                  {payingInvoiceId === selectedInvoiceToPay._id ? (
                    <span>Processing Payment...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm & Pay ${selectedInvoiceToPay.amount}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 4. DEFAULT OVERVIEW VIEW
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Parent Portal: {user?.name || 'David Parker (Parent)'}
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Monitoring: <span className="font-bold text-slate-800">{primaryChild?.name || 'Alex Parker (Student)'}</span> • {primaryChild?.grade || user?.grade || 'Grade 8'}
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

        <div
          onClick={() => onNavigate('homework')}
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs cursor-pointer hover:border-blue-300 transition"
        >
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

        <div
          onClick={() => onNavigate('fees')}
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs cursor-pointer hover:border-blue-300 transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Tuition Invoices</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900 block mb-1">
            {unpaidInvoices.length}
          </span>
          <span className="text-[11px] text-slate-400">
            {unpaidInvoices.length > 0 ? `$${outstandingBalance} due • click to pay` : 'All clear'}
          </span>
        </div>

        <div
          onClick={() => onNavigate('messages')}
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs cursor-pointer hover:border-blue-300 transition"
        >
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
            <button
              onClick={() => onNavigate('fees')}
              className="text-xs text-[#2563EB] hover:underline font-bold"
            >
              View All Invoices →
            </button>
          </div>

          {invoices.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No outstanding fees on record for this academic term.
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.slice(0, 3).map((inv) => (
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
            {tasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No assignments currently scheduled.</p>
            ) : (
              tasks.slice(0, 4).map((task) => (
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
                    <p className="text-slate-500 mt-0.5">
                      {task.subject} • Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 font-medium">{task.batchName || 'General Queue'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* AI Digest Card */}
      <AISummaryCard
        studentId={primaryChild?._id}
        studentName={primaryChild?.name || 'Alex Parker'}
      />

    </div>
  );
};
