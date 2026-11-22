import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { messageService } from '../services/messageService';
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
  CalendarCheck2,
  GraduationCap,
  Bell,
  Check,
  Award,
  AlertCircle,
  Unlock,
  Lock,
  Camera,
  Eye,
} from 'lucide-react';

export const ParentDashboard = ({ activeTab = 'overview', onNavigate }) => {
  const { user, addNotification } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [batches, setBatches] = useState([]);
  const [messages, setMessages] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Homework tab filtering
  const [homeworkFilter, setHomeworkFilter] = useState('all');
  const [enlargedPhotoUrl, setEnlargedPhotoUrl] = useState(null);

  const linkedChildren = user?.childrenIds || [];
  const primaryChild = linkedChildren[0] || null;

  const loadData = async () => {
    try {
      setLoading(true);
      const [taskRes, batchRes, msgRes] = await Promise.all([
        taskService.getTasks(),
        taskService.getBatches(),
        messageService.getMessages(),
      ]);

      if (taskRes.success) setTasks(taskRes.data || []);
      if (batchRes.success) setBatches(batchRes.data || []);
      if (msgRes.success) setMessages(msgRes.data || []);

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

    const onTaskCreated = () => {
      loadData();
    };

    socket.on('attendance:updated', onAttendanceUpdated);
    socket.on('grade:updated', onGradeUpdated);
    socket.on('task:created', onTaskCreated);

    return () => {
      socket.off('attendance:updated', onAttendanceUpdated);
      socket.off('grade:updated', onGradeUpdated);
      socket.off('task:created', onTaskCreated);
    };
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading family academic records..." />;
  }

  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const activeBatches = batches.filter((b) => b.isReleased);

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
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs space-y-2">
                      <div>
                        <span className="font-bold text-slate-700 block mb-0.5">Submitted Work Content:</span>
                        <p className="text-slate-600">{submission.content || 'Submission turned in.'}</p>
                      </div>

                      {/* Photos Uploaded by Child (Single or Multi-Page) */}
                      {((submission.attachments && submission.attachments.length > 0) || submission.attachmentUrl) && (() => {
                        const photos = (submission.attachments && submission.attachments.length > 0)
                          ? submission.attachments
                          : [submission.attachmentUrl];

                        return (
                          <div className="pt-2 border-t border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                                <Camera className="w-3.5 h-3.5 text-blue-600" />
                                <span>Child's Uploaded Homework Photos ({photos.length} {photos.length === 1 ? 'page' : 'pages'})</span>
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Click photo to inspect full resolution
                              </span>
                            </div>

                            <div className={`grid gap-2 ${photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
                              {photos.map((photo, pIdx) => (
                                <div
                                  key={pIdx}
                                  onClick={() => setEnlargedPhotoUrl(photo)}
                                  className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white p-1 cursor-pointer hover:shadow-xs transition aspect-[4/3] flex items-center justify-center"
                                >
                                  <img
                                    src={photo}
                                    alt={`Student work page ${pIdx + 1}`}
                                    className="max-h-full w-full object-contain rounded-lg"
                                  />
                                  <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-slate-900/80 text-white text-[10px] font-bold rounded-md">
                                    Page {pIdx + 1}
                                  </div>
                                  <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold space-x-1 rounded-xl">
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Zoom</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

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

        {/* Enlarged Photo Lightbox Modal for Parent */}
        {enlargedPhotoUrl && (
          <div
            className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setEnlargedPhotoUrl(null)}
          >
            <div
              className="relative max-w-4xl max-h-[92vh] bg-white rounded-3xl p-5 shadow-2xl overflow-hidden space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>Student Homework Work (Full Size)</span>
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
                alt="Full size child work"
                className="max-h-[78vh] w-auto mx-auto object-contain rounded-xl"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. DEFAULT OVERVIEW VIEW
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
          onClick={() => onNavigate('batching')}
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs cursor-pointer hover:border-blue-300 transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Focus Batches</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-3xl font-extrabold text-purple-600 block mb-1">
            {batches.length}
          </span>
          <span className="text-[11px] text-slate-400">
            {activeBatches.length} active for student
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

      {/* Grid: Study Focus Batches + Homework Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Study Batches Section */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Study Focus Batches</span>
            </h3>
            <button
              onClick={() => onNavigate('batching')}
              className="text-xs text-[#2563EB] hover:underline font-bold"
            >
              Open Studio →
            </button>
          </div>

          {batches.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No task batches organized yet. Click "Open Studio" to create sequential focus batches for Alex!
            </div>
          ) : (
            <div className="space-y-3">
              {batches.slice(0, 3).map((batch, index) => (
                <div
                  key={batch._id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 text-[11px] font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span>{batch.title}</span>
                    </p>
                    <p className="text-slate-500">
                      {batch.taskIds?.length || 0} tasks included {batch.instructions && `• "${batch.instructions}"`}
                    </p>
                  </div>

                  <div>
                    {batch.isReleased ? (
                      <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-[11px]">
                        <Unlock className="w-3 h-3 text-emerald-600" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-xl font-bold text-[11px]">
                        <Lock className="w-3 h-3 text-amber-600" />
                        <span>Locked</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Homework & Released Tasks */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Assigned Homework</span>
            </h3>
            <button
              onClick={() => onNavigate('homework')}
              className="text-xs text-[#2563EB] hover:underline font-bold"
            >
              View All Tasks →
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
