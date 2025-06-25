import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers, FiCalendar, FiCheckCircle, FiPlusCircle, FiMinusCircle
} from 'react-icons/fi';
const baseUrl = process.env.REACT_APP_API_URL;

const COLORS = ['#0088FE', '#FF8042', '#00C49F'];

const Dashboard: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const token = localStorage.getItem('token');
  const clientData = useMemo(() => JSON.parse(localStorage.getItem('client') || '{}'), []);
  const navigate = useNavigate();

  const fetchOverview = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/admin/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOverview(res.data);
    } catch (err) {
      console.error('Error fetching dashboard data', err);
    }
  };

  const fetchActivityLog = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/admin/recent-activity`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sorted = res.data.sort((a: any, b: any) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setActivityLog(sorted.slice(0, 10));
    } catch (err) {
      console.error('Error fetching activity log', err);
    }
  };

  useEffect(() => {
    if (clientData.role !== 'admin') {
      navigate('/appointments');
      return;
    }

    fetchOverview();
    fetchActivityLog();
  }, [token, navigate]);

  useEffect(() => {
    if (overview) {
      console.log('📊 Overview updated:', overview);
    }
  }, [overview]);

  if (!overview) {
    return <div className="p-6">טוען נתונים...</div>;
  }

  const usageData = [
    { name: 'לקוחות', value: overview.totalClients },
    { name: 'תורים', value: overview.totalSlots },
    { name: 'הזמנות', value: overview.totalBookings }
  ];

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <h2 className="text-3xl font-bold mb-4 text-gray-800">📊 לוח ניהול</h2>

      {/* Refresh Button */}
      <div className="mb-6">
        <button
          onClick={() => {
            fetchOverview();
            fetchActivityLog();
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          🔄 רענן את לוח הניהול
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg shadow flex items-center justify-between">
          <div>
            <p className="text-gray-600">סה״כ לקוחות</p>
            <p className="text-3xl font-bold text-blue-700">{overview.totalClients}</p>
          </div>
          <FiUsers className="text-4xl text-blue-500" />
        </div>
        <div className="bg-orange-50 p-6 rounded-lg shadow flex items-center justify-between">
          <div>
            <p className="text-gray-600">סה״כ תורים</p>
            <p className="text-3xl font-bold text-orange-700">{overview.totalSlots}</p>
          </div>
          <FiCalendar className="text-4xl text-orange-500" />
        </div>
        <div className="bg-green-50 p-6 rounded-lg shadow flex items-center justify-between">
          <div>
            <p className="text-gray-600">סה״כ הזמנות</p>
            <p className="text-3xl font-bold text-green-700">{overview.totalBookings}</p>
          </div>
          <FiCheckCircle className="text-4xl text-green-500" />
        </div>
      </div>

      {/* Pie Chart */}
      <div className="bg-white p-6 rounded shadow mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">התפלגות נתונים</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={usageData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {usageData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activity Log */}
      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">📒 פעולות אחרונות של לקוחות</h3>
        {activityLog.length === 0 ? (
          <p className="text-gray-500">לא נמצאו פעולות אחרונות.</p>
        ) : (
          <ul className="space-y-4">
            {activityLog.map((log) => (
              <li
                key={log._id}
                className="flex items-start justify-between border-b pb-2"
              >
                <div className="flex items-center gap-3">
                  {log.action === 'booked' ? (
                    <FiPlusCircle className="text-green-500 text-xl" />
                  ) : (
                    <FiMinusCircle className="text-red-500 text-xl" />
                  )}
                  <div>
                    <p className="text-sm text-gray-700">
                      <span className="font-bold">{log.clientName}</span>{' '}
                      {log.action === 'booked' ? 'הזמין תור' : 'ביטל תור'} ל־
                      {log.slotDate} בשעה {log.slotTime}
                    </p>
                    <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
