import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiMail, FiKey, FiUser } from 'react-icons/fi';

const MyProfile: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [passwords, setPasswords] = useState({ current: '', new: '' });
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const baseUrl = process.env.REACT_APP_API_URL;

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProfile();
  }, []);

   const fetchProfile = async () => {
     try {
       const res = await axios.get(`${baseUrl}/api/client/me`, {
         headers: { Authorization: `Bearer ${token}` },
       });
   
       setProfile(res.data.client || res.data);
       setEmail(res.data.client?.email || res.data.email);
   
       const now = new Date();
   
       const pastBookings = (res.data.bookings || []).filter((booking: any) => {
         const bookingDate = new Date(booking.date + 'T' + booking.time);
         return bookingDate < now;
       });
   
       const flatHistory = pastBookings.flatMap((b: any) => b.history || []);
       setHistory(flatHistory);
     } catch (err: any) {
       setMessage('שגיאה בקבלת נתוני פרופיל');
     }
   };

  const updateEmail = async () => {
    try {
      await axios.put(
        `${baseUrl}/api/client/change-email`,
        { newEmail: email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('האימייל עודכן בהצלחה!');
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'שגיאה בעדכון אימייל');
    }
  };

  const updatePassword = async () => {
    try {
      await axios.put(
        `${baseUrl}/api/client/change-password`,
        {
          currentPassword: passwords.current,
          newPassword: passwords.new,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('הסיסמה עודכנה בהצלחה!');
      setPasswords({ current: '', new: '' });
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'שגיאה בעדכון סיסמה');
    }
  };

  if (!profile) {
    return <div className="text-center mt-10 text-gray-600">טוען פרופיל...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow mt-6">
      <h2 className="text-2xl font-bold text-blue-700 mb-4 flex items-center gap-2">
        <FiUser /> פרופיל אישי
      </h2>

      {message && (
        <div className="mb-4 bg-blue-100 text-blue-800 p-3 rounded">{message}</div>
      )}

      <div className="space-y-6">
        {/* שם מלא */}
        <div>
          <label className="block font-medium text-gray-700 mb-1">שם מלא:</label>
          <div className="bg-gray-100 p-2 rounded">{profile.fullName}</div>
        </div>

        {/* אימייל */}
        <div>
          <label className="block font-medium text-gray-700 mb-1">אימייל:</label>
          <input
            type="email"
            value={email || ''}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded p-2"
          />
          <button
            onClick={updateEmail}
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            עדכן אימייל
          </button>
        </div>

        {/* שינוי סיסמה */}
        <div>
          <label className="block font-medium text-gray-700 mb-1">החלפת סיסמה:</label>
          <input
            type="password"
            placeholder="סיסמה נוכחית"
            value={passwords.current}
            onChange={(e) =>
              setPasswords({ ...passwords, current: e.target.value })
            }
            className="w-full border rounded p-2 mb-2"
          />
          <input
            type="password"
            placeholder="סיסמה חדשה"
            value={passwords.new}
            onChange={(e) =>
              setPasswords({ ...passwords, new: e.target.value })
            }
            className="w-full border rounded p-2"
          />
          <button
            onClick={updatePassword}
            className="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            עדכן סיסמה
          </button>
        </div>

        {/* היסטוריית תורים */}
        <div>
          <h3 className="text-lg font-semibold mt-6 mb-2">היסטוריית פעולות בתורים</h3>
          {history.length === 0 ? (
            <p className="text-sm text-gray-500">לא נמצאו פעולות.</p>
          ) : (
            <ul className="text-sm text-gray-700 space-y-1 max-h-60 overflow-y-auto border rounded p-2 bg-gray-50">
              {history.map((item, idx) => (
                <li key={idx} className="border-b py-1">
                  📅 {new Date(item.timestamp).toLocaleString('he-IL')} - {item.action}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
