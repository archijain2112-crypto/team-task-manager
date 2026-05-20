"use client";

import React from "react";
import Link from "next/link";
import { Calendar, Clock, PlayCircle, CheckCircle2 } from "lucide-react";

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string | Date | null;
  assignee?: {
    id: string;
    name: string;
    email: string;
  } | null;
  project?: {
    name: string;
  } | null;
}

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const isOverdue = () => {
    if (!task.dueDate || task.status === "DONE") return false;
    return new Date(task.dueDate) < new Date();
  };

  const isDueToday = () => {
    if (!task.dueDate) return false;
    const today = new Date();
    const due = new Date(task.dueDate);
    return (
      today.getDate() === due.getDate() &&
      today.getMonth() === due.getMonth() &&
      today.getFullYear() === due.getFullYear()
    );
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "HIGH":
        return "bg-rose-950/50 text-rose-400 border-rose-800/30";
      case "MEDIUM":
        return "bg-amber-950/50 text-amber-400 border-amber-800/30";
      default:
        return "bg-slate-900/50 text-slate-400 border-slate-800";
    }
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case "IN_PROGRESS":
        return <PlayCircle className="w-4 h-4 text-indigo-400" />;
      case "DONE":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatDueDate = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Link href={`/tasks/${task.id}`} className="block">
      <div className="glass-card glow-border p-4.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/30 hover:bg-[#11131c]/60 cursor-pointer transition-all space-y-3 shadow-sm select-none">
        
        {/* Header: Project and Priority */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide truncate max-w-[120px]">
            {task.project?.name || "General"}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityColor(
              task.priority
            )}`}
          >
            {task.priority}
          </span>
        </div>

        {/* Title & Desc */}
        <div>
          <h4 className="text-sm font-bold text-white leading-5 truncate">{task.title}</h4>
          {task.description && (
            <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-4">
              {task.description}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800/80 my-2" />

        {/* Footer info: Assignee, Due date, Status */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            {getStatusIcon(task.status)}
            <span className="text-[11px] font-medium text-slate-500 uppercase">
              {task.status.replace("_", " ")}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Due date indicator */}
            {task.dueDate && (
              <div
                className={`flex items-center gap-1.5 font-medium px-2 py-0.5 rounded-md border text-[11px] ${
                  isOverdue()
                    ? "bg-rose-950/30 text-rose-400 border-rose-900/40"
                    : isDueToday()
                    ? "bg-amber-950/30 text-amber-400 border-amber-900/40"
                    : "bg-slate-900/40 border-slate-800 text-slate-500"
                }`}
                title={isOverdue() ? "Overdue!" : isDueToday() ? "Due Today" : "Due Date"}
              >
                <Calendar className="w-3 h-3" />
                <span>{formatDueDate(task.dueDate)}</span>
              </div>
            )}

            {/* Assignee Avatar */}
            <div className="flex items-center gap-1.5 max-w-[100px]">
              <div className="w-5.5 h-5.5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                {task.assignee ? task.assignee.name.charAt(0).toUpperCase() : "?"}
              </div>
              <span className="truncate text-[11px] text-slate-500 font-medium">
                {task.assignee ? task.assignee.name.split(" ")[0] : "Unassigned"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
