import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import axios from 'axios';
import 'react-calendar/dist/Calendar.css';
import { Dialog } from '@headlessui/react';
import { useClient } from '../contexts/ClientContext';
const baseUrl = process.env.REACT_APP_API_URL;

interface Slot {
  _id: string;
  date: string;
  time: string;
  maxClients: number;
  bookedClients: string[];
}

const CalendarBookings: React.FC = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'book' | 'cancel' | null>(null);

  const { client, refreshClient } = useClient();
  const token = localStorage.getItem('token');
  const clientId = client?._id || '';
  const isClient = client?.role === 'client';
const noSessionsLeft = (client?.usedSessions || 0) >= (client?.totalSessions || 0);
  const fetchSlots = async () => {
    try {
      const res = await axios.get(
        `${baseUrl}/api/admin/slots${isClient ? `?adminId=${client?.adminId}` : ''}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSlots(res.data);
    } catch (err) {
      console.error('שגיאה בטעינת התורים', err);
    }
  };

  useEffect(() => {
    if (client) {
      fetchSlots();
    }
  }, [client]);

  const handleAction = async () => {
    if (!selectedSlot || !actionType) return;

    try {
      await axios.post(
        `${baseUrl}/api/slots/${selectedSlot._id}/${actionType}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await refreshClient();
      await fetchSlots();
      setIsModalOpen(false);
      setSelectedSlot(null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'שגיאה');
    }
  };

  const availableDates = new Set(
    slots
      .filter((slot) => new Date(`${slot.date}T${slot.time}`) >= new Date())
      .map((slot) => slot.date)
  );

  const isDateAvailable = (date: Date) => {
    const formatted = date.toLocaleDateString('en-CA');
    return availableDates.has(formatted);
  };

  const filteredSlots = slots
    .filter((slot) => slot.date === selectedDate)
    .filter((slot) => new Date(`${slot.date}T${slot.time}`) >= new Date());

  return (
    <div className="p-6 font-sans text-gray-800">
      <style>{`
        .react-calendar {
          width: 100%;
          background: white;
          border: none;
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          line-height: 1.4;
          border-radius: 0.5rem;
        }
        .react-calendar__tile--now {
          background: #fef08a;
          color: #000;
          font-weight: bold;
        }
        .react-calendar__tile--active {
          background: #3b82f6;
          color: white;
        }
        .react-calendar__tile:hover {
          background-color: #dbeafe;
        }
      `}</style>

      <h2 className="text-3xl font-bold mb-6 text-center">📅 לוח שנה להזמנת תורים</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="flex justify-center">
          <div className="rounded-xl shadow-lg border border-gray-200 p-4 bg-white w-full max-w-md">
            <Calendar
              onChange={(date) => {
                const formatted = (date as Date).toLocaleDateString('en-CA');
                setSelectedDate(formatted);
              }}
              locale="he-IL"
              tileDisabled={({ date }) => !isDateAvailable(date)}
            />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">תורים ליום: {selectedDate || 'בחר תאריך'}</h3>
          {filteredSlots.length === 0 ? (
            <p className="text-gray-600">אין תורים זמינים ליום זה</p>
          ) : (
            <ul className="space-y-4">
              {filteredSlots.map((slot) => {
                const alreadyBooked = slot.bookedClients.includes(clientId);
                const isFull = slot.bookedClients.length >= slot.maxClients;
                const disabled = !alreadyBooked && (isFull || noSessionsLeft);

                return (
                  <li key={slot._id} className="border p-4 rounded-lg bg-white shadow-sm">
                    <p>
                      <strong>שעה:</strong> {slot.time}
                    </p>
                    <p>
                      <strong>משתתפים:</strong> {slot.bookedClients.length}/{slot.maxClients}
                    </p>
                    <button
                      disabled={disabled}
                      onClick={() => {
                        setSelectedSlot(slot);
                        setActionType(alreadyBooked ? 'cancel' : 'book');
                        setIsModalOpen(true);
                      }}
                      className={`mt-3 w-full px-4 py-2 rounded-md text-white font-medium transition ${
                        alreadyBooked
                          ? 'bg-red-600 hover:bg-red-700'
                          : disabled
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {alreadyBooked
                        ? 'בטל תור'
                        : noSessionsLeft
                        ? 'המנוי נוצל'
                        : isFull
                        ? 'תור מלא'
                        : 'הזמן תור'}
                  </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Modal for confirmation */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="fixed z-50 inset-0 flex items-center justify-center">
        <div className="fixed inset-0 bg-black bg-opacity-30" aria-hidden="true" />
        <div className="relative bg-white p-6 rounded-xl shadow-xl w-[90%] max-w-md z-50">
          <Dialog.Title className="text-lg font-semibold mb-4">
            {actionType === 'book' ? 'אישור הזמנת תור' : 'אישור ביטול תור'}
          </Dialog.Title>
          {selectedSlot && (
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>תאריך:</strong> {selectedSlot.date}</p>
              <p><strong>שעה:</strong> {selectedSlot.time}</p>
              <p><strong>משתתפים:</strong> {selectedSlot.bookedClients.length}/{selectedSlot.maxClients}</p>
            </div>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-sm"
            >
              ביטול
            </button>
            <button
              onClick={handleAction}
              className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm"
            >
              אשר
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default CalendarBookings;
