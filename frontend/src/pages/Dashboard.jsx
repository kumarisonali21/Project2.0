import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, CheckCircle, AlertCircle, ListTodo, 
  Clock, Users, Activity, Bell, Search, Star, Sparkles 
} from 'lucide-react';
import { io } from 'socket.io-client';

const Dashboard = ({ user }) => {
  const [metrics, setMetrics] = useState({ totalTasks: 0, completedTasks: 0, overdueTasks: 0 });
  const [myTasks, setMyTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [metricsRes, tasksRes, usersRes] = await Promise.all([
        fetch('http://localhost:5000/api/dashboard', { headers }),
        fetch('http://localhost:5000/api/tasks', { headers }),
        fetch('http://localhost:5000/api/users', { headers })
      ]);

      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (tasksRes.ok) {
        const tasks = await tasksRes.json();
        // Just show pending/in progress for 'My Tasks' quick view or all. Let's show all for them to manage.
        setMyTasks(tasks.slice(0, 5)); // Limit to recent 5 tasks
      }
      if (usersRes.ok) {
        setTeamMembers(await usersRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const socket = io('http://localhost:5000');
    
    socket.on('taskCreated', () => fetchData());
    socket.on('taskUpdated', () => fetchData());
    socket.on('taskDeleted', () => fetchData());

    return () => socket.disconnect();
  }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        setMyTasks(myTasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        fetchData(); // Refresh metrics
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              {getGreeting()}, {user?.name.split(' ')[0]}! <Sparkles className="w-5 h-5 text-yellow-400" />
            </h1>
            <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> {today}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-full transition text-gray-600 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Total Tasks" 
          value={metrics.totalTasks} 
          icon={<ListTodo className="w-7 h-7 text-white" />}
          gradient="from-blue-500 to-cyan-400"
        />
        <MetricCard 
          title="Completed" 
          value={metrics.completedTasks} 
          icon={<CheckCircle className="w-7 h-7 text-white" />}
          gradient="from-emerald-400 to-teal-500"
        />
        <MetricCard 
          title="Overdue" 
          value={metrics.overdueTasks} 
          icon={<AlertCircle className="w-7 h-7 text-white" />}
          gradient="from-rose-400 to-red-500"
        />
      </div>

      {/* Main Section: Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left side: My Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-indigo-500" /> My Priority Tasks
              </h2>
              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View all</button>
            </div>

            {myTasks.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-16 h-16 text-indigo-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">All Clear!</h3>
                <p className="text-gray-500 mt-2 max-w-sm">You have no pending tasks. Great job keeping your workspace clean!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myTasks.map(task => (
                  <div key={task.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all bg-gray-50 hover:bg-white gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{task.title}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                          task.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                          task.priority === 'LOW' ? 'bg-green-100 text-green-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {task.priority || 'MEDIUM'}
                        </span>
                        {task.project?.name && (
                          <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-md">{task.project.name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <select 
                        value={task.status} 
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        className={`text-sm font-bold rounded-lg px-3 py-2 border-0 ring-1 ring-inset focus:ring-2 focus:ring-indigo-600 ${
                          task.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                          task.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 ring-blue-200' :
                          'bg-gray-100 text-gray-700 ring-gray-200'
                        }`}
                      >
                        <option value="PENDING">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Done</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side: Activity & Team */}
        <div className="space-y-8">
          
          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-pink-500" /> Recent Activity
            </h2>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              {/* Mocking recent activities */}
              {[
                { text: "Admin assigned a new task to you", time: "2 hours ago", color: "bg-blue-500" },
                { text: "Sarah completed 'Homepage Redesign'", time: "4 hours ago", color: "bg-green-500" },
                { text: "Project 'Q3 Launch' was updated", time: "Yesterday", color: "bg-purple-500" }
              ].map((activity, i) => (
                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className={`flex items-center justify-center w-3 h-3 rounded-full border-4 box-content border-white ${activity.color} shadow-sm z-10`}></div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-sm font-medium text-gray-800">{activity.text}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-cyan-500" /> Team Online
            </h2>
            <div className="space-y-4">
              {teamMembers.length > 0 ? teamMembers.map((member, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm">
                      {member.name.charAt(0)}
                    </div>
                    {/* Mock online status - active if id is even, away if odd just for visual flair */}
                    <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${i % 2 === 0 ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.role}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-500">No team members found.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon, gradient }) => (
  <div className={`bg-gradient-to-br ${gradient} rounded-2xl shadow-lg p-6 relative overflow-hidden transform hover:-translate-y-1 transition-transform duration-300`}>
    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
    <div className="relative z-10 flex items-center justify-between">
      <div>
        <p className="text-white text-sm font-semibold opacity-90 mb-1">{title}</p>
        <h3 className="text-4xl font-black text-white tracking-tight">{value}</h3>
      </div>
      <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
        {icon}
      </div>
    </div>
  </div>
);

export default Dashboard;
