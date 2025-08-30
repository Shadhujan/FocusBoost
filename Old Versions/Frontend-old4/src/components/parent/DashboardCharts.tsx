// src/components/parent/DashboardCharts.tsx
// Updated to use real session data from backend

import React, { useState, useEffect } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { RefreshCw, Calendar, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import { apiService, StudySession, SessionAnalytics } from '../../services/apiService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardChartsProps {
  childId: string;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ childId }) => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [analytics, setAnalytics] = useState<SessionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(7); // days

  useEffect(() => {
    loadSessionData();
  }, [childId, dateRange]);

  const loadSessionData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📊 Loading session data for child:', childId);

      // Load recent sessions
      const sessionsResult = await apiService.getChildSessions(childId, {
        limit: 20,
        statusFilter: 'completed' // Only completed sessions for analytics
      });

      // Load analytics
      const analyticsResult = await apiService.getChildAnalytics(childId, dateRange);

      if (sessionsResult.success && sessionsResult.data) {
        setSessions(sessionsResult.data.sessions);
        console.log('✅ Sessions loaded:', sessionsResult.data.sessions.length);
      }

      if (analyticsResult.success && analyticsResult.data) {
        setAnalytics(analyticsResult.data.analytics);
        console.log('✅ Analytics loaded:', analyticsResult.data.analytics);
      }

      if (!sessionsResult.success) {
        setError(sessionsResult.error || 'Failed to load sessions');
      }

    } catch (error: any) {
      console.error('🚨 Error loading session data:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for line chart (focus over time)
  const lineChartData = {
    labels: sessions.slice(-10).map(session => {
      const date = new Date(session.startTime);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }),
    datasets: [
      {
        label: 'Focus Score (%)',
        data: sessions.slice(-10).map(session => 
          session.results?.averageAttentionScore ? 
          Math.round(session.results.averageAttentionScore * 100) : 0
        ),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Prepare data for pie chart (subject distribution)
  const pieChartData = analytics ? {
    labels: Object.keys(analytics.subjectDistribution),
    datasets: [
      {
        data: Object.values(analytics.subjectDistribution),
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',   // Blue
          'rgba(34, 197, 94, 0.7)',    // Green
          'rgba(250, 204, 21, 0.7)',   // Yellow
          'rgba(239, 68, 68, 0.7)',    // Red
          'rgba(168, 85, 247, 0.7)',   // Purple
          'rgba(245, 101, 101, 0.7)',  // Pink
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(250, 204, 21)',
          'rgb(239, 68, 68)',
          'rgb(168, 85, 247)',
          'rgb(245, 101, 101)',
        ],
        borderWidth: 1,
      },
    ],
  } : { labels: [], datasets: [] };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-primary-500 mr-3" />
          <span className="text-gray-600">Loading session data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">⚠️ Error loading data</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadSessionData}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Session Analytics</h2>
        <div className="flex items-center gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(parseInt(e.target.value))}
            className="text-sm border rounded-lg px-3 py-1"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <button
            onClick={loadSessionData}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Refresh data"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-primary-50 border border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-primary-500">
                {analytics ? Math.round(analytics.averageFocusScore * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Average Focus</div>
            </div>
            <TrendingUp className="w-8 h-8 text-primary-400" />
          </div>
        </div>
        
        <div className="card bg-green-50 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {analytics ? formatDuration(analytics.totalStudyTime) : '0m'}
              </div>
              <div className="text-sm text-gray-600">Total Study Time</div>
            </div>
            <Clock className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="card bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {analytics ? analytics.totalSessions : 0}
              </div>
              <div className="text-sm text-gray-600">Total Sessions</div>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="card bg-purple-50 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {analytics ? formatDuration(analytics.averageSessionLength) : '0m'}
              </div>
              <div className="text-sm text-gray-600">Avg Session</div>
            </div>
            <Calendar className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Focus Trend (Last 10 Sessions)</h3>
          {sessions.length > 0 ? (
            <Line data={lineChartData} options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    callback: function(value) {
                      return value + '%';
                    }
                  }
                }
              },
              plugins: {
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return `Focus Score: ${context.parsed.y}%`;
                    }
                  }
                }
              }
            }} />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No session data available</p>
                <p className="text-sm">Complete some study sessions to see focus trends</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Subject Distribution</h3>
          {analytics && Object.keys(analytics.subjectDistribution).length > 0 ? (
            <div className="h-64 flex items-center justify-center">
              <Pie data={pieChartData} options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed;
                        return `${label}: ${value} session${value !== 1 ? 's' : ''}`;
                      }
                    }
                  }
                }
              }} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No subject data available</p>
                <p className="text-sm">Study different subjects to see distribution</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Recent Sessions Table */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Recent Sessions</h3>
        {sessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Focus Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">XP Earned</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.slice(-5).reverse().map((session) => (
                  <tr key={session.sessionId} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {formatDate(session.startTime)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm capitalize bg-gray-100 px-2 py-1 rounded">
                        {session.subject}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {session.actualDuration ? formatDuration(session.actualDuration) : 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {session.results?.averageAttentionScore ? (
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          session.results.averageAttentionScore > 0.8 
                            ? 'bg-green-100 text-green-800' 
                            : session.results.averageAttentionScore > 0.5 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {Math.round(session.results.averageAttentionScore * 100)}%
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {session.results?.xpEarned ? (
                        <span className="text-yellow-600 font-medium">
                          +{session.results.xpEarned} XP
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium">No sessions yet</p>
            <p className="text-sm">Sessions will appear here once your child starts studying</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCharts;