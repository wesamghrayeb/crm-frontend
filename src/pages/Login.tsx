import React, { useState } from 'react';
import axios from 'axios';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const baseUrl = process.env.REACT_APP_API_URL;
  console.log('API:', baseUrl);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${baseUrl}/api/auth/login`, {
        email,
        password,
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('client', JSON.stringify(res.data.client));
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300 px-4">
      <div className="bg-white shadow-2xl rounded-2xl p-10 w-full max-w-md text-center animate-fade-in">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img src="./crmLogo.png" alt="TOGETHER Logo" className="w-16 h-16 rounded-lg shadow mb-2" />
          <h1 className="text-2xl font-bold text-blue-700 tracking-wide">TOGETHER</h1>
        </div>

        <h2 className="text-xl font-semibold mb-6 text-gray-700"></h2>

        {error && (
          <p className="text-red-600 text-sm mb-4 font-medium">{error}</p>
        )}

        <form onSubmit={handleLogin} className="text-start space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 transition text-white font-semibold py-2 rounded-lg shadow"
          >
            התחבר
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
