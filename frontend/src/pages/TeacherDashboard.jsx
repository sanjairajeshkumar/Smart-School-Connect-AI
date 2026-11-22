import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { messageService } from '../services/messageService';
import { authService } from '../services/authService';
import { attendanceService } from '../services/attendanceService';
import { schoolService } from '../services/schoolService';
import { getSocket } from '../services/socket';
import { TaskCreateModal } from '../components/tasks/TaskCreateModal';
import { TeacherMessageComposer } from '../components/messages/TeacherMessageComposer';
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
  Search,
  Filter,
  Check,
  ChevronRight,
  AlertCircle,
  FileText,
  Calendar,
  Layers,
  GraduationCap,
  Camera,
  Eye,
} from 'lucide-react';

export const TeacherDashboard = ({ activeTab = 'overview', onNavigate }) => {
  const { user, addNotification } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const currentClass = classes.find((c) => c._id === selectedClassId) || user?.classId;

  // Homework Filter State
  const [taskFilter, setTaskFilter] = useState('all');
  const [taskSearch, setTaskSearch] = useState('');

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
  const [enlargedPhotoUrl, setEnlargedPhotoUrl] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [taskRes, msgRes, studentRes, classRes] = await Promise.all([
        taskService.getTasks().catch(() => ({ success: false, data: [] })),
        messageService.getMessages().catch(() => ({ success: false, data: [] })),
        authService.getLinkedStudents().catch(() => ({ success: false, data: [] })),
        schoolService.getClasses().catch(() => ({ success: false, data: [] })),
      ]);

      if (taskRes.success) setTasks(taskRes.data || []);
      if (msgRes.success) setMessages(msgRes.data || []);
      if (studentRes.success) setStudents(studentRes.data || []);
      if (classRes.success && classRes.data.length > 0) {
        setClasses(classRes.data);
        // Default to teacher's class if assigned, otherwise first class
        const teacherClassId = user?.classId?._id || user?.classId;
        const matched = classRes.data.find((c) => c._id === teacherClassId) || classRes.data[0];
        setSelectedClassId(matched._id);
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

  // Real-time socket events for live submissions and attendance
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

  // Handle Attendance remarks change
  const handleRemarksChange = (index, remarks) => {
    const updated = [...attendanceRecords];
    updated[index].remarks = remarks;
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
        score: Number(gradeScore),
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
      // Reload submissions & tasks
      handleOpenGrading(gradingTask);
      loadData();
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

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      (t.title && t.title.toLowerCase().includes(taskSearch.toLowerCase())) ||
      (t.subject && t.subject.toLowerCase().includes(taskSearch.toLowerCase()));
    if (taskFilter === 'active') return matchesSearch && t.status !== 'completed';
    if (taskFilter === 'completed') return matchesSearch && t.status === 'completed';
    return matchesSearch;
  });

  // Calculate attendance statistics
  const presentCount = attendanceRecords.filter((r) => r.status === 'present').length;
  const absentCount = attendanceRecords.filter((r) => r.status === 'absent').length;
  const lateCount = attendanceRecords.filter((r) => r.status === 'late').length;
  const totalRecords = attendanceRecords.length;
  const attendanceRate = totalRecords > 0 ? Math.round(((presentCount + lateCount) / totalRecords) * 100) : 100;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* ========================================================================= */}
      {/* TOP HEADER & TEACHER PROFILE BANNER                                       */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeTab === 'overview' && `Teacher Classroom: ${user?.name || 'Faculty Member'}`}
              {activeTab === 'attendance' && 'Daily Attendance & Roll Call'}
              {activeTab === 'homework' && 'Curriculum Assignments & Grading Studio'}
              {activeTab === 'messages' && 'Parent Communication & Updates'}
            </h2>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-full text-xs font-bold uppercase tracking-wider">
              Teacher
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Tenant: {user?.schoolId?.name || 'Hogwarts'} • Homeroom: {currentClass?.name ? `Class ${currentClass.name} - Section ${currentClass.section}` : (user?.classId?.name ? `Class ${user.classId.name} - Section ${user.classId.section}` : `${user?.grade || 'Class 9'} - Section ${user?.section || 'B'}`)}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {activeTab === 'overview' && (
            <>
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
                <span>+ New Assignment</span>
              </button>
            </>
          )}

          {activeTab === 'homework' && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Assignment</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: OVERVIEW                                                          */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Classroom KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            <div 
              onClick={() => onNavigate('homework')} 
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-blue-300 cursor-pointer transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Active Assignments</span>
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-3xl font-extrabold text-slate-900 block">
                {tasks.length}
              </span>
              <span className="text-[11px] text-blue-600 font-medium mt-1 flex items-center space-x-1">
                <span>View all assignments</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Submissions Turned In</span>
                <FileCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-3xl font-extrabold text-emerald-600 block">
                {tasks.reduce((acc, t) => acc + (t.submissionsCount || 0), 0)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">Live Received Work</span>
            </div>

            <div 
              onClick={() => onNavigate('homework')} 
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-amber-300 cursor-pointer transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Pending Review</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-3xl font-extrabold text-amber-600 block">
                {tasks.filter((t) => t.status === 'pending').length}
              </span>
              <span className="text-[11px] text-amber-600 font-medium mt-1 flex items-center space-x-1">
                <span>Grade submissions</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>

            <div 
              onClick={() => onNavigate('attendance')} 
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-indigo-300 cursor-pointer transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Enrolled Students</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-3xl font-extrabold text-indigo-600 block">
                {students.length || attendanceRecords.length || 0}
              </span>
              <span className="text-[11px] text-indigo-600 font-medium mt-1 flex items-center space-x-1">
                <span>Take daily roll-call</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Quick Attendance & Assignments Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left: Today's Roll-Call Status Widget */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                    <CalendarCheck2 className="w-4 h-4 text-blue-600" />
                    <span>Today's Classroom Attendance</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Homeroom section roll-call status</p>
                </div>
                <button
                  onClick={() => onNavigate('attendance')}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  Open Attendance Sheet →
                </button>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-2xl font-black text-emerald-600">{attendanceRate}%</span>
                  <span className="text-xs text-slate-500 block">Present on {attendanceDate}</span>
                </div>
                <div className="flex items-center space-x-3 text-xs font-semibold">
                  <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {presentCount} Present
                  </span>
                  <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                    {absentCount} Absent
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Student Roster Preview</span>
                {attendanceRecords.slice(0, 4).map((rec, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                    <span className="font-semibold text-slate-800">{rec.studentName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      rec.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                      rec.status === 'absent' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {rec.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Active Homework & Tasks Snapshot */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span>Curriculum Tasks & Homework</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Active assignments and submission rates</p>
                </div>
                <button
                  onClick={() => onNavigate('homework')}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  Grading Studio →
                </button>
              </div>

              {tasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No assignments created yet. Click "+ New Assignment" above to assign coursework.
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.slice(0, 3).map((t) => (
                    <div key={t._id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-slate-900 truncate">{t.title}</p>
                        <p className="text-slate-500 text-[11px]">{t.subject} • Due {new Date(t.dueDate).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={() => handleOpenGrading(t)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition shrink-0"
                      >
                        Grade
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: DAILY ATTENDANCE                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <CalendarCheck2 className="w-5 h-5 text-emerald-600" />
                <span>Daily Real-Time Roll Call</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mark attendance and broadcast instant alerts to parents via WebSockets
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

          {/* Attendance KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Class Attendance Rate</span>
              <span className="text-3xl font-extrabold text-emerald-600 block">
                {attendanceRate}%
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">Date: {attendanceDate}</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Present Students</span>
              <span className="text-3xl font-extrabold text-slate-900 block">
                {presentCount}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium mt-1 block">In classroom</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Recorded Absences</span>
              <span className="text-3xl font-extrabold text-rose-600 block">
                {absentCount}
              </span>
              <span className="text-[11px] text-rose-500 font-medium mt-1 block">Parent alerts dispatched</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Late Arrivals</span>
              <span className="text-3xl font-extrabold text-amber-600 block">
                {lateCount}
              </span>
              <span className="text-[11px] text-amber-600 font-medium mt-1 block">Tardy arrival notes</span>
            </div>
          </div>

          {/* Student Roll-Call Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <h3 className="text-lg font-bold text-slate-900">Classroom Roll-Call Roster</h3>

            {attendanceRecords.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No enrolled students found in this section. Invite students from the Superadmin portal.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                      <th className="pb-3 pl-2">Student</th>
                      <th className="pb-3">Roll-Call Status</th>
                      <th className="pb-3 pr-2">Teacher Remarks / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {attendanceRecords.map((record, idx) => (
                      <tr key={record.studentId || idx} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 pl-2 font-bold text-slate-900 flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                            {record.studentName?.charAt(0) || 'S'}
                          </div>
                          <span>{record.studentName}</span>
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center space-x-1.5">
                            {['present', 'absent', 'late'].map((s) => (
                              <button
                                key={s}
                                onClick={() => handleStatusChange(idx, s)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                                  record.status === s
                                    ? s === 'present'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : s === 'absent'
                                      ? 'bg-rose-600 text-white shadow-xs'
                                      : 'bg-amber-500 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 pr-2">
                          <input
                            type="text"
                            placeholder="Optional remark (e.g. excused, arrived 9:15 AM)..."
                            value={record.remarks || ''}
                            onChange={(e) => handleRemarksChange(idx, e.target.value)}
                            className="w-full max-w-md px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: ASSIGNMENTS & GRADING                                             */}
      {/* ========================================================================= */}
      {activeTab === 'homework' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-4 shadow-xs">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search assignments or subjects..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>

            <div className="flex items-center space-x-2">
              {['all', 'active', 'completed'].map((f) => (
                <button
                  key={f}
                  onClick={() => setTaskFilter(f)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize transition ${
                    taskFilter === f
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Assignments Grid */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <span>Curriculum Assignments ({filteredTasks.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Grade homework responses, provide feedback, and record marks</p>
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No assignments found. Click "+ Create Assignment" to assign homework to your students.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredTasks.map((task) => (
                  <div
                    key={task._id}
                    className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4 hover:border-slate-300 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-100 text-blue-800">
                        {task.subject}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-base text-slate-900">{task.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                      <span className="font-bold text-slate-700">Max Score: {task.maxScore || 100} pts</span>
                      <button
                        onClick={() => handleOpenGrading(task)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5"
                      >
                        <FileCheck className="w-4 h-4" />
                        <span>Review & Grade</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: PARENT MESSAGES                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'messages' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <TeacherMessageComposer
            students={students}
            recentMessages={messages}
            onMessageSent={loadData}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SUBMISSION REVIEW & REAL-TIME GRADING                              */}
      {/* ========================================================================= */}
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
              <div className="py-12 text-center text-xs text-slate-400">
                No student submissions turned in for this assignment yet.
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((sub) => (
                  <div
                    key={sub._id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">
                        {sub.studentId?.name || 'Enrolled Student'}
                      </span>
                      {sub.score !== undefined && sub.score !== null ? (
                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          Graded: {sub.score} / {gradingTask.maxScore || 100}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Ungraded
                        </span>
                      )}
                    </div>

                    <div className="p-3 bg-white border border-slate-100 rounded-xl text-xs text-slate-700 whitespace-pre-wrap">
                      {sub.content ? (
                        <div>
                          <span className="font-semibold text-slate-400 uppercase text-[10px] block mb-0.5">Student Notes</span>
                          {sub.content}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No written solution notes provided.</span>
                      )}
                    </div>

                    {/* Student's Uploaded Work Photos (Single or Multi-Page) */}
                    {((sub.attachments && sub.attachments.length > 0) || sub.attachmentUrl) && (() => {
                      const photos = (sub.attachments && sub.attachments.length > 0)
                        ? sub.attachments
                        : [sub.attachmentUrl];

                      return (
                        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                              <Camera className="w-3.5 h-3.5 text-blue-600" />
                              <span>Student's Submitted Work ({photos.length} {photos.length === 1 ? 'page' : 'pages'})</span>
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Click any page to zoom in full resolution
                            </span>
                          </div>

                          <div className={`grid gap-2.5 ${photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
                            {photos.map((photo, pIdx) => (
                              <div
                                key={pIdx}
                                onClick={() => setEnlargedPhotoUrl(photo)}
                                className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer p-1.5 aspect-[4/3]"
                              >
                                <img
                                  src={photo}
                                  alt={`Homework page ${pIdx + 1}`}
                                  className="w-full h-full object-contain rounded-lg transition group-hover:scale-102"
                                />
                                <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-slate-900/80 text-white text-[10px] font-bold rounded-md">
                                  Page {pIdx + 1}
                                </div>
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold space-x-1 rounded-xl">
                                  <Eye className="w-4 h-4" />
                                  <span>Zoom Page</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {selectedSubmission?._id === sub._id ? (
                      <form onSubmit={handleGradeSubmit} className="space-y-3 pt-2 border-t border-slate-200">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Review & Feedback (Dispatched to Student & Parent)
                            </label>
                            <input
                              type="text"
                              value={gradeFeedback}
                              onChange={(e) => setGradeFeedback(e.target.value)}
                              placeholder="e.g. Excellent solution! Well explained."
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setSelectedSubmission(null)}
                            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={gradeSaving}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center space-x-1"
                          >
                            <span>{gradeSaving ? 'Broadcasting & Emailing...' : 'Save & Send Review'}</span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setGradeScore(sub.score !== undefined && sub.score !== null ? sub.score : '');
                          setGradeFeedback(sub.feedback || '');
                        }}
                        className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                      >
                        {sub.score !== undefined && sub.score !== null ? 'Edit Grade & Feedback' : 'Enter Grade & Feedback'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task Create Modal */}
      {isCreateOpen && (
        <TaskCreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onTaskCreated={loadData}
          classes={classes}
          currentClass={currentClass}
          students={students}
        />
      )}

      {/* Enlarged Photo Lightbox Modal for Teacher */}
      {enlargedPhotoUrl && (
        <div
          className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setEnlargedPhotoUrl(null)}
        >
          <div
            className="relative max-w-5xl max-h-[92vh] bg-white rounded-3xl p-5 shadow-2xl overflow-hidden space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Student Work Photo (High Resolution)</span>
              </h4>
              <button
                type="button"
                onClick={() => setEnlargedPhotoUrl(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>
            <img
              src={enlargedPhotoUrl}
              alt="Full size student work"
              className="max-h-[78vh] w-auto mx-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
