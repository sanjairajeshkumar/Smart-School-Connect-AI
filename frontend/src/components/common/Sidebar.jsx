import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  Bot,
  Layers,
  CalendarCheck2,
  Users,
  CreditCard,
  Building,
  MailPlus,
  Sparkles,
} from 'lucide-react';

export const Sidebar = ({ activeTab, onSelectTab, role }) => {
  const getNavItems = () => {
    // School Admin / Super Admin Nav Items
    if (role === 'school_admin' || role === 'super_admin') {
      return [
        { id: 'overview', label: 'Admin Overview', icon: LayoutDashboard },
        { id: 'classes', label: 'Classes & Structure', icon: Building },
        { id: 'invitations', label: 'Invites & Directory', icon: MailPlus },
        { id: 'attendance', label: 'School Attendance', icon: CalendarCheck2 },
        { id: 'messages', label: 'Announcements', icon: MessageSquare },
        { id: 'ai-assistant', label: 'School AI', icon: Bot, isAi: true },
      ];
    }

    // Teacher Nav Items
    if (role === 'teacher') {
      return [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'attendance', label: 'Daily Attendance', icon: CalendarCheck2 },
        { id: 'homework', label: 'Assignments & Grading', icon: BookOpen },
        { id: 'messages', label: 'Parent Messages', icon: MessageSquare },
        { id: 'ai-assistant', label: 'AI Message Assistant', icon: Bot, isAi: true },
      ];
    }

    // Parent Nav Items
    if (role === 'parent') {
      return [
        { id: 'overview', label: 'Child Overview', icon: LayoutDashboard },
        { id: 'homework', label: 'Homework & Grades', icon: BookOpen },
        { id: 'batching', label: 'Focus Batching', icon: Layers },
        { id: 'messages', label: 'Teacher Chat', icon: MessageSquare },
        { id: 'ai-assistant', label: 'AI Homework Help', icon: Bot, isAi: true },
      ];
    }

    // Student Nav Items
    return [
      { id: 'overview', label: 'My School Day', icon: LayoutDashboard },
      { id: 'homework', label: 'My Assignments', icon: BookOpen },
      { id: 'ai-assistant', label: 'Ask School AI', icon: Bot, isAi: true },
    ];
  };

  const navItems = getNavItems();

  return (
    <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 py-6 px-4 shrink-0">
      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#EEF2FF] text-[#2563EB] font-semibold shadow-sm border border-blue-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#2563EB]' : 'text-slate-400'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.isAi && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                  AI
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Role Context Helper */}
      <div className="mt-8 pt-6 border-t border-slate-100 hidden md:block">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-1.5">
          <p className="font-semibold text-slate-800 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Role Context</span>
          </p>
          <p className="leading-relaxed">
            {role === 'school_admin' && 'Manage tenant classes, send real email invites to staff/students/parents, track attendance and SaaS limits.'}
            {role === 'teacher' && 'Mark daily live attendance, publish assignments, grade student submissions, and compose parent updates.'}
            {role === 'parent' && 'Track live attendance, review graded work, sequence focus study batches, and communicate with teachers.'}
            {role === 'student' && 'View your daily timetable, submit assignments for grading, and track your learning progress.'}
          </p>
        </div>
      </div>
    </aside>
  );
};
