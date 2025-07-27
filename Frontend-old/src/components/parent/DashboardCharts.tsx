import React from 'react';
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
import { useUser } from '../../context/UserContext';

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
  const { sessions } = useUser();
  
  // Filter sessions for this child
  const childSessions = sessions.filter(session => session.childId === childId);
  
  // Sort sessions by date
  const sortedSessions = [...childSessions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Prepare data for line chart (focus over time)
  const lineChartData = {
    labels: sortedSessions.map(session => {
      const date = new Date(session.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }),
    datasets: [
      {
        label: 'Focus Score',
        data: sortedSessions.map(session => session.focusScore),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };
  
  // Average emotions across all sessions
  const emotionAverages = {
    happy: 0,
    neutral: 0,
    distracted: 0
  };
  
  if (childSessions.length > 0) {
    emotionAverages.happy = childSessions.reduce((sum, session) => sum + session.emotions.happy, 0) / childSessions.length;
    emotionAverages.neutral = childSessions.reduce((sum, session) => sum + session.emotions.neutral, 0) / childSessions.length;
    emotionAverages.distracted = childSessions.reduce((sum, session) => sum + session.emotions.distracted, 0) / childSessions.length;
  }
  
  // Prepare data for pie chart (emotion distribution)
  const pieChartData = {
    labels: ['Happy', 'Neutral', 'Distracted'],
    datasets: [
      {
        data: [emotionAverages.happy, emotionAverages.neutral, emotionAverages.distracted],
        backgroundColor: [
          'rgba(34, 197, 94, 0.7)',
          'rgba(250, 204, 21, 0.7)',
          'rgba(239, 68, 68, 0.7)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(250, 204, 21)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Calculate average focus score
  const averageFocusScore = childSessions.length > 0
    ? Math.round(childSessions.reduce((sum, session) => sum + session.focusScore, 0) / childSessions.length)
    : 0;
  
  // Calculate total study time in minutes
  const totalStudyTime = childSessions.reduce((sum, session) => sum + session.duration, 0);
  
  // Calculate total sessions
  const totalSessions = childSessions.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-primary-50 border border-primary-200">
          <div className="text-4xl font-bold text-primary-500 mb-2">{averageFocusScore}%</div>
          <div className="text-gray-600">Average Focus</div>
        </div>
        
        <div className="card bg-secondary-50 border border-secondary-200">
          <div className="text-4xl font-bold text-secondary-600 mb-2">{totalStudyTime}</div>
          <div className="text-gray-600">Total Minutes</div>
        </div>
        
        <div className="card bg-accent-50 border border-accent-200">
          <div className="text-4xl font-bold text-accent-500 mb-2">{totalSessions}</div>
          <div className="text-gray-600">Total Sessions</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Focus Over Time</h3>
          {childSessions.length > 0 ? (
            <Line data={lineChartData} options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                }
              }
            }} />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No session data available
            </div>
          )}
        </div>
        
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Emotional State</h3>
          {childSessions.length > 0 ? (
            <div className="h-64 flex items-center justify-center">
              <Pie data={pieChartData} options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                  }
                }
              }} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No emotion data available
            </div>
          )}
        </div>
      </div>
      
      <div className="card">
        <h3 className="text-xl font-bold mb-4">Recent Sessions</h3>
        {childSessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Focus Score</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedSessions.slice(-5).reverse().map((session) => (
                  <tr key={session.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{session.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{session.duration} min</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        session.focusScore > 80 
                          ? 'bg-success-100 text-success-800' 
                          : session.focusScore > 50 
                            ? 'bg-warning-100 text-warning-800' 
                            : 'bg-error-100 text-error-800'
                      }`}>
                        {session.focusScore}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            No session data available
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCharts;