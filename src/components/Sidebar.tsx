"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import { LayoutDashboard, FolderPlus, LogOut, ChevronRight, Folder } from "lucide-react";
import { useToast } from "./Toast";

interface Project {
  id: string;
  name: string;
}

interface User {
  name: string;
  email: string;
}

interface SidebarProps {
  onNewProjectCreated?: () => void;
}

export default function Sidebar({ onNewProjectCreated }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user profile and projects
  const fetchData = async () => {
    try {
      const [userRes, projectsRes] = await Promise.all([
        axios.get("/api/auth/me"),
        axios.get("/api/projects"),
      ]);
      setUser(userRes.data.user);
      setProjects(projectsRes.data.projects);
    } catch (err) {
      console.error("Failed to load sidebar content", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pathname]); // Refresh when page changes

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
      toast("Successfully logged out!", "success");
      router.push("/login");
      router.refresh();
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to logout", "error");
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await axios.post("/api/projects", {
        name: newProjectName,
        description: newProjectDesc,
      });
      toast("Project created successfully!", "success");
      setNewProjectName("");
      setNewProjectDesc("");
      setShowCreateModal(false);
      
      // Update local projects list
      setProjects((prev) => [res.data.project, ...prev]);
      
      if (onNewProjectCreated) {
        onNewProjectCreated();
      }
      
      // Navigate to the new project
      router.push(`/projects/${res.data.project.id}`);
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to create project", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className="w-64 border-r border-slate-800 bg-[#0d0f17] flex flex-col h-screen text-slate-300 select-none flex-shrink-0">
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30">
          T
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          TaskFlow
        </span>
      </div>

      {/* Nav Links */}
      <div className="flex-1 py-4 overflow-y-auto px-3 space-y-6">
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              pathname === "/dashboard"
                ? "bg-slate-800 text-white font-semibold"
                : "hover:bg-slate-900 hover:text-slate-100"
            }`}
          >
            <LayoutDashboard className="w-4.5 h-4.5 text-indigo-400" />
            Dashboard
          </Link>
        </div>

        {/* Projects Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Projects</span>
            <button
              onClick={() => setShowCreateModal(true)}
              className="hover:text-indigo-400 p-0.5 rounded transition-colors cursor-pointer"
              title="Create new project"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
            {projects.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-600 italic">No projects joined</div>
            ) : (
              projects.map((proj) => {
                const isActive = pathname === `/projects/${proj.id}`;
                return (
                  <Link
                    key={proj.id}
                    href={`/projects/${proj.id}`}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all group ${
                      isActive
                        ? "bg-slate-800/80 text-white font-medium"
                        : "hover:bg-slate-900 hover:text-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Folder className={`w-4 h-4 truncate ${isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-400"}`} />
                      <span className="truncate">{proj.name}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-slate-500 transition-opacity" />
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* User Section */}
      {user && (
        <div className="p-4 border-t border-slate-800 bg-[#0a0b10] flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-slate-700">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2 bg-slate-900 hover:bg-rose-950/40 hover:text-rose-400 text-slate-400 border border-slate-800 hover:border-rose-900/50 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#12131a] border border-slate-800 rounded-xl p-6 shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-white">Create New Project</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Website Redesign"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-[#1e2230] border border-slate-800 focus:border-indigo-500/50 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none transition-all placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Summarize the project goals..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-[#1e2230] border border-slate-800 focus:border-indigo-500/50 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none transition-all resize-none placeholder-slate-600"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
