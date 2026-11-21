import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { messageService } from '../services/messageService';
import { authService } from '../services/authService';
import { TeacherMessageComposer } from '../components/messages/TeacherMessageComposer';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { MessageSquare, Send, Sparkles, User, Clock, CheckCircle } from 'lucide-react';

export const MessagesPage = () => {
  const { user, role } = useAuth();
  const [messages, setMessages] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [parentReply, setParentReply] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await messageService.getMessages();
      if (res.success) setMessages(res.data);

      if (role === 'teacher') {
        const studentRes = await authService.getLinkedStudents();
        if (studentRes.success) setStudents(studentRes.data);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSendParentReply = async (e) => {
    e.preventDefault();
    if (!parentReply.trim()) return;

    try {
      setSendingReply(true);
      await messageService.sendMessage({
        recipientRole: 'teacher',
        subject: 'Parent Update Regarding Alex',
        content: parentReply.trim(),
        grade: user?.grade || 'Grade 8',
      });
      setParentReply('');
      fetchMessages();
    } catch (err) {
      alert(err.message || 'Failed to send message to teacher');
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* If Teacher: Show the PDF Screen 04 Message Composer */}
      {role === 'teacher' ? (
        <TeacherMessageComposer
          onMessageSent={fetchMessages}
          recentMessages={messages}
          students={students}
        />
      ) : (
        /* If Parent or Student: View Feed of Teacher Announcements & Reply */
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Classroom Announcements & Messages</h3>
            <p className="text-xs text-slate-500 mb-6">
              Verified teacher updates and direct communication from Ms. Taylor for Grade 8.
            </p>

            {loading ? (
              <LoadingSpinner text="Loading message communications..." />
            ) : messages.length === 0 ? (
              <EmptyState
                title="No messages in your inbox"
                description="Your teachers have not published any class announcements or messages yet."
              />
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg._id}
                    className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-xs">
                          {msg.senderName?.charAt(0) || 'T'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{msg.senderName}</p>
                          <p className="text-[11px] text-slate-400 capitalize">{msg.senderRole} • {msg.grade}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {msg.aiRewritten && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-[#2563EB]">
                            <Sparkles className="w-3 h-3" />
                            <span>AI Enhanced</span>
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm text-slate-800 leading-relaxed font-normal pl-10">
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Parent can send a direct note back to Teacher */}
          {role === 'parent' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <h4 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Send Note or Question to Ms. Taylor</span>
              </h4>

              <form onSubmit={handleSendParentReply} className="space-y-3">
                <textarea
                  rows="3"
                  value={parentReply}
                  onChange={(e) => setParentReply(e.target.value)}
                  placeholder="Type a message or questions about Alex's homework, schedule, or progress..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !parentReply.trim()}
                  className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-200 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 transition flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingReply ? 'Sending...' : 'Send Note to Teacher'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
