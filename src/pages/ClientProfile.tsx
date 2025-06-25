import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const baseUrl = process.env.REACT_APP_API_URL;
const COLORS = ['#0088FE', '#FF8042'];

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

const ClientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem('token');
  const [client, setClient] = useState<Client | null>(null);
  const [clientSlots, setClientSlots] = useState<Slot[]>([]);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Client | null>(null);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await axios.get(`${baseUrl}/api/admin/client/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClient(res.data);
        setFormData(res.data);
        fetchClientSlots();
      } catch (err) {
        console.error('Failed to load client profile', err);
      }
    };

    const fetchClientSlots = async () => {
      try {
        const res = await axios.get(`${baseUrl}/api/admin/client/${id}/slots`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClientSlots(res.data);
      } catch (err) {
        console.error('Failed to load client appointments', err);
      }
    };

    fetchClient();
  }, [id, token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!formData) return;
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await axios.put(`${baseUrl}/api/admin/client/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClient(formData);
      setEditing(false);
      alert('✔️ פרטי הלקוח עודכנו בהצלחה');
    } catch (err) {
      alert('❌ שגיאה בעדכון פרטי הלקוח');
    }
  };

  const cancelSlot = async (slotId: string) => {
    try {
      await axios.post(
        `${baseUrl}/api/slots/${slotId}/cancel`,
        { clientId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('התור בוטל בהצלחה');
      setClientSlots(clientSlots.filter(s => s._id !== slotId));
    } catch {
      alert('שגיאה בביטול התור');
    }
  };

  if (!formData) return <div className="p-6">טוען פרופיל לקוח...</div>;

  const chartData = [
    { name: 'שומשו', value: client?.usedSessions || 0 },
    { name: 'נותרו', value: (client?.totalSessions || 0) - (client?.usedSessions || 0) },
  ];
const handleSaveChanges = async () => {
  try {
    await axios.put(`${baseUrl}/api/admin/client/${id}`, client, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert('✅ השינויים נשמרו בהצלחה');
  } catch (err) {
    alert('❌ שגיאה בשמירת השינויים');
  }
};
return (
  <div className="p-6 max-w-3xl mx-auto space-y-6">
    <div className="bg-white shadow rounded p-6">
      <h2 className="text-2xl font-bold mb-4 text-center">עריכת פרטי לקוח</h2>

      <div className="space-y-4 text-right">

        <div>
          <label className="block font-semibold mb-1">שם מלא (הלקוח כפי שיופיע במערכת):</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={client?.fullName || ''}
            onChange={(e) => setClient({ ...client!, fullName: e.target.value })}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">אימייל (לכניסה למערכת ויצירת קשר):</label>
          <input
            type="email"
            className="w-full p-2 border rounded"
            value={client?.email || ''}
            onChange={(e) => setClient({ ...client!, email: e.target.value })}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">סוג מנוי (Basic או Premium):</label>
          <select
            className="w-full p-2 border rounded"
            value={client?.subscriptionType || 'basic'}
            onChange={(e) => setClient({ ...client!, subscriptionType: e.target.value })}
          >
            <option value="basic">Basic - רגיל</option>
            <option value="premium">Premium - מתקדם</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">סה"כ מפגשים (כמות המפגשים שהלקוח קיבל):</label>
          <input
            type="number"
            className="w-full p-2 border rounded"
            value={client?.totalSessions || 0}
            onChange={(e) => setClient({ ...client!, totalSessions: parseInt(e.target.value) })}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">שומשו (כמה מפגשים כבר נוצלו):</label>
          <input
            type="number"
            className="w-full p-2 border rounded"
            value={client?.usedSessions || 0}
            onChange={(e) => setClient({ ...client!, usedSessions: parseInt(e.target.value) })}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">תאריך התחלה (מתי התחיל המנוי):</label>
          <input
            type="date"
            className="w-full p-2 border rounded"
            value={client?.startDate?.slice(0, 10) || ''}
            onChange={(e) => setClient({ ...client!, startDate: e.target.value })}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">תאריך סיום (מתי פג תוקף המנוי):</label>
          <input
            type="date"
            className="w-full p-2 border rounded"
            value={client?.endDate?.slice(0, 10) || ''}
            onChange={(e) => setClient({ ...client!, endDate: e.target.value })}
          />
        </div>

        <div className="text-center mt-6">
          <button
            onClick={handleSaveChanges}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-semibold"
          >
            💾 שמור שינויים
          </button>
        </div>
      </div>
    </div>
  </div>
);

};

export default ClientProfile;
