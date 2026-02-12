import React, { useState } from 'react';
import { login } from '../services/auth';
import Input from '../components/Input';
import Button from '../components/Button';
import { Session } from '../types';

interface LoginPageProps {
  onLogin: (session: Session) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Login is now async/await
      const result = await login(username, password);
      if (result.success && result.session) {
        onLogin(result.session);
      } else {
        setError(result.message || 'Login failed');
        setLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-gray-100 dark:bg-gray-900">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-500/40 rounded-full mix-blend-multiply filter blur-[100px] animate-blob"></div>
        <div className="absolute top-[-10%] right-[-20%] w-[600px] h-[600px] bg-blue-500/40 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-20 w-[600px] h-[600px] bg-pink-500/40 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative w-full max-w-md glass-panel p-8 rounded-3xl shadow-2xl animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-4xl font-bold mx-auto mb-6 shadow-lg shadow-blue-500/40 transform hover:scale-110 transition-transform duration-300">
            C
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Welcome Back</h2>
          <p className="text-gray-500 dark:text-gray-300 mt-2">Enter the CloudChat universe</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Username" 
            placeholder="Enter username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            className="bg-white/60 dark:bg-black/30"
          />
          <Input 
            label="Password" 
            type="password" 
            placeholder="Enter password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white/60 dark:bg-black/30"
          />

          {error && (
            <div className="p-4 rounded-xl bg-red-50/80 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm flex items-center backdrop-blur-sm">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          <Button type="submit" fullWidth disabled={loading} className="text-lg py-3">
            {loading ? 'Authenticating...' : 'Sign In'}
          </Button>

          <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
             <p>Need an account? Contact your administrator.</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;