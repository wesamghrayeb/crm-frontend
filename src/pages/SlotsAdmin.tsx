import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Dialog } from '@headlessui/react';
const baseUrl = process.env.REACT_APP_API_URL;

interface Slot {
  _id: string;
  date: string;
  time: string;
  maxClients: number;
  bookedClients: string[];
}

interface Client {
  _id: string;
  fullName: string;
}

const SlotsAdmin: React.FC = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [timeList, setTimeList] = useState<string[]>([]);
  const [maxClients, setMaxClients] = useState(1);
  const [editSlot, setEditSlot] = useState<Slot | null>(null);
  const [editedMaxClients, setEditedMaxClients] = useState(1);
  const [confirmModal, setConfirmModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingSlots, setPendingSlots] = useState<{ time: string; maxClients: number }[]>([]);
  const [bookedClientNames, setBookedClientNames] = useState<string[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [showPast, setShowPast] = useState(false);
  const token = localStorage.getItem('token');

  const fetchSlots = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/admin/slots`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSlots(res.data);
    } catch (err) {
      console.error('שגיאה בטעינת תורים', err);
    }
  };

  const fetchAllClients = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/admin/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllClients(res.data);
    } catch (err) {
      console.error('שגיאה בטעינת לקוחות', err);
    }
  };

  useEffect(() => {
    fetchSlots();
    fetchAllClients();
  }, []);

  const addTimeToList = () => {
    if (time && !timeList.includes(time)) {
      setTimeList([...timeList, time]);
      setTime('');
    }
  };

  const removeTime = (t: string) => {
    setTimeList(timeList.filter((item) => item !== t));
  };

  const openConfirmationModal = () => {
    const slotPreviews = timeList.map((t) => ({ time: t, maxClients }));
    setPendingSlots(slotPreviews);
    setShowModal(true);
  };

  const submitFinalSlots = async () => {
    try {
      for (const slot of pendingSlots) {
        await axios.post(`${baseUrl}/api/admin/slot`, {
          date,
          time: slot.time,
          maxClients: slot.maxClients,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setDate('');
      setTime('');
      setTimeList([]);
      setMaxClients(1);
      setShowModal(false);
      fetchSlots();
    } catch (err: any) {
      alert(err.response?.data?.error || 'שגיאה');
    }
  };

  const handleEdit = async (slot: Slot) => {
    const now = new Date();
    const slotDate = new Date(`${slot.date}T${slot.time}`);
    if (slotDate < now) return;

    setEditSlot(slot);
    setEditedMaxClients(slot.maxClients);

    try {
      const responses = await Promise.all(
        slot.bookedClients.map((id) =>
          axios.get(`${baseUrl}/api/admin/client/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      const names = responses.map((res) => res.data.fullName);
      setBookedClientNames(names);
    } catch (err) {
      console.error('שגיאה בטעינת שמות לקוחות:', err);
      setBookedClientNames(['שגיאה בטעינה']);
    }
  };

  const addClientToSlot = async () => {
    if (!editSlot || !selectedClientId) return;
    try {
      await axios.put(`${baseUrl}/api/admin/slot/${editSlot._id}/add-client`, {
        clientId: selectedClientId,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedClientId('');
      fetchSlots();
      handleEdit(editSlot);
    } catch (err) {
      console.error('שגיאה בהוספת לקוח', err);
    }
  };

  const saveSlotChanges = async () => {
    if (!editSlot) return;
    try {
      await axios.put(`${baseUrl}/api/admin/slot/${editSlot._id}`, {
        maxClients: editedMaxClients,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditSlot(null);
      setConfirmModal(false);
      fetchSlots();
    } catch (err: any) {
      alert(err.response?.data?.error || 'שגיאה בעדכון');
    }
  };

  const now = new Date();
  const upcomingSlots = slots.filter(slot => new Date(`${slot.date}T${slot.time}`) >= now);
  const pastSlots = slots.filter(slot => new Date(`${slot.date}T${slot.time}`) < now);

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:p-6 max-w-6xl mx-auto w-full">
      <h2 className="text-3xl font-bold mb-6 text-center">📋 ניהול תורים יומיים</h2>

      {/* יצירת תורים */}
      <form onSubmit={(e) => { e.preventDefault(); openConfirmationModal(); }} className="mb-10 bg-white shadow p-6 rounded space-y-4 max-w-xl">
        <h3 className="text-xl font-semibold">📅 יצירת תורים לתאריך מסוים</h3>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2 border rounded" required />

        <div className="flex flex-col sm:flex-row gap-2">
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full p-2 border rounded" />
          <button type="button" onClick={addTimeToList} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">➕ הוסף</button>
        </div>

        {timeList.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {timeList.map((t) => (
              <li key={t} className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-2">
                {t}
                <button type="button" onClick={() => removeTime(t)} className="text-red-600 hover:text-red-800">✖</button>
              </li>
            ))}
          </ul>
        )}

        <input type="number" min={1} value={maxClients} onChange={(e) => setMaxClients(Number(e.target.value))} className="w-full p-2 border rounded" required />

        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded">אשר והמשך</button>
      </form>

      {/* תורים עתידיים */}
      <h3 className="text-2xl font-bold mb-4 text-green-700">📆 תורים קרובים</h3>
      <div className="grid md:grid-cols-2 gap-4 mb-10">
        {upcomingSlots.map(slot => (
          <div key={slot._id} className="bg-white p-4 shadow rounded border">
            <p><strong>תאריך:</strong> {slot.date}</p>
            <p><strong>שעה:</strong> {slot.time}</p>
            <p><strong>משתתפים:</strong> {slot.bookedClients.length} / {slot.maxClients}</p>
            <button onClick={() => handleEdit(slot)} className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1 rounded">ערוך</button>
          </div>
        ))}
      </div>

      {/* Toggle passed slots */}
      <button onClick={() => setShowPast(!showPast)} className="text-sm text-gray-700 hover:text-gray-900 underline mb-4">
        🕒 תורים שחלפו {showPast ? '⬆️' : '⬇️'}
      </button>

      {showPast && (
        <div className="grid md:grid-cols-2 gap-4 opacity-70">
          {pastSlots.map(slot => (
            <div key={slot._id} className="bg-gray-100 p-4 shadow-inner rounded border border-gray-300">
              <p><strong>תאריך:</strong> {slot.date}</p>
              <p><strong>שעה:</strong> {slot.time}</p>
              <p><strong>משתתפים:</strong> {slot.bookedClients.length} / {slot.maxClients}</p>
              <p className="text-xs text-red-500 mt-2">לא ניתן לערוך תור זה</p>
            </div>
          ))}
        </div>
      )}

            {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-center">אישור יצירת תורים</h3>
            <p className="mb-4 text-gray-700 text-sm text-center">האם אתה בטוח שברצונך ליצור את התורים הבאים?</p>
            <ul className="text-sm text-gray-700 mb-4 space-y-1">
              {pendingSlots.map((slot, index) => (
                <li key={index}>
                  {date} - {slot.time} ({slot.maxClients} משתתפים)
                </li>
              ))}
            </ul>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
              >
                ביטול
              </button>
              <button
                onClick={submitFinalSlots}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                צור תורים
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Slot Modal */}
      {editSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-center">עריכת תור</h3>
            <p className="text-sm text-gray-700 mb-4 text-center">
              תאריך: <strong>{editSlot.date}</strong> | שעה: <strong>{editSlot.time}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">מספר משתתפים מקסימלי:</label>
              <input
                type="number"
                value={editedMaxClients}
                onChange={(e) => setEditedMaxClients(parseInt(e.target.value))}
                className="w-full p-2 border rounded"
                min={1}
              />
            </div>
      
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">הוספת לקוח לתור:</label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">בחר לקוח</option>
                {allClients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.fullName}
                  </option>
                ))}
              </select>
              <button
                onClick={addClientToSlot}
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
              >
                ➕ הוסף לקוח
              </button>
            </div>
      
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">לקוחות שנרשמו:</label>
              <ul className="text-sm text-gray-700 list-disc list-inside">
                {bookedClientNames.map((name, i) => (
                  <li key={i}>{name}</li>
                ))}
              </ul>
            </div>
      
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditSlot(null)}
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
              >
                ביטול
              </button>
              <button
                onClick={saveSlotChanges}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                שמור שינויים
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotsAdmin;