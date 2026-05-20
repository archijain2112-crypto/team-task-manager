"use client";

import React, { use, useEffect, useState } from "react";
import axios from "axios";
import { Plus, UserPlus, Search, Shield, Filter, UserMinus, ArrowLeft, Loader2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TaskCard from "@/components/TaskCard";
import { useToast } from "@/components/Toast";
import Link from "next/link";

interface Member {
  id: string;
  userId: string;
  role: "ADMIN" | "MEMBER";
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string | null;
  assignedTo?: string | null;
  assignee?: {
    id: string;
    name: string;
    email: string;
  } | null;
  project?: {
    name: string;
  };
}

interface ProjectData {
  id: string;
  name: string;
  description?: string | null;
  createdBy: string;
  members: Member[];
  tasks: Task[];
}

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const { toast } = useToast();

  const [project, setProject] = useState<ProjectData | null>(null);
  const [userRole, setUserRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");

  // Add Member State
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("MEMBER");
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Create Task State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [taskStatus, setTaskStatus] = useState("TODO");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const fetchProjectData = async () => {
    try {
      const res = await axios.get(`/api/projects/${projectId}`);
      setProject(res.data.project);
      setUserRole(res.data.userRole);
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to load project details", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    setIsAddingMember(true);
    try {
      const res = await axios.post(`/api/projects/${projectId}/members`, {
        email: newMemberEmail,
        role: newMemberRole,
      });
      toast("Member added successfully!", "success");
      setNewMemberEmail("");
      
      // Update local members list
      if (project) {
        setProject({
          ...project,
          members: [...project.members, res.data.member],
        });
      }
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to add member", "error");
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      await axios.delete(`/api/projects/${projectId}/members`, {
        data: { userId },
      });
      toast("Member removed successfully!", "success");
      
      // Update local members list
      if (project) {
        setProject({
          ...project,
          members: project.members.filter((m) => m.userId !== userId),
        });
      }
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to remove member", "error");
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    setIsCreatingTask(true);
    try {
      await axios.post("/api/tasks", {
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        status: taskStatus,
        assignedTo: taskAssignee || null,
        dueDate: taskDueDate || null,
        projectId,
      });

      toast("Task created successfully!", "success");
      
      // Reset form & close modal
      setTaskTitle("");
      setTaskDesc("");
      setTaskPriority("MEDIUM");
      setTaskStatus("TODO");
      setTaskAssignee("");
      setTaskDueDate("");
      setShowTaskModal(false);

      // Refresh project tasks
      fetchProjectData();
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to create task", "error");
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Filter tasks based on Search, Priority, and Assignee Filters
  const getFilteredTasks = () => {
    if (!project) return [];
    return project.tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPriority =
        priorityFilter === "ALL" || task.priority === priorityFilter;
      
      const matchesAssignee =
        assigneeFilter === "ALL" ||
        (assigneeFilter === "UNASSIGNED" && !task.assignedTo) ||
        task.assignedTo === assigneeFilter;

      return matchesSearch && matchesPriority && matchesAssignee;
    });
  };

  const filteredTasks = getFilteredTasks();

  const getTasksByStatus = (status: "TODO" | "IN_PROGRESS" | "DONE") => {
    return filteredTasks.filter((t) => t.status === status);
  };

  const isAdmin = userRole === "ADMIN";

  return (
    <div className="flex h-screen bg-[#090a0f] overflow-hidden select-none">
      <Sidebar onNewProjectCreated={fetchProjectData} />

      <main className="flex-1 overflow-y-auto bg-[#090a0f] p-8 text-slate-100 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : !project ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-2">Project not found</h2>
            <Link href="/dashboard" className="text-indigo-400 hover:underline flex items-center gap-1 text-sm font-semibold cursor-pointer">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-8 flex-1 flex flex-col min-h-0 animate-fade-in">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-white">{project.name}</h1>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${isAdmin ? "bg-indigo-950/40 text-indigo-400 border-indigo-900/40" : "bg-slate-900/40 text-slate-500 border-slate-800"}`}>
                    {userRole}
                  </span>
                </div>
                {project.description && (
                  <p className="text-xs text-slate-550 text-slate-400 leading-5">{project.description}</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all border border-indigo-500/20"
                >
                  <Plus className="w-4 h-4" /> Create Task
                </button>
              </div>
            </div>

            {/* Layout: Main board and Members management panels */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 flex-1 min-h-0">
              
              {/* Kanban Task Board Columns */}
              <div className="xl:col-span-3 flex flex-col gap-6 min-h-0">
                
                {/* Search & Filter bar */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between glass-card p-3 rounded-xl border border-slate-800 text-xs">
                  
                  {/* Search bar */}
                  <div className="relative w-full sm:max-w-xs">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#161a25] border border-slate-800 focus:border-indigo-500/40 focus:outline-none rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-650"
                    />
                  </div>

                  {/* Filter controls */}
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                    
                    {/* Priority filter */}
                    <div className="flex items-center gap-2 text-slate-400">
                      <Filter className="w-3.5 h-3.5 text-slate-500" />
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="bg-[#161a25] border border-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none text-slate-400 font-medium cursor-pointer"
                      >
                        <option value="ALL">All Priorities</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                      </select>
                    </div>

                    {/* Assignee filter */}
                    <select
                      value={assigneeFilter}
                      onChange={(e) => setAssigneeFilter(e.target.value)}
                      className="bg-[#161a25] border border-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none text-slate-400 font-medium cursor-pointer"
                    >
                      <option value="ALL">All Members</option>
                      <option value="UNASSIGNED">Unassigned</option>
                      {project.members.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.user.name}
                        </option>
                      ))}
                    </select>

                  </div>

                </div>

                {/* 3 Columns Kanban Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-y-auto pr-1">
                  
                  {/* TODO Column */}
                  <div className="space-y-4 flex flex-col min-h-[300px]">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-550 bg-slate-500" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">To Do</h3>
                      </div>
                      <span className="text-xs font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full text-slate-500">
                        {getTasksByStatus("TODO").length}
                      </span>
                    </div>

                    <div className="flex-1 bg-[#0b0c12]/50 border border-slate-900/60 p-3 rounded-xl space-y-3 overflow-y-auto max-h-[500px]">
                      {getTasksByStatus("TODO").length === 0 ? (
                        <div className="text-center py-8 text-xs text-slate-600 italic">No tasks todo</div>
                      ) : (
                        getTasksByStatus("TODO").map((task) => (
                          <TaskCard key={task.id} task={task} />
                        ))
                      )}
                    </div>
                  </div>

                  {/* IN_PROGRESS Column */}
                  <div className="space-y-4 flex flex-col min-h-[300px]">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-550 bg-indigo-500 shadow-md shadow-indigo-650/40" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">In Progress</h3>
                      </div>
                      <span className="text-xs font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full text-slate-500">
                        {getTasksByStatus("IN_PROGRESS").length}
                      </span>
                    </div>

                    <div className="flex-1 bg-[#0b0c12]/50 border border-slate-900/60 p-3 rounded-xl space-y-3 overflow-y-auto max-h-[500px]">
                      {getTasksByStatus("IN_PROGRESS").length === 0 ? (
                        <div className="text-center py-8 text-xs text-slate-600 italic">No tasks in progress</div>
                      ) : (
                        getTasksByStatus("IN_PROGRESS").map((task) => (
                          <TaskCard key={task.id} task={task} />
                        ))
                      )}
                    </div>
                  </div>

                  {/* DONE Column */}
                  <div className="space-y-4 flex flex-col min-h-[300px]">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-550 bg-emerald-500 shadow-md shadow-emerald-650/40" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Completed</h3>
                      </div>
                      <span className="text-xs font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full text-slate-500">
                        {getTasksByStatus("DONE").length}
                      </span>
                    </div>

                    <div className="flex-1 bg-[#0b0c12]/50 border border-slate-900/60 p-3 rounded-xl space-y-3 overflow-y-auto max-h-[500px]">
                      {getTasksByStatus("DONE").length === 0 ? (
                        <div className="text-center py-8 text-xs text-slate-600 italic">No tasks completed</div>
                      ) : (
                        getTasksByStatus("DONE").map((task) => (
                          <TaskCard key={task.id} task={task} />
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>

              {/* Members Management Panel */}
              <div className="space-y-6">
                
                {/* Invite panel (Admins only) */}
                {isAdmin && (
                  <div className="glass-card border border-slate-800 p-5 rounded-xl space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-indigo-400" />
                      Add Member
                    </h3>

                    <form onSubmit={handleAddMember} className="space-y-3">
                      <div>
                        <input
                          type="email"
                          required
                          placeholder="member@email.com"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                          className="w-full bg-[#161a25] border border-slate-800 focus:border-indigo-500/55 focus:outline-none rounded-lg px-3 py-2 text-xs text-white placeholder-slate-650"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <select
                          value={newMemberRole}
                          onChange={(e) => setNewMemberRole(e.target.value)}
                          className="bg-[#161a25] border border-slate-800 rounded-lg px-2 py-1.5 focus:outline-none text-slate-400 font-medium text-xs flex-1 cursor-pointer"
                        >
                          <option value="MEMBER">Member</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <button
                          type="submit"
                          disabled={isAddingMember}
                          className="bg-indigo-600 hover:bg-indigo-550 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isAddingMember ? "Adding..." : "Add"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Team members list */}
                <div className="glass-card border border-slate-800 p-5 rounded-xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-400" />
                    Project Team
                  </h3>

                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {project.members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                            {m.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <p className="font-semibold text-white truncate">{m.user.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{m.user.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${m.role === "ADMIN" ? "bg-indigo-950/40 text-indigo-400 border-indigo-900/40" : "bg-slate-900/40 text-slate-500 border-slate-800"}`}>
                            {m.role}
                          </span>
                          
                          {isAdmin && m.user.id !== project.createdBy && (
                            <button
                              onClick={() => handleRemoveMember(m.user.id)}
                              className="text-slate-505 text-slate-500 hover:text-rose-455 hover:text-rose-400 transition-colors p-1 hover:bg-rose-950/30 rounded-md cursor-pointer"
                              title="Remove member"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* Create Task Modal */}
            {showTaskModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="w-full max-w-lg bg-[#12131a] border border-slate-800 rounded-xl p-6 shadow-2xl animate-scale-in">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-white">Create New Task</h3>
                    <button
                      onClick={() => setShowTaskModal(false)}
                      className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleCreateTask} className="space-y-4">
                    
                    {/* Title */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                        Task Title
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Set up database indices"
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        className="w-full bg-[#1e2230] border border-slate-800 focus:border-indigo-500/50 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none transition-all placeholder-slate-650"
                      />
                    </div>

                    {/* Desc */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                        Description
                      </label>
                      <textarea
                        placeholder="Detail the work to be done..."
                        value={taskDesc}
                        onChange={(e) => setTaskDesc(e.target.value)}
                        rows={3}
                        className="w-full bg-[#1e2230] border border-slate-800 focus:border-indigo-500/50 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none transition-all resize-none placeholder-slate-650"
                      />
                    </div>

                    {/* Priority, Status, Assignee, DueDate */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Priority */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                          Priority
                        </label>
                        <select
                          value={taskPriority}
                          onChange={(e) => setTaskPriority(e.target.value)}
                          className="w-full bg-[#1e2230] border border-slate-800 focus:border-indigo-500/50 rounded-lg px-3.5 py-2.5 text-sm text-slate-350 text-slate-300 focus:outline-none transition-all cursor-pointer"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                        </select>
                      </div>

                      {/* Status */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                          Initial Status
                        </label>
                        <select
                          value={taskStatus}
                          onChange={(e) => setTaskStatus(e.target.value)}
                          className="w-full bg-[#1e2230] border border-slate-800 focus:border-indigo-500/50 rounded-lg px-3.5 py-2.5 text-sm text-slate-350 text-slate-300 focus:outline-none transition-all cursor-pointer"
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="DONE">Completed</option>
                        </select>
                      </div>

                      {/* Assignee */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                          Assign To
                        </label>
                        <select
                          value={taskAssignee}
                          onChange={(e) => setTaskAssignee(e.target.value)}
                          className="w-full bg-[#1e2230] border border-slate-800 focus:border-indigo-500/50 rounded-lg px-3.5 py-2.5 text-sm text-slate-350 text-slate-300 focus:outline-none transition-all cursor-pointer"
                        >
                          <option value="">Unassigned</option>
                          {project.members.map((m) => (
                            <option key={m.userId} value={m.userId}>
                              {m.user.name} ({m.user.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Due Date */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={taskDueDate}
                          onChange={(e) => setTaskDueDate(e.target.value)}
                          className="w-full bg-[#1e2230] border border-slate-800 focus:border-indigo-500/50 rounded-lg px-3.5 py-2.5 text-sm text-slate-350 text-slate-300 focus:outline-none transition-all cursor-pointer"
                        />
                      </div>

                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-4">
                      <button
                        type="button"
                        onClick={() => setShowTaskModal(false)}
                        className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isCreatingTask}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-indigo-600/25 disabled:opacity-50"
                      >
                        {isCreatingTask ? "Creating..." : "Create Task"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
