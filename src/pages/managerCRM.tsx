import React, { useEffect, useState } from 'react';
import axios from 'axios';

const baseUrl = process.env.REACT_APP_API_URL;

interface Client {
  _id: string;
  fullName: string;
  email: string;
  notes?: Note[];
}

interface Note {
  text: string;
  createdAt: string; // ISO string
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString('he-IL');
};

const ManagerCRM: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const clientData = JSON.parse(localStorage.getItem('client') || '{}');

  // Fetch manager's clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await axios.get(`${baseUrl}/api/manager/clients`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClients(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'שגיאה בטעינת הנתונים');
      } finally {
        setLoading(false);
      }
    };
    if (clientData.role === 'manager') fetchClients();
  }, [token, clientData.role]);

  // Open modal and show client notes
  const handleOpenModal = (client: Client) => {
    setSelectedClient(client);
    setNotes(client.notes || []);
    setShowModal(true);
    setNewNote('');
  };

  // Save new note to backend and update notes list
  const handleAddNote = async () => {
    if (!selectedClient || !newNote.trim()) return;
    setSavingNote(true);
    setError('');
    try {
      const res = await axios.post(
        `${baseUrl}/api/manager/client/${selectedClient._id}/notes`,
        { text: newNote.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Always set the notes from backend, not local mutation
      setNotes(res.data.notes || []);
      setNewNote('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה בשמירת הערה');
    }
    setSavingNote(false);
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 px-2">
      <h2 className="text-3xl font-bold text-blue-800 mb-6 text-center">ניהול לקוחות - מנהל</h2>
      <div className="mb-4">
        {error && <div className="bg-red-100 text-red-700 rounded p-2 mb-3">{error}</div>}
      </div>
      {loading ? (
        <div className="text-center text-gray-500">טוען נתונים...</div>
      ) : (
        <div className="rounded-2xl shadow border border-gray-200 overflow-x-auto">
          <table className="min-w-full text-sm text-gray-800 text-right table-auto rounded-2xl overflow-hidden">
            <thead className="bg-blue-50 text-blue-700 font-semibold">
              <tr>
                <th className="p-3">שם</th>
                <th className="p-3">אימייל</th>
                <th className="p-3">הערות</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, idx) => (
                <tr key={client._id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="p-3 font-semibold text-blue-800">{client.fullName}</td>
                  <td className="p-3 break-all">{client.email}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleOpenModal(client)}
                      className="bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white px-4 py-1.5 rounded-full shadow text-xs font-bold"
                    >
                      הצג / הוסף הערות
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for client notes */}
      {showModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md relative flex flex-col">
            <button
              className="absolute top-3 left-3 text-gray-400 hover:text-red-400 text-2xl font-bold"
              onClick={() => setShowModal(false)}
            >×</button>
            <h3 className="text-xl font-bold text-blue-700 mb-1 text-center">{selectedClient.fullName}</h3>
            <p className="text-center text-gray-500 mb-4">{selectedClient.email}</p>
            <div className="font-semibold mb-2 text-right">הערות / מעקב</div>
            <div className="flex gap-2 mb-3">
              <input
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="הוסף הערה חדשה..."
                className="flex-1 border p-2 rounded"
                onKeyDown={e => { if (e.key === 'Enter') handleAddNote(); }}
              />
              <button
                onClick={handleAddNote}
                disabled={savingNote || !newNote.trim()}
                className={`px-4 py-2 rounded font-bold bg-green-400 hover:bg-green-600 text-white transition ${savingNote ? 'opacity-60' : ''}`}
              >
                שמור
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {notes.length === 0 && <div className="text-gray-400 text-sm text-center">אין הערות עדיין.</div>}
              {notes.map((note, idx) => (
                <div
                  key={note.createdAt + idx}
                  className="bg-blue-50 rounded p-2 flex flex-col"
                >
                  <div className="text-sm text-gray-800 mb-1 break-words">{note.text}</div>
                  <div className="text-xs text-gray-500 text-left">{formatDate(note.createdAt)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerCRM;
