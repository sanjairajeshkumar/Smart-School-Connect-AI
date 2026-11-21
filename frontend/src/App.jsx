import React, { useState, useEffect } from 'react';
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
import { TaskBatchManager } from './components/tasks/TaskBatchManager';
import { ToastContainer } from './components/common/ToastContainer';
import { taskService } from './services/taskService';
import { LoadingSpinner } from './components/common/LoadingSpinner';

export default function App() {
  const { isAuthenticated, role, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [parentTasks, setParentTasks] = useState([]);
  const [parentBatches, setParentBatches] = useState([]);

  // Check URL query parameters for invitation token
  const urlParams = new URLSearchParams(window.location.search);
  const inviteTokenFromUrl = urlParams.get('token');
  const [inviteToken, setInviteToken] = useState(inviteTokenFromUrl || null);

  // Fetch parent batching data when batching tab is active
  const loadBatchingData = async () => {
    try {
      const [tRes, bRes] = await Promise.all([
        taskService.getTasks(),
        taskService.getBatches(),
      ]);
      if (tRes.success) setParentTasks(tRes.data);
      if (bRes.success) setParentBatches(bRes.data);
    } catch (err) {
      console.error('Failed to load batching data:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'batching' && role === 'parent') {
      loadBatchingData();
    }
  }, [activeTab, role]);

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

    // 3. Overview Tab for other roles
    if (activeTab === 'overview') {
      if (role === 'parent') return <ParentDashboard onNavigate={setActiveTab} />;
      if (role === 'student') return <StudentDashboard onNavigate={setActiveTab} />;
    }

    // 4. Homework Tab
    if (activeTab === 'homework') {
      return <HomeworkTasksPage />;
    }

    // 5. Messages & Announcements Tab
    if (activeTab === 'messages') {
      return <MessagesPage />;
    }

    // 6. AI Assistant Tab (Ask School AI)
    if (activeTab === 'ai-assistant') {
      return <AIAssistantPage />;
    }

    // 7. Parent Task Batching Tab
    if (activeTab === 'batching' && role === 'parent') {
      return (
        <TaskBatchManager
          tasks={parentTasks}
          batches={parentBatches}
          onRefresh={loadBatchingData}
          studentName={user?.childrenIds?.[0]?.name || 'Student'}
        />
      );
    }

    // 8. Parent Fees Tab
    if (activeTab === 'fees' && role === 'parent') {
      return <ParentDashboard onNavigate={setActiveTab} />;
    }

    if (role === 'school_admin') return <SchoolAdminDashboard onNavigate={setActiveTab} />;
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
