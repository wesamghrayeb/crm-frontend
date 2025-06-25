import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
const baseUrl = process.env.REACT_APP_API_URL;

interface Client {
  _id: string;
  fullName: string;
  email: string;
  totalSessions: number;
  usedSessions: number;
  startDate: String,
  endDate: String,
  adminId: string;
}

const RenewModal = ({
  isOpen,
  onClose,
  onSubmit,
  defaultValues
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
  defaultValues: any;
}) => {
  const [subscriptionType, setSubscriptionType] = useState(defaultValues.subscriptionType);
  const [totalSessions, setTotalSessions] = useState(defaultValues.totalSessions);
  const [startDate, setStartDate] = useState(defaultValues.startDate);
  const [endDate, setEndDate] = useState(defaultValues.endDate);


  useEffect(() => {
    setSubscriptionType(defaultValues.subscriptionType);
    setTotalSessions(defaultValues.totalSessions);
    setStartDate(defaultValues.startDate);
    setEndDate(defaultValues.endDate);
  }, [defaultValues]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">חידוש מנוי</h2>

        <label className="block mb-1">סוג מנוי:</label>
        <select
          value={subscriptionType}
          onChange={(e) => setSubscriptionType(e.target.value)}
          className="w-full border p-2 rounded mb-3"
        >
          <option value="basic">Basic</option>
          <option value="premium">Premium</option>
        </select>

        <label className="block mb-1">סה"כ מפגשים:</label>
        <input
          type="number"
          value={totalSessions}
          onChange={(e) => setTotalSessions(Number(e.target.value))}
          className="w-full border p-2 rounded mb-3"
        />

        <label className="block mb-1">תאריך התחלה:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full border p-2 rounded mb-3"
        />

        <label className="block mb-1">תאריך סיום:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        />

        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">ביטול</button>
          <button
            onClick={() =>
              onSubmit({ subscriptionType, totalSessions, startDate, endDate })
            }
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            אישור
          </button>
        </div>
      </div>
    </div>
  );
};

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClient, setNewClient] = useState({ fullName: '',
  email: '',
  password: '',
  totalSessions: 0,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) });
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [defaultRenewData, setDefaultRenewData] = useState({
    subscriptionType: 'basic',
    totalSessions: 10,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  });

  const token = localStorage.getItem('token');
  const clientData = JSON.parse(localStorage.getItem('client') || '{}');
  const navigate = useNavigate();

  useEffect(() => {
    if (clientData.role !== 'admin') {
      navigate('/appointments');
      return;
    }

    fetchClients();
  }, [token, clientData, navigate]);

  const fetchClients = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/admin/clients`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setClients(res.data);
    } catch (err) {
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const openRenewModal = (clientId: string) => {
    setSelectedClientId(clientId);
    setDefaultRenewData({
      subscriptionType: 'basic',
      totalSessions: 10,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    });
    setShowRenewModal(true);
  };

  const handleRenewSubmit = async (values: any) => {
    if (!selectedClientId) return;

    try {
      await axios.put(`${baseUrl}/api/admin/client/${selectedClientId}/renew`, values, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('המנוי חודש בהצלחה');
      fetchClients();
      setShowRenewModal(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'שגיאה בחידוש מנוי');
    }
  };

  const deleteClient = async () => {
    if (!clientToDelete) return;
    try {
      await axios.delete(`${baseUrl}/api/admin/client/${clientToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      fetchClients();
      setClientToDelete(null);
      setConfirmationMessage('🗑️ הלקוח נמחק בהצלחה');
      setShowConfirmationModal(true);
    } catch (err: any) {
      setConfirmationMessage(err.response?.data?.error || 'שגיאה במחיקת לקוח');
      setShowConfirmationModal(true);
    }
  };
  const handleAddClient = async () => {
    try {
      await axios.post(`${baseUrl}/api/auth/register`, {
        ...newClient,
        adminId: clientData._id,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      setShowAddModal(false); // סגור את המודאל
      fetchClients(); // רענן את הרשימה
      setConfirmationMessage('✅ הלקוח נוסף בהצלחה');
      setShowConfirmationModal(true); // הצג חלון אישור
    } catch (err: any) {
      setConfirmationMessage(err.response?.data?.error || 'שגיאה בהוספת לקוח');
      setShowConfirmationModal(true);
    }
  };

  const exportCSV = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/admin/report/usage/export`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'usage_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      alert(err.response?.data?.error || 'שגיאה ביצוא');
    }
  };

return (
  <div className="text-center mb-8">
  <h2 className="text-3xl font-bold text-gray-800 mb-2">רשימת לקוחות</h2>
  <p className="text-gray-600 text-sm max-w-xl mx-auto">
    בדף זה תוכל לצפות בכל הלקוחות הרשומים במערכת, להוסיף לקוח חדש, לחדש מנוי קיים או למחוק לקוח. ניתן גם לייצא את רשימת הלקוחות כקובץ אקסל
  </p>

    {/* Action Buttons */}
    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
      <button
        onClick={() => setShowAddModal(true)}
        className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-2.5 rounded-full shadow-md font-semibold transition"
      >
        ➕ הוסף לקוח חדש
      </button>

      <button
        onClick={exportCSV}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2.5 rounded-full shadow-md font-semibold transition"
      >
        📁 ייצא דוח CSV
      </button>
    </div>

      {/* Clients Table */}
    {loading ? (
      <p className="text-gray-500 text-center">טוען נתונים...</p>
    ) : clients.length === 0 ? (
      <p className="text-gray-500 text-center">לא נמצאו לקוחות.</p>
    ) : (
      <div className="overflow-x-auto rounded-xl shadow border border-gray-200">
        <table className="min-w-full text-sm text-gray-800 text-right table-auto">
          <thead className="bg-gray-100 text-gray-700 font-semibold">
            <tr>
              <th className="p-3">שם</th>
              <th className="p-3">אימייל</th>
              <th className="p-3 hidden md:table-cell">סה"כ</th>
              <th className="p-3 hidden md:table-cell">שומשו</th>
              <th className="p-3 hidden lg:table-cell">התחלה</th>
              <th className="p-3 hidden lg:table-cell">סיום</th>
              <th className="p-3">שימוש</th>
              <th className="p-3">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client, index) => {
              const usageRate = client.totalSessions === 0
                ? '0%'
                : `${Math.round((client.usedSessions / client.totalSessions) * 100)}%`;

              return (
                <tr key={client._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="p-3">{client.fullName}</td>
                  <td className="p-3 break-all">{client.email}</td>
                  <td className="p-3 hidden md:table-cell">{client.totalSessions}</td>
                  <td className="p-3 hidden md:table-cell">{client.usedSessions}</td>
                  <td className="p-3 hidden lg:table-cell">{client.startDate.slice(0, 10)}</td>
                  <td className="p-3 hidden lg:table-cell">{client.endDate.slice(0, 10)}</td>
                  <td className="p-3 text-blue-600 font-bold">{usageRate}</td>
                  <td className="p-3">
                    <div className="flex flex-col sm:flex-row gap-2 items-center sm:items-end justify-end">
                      <button
                        onClick={() => openRenewModal(client._id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-full text-xs shadow"
                      >
                        🔁 
                      </button>

                      <Link
                        to={`/client/${client._id}`}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs shadow text-center"
                      >
                        👤 
                      </Link>

                      <button
                        onClick={() => setClientToDelete(client)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-full text-xs shadow"
                      >
                        🗑️ 
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}

    {/* Renew Modal */}
    <RenewModal
      isOpen={showRenewModal}
      onClose={() => setShowRenewModal(false)}
      onSubmit={handleRenewSubmit}
      defaultValues={defaultRenewData}
    />

    {/* Add Client Modal */}
    {showAddModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">הוספת לקוח חדש</h3>
          <div className="space-y-3">
            <input type="text" placeholder="שם מלא" className="w-full p-2 border rounded"
              value={newClient.fullName}
              onChange={(e) => setNewClient({ ...newClient, fullName: e.target.value })}
            />
            <input type="email" placeholder="אימייל" className="w-full p-2 border rounded"
              value={newClient.email}
              onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
            />
            <input type="password" placeholder="סיסמה" className="w-full p-2 border rounded"
              value={newClient.password}
              onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
            />
            <input type="number" placeholder="סה״כ מפגשים" className="w-full p-2 border rounded"
              value={newClient.totalSessions}
              onChange={(e) => setNewClient({ ...newClient, totalSessions: parseInt(e.target.value) })}
            />
            <input type="date" className="w-full p-2 border rounded"
              value={newClient.startDate}
              onChange={(e) => setNewClient({ ...newClient, startDate: e.target.value })}
            />
            <input type="date" className="w-full p-2 border rounded"
              value={newClient.endDate}
              onChange={(e) => setNewClient({ ...newClient, endDate: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowAddModal(false)} className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded">
              ביטול
            </button>
            <button onClick={handleAddClient} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
              הוסף לקוח
            </button>
          </div>
        </div>
      </div>
    )}
    {showConfirmationModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm text-center">
          <p className="text-gray-800 text-lg mb-4">{confirmationMessage}</p>
          <button
            onClick={() => setShowConfirmationModal(false)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
          >
            סגור
          </button>
        </div>
      </div>
    )}
    {clientToDelete && (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
       <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm text-center">
         <p className="text-red-700 font-bold text-lg mb-4">
           האם אתה בטוח שברצונך למחוק את ?"{clientToDelete.fullName}" הלקוח
         </p>
         <div className="flex justify-center gap-4">
           <button
             onClick={() => setClientToDelete(null)}
             className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
           >
             ביטול
           </button>
           <button
             onClick={deleteClient}
             className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
           >
             מחק
           </button>
         </div>
       </div>
     </div>
   )}

  </div>
);


};

export default Clients;
