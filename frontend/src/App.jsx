import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { SchoolAdminDashboard } from './pages/SchoolAdminDashboard';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { ParentDashboard } from './pages/ParentDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { HomeworkTasksPage } from './pages/HomeworkTasksPage';
import { MessagesPage } from './pages/MessagesPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { ToastContainer } from './components/common/ToastContainer';
import { LoadingSpinner } from './components/common/LoadingSpinner';

export default function App() {
  const { isAuthenticated, role, loading, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Check URL query parameters for invitation token
  const urlParams = new URLSearchParams(window.location.search);
  const inviteTokenFromUrl = urlParams.get('token');
  const [inviteToken, setInviteToken] = useState(inviteTokenFromUrl || null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8FC]">
        <LoadingSpinner text="Authenticating school session..." />
      </div>
    );
  }

  // Handle Invitation Onboarding Flow
  if (!isAuthenticated && inviteToken) {
    return (
      <>
        <OnboardingPage
          token={inviteToken}
          onComplete={() => {
            // Clear URL token parameter
            window.history.replaceState({}, document.title, window.location.pathname);
            setInviteToken(null);
          }}
        />
        <ToastContainer />
      </>
    );
  }

  // Unauthenticated Login & School Registration Flow
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage onOpenOnboarding={(token) => setInviteToken(token)} />
        <ToastContainer />
      </>
    );
  }

  const renderContent = () => {
    // 1. Super Admin & School Admin Routing
    if (role === 'school_admin' || role === 'super_admin') {
      if (['overview', 'classes', 'invitations', 'fees', 'attendance'].includes(activeTab)) {
        return <SchoolAdminDashboard activeTab={activeTab} onNavigate={setActiveTab} />;
      }
      if (activeTab === 'messages') {
        return <MessagesPage />;
      }
      if (activeTab === 'ai-assistant') {
        return <AIAssistantPage />;
      }
    }

    // 2. Teacher Routing
    if (role === 'teacher') {
      if (['overview', 'attendance', 'homework', 'messages'].includes(activeTab)) {
        return <TeacherDashboard activeTab={activeTab} onNavigate={setActiveTab} />;
      }
      if (activeTab === 'ai-assistant') {
        return <AIAssistantPage />;
      }
    }

    // 3. Parent Routing
    if (role === 'parent') {
      if (['overview', 'homework', 'batching', 'fees'].includes(activeTab)) {
        return <ParentDashboard activeTab={activeTab} onNavigate={setActiveTab} />;
      }
      if (activeTab === 'messages') {
        return <MessagesPage />;
      }
      if (activeTab === 'ai-assistant') {
        return <AIAssistantPage />;
      }
    }

    // 4. Student Routing
    if (role === 'student') {
      if (activeTab === 'overview') {
        return <StudentDashboard onNavigate={setActiveTab} />;
      }
      if (activeTab === 'homework') {
        return <HomeworkTasksPage />;
      }
      if (activeTab === 'messages') {
        return <MessagesPage />;
      }
      if (activeTab === 'ai-assistant') {
        return <AIAssistantPage />;
      }
    }

    // Fallback based on role
    if (role === 'school_admin' || role === 'super_admin') return <SchoolAdminDashboard onNavigate={setActiveTab} />;
    if (role === 'teacher') return <TeacherDashboard onNavigate={setActiveTab} />;
    if (role === 'parent') return <ParentDashboard onNavigate={setActiveTab} />;
    return <StudentDashboard onNavigate={setActiveTab} />;
  };

  return (
    <DashboardLayout activeTab={activeTab} onSelectTab={setActiveTab}>
      {renderContent()}
      <ToastContainer />
    </DashboardLayout>
  );
}
