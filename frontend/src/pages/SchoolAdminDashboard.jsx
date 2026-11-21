import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { schoolService } from '../services/schoolService';
import { authService } from '../services/authService';
import { attendanceService } from '../services/attendanceService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Building2,
  Users,
  GraduationCap,
  CalendarCheck2,
  CreditCard,
  MailPlus,
  Plus,
  Send,
  Trash2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Key,
  Copy,
  Check,
  Shield,
  Lock,
  Search,
  Filter,
  DollarSign,
  AlertCircle,
  FileText,
  Calendar,
  Layers,
  ChevronRight,
  Eye,
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  UserCheck,
} from 'lucide-react';

export const SchoolAdminDashboard = ({ activeTab = 'overview', onNavigate }) => {
  const { user, addNotification } = useAuth();

  // Core Data States
  const [analytics, setAnalytics] = useState(null);
  const [classes, setClasses] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [directoryUsers, setDirectoryUsers] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [attendanceOverview, setAttendanceOverview] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('teacher');
  const [inviteClassId, setInviteClassId] = useState('');
  const [inviteStudentId, setInviteStudentId] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState(null);

  const [isClassOpen, setIsClassOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassSection, setNewClassSection] = useState('A');
  const [newClassRoom, setNewClassRoom] = useState('');
  const [classLoading, setClassLoading] = useState(false);

  // Class Details Cockpit Modal State
  const [selectedClassForModal, setSelectedClassForModal] = useState(null);
  const [classDetailData, setClassDetailData] = useState(null);
  const [loadingClassDetail, setLoadingClassDetail] = useState(false);

  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [adminName, setAdminName] = useState(user?.name || 'Super Administrator');
  const [adminEmail, setAdminEmail] = useState(user?.email || 'admin');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);

  // Load All Tab Data
  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, classRes, inviteRes, studentRes, usersRes, attRes] = await Promise.all([
        schoolService.getAnalytics().catch(() => ({ success: false })),
        schoolService.getClasses().catch(() => ({ success: false })),
        schoolService.getInvitations().catch(() => ({ success: false })),
        authService.getLinkedStudents().catch(() => ({ success: false })),
        schoolService.getUsers().catch(() => ({ success: false })),
        attendanceService.getSchoolOverview(attendanceDate).catch(() => ({ success: false })),
      ]);

      if (analyticsRes.success) setAnalytics(analyticsRes.data);
      if (classRes.success) setClasses(classRes.data || []);
      if (inviteRes.success) setInvitations(inviteRes.data || []);
      if (studentRes.success) setStudentsList(studentRes.data || []);
      if (usersRes.success) setDirectoryUsers(usersRes.data || []);
      if (attRes.success) setAttendanceOverview(attRes.data);
    } catch (err) {
      console.error('Failed to load school admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [attendanceDate]);

  // Handle Send Invitation
  const handleSendInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      await schoolService.sendInvitation({
        email: inviteEmail,
        name: inviteName,
        role: inviteRole,
        classId: inviteClassId || undefined,
        studentId: inviteRole === 'parent' ? inviteStudentId : undefined,
      });
      addNotification({
        type: 'success',
        title: 'Invitation Dispatched',
        message: `Onboarding email sent to ${inviteEmail}`,
      });
      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteName('');
      setInviteStudentId('');
      loadData();
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Invite Error',
        message: err.response?.data?.message || err.message,
      });
    } finally {
      setInviteLoading(false);
    }
  };

  // Copy Direct Link
  const handleCopyInviteLink = (token) => {
    const link = `${window.location.origin}/onboard?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    addNotification({
      type: 'info',
      title: 'Link Copied',
      message: 'Activation link copied to clipboard.',
    });
    setTimeout(() => setCopiedToken(null), 3000);
  };

  // Create Class
  const handleCreateClass = async (e) => {
    e.preventDefault();
    setClassLoading(true);
    try {
      await schoolService.createClass({
        name: newClassName,
        section: newClassSection,
        roomNumber: newClassRoom,
      });
      addNotification({
        type: 'success',
        title: 'Class Created',
        message: `${newClassName} - ${newClassSection} is active.`,
      });
      setIsClassOpen(false);
      setNewClassName('');
      loadData();
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Error Creating Class',
        message: err.response?.data?.message || err.message,
      });
    } finally {
      setClassLoading(false);
    }
  };

  // Inspect Full Class Details (Students, Teachers, Schedule)
  const handleOpenClassDetail = async (cls) => {
    setSelectedClassForModal(cls);
    setLoadingClassDetail(true);
    try {
      const res = await schoolService.getClassDetails(cls._id);
      if (res.success && res.data) {
        setClassDetailData(res.data);
      }
    } catch (err) {
      // Graceful client-side fallback using directory users
      const classStudents = directoryUsers.filter(
        (u) => u.role === 'student' && (u.classId?._id === cls._id || u.classId === cls._id)
      );
      const classTeachers = directoryUsers.filter(
        (u) => u.role === 'teacher' && (u.classId?._id === cls._id || u.classId === cls._id)
      );
      setClassDetailData({
        class: cls,
        students: classStudents,
        teachers: classTeachers,
        totalStudents: classStudents.length,
        totalTeachers: classTeachers.length,
      });
    } finally {
      setLoadingClassDetail(false);
    }
  };

  // Revoke Invitation
  const handleRevokeInvite = async (id) => {
    try {
      await schoolService.revokeInvitation(id);
      addNotification({ type: 'info', title: 'Revoked', message: 'Invitation has been revoked.' });
      loadData();
    } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: err.message });
    }
  };

  // Update Security Credentials
  const handleUpdateSecurity = async (e) => {
    e.preventDefault();
    setSecurityLoading(true);
    try {
      await authService.updateSuperAdminProfile({
        name: adminName,
        email: adminEmail,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      addNotification({
        type: 'success',
        title: 'Credentials Updated',
        message: 'Your administrator login credentials have been saved.',
      });
      setIsSecurityOpen(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Update Error',
        message: err.response?.data?.message || err.message,
      });
    } finally {
      setSecurityLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading multi-tenant school metrics..." />;
  }

  // Filtered Directory Users
  const filteredDirectory = directoryUsers.filter((u) => {
    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* ========================================================================= */}
      {/* TOP HEADER & ADMIN PROFILE CONTROLS                                       */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeTab === 'overview' && 'Super Administrator Portal'}
              {activeTab === 'classes' && 'Academic Classes & Structure'}
              {activeTab === 'invitations' && 'School Directory & Member Provisioning'}
              {activeTab === 'attendance' && 'Campus Attendance & Daily Roll Call'}
            </h2>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 border border-purple-200 rounded-full text-xs font-bold uppercase tracking-wider">
              Super Admin
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Academic Year {analytics?.academicYear || '2026-2027'} • Tenant: {user?.schoolId?.name || 'Oakridge International Academy'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsSecurityOpen(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
          >
            <Shield className="w-4 h-4 text-slate-600" />
            <span>Admin Credentials</span>
          </button>

          {activeTab === 'classes' && (
            <button
              onClick={() => setIsClassOpen(true)}
              className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Class</span>
            </button>
          )}

          {activeTab === 'invitations' && (
            <button
              onClick={() => setIsInviteOpen(true)}
              className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center space-x-1.5"
            >
              <MailPlus className="w-4 h-4" />
              <span>+ Invite Member</span>
            </button>
          )}

          {activeTab === 'overview' && (
            <>
              <button
                onClick={() => setIsClassOpen(true)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>New Class</span>
              </button>
              <button
                onClick={() => setIsInviteOpen(true)}
                className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center space-x-1.5"
              >
                <MailPlus className="w-4 h-4" />
                <span>+ Invite Member</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: ADMIN OVERVIEW                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            <div 
              onClick={() => onNavigate('invitations')} 
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-blue-300 cursor-pointer transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Enrolled Students</span>
                <GraduationCap className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-3xl font-extrabold text-slate-900 block">
                {analytics?.studentsCount || 0}
              </span>
              <span className="text-[11px] text-blue-600 font-medium mt-1 flex items-center space-x-1">
                <span>View student roster</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>

            <div 
              onClick={() => onNavigate('invitations')} 
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-indigo-300 cursor-pointer transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Teaching Faculty</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-3xl font-extrabold text-slate-900 block">
                {analytics?.teachersCount || 0}
              </span>
              <span className="text-[11px] text-indigo-600 font-medium mt-1 flex items-center space-x-1">
                <span>Assigned educators</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>

            <div 
              onClick={() => onNavigate('attendance')} 
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-emerald-300 cursor-pointer transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Today Attendance</span>
                <CalendarCheck2 className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-3xl font-extrabold text-emerald-600 block">
                {analytics?.attendanceRate || 96}%
              </span>
              <span className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center space-x-1">
                <span>Daily roll-call details</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Platform License</span>
                <ShieldCheck className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-3xl font-extrabold text-slate-900 block">
                {analytics?.totalUsers || 0} / {analytics?.seatsLimit || 500}
              </span>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-purple-600 h-1.5 rounded-full"
                  style={{ width: `${analytics?.seatsUsedPercentage || 10}%` }}
                />
              </div>
            </div>
          </div>

          {/* School Academic & Enrollment Summary Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span>Classroom & Cohort Management Snapshot</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Academic cohorts, faculty assignments, and linked parent guardians</p>
              </div>
              <button
                onClick={() => onNavigate('classes')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <span>Manage Class Rosters</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 border-t border-slate-100">
              <div>
                <span className="text-xs text-slate-400 font-medium block">Active Classrooms</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {classes.length} Classes
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium block">Linked Parent Guardians</span>
                <span className="text-2xl font-black text-indigo-600 mt-1 block">
                  {analytics?.parentsCount || 0} Guardians
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium block">Average Students per Class</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">
                  {classes.length > 0 ? Math.round((analytics?.studentsCount || 0) / classes.length) : 0} Students
                </span>
              </div>
            </div>
          </div>

          {/* Quick Academic Classes & Invitations Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Academic Classes ({classes.length})</span>
                </h3>
                <button onClick={() => onNavigate('classes')} className="text-xs text-[#2563EB] hover:underline font-bold">
                  Manage Classes →
                </button>
              </div>
              <div className="space-y-3">
                {classes.slice(0, 3).map((cls) => (
                  <div
                    key={cls._id}
                    onClick={() => handleOpenClassDetail(cls)}
                    className="p-3.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-200 rounded-2xl flex items-center justify-between text-xs cursor-pointer transition group"
                  >
                    <div>
                      <p className="font-bold text-slate-800 group-hover:text-blue-600 transition">{cls.name} - Section {cls.section}</p>
                      <p className="text-slate-500">{cls.roomNumber || 'Room 101'} • {cls.academicYear}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                        {cls.studentCount || 0} Students
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                  <MailPlus className="w-4 h-4 text-indigo-600" />
                  <span>Recent Invitations ({invitations.length})</span>
                </h3>
                <button onClick={() => onNavigate('invitations')} className="text-xs text-[#2563EB] hover:underline font-bold">
                  View Directory →
                </button>
              </div>
              <div className="space-y-3">
                {invitations.slice(0, 3).map((inv) => (
                  <div key={inv._id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-slate-800 truncate">{inv.name}</p>
                      <p className="text-slate-500 truncate">{inv.email}</p>
                    </div>
                    <button
                      onClick={() => handleCopyInviteLink(inv.token)}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold transition shrink-0 flex items-center space-x-1"
                    >
                      <Copy className="w-3 h-3 text-slate-500" />
                      <span>Copy Link</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: CLASSES & STRUCTURE                                               */}
      {/* ========================================================================= */}
      {activeTab === 'classes' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-blue-950">Academic Organization & Class Schedule</h3>
              <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                Configure grade sections, assign homeroom instructors, and track live student enrollments across Oakridge Academy.
              </p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-semibold text-blue-900">
              <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-2xl border border-blue-200">
                <span className="block text-xl font-black text-blue-700">{classes.length}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Active Classes</span>
              </div>
              <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-2xl border border-blue-200">
                <span className="block text-xl font-black text-indigo-700">{analytics?.studentsCount || 0}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Total Enrolled</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div
                key={cls._id}
                onClick={() => handleOpenClassDetail(cls)}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer space-y-4 group relative flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                        {cls.academicYear}
                      </span>
                      <h4 className="text-xl font-black text-slate-900 mt-2 group-hover:text-blue-600 transition">
                        {cls.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Section {cls.section} • {cls.roomNumber || 'Room 101'}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 group-hover:bg-blue-50 group-hover:border-blue-200 flex items-center justify-center font-bold text-slate-700 group-hover:text-blue-700 transition">
                      {cls.section}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Enrolled Students</span>
                      <span className="font-extrabold text-slate-900 text-sm">{cls.studentCount || 0} Students</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Homeroom Teacher</span>
                      <span className="font-extrabold text-slate-900 text-xs truncate block">
                        {cls.homeroomTeacherId?.name || 'Assigned Faculty'}
                      </span>
                    </div>
                  </div>

                  {cls.schedule && cls.schedule.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weekly Schedule Preview</p>
                      <div className="space-y-1">
                        {cls.schedule.slice(0, 3).map((sch, i) => (
                          <div key={i} className="flex items-center justify-between text-[11px] text-slate-600">
                            <span className="font-semibold text-slate-800">{sch.day}: {sch.subject}</span>
                            <span className="text-slate-400">{sch.startTime} - {sch.endTime}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-600 group-hover:text-blue-800 flex items-center space-x-1">
                    <span>View Full Roster & Faculty</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                  </span>
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">Click to inspect</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: INVITES & DIRECTORY                                               */}
      {/* ========================================================================= */}
      {activeTab === 'invitations' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-4 shadow-xs">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>

            <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto">
              {['all', 'teacher', 'student', 'parent'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize transition ${
                    roleFilter === r
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r === 'all' ? 'All Roles' : `${r}s`}
                </button>
              ))}
            </div>
          </div>

          {/* Section 1: Active Member Directory */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Enrolled School Directory ({filteredDirectory.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Active teachers, students, and parents with verified accounts</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="pb-3 pl-2">Name</th>
                    <th className="pb-3">Email Address</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Class / Linkage</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredDirectory.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-slate-400 font-medium">
                        No active users matching filter.
                      </td>
                    </tr>
                  ) : (
                    filteredDirectory.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 pl-2 font-bold text-slate-900 flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                            {u.name?.charAt(0) || 'U'}
                          </div>
                          <span>{u.name}</span>
                        </td>
                        <td className="py-3.5 text-slate-600 font-mono">{u.email}</td>
                        <td className="py-3.5">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold capitalize ${
                            u.role === 'teacher' ? 'bg-indigo-100 text-indigo-800' :
                            u.role === 'student' ? 'bg-blue-100 text-blue-800' :
                            u.role === 'parent' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-600">
                          {u.grade ? `${u.grade} - ${u.section || 'A'}` : '—'}
                        </td>
                        <td className="py-3.5">
                          <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Pending Invitations & Activation Links */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <MailPlus className="w-5 h-5 text-indigo-600" />
                  <span>Pending Onboarding Invitations ({invitations.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Secure email links dispatched to invited staff, students, and parents</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="pb-3 pl-2">Invitee</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Assigned Role</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right pr-2">Activation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {invitations.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-slate-400 font-medium">
                        No invitations dispatched yet. Click "+ Invite Member" above to onboard new users.
                      </td>
                    </tr>
                  ) : (
                    invitations.map((inv) => (
                      <tr key={inv._id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 pl-2 font-bold text-slate-900">{inv.name}</td>
                        <td className="py-3.5 text-slate-600 font-mono">{inv.email}</td>
                        <td className="py-3.5">
                          <span className="capitalize px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                            {inv.role}
                          </span>
                        </td>
                        <td className="py-3.5">
                          {inv.status === 'accepted' ? (
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Activated
                            </span>
                          ) : inv.status === 'revoked' ? (
                            <span className="text-slate-400">Revoked</span>
                          ) : (
                            <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Pending Setup
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-right pr-2">
                          {inv.status === 'pending' && (
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleCopyInviteLink(inv.token)}
                                className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center space-x-1"
                              >
                                {copiedToken === inv.token ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-600">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-slate-500" />
                                    <span>Copy Link</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleRevokeInvite(inv._id)}
                                className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition"
                                title="Revoke Invitation"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: SCHOOL ATTENDANCE                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Date Selector Header */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <CalendarCheck2 className="w-5 h-5 text-emerald-600" />
                <span>Daily Campus Attendance Overview</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time roll-call compliance and classroom attendance records</p>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-slate-600">Select Date:</label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              />
            </div>
          </div>

          {/* Attendance Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Campus Attendance Rate</span>
              <span className="text-3xl font-extrabold text-emerald-600 block">
                {attendanceOverview?.overallRate || 96}%
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">Live Daily Average</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Present on Campus</span>
              <span className="text-3xl font-extrabold text-slate-900 block">
                {attendanceOverview?.totalPresent || 0}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Confirmed Checked In</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Recorded Absences</span>
              <span className="text-3xl font-extrabold text-rose-600 block">
                {attendanceOverview?.totalAbsent || 0}
              </span>
              <span className="text-[11px] text-rose-500 font-medium mt-1 block">Alerts Dispatched to Parents</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Late Arrivals</span>
              <span className="text-3xl font-extrabold text-amber-600 block">
                {attendanceOverview?.totalLate || 0}
              </span>
              <span className="text-[11px] text-amber-600 font-medium mt-1 block">Tardy Check-ins</span>
            </div>
          </div>

          {/* Class by Class Attendance Breakdown Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <h3 className="text-lg font-bold text-slate-900">Classroom Roll-Call Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="pb-3 pl-2">Classroom</th>
                    <th className="pb-3">Room</th>
                    <th className="pb-3">Roll-Call Status</th>
                    <th className="pb-3">Present</th>
                    <th className="pb-3">Absent</th>
                    <th className="pb-3">Late</th>
                    <th className="pb-3">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(!attendanceOverview?.classBreakdown || attendanceOverview.classBreakdown.length === 0) ? (
                    <tr>
                      <td colSpan="7" className="py-6 text-center text-slate-400 font-medium">
                        No classroom attendance records found for {attendanceDate}.
                      </td>
                    </tr>
                  ) : (
                    attendanceOverview.classBreakdown.map((c) => (
                      <tr key={c.classId} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 pl-2 font-bold text-slate-900">{c.className}</td>
                        <td className="py-3.5 text-slate-500">{c.roomNumber || 'Room 101'}</td>
                        <td className="py-3.5">
                          {c.marked ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle className="w-3 h-3" />
                              <span>Marked by {c.markedByName || 'Teacher'}</span>
                            </span>
                          ) : (
                            <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Pending Submission
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 font-bold text-emerald-600">{c.present}</td>
                        <td className="py-3.5 font-bold text-rose-600">{c.absent}</td>
                        <td className="py-3.5 font-bold text-amber-600">{c.late}</td>
                        <td className="py-3.5 font-bold">
                          <div className="flex items-center space-x-2">
                            <span>{c.rate}%</span>
                            <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-1.5 rounded-full"
                                style={{ width: `${c.rate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: INVITE MEMBER                                                    */}
      {/* ========================================================================= */}
      {isInviteOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Invite School Member</h3>
                <p className="text-xs text-slate-500">Dispatches an activation link to their real email</p>
              </div>
              <button onClick={() => setIsInviteOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                ×
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Arthur Bell"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@school.edu or gmail"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm capitalize"
                >
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                </select>
              </div>

              {inviteRole !== 'parent' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Academic Class</label>
                  <select
                    value={inviteClassId}
                    onChange={(e) => setInviteClassId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="">Select a class...</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} - Section {c.section}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {inviteRole === 'parent' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Link to Enrolled Student</label>
                  <select
                    value={inviteStudentId}
                    onChange={(e) => setInviteStudentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="">Select child...</option>
                    {studentsList.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="w-1/2 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE ACADEMIC CLASS                                            */}
      {/* ========================================================================= */}
      {isClassOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create Academic Class</h3>
                <p className="text-xs text-slate-500">Configure grade level, section, and room number</p>
              </div>
              <button onClick={() => setIsClassOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                ×
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Class / Grade Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade 10"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Section</label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    placeholder="A"
                    value={newClassSection}
                    onChange={(e) => setNewClassSection(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room Number</label>
                  <input
                    type="text"
                    placeholder="Room 301"
                    value={newClassRoom}
                    onChange={(e) => setNewClassRoom(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsClassOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={classLoading}
                  className="w-1/2 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  {classLoading ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: SUPERADMIN SECURITY & CREDENTIALS                                */}
      {/* ========================================================================= */}
      {isSecurityOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span>Admin Credentials</span>
                </h3>
                <p className="text-xs text-slate-500">Only Superadmin can update these root credentials</p>
              </div>
              <button onClick={() => setIsSecurityOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateSecurity} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Username / Email</label>
                <input
                  type="text"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin or your email"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Password (Required to change password)
                </label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password (Optional)
                </label>
                <input
                  type="password"
                  minLength={6}
                  placeholder="Leave blank to keep unchanged"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsSecurityOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={securityLoading}
                  className="w-1/2 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  {securityLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: FULL CLASS COCKPIT (STUDENTS, FACULTY & TIMETABLE)               */}
      {/* ========================================================================= */}
      {selectedClassForModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                    {selectedClassForModal.academicYear || '2026-2027'}
                  </span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {selectedClassForModal.roomNumber || 'Room 204'}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 flex items-center space-x-2">
                  <span>{selectedClassForModal.name}</span>
                  <span className="text-slate-400 font-medium">— Section {selectedClassForModal.section}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Detailed academic profile, assigned teaching faculty, and enrolled student roster
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedClassForModal(null);
                  setClassDetailData(null);
                }}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {loadingClassDetail ? (
              <div className="py-16">
                <LoadingSpinner text="Retrieving complete classroom roster and faculty details..." />
              </div>
            ) : (
              <div className="space-y-6">
                {/* 3 Summary KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-medium block">Enrolled Students</span>
                      <span className="text-xl font-extrabold text-slate-900">
                        {classDetailData?.students?.length || 0} Students
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-medium block">Teaching Faculty</span>
                      <span className="text-xl font-extrabold text-slate-900">
                        {classDetailData?.teachers?.length || 1} Assigned
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-medium block">Weekly Periods</span>
                      <span className="text-xl font-extrabold text-slate-900">
                        {selectedClassForModal.schedule?.length || 6} Scheduled
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 1: Assigned Faculty & Homeroom Teacher */}
                <div className="p-5 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 border border-indigo-100 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span>Assigned Teaching Faculty</span>
                    </h4>
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                      Homeroom & Curriculum
                    </span>
                  </div>

                  {(!classDetailData?.teachers || classDetailData.teachers.length === 0) ? (
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                      <span>No specific faculty explicitly mapped. Homeroom curriculum led by School Faculty.</span>
                      <button
                        onClick={() => {
                          setInviteRole('teacher');
                          setInviteClassId(selectedClassForModal._id);
                          setIsInviteOpen(true);
                        }}
                        className="text-xs font-bold text-indigo-600 hover:underline"
                      >
                        + Assign / Invite Teacher
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {classDetailData.teachers.map((t) => (
                        <div key={t._id} className="p-3.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                              {t.name?.charAt(0) || 'T'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{t.name}</p>
                              <p className="text-[11px] text-slate-500">{t.email}</p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-bold text-[10px]">
                            Educator
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 2: Enrolled Students Roster Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                        <span>Enrolled Student Roster ({classDetailData?.students?.length || 0})</span>
                      </h4>
                      <p className="text-xs text-slate-500">All registered students active in this homeroom cohort</p>
                    </div>

                    <button
                      onClick={() => {
                        setInviteRole('student');
                        setInviteClassId(selectedClassForModal._id);
                        setIsInviteOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Invite Student</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-3 pl-4">Student Name</th>
                          <th className="py-3">Email Address</th>
                          <th className="py-3">Linked Parent / Guardian</th>
                          <th className="py-3">Status</th>
                          <th className="py-3 text-right pr-4">Enrolled On</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {(!classDetailData?.students || classDetailData.students.length === 0) ? (
                          <tr>
                            <td colSpan="5" className="py-8 text-center text-slate-400">
                              <p className="font-medium text-xs">No students currently enrolled in this class.</p>
                              <button
                                onClick={() => {
                                  setInviteRole('student');
                                  setInviteClassId(selectedClassForModal._id);
                                  setIsInviteOpen(true);
                                }}
                                className="mt-2 text-xs font-bold text-blue-600 hover:underline inline-flex items-center space-x-1"
                              >
                                <span>+ Send Invitation Link to Student</span>
                              </button>
                            </td>
                          </tr>
                        ) : (
                          classDetailData.students.map((st) => (
                            <tr key={st._id} className="hover:bg-slate-50/70 transition">
                              <td className="py-3 pl-4 font-bold text-slate-900 flex items-center space-x-2.5">
                                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                                  {st.name?.charAt(0) || 'S'}
                                </div>
                                <span>{st.name}</span>
                              </td>
                              <td className="py-3 font-mono text-slate-600">{st.email}</td>
                              <td className="py-3">
                                {st.parentId ? (
                                  <div className="space-y-0.5">
                                    <span className="font-bold text-slate-800">{st.parentId.name}</span>
                                    <span className="text-[10px] text-slate-400 block">{st.parentId.email}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">No parent allocated</span>
                                )}
                              </td>
                              <td className="py-3">
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Active</span>
                                </span>
                              </td>
                              <td className="py-3 text-right pr-4 text-slate-400">
                                {st.createdAt ? new Date(st.createdAt).toLocaleDateString() : 'Active Term'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 3: Full Weekly Timetable Schedule */}
                {selectedClassForModal.schedule && selectedClassForModal.schedule.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>Weekly Academic Schedule & Timetable</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {selectedClassForModal.schedule.map((sch, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-blue-600 text-[11px]">{sch.day}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{sch.startTime} - {sch.endTime}</span>
                          </div>
                          <p className="font-bold text-slate-800 text-sm">{sch.subject}</p>
                          <p className="text-[11px] text-slate-500">{sch.teacherName || 'Lead Faculty'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Tenant: Oakridge International Academy • Multi-tenant Academic System
              </span>

              <button
                type="button"
                onClick={() => {
                  setSelectedClassForModal(null);
                  setClassDetailData(null);
                }}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
