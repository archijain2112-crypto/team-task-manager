"use client";

import React, { use, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Shield, Loader2, Save, AlertCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useToast } from "@/components/Toast";
import Link from "next/link";

interface ProjectMember {
  userId: string;
  role: "ADMIN" | "MEMBER";
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface TaskData {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string | null;
  assignedTo?: string | null;
  projectId: string;
  createdBy: string;
  createdAt: string;
  project: {
    id: string;
    name: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
  } | null;
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

export default function TaskDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: taskId } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [task, setTask] = useState<TaskData | null>(null);
  const [userRole, setUserRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTaskDetails = async () => {
    try {
      // 1. Fetch Task details
      const taskRes = await axios.get(`/api/tasks/${taskId}`);
      const taskObj: TaskData = taskRes.data.task;
      setTask(taskObj);
      setUserRole(taskRes.data.userRole);

      // 2. Fetch Project members (for the assignee list)
      const projectRes = await axios.get(`/api/projects/${taskObj.projectId}`);
      setProjectMembers(projectRes.data.project.members);
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to load task details", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const handleDeleteTask = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    setIsDeleting(true);

    try {
      await axios.delete(`/api/tasks/${taskId}`);
      toast("Task deleted successfully!", "success");
      router.push(`/projects/${task?.projectId}`);
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to delete task", "error");
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#090a0f] overflow-hidden select-none">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </main>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex h-screen bg-[#090a0f] overflow-hidden select-none">
        <Sidebar />
        <main className="flex-1 flex flex-col items-center justify-center text-center text-slate-100">
          <h2 className="text-xl font-bold mb-2">Task not found</h2>
          <Link href="/dashboard" className="text-indigo-455 text-indigo-400 hover:underline flex items-center gap-1 text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </main>
      </div>
    );
  }

  const isAdmin = userRole === "ADMIN";

  return (
    <div className="flex h-screen bg-[#090a0f] overflow-hidden select-none">
      <Sidebar />

      <main className="flex-1 overflow-y-auto bg-[#090a0f] p-8 text-slate-100 flex flex-col">
        <div className="space-y-8 flex-1 max-w-4xl w-full mx-auto animate-fade-in">
          
          {/* Top navigation */}
          <div className="flex items-center justify-between">
            <Link
              href={`/projects/${task.projectId}`}
              className="text-slate-400 hover:text-white flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-400" />
              Back to {task.project.name}
            </Link>

            {isAdmin && (
              <button
                onClick={handleDeleteTask}
                disabled={isDeleting}
                className="px-3.5 py-2 bg-rose-950/20 hover:bg-rose-900/30 text-rose-455 text-rose-400 border border-rose-900/30 hover:border-rose-900/50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? "Deleting..." : "Delete Task"}
              </button>
            )}
          </div>

          <TaskDetailForm
            task={task}
            userRole={userRole}
            projectMembers={projectMembers}
            onUpdate={fetchTaskDetails}
          />

        </div>
      </main>
    </div>
  );
}

interface FormProps {
  task: TaskData;
  userRole: "ADMIN" | "MEMBER";
  projectMembers: ProjectMember[];
  onUpdate: () => void;
}

function TaskDetailForm({ task, userRole, projectMembers, onUpdate }: FormProps) {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [assignedTo, setAssignedTo] = useState(task.assignedTo || "");
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.substring(0, 10) : "");

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await axios.get("/api/auth/me");
        setCurrentUser(res.data.user);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchMe();
  }, []);

  if (loadingUser) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const isAdmin = userRole === "ADMIN";
  const isAssignee = currentUser && task.assignedTo === currentUser.id;
  const canEditAll = isAdmin;
  const canEditStatusOnly = !isAdmin && isAssignee;
  const isReadOnly = !isAdmin && !isAssignee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setIsSaving(true);

    try {
      const payload: any = {};
      if (canEditAll) {
        payload.title = title;
        payload.description = description;
        payload.status = status;
        payload.priority = priority;
        payload.assignedTo = assignedTo || null;
        payload.dueDate = dueDate || null;
      } else {
        // Can only edit status
        payload.status = status;
      }

      await axios.put(`/api/tasks/${task.id}`, payload);
      toast("Task updated successfully!", "success");
      onUpdate();
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to save task updates", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "HIGH":
        return "text-rose-455 text-rose-450 text-rose-400";
      case "MEDIUM":
        return "text-amber-455 text-amber-450 text-amber-400";
      default:
        return "text-slate-400";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 glass-panel p-8 rounded-2xl border border-slate-800 shadow-xl">
      
      {/* Read only Warning alert */}
      {isReadOnly && (
        <div className="flex items-start gap-3 p-4 bg-amber-950/20 border border-amber-900/35 rounded-xl text-xs text-amber-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <div>
            <p className="font-bold">Read-Only Task Panel</p>
            <p className="text-slate-450 text-slate-400 mt-0.5">
              You are viewing this task in read-only mode because it is not assigned to you, and you are not a project Admin.
            </p>
          </div>
        </div>
      )}

      {/* Status only Editable Warning */}
      {canEditStatusOnly && (
        <div className="flex items-start gap-3 p-4 bg-indigo-950/20 border border-indigo-900/35 rounded-xl text-xs text-indigo-200">
          <Shield className="w-5 h-5 flex-shrink-0 text-indigo-400" />
          <div>
            <p className="font-bold">Assignee Update Dashboard</p>
            <p className="text-slate-450 text-slate-400 mt-0.5">
              As the assignee, you can modify the task progress state below. Detailed fields (title, priority, due date) can only be updated by the project Admins.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Title, Description, Metadata */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Task Name
            </label>
            <input
              type="text"
              required
              disabled={!canEditAll}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#161a25] disabled:bg-slate-900/25 border border-slate-800 disabled:border-slate-900 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-base font-bold text-white focus:outline-none transition-all placeholder-slate-700"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Task Description
            </label>
            <textarea
              placeholder="No description provided."
              disabled={!canEditAll}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full bg-[#161a25] disabled:bg-slate-900/25 border border-slate-800 disabled:border-slate-900 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all resize-none placeholder-slate-700 leading-6"
            />
          </div>

          {/* Metadata Block: Creator and Creation Date */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-slate-800 bg-slate-950/20 text-xs text-slate-400">
            <div>
              <span className="block text-slate-500 mb-1 font-semibold uppercase tracking-wider text-[9px]">Created By</span>
              <span className="font-medium text-slate-300">{task.creator.name}</span>
            </div>
            <div>
              <span className="block text-slate-500 mb-1 font-semibold uppercase tracking-wider text-[9px]">Creation Date</span>
              <span className="font-medium text-slate-300">
                {new Date(task.createdAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

        </div>

        {/* Right Column: Status, Priority, Assignee, DueDate */}
        <div className="space-y-6 bg-[#0f1118]/60 p-6 rounded-2xl border border-slate-800/80">
          
          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Status State
            </label>
            <select
              disabled={isReadOnly}
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full bg-[#161a25] disabled:bg-slate-900/35 border border-slate-850 disabled:border-slate-900 rounded-lg px-3 py-2 text-xs text-slate-350 text-slate-350 text-slate-300 focus:outline-none transition-all cursor-pointer font-semibold"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Completed</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Priority
            </label>
            <select
              disabled={!canEditAll}
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className={`w-full bg-[#161a25] disabled:bg-slate-900/35 border border-slate-850 disabled:border-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none transition-all cursor-pointer font-semibold ${getPriorityColor(
                priority
              )}`}
            >
              <option value="LOW" className="text-slate-400 font-semibold">Low</option>
              <option value="MEDIUM" className="text-amber-400 font-semibold">Medium</option>
              <option value="HIGH" className="text-rose-455 text-rose-450 text-rose-400 font-semibold">High</option>
            </select>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Assigned Member
            </label>
            <select
              disabled={!canEditAll}
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full bg-[#161a25] disabled:bg-slate-900/35 border border-slate-850 disabled:border-slate-900 rounded-lg px-3 py-2 text-xs text-slate-350 text-slate-300 focus:outline-none transition-all cursor-pointer font-semibold"
            >
              <option value="">Unassigned</option>
              {projectMembers.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user.name}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Due Date
            </label>
            <div className="relative">
              <input
                type="date"
                disabled={!canEditAll}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#161a25] disabled:bg-slate-900/35 border border-slate-850 disabled:border-slate-900 rounded-lg px-3 py-2 text-xs text-slate-350 text-slate-300 focus:outline-none transition-all cursor-pointer font-semibold"
              />
            </div>
          </div>

          {/* Submit Save Button */}
          {!isReadOnly && (
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-indigo-650 hover:bg-indigo-550 bg-indigo-600 hover:bg-indigo-550 text-white rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-indigo-650/20 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving updates...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  {canEditAll ? "Save Changes" : "Update Status"}
                </>
              )}
            </button>
          )}

        </div>

      </div>

    </form>
  );
}
