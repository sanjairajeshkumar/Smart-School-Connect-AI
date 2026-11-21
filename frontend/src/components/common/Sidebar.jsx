import React from 'react';
import { LayoutDashboard, BookOpen, MessageSquare, Bot, Sparkles, Layers } from 'lucide-react';

export const Sidebar = ({ activeTab, onSelectTab, role }) => {
  const getNavItems = () => {
    const items = [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'homework', label: role === 'student' ? 'My homework' : 'Homework', icon: BookOpen },
      { id: 'messages', label: 'Messages', icon: MessageSquare },
      { id: 'ai-assistant', label: 'AI assistant', icon: Bot, isAi: true },
    ];

    if (role === 'parent') {
      items.splice(2, 0, { id: 'batching', label: 'Task Batching', icon: Layers });
    }

    return items;
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

      {/* Role Scoped Info Card */}
      <div className="mt-8 pt-6 border-t border-slate-100 hidden md:block">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-1.5">
          <p className="font-semibold text-slate-800 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Role Context</span>
          </p>
          <p className="leading-relaxed">
            {role === 'teacher' && 'Draft assignments, rewrite messages with AI approval, and view class completion rates.'}
            {role === 'parent' && 'Review child homework, organize into sequential focus batches, and message teachers.'}
            {role === 'student' && 'View assigned work, track study minutes, and check off completed tasks.'}
          </p>
        </div>
      </div>
    </aside>
  );
};
