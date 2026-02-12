import React, { useState, useEffect } from 'react';
import { getSessionFromCookie } from './services/auth';
import { Session, UserRole } from './types';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import FriendListPage from './pages/FriendListPage';
import AdminPanel from './pages/AdminPanel';
import Layout from './components/Layout';
import SetupPage from './pages/SetupPage';
import { isFirebaseConfigured, checkDatabaseConnection, resetFirebaseConfig, initializeStorage } from './services/storage';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentPage, setCurrentPage] = useState('chat');
  const [targetChatId, setTargetChatId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      // Check if firebase is configured
      const isConfig = isFirebaseConfigured();
      setConfigured(isConfig);

      if (isConfig) {
        // 1. Check Database Connectivity specifically for "Missing Database" error
        const dbStatus = await checkDatabaseConnection();
        if (!dbStatus.ok && dbStatus.error === 'database_missing') {
          setDbError('database_missing');
          setLoading(false);
          return;
        }

        // 2. Initialize Storage (Seeds admin user if needed) - only run if DB is accessible
        await initializeStorage();

        // 3. Check for existing session
        const s = getSessionFromCookie();
        if (s) {
          setSession(s);
        }
      }
      setLoading(false);
    };

    init();
  }, []);

  const handleLogin = (newSession: Session) => {
    setSession(newSession);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setTargetChatId(undefined); // Clear specific chat target if moving away
  };

  const handleStartChat = (friendId: string) => {
    setTargetChatId(friendId);
    setCurrentPage('chat');
  };

  if (loading) return null;

  // Show Setup Page if no valid Firebase config found
  if (!configured) {
    return <SetupPage />;
  }

  // Show "Database Missing" error screen
  if (dbError === 'database_missing') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900 text-white relative">
         <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-red-900/20 to-black z-0"></div>
         <div className="relative z-10 glass-panel max-w-lg w-full p-8 rounded-3xl shadow-2xl border border-red-500/20 bg-black/60 backdrop-blur-xl">
            <div className="flex flex-col items-center text-center">
               <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/30">
                 <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               </div>
               <h1 className="text-2xl font-bold mb-3">Firestore Database Not Found</h1>
               <p className="text-gray-300 mb-6 text-sm leading-relaxed">
                 The app is trying to connect to a Firestore database named <strong>"chat"</strong>, but it doesn't exist.
               </p>
               
               <div className="bg-white/5 rounded-xl p-4 text-left w-full mb-6 border border-white/10">
                 <h3 className="text-sm font-bold text-white mb-2">How to fix this in Firebase Console:</h3>
                 <ol className="list-decimal list-inside text-xs text-gray-400 space-y-2">
                   <li>Go to <strong>Firestore Database</strong> section.</li>
                   <li>Click the databases dropdown (usually says "(default)") at the top.</li>
                   <li>Click <strong>Create database</strong>.</li>
                   <li>Set Database ID to: <code className="text-yellow-400 bg-black/30 px-1 rounded">chat</code></li>
                   <li>Select your location and start in <strong>Production Mode</strong>.</li>
                   <li>Ensure your Security Rules allow access (or set to test mode temporarily).</li>
                 </ol>
               </div>
               
               <div className="flex space-x-4 w-full">
                  <button 
                    onClick={() => window.location.reload()} 
                    className="flex-1 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    I Created "chat", Retry
                  </button>
                  <button 
                    onClick={resetFirebaseConfig} 
                    className="px-4 py-3 text-gray-400 hover:text-white text-sm font-medium"
                  >
                    Reset Config
                  </button>
               </div>
            </div>
         </div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'chat':
        return <ChatPage session={session} initialChatId={targetChatId} />;
      case 'friends':
        return <FriendListPage session={session} onStartChat={handleStartChat} />;
      case 'admin':
        return session.role === UserRole.ADMIN ? <AdminPanel /> : <div className="p-8 text-center text-red-500">Access Denied</div>;
      default:
        return <ChatPage session={session} />;
    }
  };

  return (
    <Layout session={session} currentPage={currentPage} onNavigate={handleNavigate}>
      {renderPage()}
    </Layout>
  );
};

export default App;