import React, { useState, useEffect } from 'react';
import { getSessionFromCookie } from './services/auth';
import { Session, UserRole } from './types';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import FriendListPage from './pages/FriendListPage';
import AdminPanel from './pages/AdminPanel';
import Layout from './components/Layout';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentPage, setCurrentPage] = useState('chat');
  const [targetChatId, setTargetChatId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const s = getSessionFromCookie();
    if (s) {
      setSession(s);
    }
    setLoading(false);
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