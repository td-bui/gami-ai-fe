"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/utils/authFetch";
import { FaUser, FaChartBar, FaTrophy, FaClipboardList } from "react-icons/fa";
import { format } from 'date-fns';

// --- TypeScript Interfaces for API Data ---
interface UserInfo {
  username: string;
  level: string;
  xp: number;
  rank: number;
}

interface PerformanceStats {
  time: string;
  space: string;
  overall: string;
}

interface OverallStats {
  problemsSolved: string;
  acceptanceRate: string;
  performanceBeats: PerformanceStats;
  attempting: number;
  totalSubmissions: number;
  byDifficulty: Record<string, string>;
}

interface LeaderboardEntry {
  username: string;
  level: string;
  xp: number;
}

interface HistoryItem {
  title: string;
  difficulty: string;
  completedAt?: string;
  submittedAt?: string;
  status?: string;
  runtime?: number;
}

interface DashboardData {
  userInfo: UserInfo;
  overallStats: OverallStats;
  leaderboard: LeaderboardEntry[];
  lessonHistory: HistoryItem[];
  problemHistory: HistoryItem[];
}

// --- Reusable UI Components ---

const StatCard = ({ title, icon, children, className }: { title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm ${className}`}>
    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-3">
      {icon}
      <span>{title}</span>
    </h2>
    {children}
  </div>
);

const ProgressBar = ({ value, total, color }: { value: number; total: number; color: string }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div className={`${color} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
    </div>
  );
};

// --- Main Dashboard Page ---

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'problems' | 'lessons'>('problems');

  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setError("User not found. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const res = await authFetch(`${apiBaseUrl}/api/user/${userId}/dashboard`);
        if (!res.ok) {
          throw new Error("Failed to fetch dashboard data.");
        }
        const dashboardData = await res.json();
        setData(dashboardData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-gray-100 text-gray-800">Loading Dashboard...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen bg-gray-100 text-red-500">{error}</div>;
  }

  if (!data) {
    return <div className="flex justify-center items-center h-screen bg-gray-100 text-gray-800">No data available.</div>;
  }

  const { userInfo, overallStats, leaderboard, lessonHistory, problemHistory } = data;

  return (
    <div className="bg-gray-100 text-gray-700 h-full p-4 sm:p-6 lg:p-8 mx-auto">
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <StatCard title={userInfo.username} icon={<FaUser />}>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Level</span>
                  <span className="text-gray-900 font-bold capitalize">{userInfo.level}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">XP</span>
                  <span className="text-amber-500 font-bold">{userInfo.xp}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Rank</span>
                  <span className="text-gray-900 font-bold">#{userInfo.rank}</span>
                </div>
              </div>
            </StatCard>

            <StatCard title="Difficulty Stats" icon={<FaChartBar />}>
              <div className="space-y-4">
                {Object.entries(overallStats.byDifficulty).map(([difficulty, stats]) => {
                  const [solved, total] = stats.split('/').map(Number);
                  const color = difficulty.toLowerCase() === 'easy' ? 'bg-green-500' : difficulty.toLowerCase() === 'medium' ? 'bg-yellow-500' : 'bg-red-500';
                  return (
                    <div key={difficulty}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold capitalize">{difficulty}</span>
                        <span className="text-gray-900">{solved} / {total}</span>
                      </div>
                      <ProgressBar value={solved} total={total} color={color} />
                    </div>
                  );
                })}
              </div>
            </StatCard>

            <StatCard title="Leaderboard" icon={<FaTrophy />}>
              <ul className="space-y-3">
                {leaderboard.map((user, index) => (
                  <li key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900 w-5">{index + 1}</span>
                      <span>{user.username}</span>
                    </div>
                    <span className="text-amber-500 font-semibold">{user.xp} XP</span>
                  </li>
                ))}
              </ul>
            </StatCard>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <StatCard title="Overall Stats" icon={<FaClipboardList />}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-gray-900">{overallStats.problemsSolved.split('/')[0]}</div>
                  <div className="text-sm">Problems Solved</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">{overallStats.acceptanceRate}</div>
                  <div className="text-sm">Acceptance Rate</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">{overallStats.totalSubmissions}</div>
                  <div className="text-sm">Total Submissions</div>
                </div>
              </div>
            </StatCard>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-200">
                <button onClick={() => setActiveTab('problems')} className={`py-3 px-6 font-semibold text-sm transition-colors ${activeTab === 'problems' ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:bg-gray-50'}`}>
                  Problems Solved
                </button>
                <button onClick={() => setActiveTab('lessons')} className={`py-3 px-6 font-semibold text-sm transition-colors ${activeTab === 'lessons' ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:bg-gray-50'}`}>
                  Lessons Completed
                </button>
              </div>
              <div className="p-1">
                <div className="overflow-x-auto">
                  {/* Use table-fixed to prevent layout shifts */}
                  <table className="w-full text-left text-sm table-fixed">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                      <tr>
                        {/* Define explicit column widths */}
                        <th className="px-6 py-3 w-2/5">Title</th>
                        <th className="px-6 py-3 w-1/5">Difficulty</th>
                        <th className="px-6 py-3 w-1/5">Date</th>
                        <th className="px-6 py-3 w-1/5">Runtime</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeTab === 'problems' ? problemHistory : lessonHistory).map((item, index) => (
                        <tr key={index} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900 truncate">{item.title}</td>
                          <td className="px-6 py-4 capitalize">{item.difficulty}</td>
                          <td className="px-6 py-4">{format(new Date(item.submittedAt || item.completedAt!), 'MMM dd, yyyy')}</td>
                          {/* Conditionally render content, not the cell itself */}
                          <td className="px-6 py-4">
                            {activeTab === 'problems' && item.runtime != null ? `${item.runtime} ms` : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}