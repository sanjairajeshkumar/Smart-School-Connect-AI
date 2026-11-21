import React from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { useAuth } from '../context/AuthContext';

export const DashboardLayout = ({ activeTab, onSelectTab, children }) => {
  const { role } = useAuth();

  const getSectionTitle = () => {
    switch (activeTab) {
      case 'overview':
        return 'Overview';
      case 'homework':
        return role === 'student' ? 'My homework' : 'Homework';
      case 'messages':
        return 'Messages';
      case 'ai-assistant':
        return 'AI assistant';
      case 'batching':
        return 'Task Batching';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex flex-col">
      {/* Top Navbar */}
      <Navbar currentSection={getSectionTitle()} />

      {/* Main Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} onSelectTab={onSelectTab} role={role} />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
