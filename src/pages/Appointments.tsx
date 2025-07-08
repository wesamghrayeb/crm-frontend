import React, { useEffect, useState, Fragment } from 'react';
import axios from 'axios';
import { Dialog, Transition } from '@headlessui/react';
import {
  FiCalendar, FiClock, FiUsers, FiCheckCircle, FiXCircle, FiAlertTriangle, FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import { useClient } from '../contexts/ClientContext';
const baseUrl = process.env.REACT_APP_API_URL;

interface Slot {
  _id: string;
  date: string;
  time: string;
  bookedClients: string[];
  maxClients: number;
}

const Appointments: React.FC = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionAlert, setSessionAlert] = useState(false);
  const [dateAlert, setDateAlert] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [actionType, setActionType] = useState<'book' | 'cancel' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openDayIdx, setOpenDayIdx] = useState(0);

  const token = localStorage.getItem('token');
  const { client, refreshClient } = useClient();

  const clientId = client?._id || '';
  const noSessionsLeft = (client?.usedSessions || 0) >= (client?.totalSessions || 0);
  const updateAlerts = () => {
    if (!client) return;
    const remaining = client.totalSessions - client.usedSessions;
    setSessionAlert(remaining == 1);
    const end = client?.endDate ? new Date(client.endDate) : null;
    if(end != null){
        const diff = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        setDateAlert(diff <= 7);
    }
  };

  const fetchSlots = async () => {
    try {
      const isClient = client?.role === 'client';
      const res = await axios.get(`${baseUrl}/api/admin/slots${isClient ? `?adminId=${client?.adminId}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSlots(res.data);
    } catch (err) {
      console.error('Error fetching slots', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshClient(); }, [token]);
  useEffect(() => {
    if (client) {
      updateAlerts();
      fetchSlots();
    }
    // eslint-disable-next-line
  }, [client]);

  const handleSlotAction = async () => {
    if (!selectedSlot || !actionType) return;

    // Check if full again before booking
    if (actionType === 'book') {
      const refreshedSlot = slots.find(s => s._id === selectedSlot._id);
      if (refreshedSlot && refreshedSlot.bookedClients.length >= refreshedSlot.maxClients) {
        setErrorMessage('לא ניתן להזמין תור - התור כבר מלא.');
        return;
      }
    }

    const endpoint = actionType === 'book' ? 'book' : 'cancel';
    try {
      await axios.post(`${baseUrl}/api/slots/${selectedSlot._id}/${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await refreshClient();
      await fetchSlots();
      setSelectedSlot(null);
      setActionType(null);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'שגיאה');
    }
  };

  // Group by date, only show future slots
  const groupedSlots = Object.entries(
    slots
      .filter(slot => new Date(`${slot.date}T${slot.time}`) >= new Date())
      .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
      .reduce((acc: Record<string, Slot[]>, slot) => {
        if (!acc[slot.date]) acc[slot.date] = [];
        acc[slot.date].push(slot);
        return acc;
      }, {})
  );

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen max-w-screen-xl mx-auto">
      <h2 className="text-3xl font-bold flex items-center gap-2 text-blue-700 mb-6 justify-center">
        <FiCalendar /> מערכת הזמנת תורים - לקוח
      </h2>

      <p className="text-gray-600 mb-4 text-center">בחר תור מתוך הרשימה לפי תאריך ושעה. במידה והתור מלא או המנוי נוצל, לא תוכל להזמין.</p>

      {sessionAlert && (
        <div className="bg-yellow-100 text-yellow-800 p-3 rounded flex items-center gap-2 mb-4 justify-center max-w-xl mx-auto">
          <FiAlertTriangle />
          שים לב! נותר לך רק תור אחד
        </div>
      )}
      {dateAlert && (
        <div className="bg-red-100 text-red-700 p-3 rounded flex items-center gap-2 mb-4 justify-center max-w-xl mx-auto">
          <FiClock /> המנוי שלך מסתיים בקרוב – נא לחדש אותו!
        </div>
      )}
      {noSessionsLeft && (
        <div className="bg-gray-100 text-gray-800 p-3 rounded flex items-center gap-2 mb-4 border border-gray-300 justify-center max-w-xl mx-auto">
          🎫 המנוי נוצל במלואו — לא ניתן להזמין תורים נוספים.
        </div>
      )}

      {loading ? (
        <p className="text-center">טוען תורים...</p>
      ) : groupedSlots.length === 0 ? (
        <div className="bg-white text-gray-500 p-6 rounded-2xl shadow mx-auto max-w-xl mt-10 text-center">
          לא נמצאו תורים קרובים להזמנה.
        </div>
      ) : (
        <div className="space-y-3">
          {groupedSlots.map(([date, daySlots], idx) => (
            <div key={date} className="border rounded-2xl overflow-hidden shadow bg-white">
              {/* Accordion Header */}
              <button
                className={`w-full flex justify-between items-center px-4 py-3 text-right focus:outline-none bg-gradient-to-l transition
                  ${idx === openDayIdx
                    ? 'from-blue-100 via-white to-white font-bold'
                    : 'bg-white text-gray-700'}
                `}
                onClick={() => setOpenDayIdx(idx === openDayIdx ? -1 : idx)}
                aria-expanded={idx === openDayIdx}
                aria-controls={`appointment-day-${idx}`}
              >
                <span className="flex items-center gap-2">
                  <FiCalendar className="text-blue-400" />
                  {new Date(date).toLocaleDateString('he-IL', {
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
                id={`appointment-day-${idx}`}
                className={`transition-all duration-200 bg-blue-50 ${
                  idx === openDayIdx ? 'block' : 'hidden'
                }`}
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-4">
                  {daySlots.map((slot: Slot) => {
                    const alreadyBooked = slot.bookedClients.includes(clientId);
                    const isFull = slot.bookedClients.length >= slot.maxClients;
                    const isBookingDisabled = !alreadyBooked && (noSessionsLeft || isFull);

                    return (
                      <div key={slot._id} className="bg-white p-4 rounded-xl shadow hover:shadow-lg flex flex-col justify-between transition duration-300">
                        <div className="flex items-center justify-between mb-2 text-gray-700">
                          <span><FiClock className="inline mr-1" /> {slot.time}</span>
                          <span><FiUsers className="inline mr-1 text-green-600" /> {slot.bookedClients.length}/{slot.maxClients}</span>
                        </div>
                        <button
                          disabled={isBookingDisabled}
                          onClick={() => {
                            setSelectedSlot(slot);
                            setActionType(alreadyBooked ? 'cancel' : 'book');
                          }}
                          className={`w-full text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${
                            alreadyBooked
                              ? 'bg-red-500 hover:bg-red-600'
                              : isBookingDisabled
                              ? 'bg-gray-300 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {alreadyBooked ? <FiXCircle /> : <FiCheckCircle />}
                          {alreadyBooked
                            ? 'בטל תור'
                            : noSessionsLeft
                            ? 'המנוי נוצל'
                            : isFull
                            ? 'תור מלא'
                            : 'הזמן תור'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Confirm/Cancel */}
      <Transition show={!!selectedSlot} as={Fragment}>
        <Dialog onClose={() => { setSelectedSlot(null); setErrorMessage(null); }} className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-30" aria-hidden="true" />
          <div className="bg-white p-6 rounded-lg shadow-lg z-50 max-w-sm w-full">
            <Dialog.Title className="text-lg font-bold mb-4">
              {actionType === 'book' ? 'אישור הזמנת תור' : 'אישור ביטול תור'}
            </Dialog.Title>
            {errorMessage && <p className="text-red-600 text-sm mb-2">{errorMessage}</p>}
            <p className="mb-4 text-sm text-gray-700">
              {actionType === 'book'
                ? `האם ברצונך להזמין תור לתאריך ${selectedSlot?.date} בשעה ${selectedSlot?.time}?`
                : `האם לבטל את התור שלך לתאריך ${selectedSlot?.date} בשעה ${selectedSlot?.time}?`}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setSelectedSlot(null); setErrorMessage(null); }}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                ביטול
              </button>
              <button
                onClick={handleSlotAction}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                אשר
              </button>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default Appointments;
