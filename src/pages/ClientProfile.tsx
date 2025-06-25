import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Client {
  fullName: string;
  email: string;
  totalSessions: number;
  usedSessions: number;
  subscriptionType?: string;
  startDate?: string;
  endDate?: string;
}

interface Slot {
  _id: string;
  date: string;
  time: string;
}

const COLORS = ['#0088FE', '#FF8042'];

const ClientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem('token');
  const [client, setClient] = useState<Client | null>(null);
  const [clientSlots, setClientSlots] = useState<Slot[]>([]);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/admin/client/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClient(res.data);
        fetchClientSlots();
      } catch (err) {
        console.error('Failed to load client profile', err);
      }
    };

    const fetchClientSlots = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/admin/client/${id}/slots`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClientSlots(res.data);
      } catch (err) {
        console.error('Failed to load client appointments', err);
      }
    };

    fetchClient();
  }, [id, token]);

  const cancelSlot = async (slotId: string) => {
    try {
      await axios.post(
        `http://localhost:5000/api/slots/${slotId}/cancel`,
        { clientId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('התור בוטל בהצלחה');
      setClientSlots(clientSlots.filter(s => s._id !== slotId));
    } catch {
      alert('שגיאה בביטול התור');
    }
  };

  if (!client) return <div className="p-6">טוען פרופיל לקוח...</div>;

  const chartData = [
    { name: 'שומשו', value: client.usedSessions },
    { name: 'נותרו', value: client.totalSessions - client.usedSessions },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white shadow rounded p-6">
        <h2 className="text-2xl font-bold mb-4">פרטי לקוח</h2>
        <table className="table-auto w-full text-right text-gray-700">
          <tbody>
            <tr><td>שם:</td><td>{client.fullName}</td></tr>
            <tr><td>אימייל:</td><td>{client.email}</td></tr>
            <tr><td>סוג מנוי:</td><td>{client.subscriptionType || 'N/A'}</td></tr>
            <tr><td>מתאריך:</td><td>{client.startDate?.slice(0, 10)}</td></tr>
            <tr><td>עד תאריך:</td><td>{client.endDate?.slice(0, 10)}</td></tr>
            <tr><td>סה״כ מפגשים:</td><td>{client.totalSessions}</td></tr>
            <tr><td>שומשו:</td><td>{client.usedSessions}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="bg-white shadow rounded p-6">
        <h3 className="text-xl font-semibold mb-4">שימוש במפגשים</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white shadow rounded p-6">
        <h3 className="text-xl font-semibold mb-4">תורים של הלקוח</h3>
        {clientSlots.length === 0 ? (
          <p className="text-gray-600">אין תורים ללקוח זה.</p>
        ) : (
          <table className="w-full text-right border">
            <thead>
              <tr className="bg-gray-100 text-sm">
                <th className="p-2 border">תאריך</th>
                <th className="p-2 border">שעה</th>
                <th className="p-2 border">פעולה</th>
              </tr>
            </thead>
            <tbody>
              {clientSlots.map((slot) => (
                <tr key={slot._id}>
                  <td className="p-2 border">{slot.date}</td>
                  <td className="p-2 border">{slot.time}</td>
                  <td className="p-2 border">
                    <button
                      onClick={() => cancelSlot(slot._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                    >
                      בטל תור
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ClientProfile;
