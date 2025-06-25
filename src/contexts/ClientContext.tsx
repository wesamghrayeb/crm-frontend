import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
const baseUrl = process.env.REACT_APP_API_URL;

type ClientType = {
  _id: string;
  fullName: string;
  email: string;
  totalSessions: number;
  usedSessions: number;
  startDate?: string;
  endDate?: string; 
  role?: string;
  adminId?: string;
};

type ClientContextType = {
  client: ClientType | null;
  setClient: (client: ClientType | null) => void;
  refreshClient: () => Promise<void>; // ← הוסף זאת
};

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [client, setClient] = useState<ClientType | null>(null);

  const refreshClient = async () => {
    const token = localStorage.getItem('token');
    console.log(token);
    if (!token) return;
    try {
      const res = await axios.get(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClient(res.data.client || res.data);
    } catch (err) {
      console.error('Failed to refresh client', err);
    }
  };

  useEffect(() => {
    refreshClient();
  }, []);

  return (
    <ClientContext.Provider value={{ client, setClient, refreshClient }}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = () => {
  const context = useContext(ClientContext);
  if (!context) throw new Error('useClient must be used within a ClientProvider');
  return context;
};