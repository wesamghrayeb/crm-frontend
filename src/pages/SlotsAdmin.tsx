import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  FiCalendar, FiClock, FiUsers, FiEdit2, FiTrash2, FiChevronDown, FiChevronUp, FiUserPlus
} from 'react-icons/fi';

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
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const [showHourModal, setShowHourModal] = useState(false);
  const [newSlotMaxClients, setNewSlotMaxClients] = useState(1);
  const [bookedClientNames, setBookedClientNames] = useState<string[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [showPast, setShowPast] = useState(false);
  const [expandedPastDate, setExpandedPastDate] = useState<string | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [editSlot, setEditSlot] = useState<Slot | null>(null);
  const [editedMaxClients, setEditedMaxClients] = useState(1);
  const [clientListModal, setClientListModal] = useState<{ slot: Slot | null }>({ slot: null });
  const [selectedClientId, setSelectedClientId] = useState<string>('');

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
    // eslint-disable-next-line
  }, []);

  const generateDayTimes = () => {
    const times = [];
    for (let h = 10; h < 22; h++) {
      for (let m = 0; m < 60; m += 20) {
        const hh = h.toString().padStart(2, '0');
        const mm = m.toString().padStart(2, '0');
        times.push({ time: `${hh}:${mm}` });
      }
    }
    return times;
  };

  const groupedSlots = slots.reduce((acc: Record<string, Slot[]>, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  const today = new Date().toISOString().split('T')[0];

  const upcomingDates = Object.keys(groupedSlots)
    .filter(date => date > today)
    .sort();

  const handleCreateSlot = async () => {
    if (!selectedDate || !selectedHour) return;
    try {
      await axios.post(`${baseUrl}/api/admin/slot`, {
        date: selectedDate,
        time: selectedHour,
        maxClients: newSlotMaxClients,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowHourModal(false);
      setSelectedHour(null);
      fetchSlots();
    } catch (err: any) {
      alert(err.response?.data?.error || 'שגיאה');
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק תור זה?')) {
      try {
        await axios.delete(`${baseUrl}/api/admin/slot/${slotId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchSlots();
      } catch (err) {
        alert('שגיאה במחיקה');
      }
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
      // Handle error
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
      fetchSlots();
    } catch (err: any) {
      alert(err.response?.data?.error || 'שגיאה בעדכון');
    }
  };

  const handleSlotClick = async (slot: Slot) => {
    try {
      const responses = await Promise.all(
        slot.bookedClients.map(id =>
          axios.get(`${baseUrl}/api/admin/client/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      const names = responses.map(res => res.data.fullName);
      setBookedClientNames(names);
      setClientListModal({ slot });
    } catch (err) {
      setBookedClientNames(['שגיאה בטעינה']);
      setClientListModal({ slot });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-2 sm:px-4 py-6 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center text-blue-800">📋 ניהול תורים</h2>

      {/* בחירת תאריך ויצירת תורים */}
      <div className="bg-white shadow-lg p-6 rounded-2xl mb-8">
        <label className="block mb-2 font-semibold text-gray-700">בחר תאריך:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="p-2 border rounded w-full"
        />

        {selectedDate && (
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
            {generateDayTimes().map(({ time }) => {
              const existingSlot = slots.find(s => s.date === selectedDate && s.time === time);

              const isToday = selectedDate === today;
              const now = new Date();
              const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
              const isPastTime = isToday && time <= currentTime;
              const isDisabled = !!existingSlot || isPastTime;

              return (
                <button
                  key={time}
                  onClick={() => {
                    if (isDisabled) return;
                    setSelectedHour(time);
                    setNewSlotMaxClients(1);
                    setShowHourModal(true);
                  }}
                  disabled={isDisabled}
                  className={`px-3 py-2 rounded text-sm border font-mono shadow-sm transition ${
                    isDisabled
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                  }`}
                >
                  {time}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* תורים של היום */}
      <h3 className="text-xl font-bold text-green-700 mb-2 flex items-center gap-2">
        <FiCalendar /> תורים להיום ({today})
      </h3>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {(groupedSlots[today] || []).map(slot => (
          <div key={slot._id} className="bg-white p-4 shadow rounded-2xl border hover:shadow-md transition flex flex-col gap-2">
            <div className="flex items-center gap-2 text-blue-600 font-semibold">
              <FiClock /> {slot.time}
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <FiUsers /> {slot.bookedClients.length} / {slot.maxClients}
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => handleEdit(slot)} className="flex items-center gap-1 text-sm bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded">
                <FiEdit2 /> ערוך
              </button>
              <button onClick={() => handleDeleteSlot(slot._id)} className="flex items-center gap-1 text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">
                <FiTrash2 /> מחק
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ימים קרובים עם תורים (אקורדיון) */}
      <h3 className="text-xl font-bold mb-2 text-blue-800 flex items-center gap-2 mt-10">
        <FiCalendar /> ימים קרובים:
      </h3>
      <div className="space-y-3 mb-6">
        {upcomingDates.map((date, idx) => (
          <div key={date} className="border rounded-2xl overflow-hidden shadow bg-white">
            {/* Accordion Header */}
            <button
              className={`w-full flex justify-between items-center px-4 py-3 text-right focus:outline-none transition
                ${expandedDate === date
                  ? 'from-blue-100 via-white to-white font-bold'
                  : 'bg-white text-gray-700'}
              `}
              onClick={() => setExpandedDate(expandedDate === date ? null : date)}
              aria-expanded={expandedDate === date}
            >
              <span className="flex items-center gap-2 font-semibold">
                <FiCalendar className="text-blue-400" />
                {new Date(date).toLocaleDateString('he-IL', {
                  weekday: 'long',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
              <span className="transition-transform">
                {expandedDate === date ? (
                  <FiChevronUp className="text-blue-600" />
                ) : (
                  <FiChevronDown className="text-gray-400" />
                )}
              </span>
            </button>
            <div
              className={`transition-all duration-200 bg-blue-50 ${
                expandedDate === date ? 'block' : 'hidden'
              }`}
            >
              <div className="grid md:grid-cols-2 gap-4 p-4">
                {(groupedSlots[date] || [])
                 .slice()
                 .sort((a, b) => a.time.localeCompare(b.time))
                 .map(slot => (
                  <div key={slot._id} className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-blue-600 font-semibold">
                      <FiClock /> {slot.time}
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <FiUsers /> {slot.bookedClients.length} / {slot.maxClients}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleEdit(slot)} className="flex items-center gap-1 text-sm bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded">
                        <FiEdit2 /> ערוך
                      </button>
                      <button onClick={() => handleDeleteSlot(slot._id)} className="flex items-center gap-1 text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">
                        <FiTrash2 /> מחק
                      </button>
                      {slot.bookedClients.length > 0 && (
                        <button
                          onClick={() => handleSlotClick(slot)}
                          className="flex items-center gap-1 text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                        >
                          <FiUsers /> הצג לקוחות
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* עבר */}
      <h3 className="text-xl font-bold mb-2 text-gray-700 flex items-center gap-2 mt-10">
        <FiClock /> תורים שחלפו:
      </h3>
      <button
        onClick={() => setShowPast(!showPast)}
        className="text-sm text-blue-700 underline mb-4"
      >
        {showPast ? 'הסתר ⬆️' : 'הצג ⬇️'}
      </button>
      {showPast && (
        <div className="space-y-6 mb-10">
          {/** 1. Group by month */}
          {Object.entries(
            Object.keys(groupedSlots)
              .filter(date => date < today)
              .sort((a, b) => b.localeCompare(a))
              .reduce((acc: Record<string, string[]>, date) => {
                const month = date.slice(0, 7); // "YYYY-MM"
                if (!acc[month]) acc[month] = [];
                acc[month].push(date);
                return acc;
              }, {})
          ).map(([month, days]) => (
            <div key={month} className="border-2 rounded-2xl shadow bg-gray-50">
              {/* --- Month Accordion Header --- */}
              <button
                onClick={() =>
                  setExpandedPastDate(expandedPastDate === month ? null : month)
                }
                className="w-full flex justify-between items-center px-4 py-3 text-right bg-blue-50 font-bold text-blue-800"
              >
                <span>
                  {new Date(month + '-01').toLocaleString('he-IL', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                <span>
                  {expandedPastDate === month ? <FiChevronUp /> : <FiChevronDown />}
                </span>
              </button>
      
              {/* --- If Month Is Expanded: Show Days --- */}
              {expandedPastDate === month && (
                <div className="px-2 pb-2">
                  {days.map(date => (
                    <div key={date} className="my-3 border rounded-xl shadow bg-white">
                      <div className="flex items-center gap-2 px-4 py-2 font-semibold text-gray-800">
                        <FiCalendar /> {new Date(date).toLocaleDateString('he-IL')}
                      </div>
                      <div className="mt-2 grid md:grid-cols-2 gap-4 p-4">
                        {(groupedSlots[date] || [])
                         .filter(slot => slot.bookedClients.length > 0)
                         .slice()
                         .sort((a, b) => a.time.localeCompare(b.time))
                         .map(slot => (
                          <div
                            key={slot._id}
                            className="bg-gray-50 p-4 border rounded-xl shadow-inner flex flex-col gap-2"
                          >
                            <div className="flex items-center gap-2 text-blue-600 font-semibold">
                              <FiClock /> {slot.time}
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                              <FiUsers /> {slot.bookedClients.length} / {slot.maxClients}
                            </div>
                            {slot.bookedClients.length > 0 && (
                              <div className="mt-2">
                                <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold mb-1">
                                  <FiUsers /> לקוחות:
                                </div>
                                <ul className="list-disc list-inside text-xs text-gray-700 space-y-1 mr-3">
                                  {slot.bookedClients.map(clientId => {
                                    const client = allClients.find(c => c._id === clientId);
                                    return (
                                      <li key={clientId}>
                                        {client ? client.fullName : clientId}
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* פופאפ יצירת תור */}
      {showHourModal && selectedHour && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2 text-center text-blue-700">יצירת תור לשעה {selectedHour}</h3>
            <p className="text-center mb-4 text-gray-600">תאריך: {selectedDate}</p>
            <label className="block text-sm mb-1">מספר משתתפים:</label>
            <input
              type="number"
              min={1}
              value={newSlotMaxClients}
              onChange={(e) => setNewSlotMaxClients(parseInt(e.target.value))}
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowHourModal(false)} className="bg-gray-400 text-white px-4 py-2 rounded">ביטול</button>
              <button onClick={handleCreateSlot} className="bg-green-600 text-white px-4 py-2 rounded">צור תור</button>
            </div>
          </div>
        </div>
      )}

      {/* מודל עריכה */}
      {editSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-center text-blue-700">עריכת תור</h3>
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
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full flex items-center justify-center gap-2"
              >
                <FiUserPlus /> הוסף לקוח
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

      {/* מודל צפייה בלקוחות */}
      {clientListModal.slot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md">
            <h3 className="text-lg font-bold text-center mb-2 text-blue-700">לקוחות בתור</h3>
            <p className="text-sm text-center mb-4">
              תאריך: {clientListModal.slot.date} | שעה: {clientListModal.slot.time}
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {bookedClientNames.map((name, idx) => (
                <li key={idx}>{name}</li>
              ))}
            </ul>
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setClientListModal({ slot: null })}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotsAdmin;
