import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers, FiCalendar, FiCheckCircle, FiPlusCircle, FiMinusCircle, FiClock, FiChevronDown, FiChevronUp
} from 'react-icons/fi';

const baseUrl = process.env.REACT_APP_API_URL;

const Dashboard: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [openDayIdx, setOpenDayIdx] = useState(0);

  const token = localStorage.getItem('token');
  const clientData = useMemo(
    () => JSON.parse(localStorage.getItem('client') || '{}'),
    []
  );
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
      const sorted = res.data.sort(
        (a: any, b: any) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setActivityLog(sorted);
    } catch (err) {
      console.error('Error fetching activity log', err);
    }
  };

  function isToday(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }

  const todayLogs = activityLog.filter((log) => isToday(log.timestamp));
  const logsToShow = showAllActivity ? activityLog.slice(0, 30) : todayLogs;

  useEffect(() => {
    if (clientData.role !== 'admin') {
      navigate('/appointments');
      return;
    }
    fetchOverview();
    fetchActivityLog();
    // eslint-disable-next-line
  }, [token, navigate]);

  if (!overview) {
    return <div className="p-6">טוען נתונים...</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-screen-xl mx-auto space-y-10">
      <h2 className="text-3xl font-bold mb-4 text-gray-800 text-center">
        📊 לוח ניהול
      </h2>

      {/* Refresh Button */}
      <div className="flex justify-center mb-4">
        <button
          onClick={() => {
            fetchOverview();
            fetchActivityLog();
          }}
          className="bg-blue-600 text-white px-5 py-2 rounded-full shadow hover:bg-blue-700 transition"
        >
          🔄 רענן את לוח הניהול
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div className="bg-blue-50 p-6 rounded-2xl shadow flex items-center justify-between hover:shadow-lg transition">
          <div>
            <p className="text-gray-600">סה״כ לקוחות</p>
            <p className="text-3xl font-bold text-blue-700">{overview.totalClients}</p>
          </div>
          <FiUsers className="text-4xl text-blue-500" />
        </div>
        <div className="bg-orange-50 p-6 rounded-2xl shadow flex items-center justify-between hover:shadow-lg transition">
          <div>
            <p className="text-gray-600">סה״כ תורים</p>
            <p className="text-3xl font-bold text-orange-700">{overview.totalSlots}</p>
          </div>
          <FiCalendar className="text-4xl text-orange-500" />
        </div>
        <div className="bg-green-50 p-6 rounded-2xl shadow flex items-center justify-between hover:shadow-lg transition">
          <div>
            <p className="text-gray-600">סה״כ הזמנות</p>
            <p className="text-3xl font-bold text-green-700">{overview.totalBookings}</p>
          </div>
          <FiCheckCircle className="text-4xl text-green-500" />
        </div>
      </div>

      {/* Days With Reservations Accordion */}
      <div className="bg-white p-6 rounded-2xl shadow mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
          <FiCalendar className="inline text-blue-400" /> ימים קרובים עם הזמנות
        </h3>
        {!overview.daysWithReservations || overview.daysWithReservations.length === 0 ? (
          <p className="text-gray-500">לא נמצאו הזמנות קרובות.</p>
        ) : (
          <div className="space-y-2">
            {overview.daysWithReservations.map((day: any, idx: number) => (
              <div key={day.date} className="border rounded-lg overflow-hidden">
                {/* Accordion Header */}
                <button
                  className={`w-full flex justify-between items-center px-4 py-3 text-right focus:outline-none bg-gradient-to-l transition
                    ${idx === openDayIdx
                      ? 'from-blue-100 via-white to-white font-bold'
                      : 'bg-white text-gray-700'}
                  `}
                  onClick={() => setOpenDayIdx(idx === openDayIdx ? -1 : idx)}
                  aria-expanded={idx === openDayIdx}
                  aria-controls={`reservation-day-${idx}`}
                >
                  <span className="flex items-center gap-2">
                    <FiCalendar className="text-blue-400" />
                    {new Date(day.date).toLocaleDateString('he-IL', {
                      weekday: 'long',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="transition-transform">
                    {idx === openDayIdx ? (
                      <FiChevronUp className="text-blue-600" />
                    ) : (
                      <FiChevronDown className="text-gray-400" />
                    )}
                  </span>
                </button>
                {/* Accordion Content */}
                <div
                  id={`reservation-day-${idx}`}
                  className={`transition-all duration-200 bg-blue-50 ${
                    idx === openDayIdx ? 'block' : 'hidden'
                  }`}
                >
                  <ul className="divide-y">
                    {day.slots.map((slot: any, slotIdx: number) => (
                      <li key={slotIdx} className="py-3 flex items-center gap-4">
                        <span className="bg-blue-100 px-2 py-1 rounded-lg text-sm flex items-center gap-1 shadow-inner">
                          <FiClock /> {slot.time}
                        </span>
                        <span className="text-gray-700 flex-1">
                          {slot.clients.length === 0
                            ? <span className="text-gray-400">אין לקוחות</span>
                            : slot.clients.map((c: any) => c.fullName).join(', ')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity Log */}
      <div className="bg-white p-6 rounded-2xl shadow mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
          <FiCheckCircle className="text-green-400" /> פעולות אחרונות של לקוחות
        </h3>
        {logsToShow.length === 0 ? (
          <p className="text-gray-500">לא נמצאו פעולות {showAllActivity ? 'אחרונות' : 'מהיום'}.</p>
        ) : (
          <ul className="space-y-4">
            {logsToShow.map((log) => (
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
                    <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString('he-IL')}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {/* Toggle buttons */}
        {!showAllActivity && activityLog.length > todayLogs.length && (
          <button
            className="mt-4 text-blue-600 hover:underline"
            onClick={() => setShowAllActivity(true)}
          >
            הצג עוד פעולות
          </button>
        )}
        {showAllActivity && (
          <button
            className="mt-4 text-blue-600 hover:underline"
            onClick={() => setShowAllActivity(false)}
          >
            הצג רק פעולות מהיום
          </button>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
