import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { messageService } from '../services/messageService';
import { authService } from '../services/authService';
import { attendanceService } from '../services/attendanceService';
import { schoolService } from '../services/schoolService';
import { getSocket } from '../services/socket';
import { AISummaryCard } from '../components/ai/AISummaryCard';
import { TaskCreateModal } from '../components/tasks/TaskCreateModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Badge } from '../components/common/Badge';
import {
  Plus,
  Sparkles,
  MessageSquare,
  BookOpen,
  CalendarCheck2,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileCheck,
  Send,
  Radio,
} from 'lucide-react';

export const TeacherDashboard = ({ onNavigate }) => {
  const { user, addNotification } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Attendance Tab State
  const [selectedClassId, setSelectedClassId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceSaving, setAttendanceSaving] = useState(false);

  // Grading Modal State
  const [gradingTask, setGradingTask] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [gradeSaving, setGradeSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [taskRes, msgRes, studentRes, classRes] = await Promise.all([
        taskService.getTasks(),
        messageService.getMessages(),
        authService.getLinkedStudents(),
        schoolService.getClasses(),
      ]);

      if (taskRes.success) setTasks(taskRes.data);
      if (msgRes.success) setMessages(msgRes.data);
      if (studentRes.success) setStudents(studentRes.data);
      if (classRes.success && classRes.data.length > 0) {
        setClasses(classRes.data);
        setSelectedClassId(classRes.data[0]._id);
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

  // Listen to real-time socket events for live submissions and attendance
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onSubmissionReceived = (data) => {
      addNotification({
        type: 'info',
        title: 'New Submission',
        message: `${data.studentName} submitted ${data.taskTitle}`,
      });
      loadData();
    };

    socket.on('submission:received', onSubmissionReceived);
    return () => {
      socket.off('submission:received', onSubmissionReceived);
    };
  }, []);

  // Fetch Attendance when selectedClassId or date changes
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedClassId) return;
      try {
        const res = await attendanceService.getClassAttendance(selectedClassId, attendanceDate);
        if (res.success && res.data) {
          setAttendanceRecords(res.data.records || []);
        }
      } catch (err) {
        console.error('Failed to load attendance sheet:', err);
      }
    };

    fetchAttendance();
  }, [selectedClassId, attendanceDate]);

  // Handle Attendance status change
  const handleStatusChange = (index, newStatus) => {
    const updated = [...attendanceRecords];
    updated[index].status = newStatus;
    setAttendanceRecords(updated);
  };

  // Bulk mark all present
  const handleMarkAllPresent = () => {
    const updated = attendanceRecords.map((r) => ({ ...r, status: 'present' }));
    setAttendanceRecords(updated);
  };

  // Save Attendance and emit live WebSocket update
  const handleSaveAttendance = async () => {
    setAttendanceSaving(true);
    try {
      await attendanceService.markAttendance({
        classId: selectedClassId,
        date: attendanceDate,
        records: attendanceRecords,
      });
      addNotification({
        type: 'success',
        title: 'Attendance Saved',
        message: `Attendance for ${attendanceDate} broadcasted in real-time.`,
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.message || err.message,
      });
    } finally {
      setAttendanceSaving(false);
    }
  };

  // Open Grading Drawer for a task
  const handleOpenGrading = async (task) => {
    setGradingTask(task);
    setSubmissionsLoading(true);
    try {
      const res = await taskService.getSubmissions(task._id);
      if (res.success) {
        setSubmissions(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  // Submit Grade
  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    setGradeSaving(true);
    try {
      await taskService.gradeSubmission(selectedSubmission._id, {
        score: gradeScore,
        feedback: gradeFeedback,
      });
      addNotification({
        type: 'success',
        title: 'Grade Recorded',
        message: `Feedback & score broadcasted to student & parent in real-time.`,
      });
      setSelectedSubmission(null);
      setGradeScore('');
      setGradeFeedback('');
      // Reload submissions
      handleOpenGrading(gradingTask);
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Grading Error',
        message: err.message,
      });
    } finally {
      setGradeSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading teacher classroom metrics..." />;
  }

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Teacher Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Teacher Portal: {user?.name || 'Faculty Member'}
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Tenant: {user?.schoolId?.name || 'Oakridge International'} • Homeroom {user?.grade || 'Grade 8'}
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
            <span>New Assignment</span>
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
          <span className="text-xs font-semibold text-slate-500">Submissions Turned In</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <span className="text-3xl font-extrabold text-amber-600 block mb-1">
            {pendingCount}
          </span>
          <span className="text-xs font-semibold text-slate-500">Pending Review</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <span className="text-3xl font-extrabold text-blue-600 block mb-1">
            {students.length || 24}
          </span>
          <span className="text-xs font-semibold text-slate-500">Roster Students</span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION: DAILY REAL-TIME ATTENDANCE MARKER                     */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <CalendarCheck2 className="w-5 h-5 text-blue-600" />
              <span>Daily Real-Time Attendance Marker</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Updates parent portals immediately via WebSockets upon saving
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {classes.length > 0 && (
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} - Section {c.section}
                  </option>
                ))}
              </select>
            )}

            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            />

            <button
              onClick={handleMarkAllPresent}
              className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold transition"
            >
              Mark All Present
            </button>

            <button
              onClick={handleSaveAttendance}
              disabled={attendanceSaving}
              className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1.5"
            >
              {attendanceSaving ? <LoadingSpinner text="" /> : <Send className="w-3.5 h-3.5" />}
              <span>Save & Broadcast</span>
            </button>
          </div>
        </div>

        {/* Student Roster Table */}
        {attendanceRecords.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No enrolled students in this class yet. Invite students from the School Admin tab.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {attendanceRecords.map((record, idx) => (
              <div
                key={record.studentId || idx}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-xs text-slate-800 truncate">{record.studentName}</p>
                  <p className="text-[11px] text-slate-400">Status: <span className="capitalize font-semibold text-slate-600">{record.status}</span></p>
                </div>

                <div className="flex items-center space-x-1">
                  {['present', 'absent', 'late'].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(idx, s)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                        record.status === s
                          ? s === 'present'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : s === 'absent'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-amber-500 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {s.charAt(0).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION: ASSIGNMENTS & LIVE GRADING HUB                        */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <span>Assignments & Submissions Review</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review student responses, enter scores out of 100, and broadcast live feedback
            </p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="text-xs font-bold text-[#2563EB] hover:underline"
          >
            + Create Assignment
          </button>
        </div>

        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-800">{task.title}</span>
                  <Badge variant={task.priority === 'high' ? 'danger' : 'neutral'}>
                    {task.subject}
                  </Badge>
                  <span className="text-xs text-slate-400 font-medium">Max: {task.maxScore || 100} pts</span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>
                <p className="text-[11px] text-slate-400">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => handleOpenGrading(task)}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Review Submissions</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: REVIEW & GRADE SUBMISSIONS                             */}
      {/* ------------------------------------------------------------- */}
      {gradingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Submissions: {gradingTask.title}
                </h3>
                <p className="text-xs text-slate-500">Max Score: {gradingTask.maxScore || 100} points</p>
              </div>
              <button
                onClick={() => { setGradingTask(null); setSelectedSubmission(null); }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {submissionsLoading ? (
              <LoadingSpinner text="Fetching student submissions..." />
            ) : submissions.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No students have submitted responses for this assignment yet.
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((sub) => (
                  <div
                    key={sub._id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{sub.studentName}</p>
                        <p className="text-[11px] text-slate-400">
                          Submitted: {new Date(sub.submittedAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        {sub.status === 'graded' ? (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold">
                            Score: {sub.score} / {sub.maxScore || 100}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold">
                            Pending Grade
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700">
                      <p className="font-semibold text-slate-500 mb-1">Student Answer / Work:</p>
                      <p className="whitespace-pre-wrap">{sub.content || 'Attached file submission.'}</p>
                    </div>

                    {sub.feedback && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                        <p className="font-semibold text-blue-700 mb-1">Teacher Feedback:</p>
                        <p>{sub.feedback}</p>
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setGradeScore(sub.score !== null ? sub.score.toString() : '');
                          setGradeFeedback(sub.feedback || '');
                        }}
                        className="px-3 py-1.5 bg-[#2563EB] text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                      >
                        {sub.status === 'graded' ? 'Update Grade' : 'Grade Submission'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Grading Form Modal Layer */}
            {selectedSubmission && (
              <form onSubmit={handleGradeSubmit} className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3 animate-in fade-in">
                <h4 className="font-bold text-xs text-blue-900">
                  Grade {selectedSubmission.studentName}'s Work
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Score (out of {gradingTask.maxScore || 100})
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={gradingTask.maxScore || 100}
                      value={gradeScore}
                      onChange={(e) => setGradeScore(e.target.value)}
                      placeholder="e.g. 95"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Constructive Feedback
                  </label>
                  <textarea
                    rows={2}
                    value={gradeFeedback}
                    onChange={(e) => setGradeFeedback(e.target.value)}
                    placeholder="Provide actionable praise or guidance..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedSubmission(null)}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={gradeSaving}
                    className="px-4 py-1.5 bg-[#2563EB] text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                  >
                    {gradeSaving ? 'Saving...' : 'Broadcast Grade'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Task Create Modal */}
      <TaskCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={loadData}
      />
    </div>
  );
};
