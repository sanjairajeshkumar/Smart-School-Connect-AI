import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { schoolService } from '../services/schoolService';
import { feeService } from '../services/feeService';
import { authService } from '../services/authService';
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
} from 'lucide-react';

export const SchoolAdminDashboard = ({ onNavigate }) => {
  const { user, addNotification } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [classes, setClasses] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Invitation Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('teacher');
  const [inviteClassId, setInviteClassId] = useState('');
  const [inviteStudentId, setInviteStudentId] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState(null);

  // New Class Modal State
  const [isClassOpen, setIsClassOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassSection, setNewClassSection] = useState('A');
  const [newClassRoom, setNewClassRoom] = useState('');
  const [classLoading, setClassLoading] = useState(false);

  // Superadmin Security & Credentials Modal State
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [adminName, setAdminName] = useState(user?.name || 'Super Administrator');
  const [adminEmail, setAdminEmail] = useState(user?.email || 'admin');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, classRes, inviteRes, studentRes] = await Promise.all([
        schoolService.getAnalytics(),
        schoolService.getClasses(),
        schoolService.getInvitations(),
        authService.getLinkedStudents(),
      ]);
      if (analyticsRes.success) setAnalytics(analyticsRes.data);
      if (classRes.success) setClasses(classRes.data);
      if (inviteRes.success) setInvitations(inviteRes.data);
      if (studentRes.success) setStudentsList(studentRes.data);
    } catch (err) {
      console.error('Failed to load school admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      const res = await schoolService.sendInvitation({
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

  const handleCopyInviteLink = (token) => {
    const link = `${window.location.origin}/?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    addNotification({
      type: 'info',
      title: 'Link Copied',
      message: 'Activation link copied to clipboard.',
    });
    setTimeout(() => setCopiedToken(null), 3000);
  };

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

  const handleRevokeInvite = async (id) => {
    try {
      await schoolService.revokeInvitation(id);
      addNotification({ type: 'info', title: 'Revoked', message: 'Invitation has been revoked.' });
      loadData();
    } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const handleUpdateSecurity = async (e) => {
    e.preventDefault();
    setSecurityLoading(true);
    try {
      const res = await authService.updateSuperAdminProfile({
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

  const { financials } = analytics || {};

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* School Admin Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Super Administrator Portal
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
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Enrolled Students</span>
            <GraduationCap className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900 block">
            {analytics?.studentsCount || 0}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Active Student Profiles</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Teaching Faculty</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900 block">
            {analytics?.teachersCount || 0}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Assigned Teachers</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Today Attendance</span>
            <CalendarCheck2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-3xl font-extrabold text-emerald-600 block">
            {analytics?.attendanceRate || 96}%
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Live Daily Attendance</span>
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
              className="bg-blue-600 h-1.5 rounded-full"
              style={{ width: `${analytics?.seatsUsedPercentage || 10}%` }}
            />
          </div>
        </div>
      </div>

      {/* Financials & Fee Collection Analytics Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <span>Fee Collection Analytics</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time tuition billing and receipt reconciliation</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
              {financials?.collectionRate || 0}% Collected
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 border-t border-slate-100">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Total Billed (Term)</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              ${(financials?.totalBilled || 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Collected to Date</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              ${(financials?.totalCollected || 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Outstanding Balance</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">
              ${(financials?.pendingAmount || 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400">({financials?.pendingInvoices || 0} unpaid invoices)</span>
          </div>
        </div>
      </div>

      {/* Grid: Academic Classes + Pending Invitations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Academic Classes Section */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Academic Classes ({classes.length})</span>
            </h3>
            <button
              onClick={() => setIsClassOpen(true)}
              className="text-xs text-[#2563EB] hover:underline font-bold"
            >
              + Add Class
            </button>
          </div>

          <div className="space-y-3">
            {classes.map((cls) => (
              <div
                key={cls._id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-slate-800 text-sm">
                    {cls.name} - Section {cls.section}
                  </p>
                  <p className="text-xs text-slate-500">
                    {cls.roomNumber || 'Room 101'} • {cls.academicYear}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                    {cls.studentCount || 0} Students
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Email Invitations & Activation Links Section */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                <MailPlus className="w-4 h-4 text-indigo-600" />
                <span>Invites & Provisioning</span>
              </h3>
              <p className="text-[11px] text-slate-500">Only Superadmin can grant access to Teachers, Parents & Students</p>
            </div>
            <button
              onClick={() => setIsInviteOpen(true)}
              className="text-xs text-[#2563EB] hover:underline font-bold"
            >
              + Invite Member
            </button>
          </div>

          {invitations.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No pending invites. Click "+ Invite Member" to send genuine email onboarding invitations.
            </div>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {invitations.map((inv) => (
                <div
                  key={inv._id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center space-x-2">
                      <p className="font-bold text-slate-800 truncate">{inv.name}</p>
                      <span className="capitalize px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                        {inv.role}
                      </span>
                    </div>
                    <p className="text-slate-500 truncate">{inv.email}</p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {inv.status === 'accepted' ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Active Account
                      </span>
                    ) : inv.status === 'revoked' ? (
                      <span className="text-slate-400">Revoked</span>
                    ) : (
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleCopyInviteLink(inv.token)}
                          className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold transition flex items-center space-x-1"
                          title="Copy direct activation URL"
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
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                          title="Revoke invitation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Modal: Superadmin Security & Credentials */}
      {isSecurityOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-slate-900">Admin Security & Password</h3>
              </div>
              <button
                onClick={() => setIsSecurityOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Only you can change the Superadmin email/username and password while logged in here.
            </p>

            <form onSubmit={handleUpdateSecurity} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Administrator Display Name
                </label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Login Username / Email
                </label>
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
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSecurityOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={securityLoading}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  {securityLoading ? 'Saving...' : 'Update Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Invite Staff / Student / Parent */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Provision New Member</h3>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              An invitation email will be dispatched with an onboarding link for the user to set their password and access their portal.
            </p>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Miller"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Real Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="david.miller@domain.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role Assignment
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2563EB]"
                >
                  <option value="teacher">👩‍🏫 Teacher (Faculty)</option>
                  <option value="parent">👨‍👧 Parent</option>
                  <option value="student">🎒 Student</option>
                </select>
              </div>

              {classes.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign to Class
                  </label>
                  <select
                    value={inviteClassId}
                    onChange={(e) => setInviteClassId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="">General Class Assignment</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} - Section {c.section}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {inviteRole === 'parent' && studentsList.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Link to Enrolled Student
                  </label>
                  <select
                    value={inviteStudentId}
                    onChange={(e) => setInviteStudentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  >
                    <option value="">Select Child...</option>
                    {studentsList.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.grade} - {s.section})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-2"
                >
                  {inviteLoading ? <LoadingSpinner text="" /> : <span>Send Email Invite</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Class */}
      {isClassOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Create Academic Class</h3>
              <button
                onClick={() => setIsClassOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Grade / Class Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade 9"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A"
                  value={newClassSection}
                  onChange={(e) => setNewClassSection(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Room Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Room 304"
                  value={newClassRoom}
                  onChange={(e) => setNewClassRoom(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsClassOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={classLoading}
                  className="px-5 py-2.5 bg-[#2563EB] text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
