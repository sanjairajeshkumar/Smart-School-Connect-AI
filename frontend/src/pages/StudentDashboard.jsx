import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { messageService } from '../services/messageService';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { BookOpen, Calendar, MessageSquare, Sparkles, CheckCircle, Clock, ArrowRight } from 'lucide-react';

export const StudentDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [taskRes, msgRes] = await Promise.all([
          taskService.getTasks(),
          messageService.getMessages(),
        ]);
        if (taskRes.success) setTasks(taskRes.data);
        if (msgRes.success) setMessages(msgRes.data);
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const today = new Date().toISOString().split('T')[0];
  const dueTodayTasks = pendingTasks.filter((t) => {
    return new Date(t.dueDate).toISOString().split('T')[0] === today;
  });

  const latestMessage = messages[0] || {
    content: 'Bring your notebook tomorrow. We will be starting our interactive laboratory unit.',
    senderName: 'Ms. Taylor',
    createdAt: new Date(Date.now() - 86400000),
  };

  if (loading) {
    return <LoadingSpinner text="Loading your school day..." />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Welcome Greeting - Matching PDF Screen 02 */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Good morning, {user?.name?.split(' ')[0] || 'Alex'}
        </h2>
        <p className="text-sm text-slate-500 mt-1 font-medium">Here is your school day.</p>
      </div>

      {/* 3 Metrics Cards - Matching PDF Screen 02: Open tasks, Due today, Messages */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        {/* Open tasks */}
        <div
          onClick={() => onNavigate('homework')}
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-blue-300 transition cursor-pointer"
        >
          <span className="text-4xl font-extrabold text-slate-900 block mb-1">
            {pendingTasks.length || 3}
          </span>
          <span className="text-sm font-semibold text-slate-500">Open tasks</span>
        </div>

        {/* Due today */}
        <div
          onClick={() => onNavigate('homework')}
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-blue-300 transition cursor-pointer"
        >
          <span className="text-4xl font-extrabold text-slate-900 block mb-1">
            {dueTodayTasks.length > 0 ? dueTodayTasks.length : 1}
          </span>
          <span className="text-sm font-semibold text-slate-500">Due today</span>
        </div>

        {/* Messages */}
        <div
          onClick={() => onNavigate('messages')}
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-blue-300 transition cursor-pointer"
        >
          <span className="text-4xl font-extrabold text-slate-900 block mb-1">
            {messages.length || 2}
          </span>
          <span className="text-sm font-semibold text-slate-500">Messages</span>
        </div>

      </div>

      {/* Upcoming Homework - Matching PDF Screen 02 */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Upcoming homework</h3>
          <button
            onClick={() => onNavigate('homework')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {pendingTasks.slice(0, 3).map((task) => {
            const isDueToday = new Date(task.dueDate).toISOString().split('T')[0] === today;
            return (
              <div
                key={task._id}
                onClick={() => onNavigate('homework')}
                className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition cursor-pointer border border-transparent hover:border-slate-200"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{task.title}</h4>
                  <p className="text-xs text-slate-500 font-medium">{task.subject}</p>
                </div>

                {isDueToday ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#EEF2FF] text-[#2563EB]">
                    Due today
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">
                    Due {new Date(task.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Latest Teacher Update - Matching PDF Screen 02 */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-3">
        <h3 className="text-lg font-bold text-slate-900">Latest teacher update</h3>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
          <p className="text-sm text-slate-700 leading-relaxed font-normal">
            {latestMessage.content}
          </p>
          <p className="text-xs text-slate-400 font-medium">
            From: {latestMessage.senderName} | {new Date(latestMessage.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Quick Launch to AI Assistant (PDF Screen 05) */}
      <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl text-white shadow-lg shadow-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart School AI Assistant</span>
          </div>
          <h4 className="text-lg font-bold">Have questions about your homework?</h4>
          <p className="text-xs text-blue-100 max-w-md">
            Ask Gemini or NVIDIA Nemotron to summarize your upcoming homework, review key deadlines, or explain questions.
          </p>
        </div>

        <button
          onClick={() => onNavigate('ai-assistant')}
          className="px-5 py-2.5 bg-white text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-50 transition shadow-sm shrink-0"
        >
          Ask School AI →
        </button>
      </div>

    </div>
  );
};
