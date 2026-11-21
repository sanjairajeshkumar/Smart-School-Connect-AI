import React, { useState } from 'react';
import { taskService } from '../../services/taskService';
import { Layers, Plus, CheckCircle, Clock, Lock, Unlock, ArrowUpDown, Sparkles } from 'lucide-react';
import { Badge } from '../common/Badge';

export const TaskBatchManager = ({ tasks = [], batches = [], onRefresh, studentName = 'Alex', studentId = null }) => {
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [batchTitle, setBatchTitle] = useState('Batch 1: High Priority Focus');
  const [instructions, setInstructions] = useState('Focus on finishing these 2 tasks first.');
  const [isReleased, setIsReleased] = useState(true);
  const [creating, setCreating] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const toggleSelectTask = (taskId) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (selectedTaskIds.length === 0) {
      alert('Please select at least one task to include in this batch.');
      return;
    }

    try {
      setCreating(true);
      await taskService.createBatch({
        title: batchTitle,
        taskIds: selectedTaskIds,
        isReleased,
        instructions,
        studentId: studentId || tasks[0]?.assignedStudentId?._id || tasks[0]?.assignedStudentId,
      });
      setActionMessage(`Created and assigned "${batchTitle}" successfully!`);
      setSelectedTaskIds([]);
      if (onRefresh) onRefresh();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create batch');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleRelease = async (batchId, currentReleased) => {
    try {
      await taskService.toggleBatchRelease(batchId, !currentReleased);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to toggle batch release');
    }
  };

  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-[#2563EB] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Parent Workload Sequencing</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Task Batching & Sequencing for {studentName}
            </h3>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Prevent homework burnout by breaking down assignments into sequential batches. Assign the first 2 tasks now, and unlock subsequent batches once the earlier ones are completed.
            </p>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-medium flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Create New Batch */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h4 className="text-base font-bold text-slate-800 flex items-center space-x-2 mb-4">
            <Layers className="w-5 h-5 text-[#2563EB]" />
            <span>Create & Sequence a Batch</span>
          </h4>

          <form onSubmit={handleCreateBatch} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Batch Title
              </label>
              <input
                type="text"
                required
                value={batchTitle}
                onChange={(e) => setBatchTitle(e.target.value)}
                placeholder="e.g. Batch 1 - Today's 2 Core Tasks"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Parent Guidance Note
              </label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Finish these two before free play time."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                id="releaseCheck"
                checked={isReleased}
                onChange={(e) => setIsReleased(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <label htmlFor="releaseCheck" className="text-xs font-medium text-slate-700 cursor-pointer">
                Release to {studentName} immediately (uncheck to keep locked in reserve)
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Select Tasks for this Batch ({selectedTaskIds.length} selected)
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {tasks.map((task) => {
                  if (!task) return null;
                  const isChecked = selectedTaskIds.includes(task._id);
                  const dueFormatted = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date';
                  return (
                    <div
                      key={task._id}
                      onClick={() => toggleSelectTask(task._id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition ${
                        isChecked
                          ? 'border-blue-500 bg-blue-50/70 text-blue-900 font-semibold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <div>
                          <p className="font-semibold">{task.title || 'Assignment'}</p>
                          <p className="text-[11px] text-slate-500 font-normal">
                            {task.subject || 'General'} • Due {dueFormatted}
                          </p>
                        </div>
                      </div>
                      <Badge variant={task.status}>{task.status === 'completed' ? 'Done' : 'Pending'}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={creating || selectedTaskIds.length === 0}
              className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-200 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{creating ? 'Saving Batch...' : 'Save & Organize Batch'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Active Batches List */}
        <div className="lg:col-span-7 space-y-4">
          <h4 className="text-base font-bold text-slate-800 flex items-center space-x-2">
            <span>Configured Task Batches</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
              {batches.length}
            </span>
          </h4>

          {batches.length === 0 ? (
            <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-3xl text-sm text-slate-500">
              No batches created yet. Select tasks on the left to organize your child's first focus batch!
            </div>
          ) : (
            batches.map((batch, index) => (
              <div
                key={batch._id}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 transition hover:border-slate-300"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-100 text-[#2563EB] text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <h5 className="font-bold text-slate-900 text-base">{batch.title}</h5>
                    </div>
                    {batch.instructions && (
                      <p className="text-xs text-slate-500 italic pl-8">
                        "{batch.instructions}"
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggleRelease(batch._id, batch.isReleased)}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      batch.isReleased
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {batch.isReleased ? (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Active for Student</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Locked (Click to Release)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Tasks inside this batch */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {batch.taskIds && batch.taskIds.length > 0 ? (
                    batch.taskIds.filter(Boolean).map((task) => {
                      const taskId = typeof task === 'object' ? task._id : task;
                      const taskTitle = typeof task === 'object' ? task.title : 'Assignment';
                      const taskStatus = typeof task === 'object' ? task.status : 'pending';
                      return (
                        <div
                          key={taskId}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                        >
                          <span className="font-semibold text-slate-800">
                            {taskTitle}
                          </span>
                          <Badge variant={taskStatus}>
                            {taskStatus === 'completed' ? 'Done' : 'Pending'}
                          </Badge>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400">No tasks currently assigned to this batch.</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
