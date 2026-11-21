const config = require('../../config/env');
const GroqAdapter = require('./groqAdapter');
const GeminiAdapter = require('./geminiAdapter');
const NvidiaAdapter = require('./nvidiaAdapter');

class AIOrchestrator {
  constructor() {
    this.adapters = {
      groq: new GroqAdapter(config.groqApiKey),
      gemini: new GeminiAdapter(config.geminiApiKey),
      nvidia: new NvidiaAdapter(config.nvidiaApiKey),
    };
  }

  // Get active provider chain with preferred first
  getProviderChain(preferredProvider) {
    const chain = [];
    const order = [preferredProvider, 'groq', 'gemini', 'nvidia'].filter(Boolean);
    const seen = new Set();

    for (const p of order) {
      if (!seen.has(p) && this.adapters[p]) {
        seen.add(p);
        chain.push(this.adapters[p]);
      }
    }
    return chain;
  }

  /**
   * Rewrite a teacher's message draft with specified tone and audience
   */
  async rewriteMessageDraft({ draft, tone = 'Encouraging & Professional', audience = 'Parents', subject = '' }, preferredProvider) {
    const prompt = `Please rewrite and enhance the following school message from a teacher to ${audience}.
Subject: ${subject || 'School Update'}
Desired Tone: ${tone}
Draft message:
"""
${draft}
"""

Guidelines:
- Maintain clear, actionable details (dates, requirements, instructions).
- Keep it respectful, warm, professional, and easy to read.
- Return ONLY the rewritten message text without preamble, meta commentary, or quotes.`;

    const systemInstruction = 'You are an expert school communications coordinator helping teachers write clear, polite, and encouraging messages for parents and students.';

    return await this.executeWithFallback(prompt, systemInstruction, preferredProvider, () => {
      // High-quality contextual demo fallback
      return this.generateSmartDraftFallback(draft, tone, audience);
    });
  }

  /**
   * Summarize student homework, time spent, and pending work into a concise digest for teachers/parents
   */
  async generateStudentDigest({ studentName, grade, tasks = [], recentMessages = [] }, preferredProvider) {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const totalMinutes = tasks.reduce((sum, t) => sum + (t.timeSpentMinutes || 0), 0);
    const avgMinutes = completedTasks.length ? Math.round(totalMinutes / completedTasks.length) : 0;

    const prompt = `Generate a concise, well-structured academic digest and progress summary for:
Student: ${studentName} (${grade})
Completed Tasks (${completedTasks.length}): ${completedTasks.map(t => `${t.title} (${t.subject}, ${t.timeSpentMinutes || 0}m spent, student note: "${t.studentNotes || 'none'}")`).join('; ') || 'None yet'}
Pending Tasks (${pendingTasks.length}): ${pendingTasks.map(t => `${t.title} (${t.subject}, due ${new Date(t.dueDate).toLocaleDateString()})`).join('; ') || 'None'}
Average Time per Task: ${avgMinutes} minutes
Recent Parent/Teacher Updates: ${recentMessages.map(m => `"${m.content}"`).join('; ') || 'None'}

Please format the summary cleanly with:
1. Executive Snapshot (Overall progress status)
2. Task Completion & Time Spent Analysis
3. Critical Pending Deadlines & Recommended Action Items
Keep it strictly grounded in the provided data.`;

    const systemInstruction = 'You are a school analytics and student progress assistant summarizing homework and academic performance for educators and parents.';

    return await this.executeWithFallback(prompt, systemInstruction, preferredProvider, () => {
      return this.generateSmartDigestFallback(studentName, grade, completedTasks, pendingTasks, totalMinutes, avgMinutes);
    });
  }

  /**
   * Interactive School AI Assistant (PDF Screen 05)
   */
  async askSchoolAssistant({ query, role, userName, studentData, homeworkList }, preferredProvider) {
    const tasksSummary = (homeworkList || []).map(t => 
      `- ${t.title} [${t.subject}]: Status=${t.status}, Due=${new Date(t.dueDate).toLocaleDateString()}, Priority=${t.priority}`
    ).join('\n');

    const prompt = `User (${userName}, Role: ${role}) asked: "${query}"

Here is the verified school context from MongoDB:
User Role: ${role}
Tasks/Homework Records:
${tasksSummary || 'No tasks found.'}

Answer the user's question directly, accurately, and concisely based strictly on their authorized school records. If asking for a summary of tomorrow's homework or open tasks, list the exact titles and subjects due.`;

    const systemInstruction = 'You are the Smart School Connect AI Assistant. You provide helpful, concise answers to students, teachers, and parents grounded strictly in school data.';

    return await this.executeWithFallback(prompt, systemInstruction, preferredProvider, () => {
      return this.generateSmartAssistantFallback(query, role, userName, homeworkList);
    });
  }

  /**
   * Fallback engine: tries primary -> secondary -> tertiary -> contextual mock engine
   */
  async executeWithFallback(prompt, systemInstruction, preferredProvider = 'groq', smartFallbackFn) {
    const chain = this.getProviderChain(preferredProvider);
    const errors = [];

    for (const adapter of chain) {
      try {
        if (!adapter.apiKey) {
          continue; // skip unconfigured provider
        }
        const text = await adapter.generateText(prompt, systemInstruction);
        if (text && text.trim().length > 0) {
          return {
            text,
            providerUsed: adapter.name,
            providerCode: adapter.code,
            isFallback: adapter.code !== preferredProvider,
            fallbackChain: errors,
          };
        }
      } catch (err) {
        errors.push({ provider: adapter.name, error: err.message });
        console.warn(`[AI Orchestrator] ${adapter.name} failed: ${err.message}. Cascading to next provider...`);
      }
    }

    // If all cloud providers were unavailable or unconfigured, use our Contextual AI Engine
    const fallbackText = smartFallbackFn();
    return {
      text: fallbackText,
      providerUsed: 'Smart School Contextual AI Engine (Local Fallback)',
      providerCode: 'contextual_fallback',
      isFallback: true,
      fallbackChain: errors,
      note: 'Executed via server-side grounded fallback engine. Add GROQ_API_KEY, GEMINI_API_KEY, or NVIDIA_API_KEY to backend/.env to use live cloud endpoints.',
    };
  }

  // Grounded Smart Fallbacks for reliable offline/demo execution
  generateSmartDraftFallback(draft, tone, audience) {
    const cleanDraft = draft.trim();
    if (tone.toLowerCase().includes('encourag')) {
      return `Dear ${audience},\n\nWe hope you have had a wonderful week. ${cleanDraft} We truly appreciate your continued support in reinforcing these good learning habits at home. Please feel free to reach out if you have any questions.\n\nWarm regards,\nGrade 8 Teaching Team`;
    }
    if (tone.toLowerCase().includes('urgent') || tone.toLowerCase().includes('reminder')) {
      return `Dear ${audience},\n\nIMPORTANT REMINDER: ${cleanDraft} Kindly ensure this is reviewed and completed on time to keep up with the classroom syllabus.\n\nThank you for your prompt attention and cooperation.\n\nBest regards,\nSchool Administration & Teaching Staff`;
    }
    // Default concise professional tone
    return `Dear ${audience},\n\n${cleanDraft}\n\nThank you for partnering with us in your child's academic journey.\n\nSincerely,\nYour Class Teacher`;
  }

  generateSmartDigestFallback(studentName, grade, completed, pending, totalMinutes, avgMinutes) {
    const pendingList = pending.length > 0 
      ? pending.map(t => `• ${t.title} (${t.subject}) - Due ${new Date(t.dueDate).toLocaleDateString()}`).join('\n')
      : '• No pending tasks! All caught up.';

    const completedList = completed.length > 0
      ? completed.map(t => `• ${t.title} (${t.subject}) - Completed (${t.timeSpentMinutes || 25} mins spent)`).join('\n')
      : '• No completed tasks recorded yet.';

    return `### Academic & Homework Digest for ${studentName} (${grade})

**1. Executive Snapshot**
${studentName} has completed **${completed.length}** task(s) with **${pending.length}** pending assignment(s). Overall task completion rate is **${completed.length + pending.length > 0 ? Math.round((completed.length / (completed.length + pending.length)) * 100) : 100}%**.

**2. Time & Effort Analysis**
• **Total Time Recorded:** ${totalMinutes} minutes
• **Average Time per Completed Task:** ${avgMinutes} minutes
• **Effort Rating:** Consistent and on track with curriculum expectations.

**3. Completed Work**
${completedList}

**4. Pending Deadlines & Recommended Action**
${pendingList}
*Recommendation:* Prioritize the next due assignment to prevent any homework backlog before the upcoming class reviews.`;
  }

  generateSmartAssistantFallback(query, role, userName, homeworkList = []) {
    const q = query.toLowerCase();
    const pending = homeworkList.filter(t => t.status === 'pending');
    const completed = homeworkList.filter(t => t.status === 'completed');

    if (q.includes('tomorrow') || q.includes('due') || q.includes('homework')) {
      if (pending.length === 0) {
        return `Great news, ${userName}! You have no pending homework due right now. You are all caught up! Check the Homework & Tasks tab if you would like to review completed items.`;
      }
      const topTasks = pending.slice(0, 3).map(t => `• ${t.title} (${t.subject}) due ${new Date(t.dueDate).toLocaleDateString()}`).join('\n');
      return `Here is your upcoming homework summary:\n${topTasks}\n\nYou currently have ${pending.length} pending task(s). Check the Homework page for full instructions.`;
    }

    if (q.includes('summary') || q.includes('progress')) {
      return `You have completed ${completed.length} task(s) and have ${pending.length} pending task(s). Keep up the great effort!`;
    }

    return `Hello ${userName}! Based on your current school records, you have ${pending.length} active pending task(s) in your queue. You can ask me to summarize homework for tomorrow, check due dates, or review recent teacher announcements.`;
  }
}

module.exports = new AIOrchestrator();
