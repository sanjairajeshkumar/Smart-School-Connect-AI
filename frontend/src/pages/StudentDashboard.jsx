import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { messageService } from '../services/messageService';
import { attendanceService } from '../services/attendanceService';
import { getSocket } from '../services/socket';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StudentWorkSubmitModal } from '../components/tasks/StudentWorkSubmitModal';
import {
  BookOpen,
  Calendar,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  CalendarCheck2,
  Award,
  Camera,
} from 'lucide-react';

export const StudentDashboard = ({ onNavigate }) => {
  const { user, addNotification } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  // Homework submission modal state
  const [activeTaskForSubmission, setActiveTaskForSubmission] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [timeSpent, setTimeSpent] = useState('30');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [taskRes, msgRes, attRes] = await Promise.all([
        taskService.getTasks(),
        messageService.getMessages(),
        attendanceService.getStudentAttendance(user?._id),
      ]);

      if (taskRes.success) setTasks(taskRes.data);
      if (msgRes.success) setMessages(msgRes.data);
      if (attRes.success) setAttendance(attRes.data);
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
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

    const onGradeUpdated = (data) => {
      addNotification({
        type: 'success',
        title: 'Grade Received!',
        message: `Teacher ${data.gradedByName} graded your assignment: ${data.score}/${data.maxScore}!`,
      });
      loadData();
    };

    const onTaskCreated = () => {
      loadData();
    };

    socket.on('grade:updated', onGradeUpdated);
    socket.on('task:created', onTaskCreated);

    return () => {
      socket.off('grade:updated', onGradeUpdated);
      socket.off('task:created', onTaskCreated);
    };
  }, []);

  const handleOpenSubmit = (task) => {
    setActiveTaskForSubmission(task);
    setSubmissionText(task.submission?.content || '');
    setTimeSpent(task.submission?.timeSpentMinutes?.toString() || '30');
  };

  const handleSubmitting = async (e) => {
    e.preventDefault();
    if (!activeTaskForSubmission) return;
    setSubmitting(true);
    try {
      await taskService.submitAssignment(activeTaskForSubmission._id, {
        content: submissionText,
        timeSpentMinutes: Number(timeSpent),
      });
      addNotification({
        type: 'success',
        title: 'Homework Turned In!',
        message: `Your work for "${activeTaskForSubmission.title}" has been submitted to your teacher.`,
      });
      setActiveTaskForSubmission(null);
      loadData();
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Submission Failed',
        message: err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your school day..." />;
  }

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  // Sample or loaded class schedule
  const schedule = [
    { subject: 'Mathematics', time: '09:00 - 10:00 AM', room: 'Room 204', teacher: 'Lead Faculty' },
    { subject: 'Science (Laboratory)', time: '10:15 - 11:15 AM', room: 'Lab B', teacher: 'Lead Faculty' },
    { subject: 'English Literature', time: '11:30 - 12:30 PM', room: 'Room 204', teacher: 'Lead Faculty' },
    { subject: 'Physical Education', time: '01:30 - 02:30 PM', room: 'Gymnasium', teacher: 'Athletics Coach' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Welcome Greeting */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Good morning, {user?.name?.split(' ')[0] || 'Student'}
        </h2>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          {user?.grade || 'Grade 8'} • Homeroom Section {user?.section || 'A'}
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div
          onClick={() => onNavigate('homework')}
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-blue-300 transition cursor-pointer"
        >
          <span className="text-3xl font-extrabold text-slate-900 block mb-1">
            {pendingTasks.length}
          </span>
          <span className="text-xs font-semibold text-slate-500">Open Homework</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <span className="text-3xl font-extrabold text-emerald-600 block mb-1">
            {completedTasks.length}
          </span>
          <span className="text-xs font-semibold text-slate-500">Completed & Graded</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <span className="text-3xl font-extrabold text-blue-600 block mb-1">
            {attendance?.attendancePercentage || 98}%
          </span>
          <span className="text-xs font-semibold text-slate-500">Attendance Rate</span>
        </div>

        <div
          onClick={() => onNavigate('messages')}
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-blue-300 transition cursor-pointer"
        >
          <span className="text-3xl font-extrabold text-indigo-600 block mb-1">
            {messages.length}
          </span>
          <span className="text-xs font-semibold text-slate-500">School Notices</span>
        </div>
      </div>

      {/* Class Schedule Timetable */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span>Today's Class Timetable</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {schedule.map((item, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-xs"
            >
              <span className="text-[11px] font-bold text-blue-600 block">{item.time}</span>
              <p className="font-bold text-slate-800 text-sm">{item.subject}</p>
              <p className="text-slate-500">{item.room} • {item.teacher}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Homework & Submissions Hub */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span>Assignments & Submission Hub</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">Turn in work directly</span>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No homework assigned at this time.
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const submission = task.submission;
              const isGraded = submission?.status === 'graded';
              const isSubmitted = submission?.status === 'submitted' || task.status === 'completed';

              return (
                <div
                  key={task._id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-800">{task.title}</span>
                      <Badge variant={task.priority === 'high' ? 'danger' : 'neutral'}>
                        {task.subject}
                      </Badge>
                      <span className="text-xs text-slate-400">Max: {task.maxScore || 100} pts</span>
                    </div>
                    <p className="text-xs text-slate-500">{task.description}</p>
                    <p className="text-[11px] text-slate-400">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>

                    {/* Work Photo(s) attached preview */}
                    {((submission?.attachments && submission.attachments.length > 0) || submission?.attachmentUrl) && (() => {
                      const photos = (submission?.attachments && submission.attachments.length > 0)
                        ? submission.attachments
                        : [submission.attachmentUrl];
                      return (
                        <div
                          onClick={() => handleOpenSubmit(task)}
                          className="mt-2 inline-flex items-center space-x-2.5 p-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs cursor-pointer hover:border-blue-300 transition"
                        >
                          <img
                            src={photos[0]}
                            alt="Homework Work"
                            className="w-10 h-10 object-cover rounded-lg border border-slate-100"
                          />
                          <span className="text-[11px] font-bold text-blue-600 flex items-center space-x-1 pr-2">
                            <Camera className="w-3.5 h-3.5" />
                            <span>
                              {photos.length === 1
                                ? 'View Work Photo'
                                : `View Work Photos (${photos.length} pages)`}
                            </span>
                          </span>
                        </div>
                      );
                    })()}

                    {/* Teacher Feedback pill if graded */}
                    {isGraded && (
                      <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center space-x-2">
                        <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-bold">Score: {submission.score} / {submission.maxScore || 100}</span>
                          {submission.feedback && <span> • Feedback: "{submission.feedback}"</span>}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center space-x-2">
                    {isGraded ? (
                      <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
                        Graded ({submission.score} pts)
                      </span>
                    ) : isSubmitted ? (
                      <button
                        onClick={() => handleOpenSubmit(task)}
                        className="px-3 py-1.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl text-xs font-bold transition"
                      >
                        Edit Submission
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenSubmit(task)}
                        className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Work</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Homework Submission Modal with Photo Upload */}
      {activeTaskForSubmission && (
        <StudentWorkSubmitModal
          isOpen={!!activeTaskForSubmission}
          task={activeTaskForSubmission}
          onClose={() => setActiveTaskForSubmission(null)}
          onSubmitted={loadData}
        />
      )}

    </div>
  );
};
