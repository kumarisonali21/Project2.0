import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/analytics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="text-center mt-10">Loading analytics...</div>;
  if (!analytics) return <div className="text-center mt-10 text-red-500">Failed to load analytics</div>;

  const doughnutData = {
    labels: ['HIGH', 'MEDIUM', 'LOW'],
    datasets: [
      {
        data: [
          analytics.priorityCounts.HIGH || 0,
          analytics.priorityCounts.MEDIUM || 0,
          analytics.priorityCounts.LOW || 0,
        ],
        backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
        hoverBackgroundColor: ['#dc2626', '#d97706', '#059669'],
      },
    ],
  };

  // Mocking burn-down for presentation (in a real app, we'd need historical date-based snapshot data)
  const lineData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Remaining Tasks',
        data: [12, 11, 9, 7, 5, 4, 2], // Dummy data
        fill: false,
        backgroundColor: '#4f46e5',
        borderColor: '#4f46e5',
      },
      {
        label: 'Ideal Burndown',
        data: [12, 10, 8, 6, 4, 2, 0], // Dummy data
        fill: false,
        borderDash: [5, 5],
        backgroundColor: '#9ca3af',
        borderColor: '#9ca3af',
      }
    ],
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Analytics Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-center">Task Priority Distribution</h2>
          <div className="w-64 h-64 mx-auto">
            <Doughnut data={doughnutData} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-center">Weekly Sprint Burndown</h2>
          <div className="w-full h-64 flex justify-center">
            <Line data={lineData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
