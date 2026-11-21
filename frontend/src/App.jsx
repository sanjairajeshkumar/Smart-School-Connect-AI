import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { ParentDashboard } from './pages/ParentDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { HomeworkTasksPage } from './pages/HomeworkTasksPage';
import { MessagesPage } from './pages/MessagesPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { TaskBatchManager } from './components/tasks/TaskBatchManager';
import { taskService } from './services/taskService';
import { LoadingSpinner } from './components/common/LoadingSpinner';

export default function App() {
  const { isAuthenticated, role, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [parentTasks, setParentTasks] = useState([]);
  const [parentBatches, setParentBatches] = useState([]);

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

  React.useEffect(() => {
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

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderContent = () => {
    // 1. Overview Tab (Role-Specific)
    if (activeTab === 'overview') {
      if (role === 'teacher') return <TeacherDashboard onNavigate={setActiveTab} />;
      if (role === 'parent') return <ParentDashboard onNavigate={setActiveTab} />;
      if (role === 'student') return <StudentDashboard onNavigate={setActiveTab} />;
    }

    // 2. Homework Tab
    if (activeTab === 'homework') {
      return <HomeworkTasksPage />;
    }

    // 3. Messages Tab
    if (activeTab === 'messages') {
      return <MessagesPage />;
    }

    // 4. AI Assistant Tab (Ask School AI)
    if (activeTab === 'ai-assistant') {
      return <AIAssistantPage />;
    }

    // 5. Parent Task Batching Tab
    if (activeTab === 'batching' && role === 'parent') {
      return (
        <TaskBatchManager
          tasks={parentTasks}
          batches={parentBatches}
          onRefresh={loadBatchingData}
          studentName="Alex Johnson"
        />
      );
    }

    return <StudentDashboard onNavigate={setActiveTab} />;
  };

  return (
    <DashboardLayout activeTab={activeTab} onSelectTab={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
}
