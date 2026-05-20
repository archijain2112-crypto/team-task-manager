"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { CheckCircle2, AlertTriangle, ClipboardList, Clock, ArrowRight } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TaskCard from "@/components/TaskCard";

interface DashboardData {
  totalTasks: number;
  statusCounts: {
    TODO: number;
    IN_PROGRESS: number;
    DONE: number;
  };
  priorityCounts: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
  };
  overdueCount: number;
  tasksPerUser: Array<{ name: string; count: number }>;
  recentTasks: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get("/api/dashboard");
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Format Status Data for Recharts Pie Chart
  const getStatusChartData = (status: any) => {
    if (!status) return [];
    return [
      { name: "Todo", value: status.TODO, color: "#64748b" },
      { name: "In Progress", value: status.IN_PROGRESS, color: "#6366f1" },
      { name: "Completed", value: status.DONE, color: "#10b981" },
    ].filter((item) => item.value > 0);
  };

  const statusData = data ? getStatusChartData(data.statusCounts) : [];

  return (
    <div className="flex h-screen bg-[#090a0f] overflow-hidden select-none">
      {/* Sidebar */}
      <Sidebar onNewProjectCreated={fetchDashboardData} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#090a0f] p-8 text-slate-100">
        
        {/* Header Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Workspace Overview</h1>
            <p className="text-xs text-slate-500 mt-1">Aggregated statistics across all joined projects</p>
          </div>
        </div>

        {loading ? (
          /* Loading Skeletal State */
          <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-[#11131c] rounded-xl border border-slate-800 shimmer" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80 bg-[#11131c] rounded-xl border border-slate-800 shimmer" />
              <div className="h-80 bg-[#11131c] rounded-xl border border-slate-800 shimmer" />
            </div>
          </div>
        ) : !data || data.totalTasks === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-[60vh] glass-panel rounded-2xl border border-slate-800 p-8 text-center max-w-xl mx-auto mt-12">
            <div className="w-16 h-16 rounded-2xl bg-indigo-650/10 border border-indigo-500/20 flex items-center justify-center mb-6">
              <ClipboardList className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No tasks or projects found</h3>
            <p className="text-sm text-slate-500 max-w-sm mb-6">
              Get started by creating a new project using the <strong className="text-indigo-400 font-semibold">+</strong> button in the sidebar, or ask an administrator to add you.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider animate-bounce">
              <span>Create project in sidebar</span>
              <ArrowRight className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
        ) : (
          /* Real Data State */
          <div className="space-y-8 animate-fade-in">
            
            {/* Metric Blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Total Tasks */}
              <div className="glass-card p-6 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Tasks</p>
                  <p className="text-3xl font-extrabold text-white">{data.totalTasks}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-slate-400" />
                </div>
              </div>

              {/* In Progress Tasks */}
              <div className="glass-card p-6 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">In Progress</p>
                  <p className="text-3xl font-extrabold text-indigo-400">{data.statusCounts.IN_PROGRESS}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-950/20 border border-indigo-900/30 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-indigo-400" />
                </div>
              </div>

              {/* Completed Tasks */}
              <div className="glass-card p-6 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Completed</p>
                  <p className="text-3xl font-extrabold text-emerald-400">{data.statusCounts.DONE}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-950/20 border border-emerald-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
              </div>

              {/* Overdue Tasks */}
              <div className="glass-card p-6 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Overdue Tasks</p>
                  <p className={`text-3xl font-extrabold ${data.overdueCount > 0 ? "text-rose-500 font-black animate-pulse" : "text-slate-400"}`}>
                    {data.overdueCount}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${data.overdueCount > 0 ? "bg-rose-950/20 border-rose-900/30 text-rose-400" : "bg-slate-900/50 border-slate-800 text-slate-400"}`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>

            </div>

            {/* Recharts Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Pie: Tasks by Status */}
              <div className="glass-card p-6 rounded-xl border border-slate-800/80 space-y-4">
                <h3 className="text-sm font-bold text-slate-350 text-white uppercase tracking-wider">Tasks by Status</h3>
                
                <div className="h-64 flex items-center justify-center relative">
                  {statusData.length === 0 ? (
                    <div className="text-slate-600 text-xs italic">No statuses to chart</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#11131c",
                            borderColor: "#1e2230",
                            borderRadius: "8px",
                            color: "#fff",
                            fontSize: "12px",
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          iconType="circle"
                          iconSize={8}
                          formatter={(value) => <span className="text-slate-400 text-xs">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Bar: Tasks per User */}
              <div className="glass-card p-6 rounded-xl border border-slate-800/80 space-y-4">
                <h3 className="text-sm font-bold text-slate-350 text-white uppercase tracking-wider">Contributions</h3>
                
                <div className="h-64 flex items-center justify-center">
                  {data.tasksPerUser.length === 0 ? (
                    <div className="text-slate-600 text-xs italic">No assignees to chart</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.tasksPerUser}>
                        <XAxis
                          dataKey="name"
                          stroke="#475569"
                          fontSize={11}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="#475569"
                          fontSize={11}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#11131c",
                            borderColor: "#1e2230",
                            borderRadius: "8px",
                            color: "#fff",
                            fontSize: "12px",
                          }}
                          cursor={{ fill: "rgba(255,255,255,0.02)" }}
                        />
                        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

            </div>

            {/* Recent Tasks List */}
            <div className="glass-card p-6 rounded-xl border border-slate-800/80 space-y-4">
              <h3 className="text-sm font-bold text-slate-350 text-white uppercase tracking-wider">Recent Activity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {data.recentTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
