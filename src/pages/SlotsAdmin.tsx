import React, { useEffect, useState } from 'react';
import axios from 'axios';

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
    console.error('שגיאה בטעינת שמות לקוחות:', err);
    setBookedClientNames(['שגיאה בטעינה']);
  }
};

const [selectedClientId, setSelectedClientId] = useState<string>('');

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
    handleEdit(editSlot); // ריענון נתוני העריכה
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
    console.error('שגיאה בטעינת לקוחות:', err);
    setBookedClientNames(['שגיאה בטעינה']);
    setClientListModal({ slot });
  }
};
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center">📋 ניהול תורים</h2>

      {/* בחירת תאריך */}
      <div className="bg-white shadow p-6 rounded mb-8">
        <label className="block mb-2 font-semibold">בחר תאריך:</label>
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
             
               // בדיקה אם הזמן עבר (רק אם התאריך הוא היום)
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
                   className={`px-3 py-2 rounded text-sm border font-mono ${
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
        <hr></hr>
      {/* תורים של היום */}
      <h3 className="text-xl font-bold text-green-700 mb-2">📅 תורים להיום ({today}):</h3>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {(groupedSlots[today] || []).map(slot => (
          <div key={slot._id} className="bg-white p-4 shadow rounded border">
            <p><strong>שעה:</strong> {slot.time}</p>
            <p><strong>משתתפים:</strong> {slot.bookedClients.length} / {slot.maxClients}</p>
            <div className="mt-2 flex gap-2">
                <button onClick={() => handleEdit(slot)} className="text-sm bg-yellow-500 text-white px-3 py-1 rounded">
                  ערוך
                </button>
              <button onClick={() => handleDeleteSlot(slot._id)} className="text-sm bg-red-500 text-white px-3 py-1 rounded">
                מחק
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ימים קרובים */}
              <hr></hr>

      <h3 className="text-xl font-bold mb-2 text-gray-800">📆 ימים קרובים:</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {upcomingDates.map(date => (
          <button
            key={date}
            onClick={() => setExpandedDate(expandedDate === date ? null : date)}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            {new Date(date).toLocaleDateString('he-IL')}
          </button>
        ))}
      </div>

      {expandedDate && (
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          {(groupedSlots[expandedDate] || []).map(slot => (
            <div key={slot._id} className="bg-white p-4 shadow rounded border">
              <p><strong>שעה:</strong> {slot.time}</p>
              <p><strong>משתתפים:</strong> {slot.bookedClients.length} / {slot.maxClients}</p>
              <div className="mt-2 flex gap-2">
                  <button onClick={() => handleEdit(slot)} className="text-sm bg-yellow-500 text-white px-3 py-1 rounded">
                    ערוך
                  </button>
                <button onClick={() => handleDeleteSlot(slot._id)} className="text-sm bg-red-500 text-white px-3 py-1 rounded">
                  מחק
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* פופאפ יצירת תור */}
      {showHourModal && selectedHour && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2 text-center">יצירת תור לשעה {selectedHour}</h3>
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
        <hr></hr>

      <h3 className="text-xl font-bold mb-2 text-gray-700">🕒 תורים שחלפו:</h3>
      <button
        onClick={() => setShowPast(!showPast)}
        className="text-sm text-blue-600 underline mb-4"
      >
        {showPast ? 'הסתר ⬆️' : 'הצג ⬇️'}
      </button>
      
      {showPast && (
        <div className="space-y-4 mb-10">
          {Object.keys(groupedSlots)
            .filter(date => date < today)
            .sort((a, b) => b.localeCompare(a)) // מהמאוחר למוקדם
            .map(date => (
              <div key={date}>
                <button
                  onClick={() => setExpandedPastDate(expandedPastDate === date ? null : date)}
                  className="bg-gray-100 px-4 py-2 rounded hover:bg-gray-200"
                >
                  {new Date(date).toLocaleDateString('he-IL')}
                </button>
                {expandedPastDate === date && (
                  <div className="mt-2 grid md:grid-cols-2 gap-4">
                    {groupedSlots[date].map(slot => (
                      <div key={slot._id} className="bg-white p-4 border rounded shadow-inner">
                        <p><strong>שעה:</strong> {slot.time}</p>
                        <p><strong>משתתפים:</strong> {slot.bookedClients.length} / {slot.maxClients}</p>
                        {slot.bookedClients.length > 0 && (
                          <button
                            onClick={() => handleSlotClick(slot)}
                            className="mt-2 text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                          >
                            הצג לקוחות
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
      
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

     {clientListModal.slot && (
       <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
         <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
           <h3 className="text-lg font-bold text-center mb-2">לקוחות בתור</h3>
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
