import React, { useEffect, useState } from 'react';
import { UserRole, Session, UserStatus } from '../types';
import { logout } from '../services/auth';
import { getUserById, saveUser } from '../services/storage';
import Button from './Button';
import Input from './Input';

interface LayoutProps {
  children: React.ReactNode;
  session: Session;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, session, currentPage, onNavigate }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [newAvatar, setNewAvatar] = useState<string>('');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Session Validation Loop
  useEffect(() => {
    const checkStatus = async () => {
      const freshUser = await getUserById(session.userId);
      if (!freshUser || freshUser.status === UserStatus.PAUSED) {
        alert("Your session has expired or your account was suspended.");
        logout();
      } else {
        setCurrentUserData(freshUser);
        if (!newAvatar) setNewAvatar(freshUser.avatar || '');
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 2000); // Check every 2 seconds
    return () => clearInterval(interval);
  }, [session.userId]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { // Limit to 500KB for Base64 in Firestore sake (Firestore limit is 1MB doc size)
        alert("File too large. Please select an image under 500KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUserData) {
      const updatedUser = { ...currentUserData, avatar: newAvatar };
      await saveUser(updatedUser);
      setShowProfileModal(false);
      // Force refresh of layout data
      setCurrentUserData(updatedUser);
    }
  };
  
  const navItems = [
    { id: 'chat', label: 'Chats', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
    )},
    { id: 'friends', label: 'Friends', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    )},
  ];

  if (session.role === UserRole.ADMIN) {
    navItems.push({ id: 'admin', label: 'Admin', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    )});
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
      
      {/* Animated Liquid Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-400/30 dark:bg-purple-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-400/30 dark:bg-blue-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-pink-400/30 dark:bg-pink-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-72 glass border-r border-white/20 z-10 relative">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">
              C
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 tracking-tight">CloudChat</span>
          </div>
          
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            {isDarkMode ? '🌞' : '🌙'}
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-3 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`group w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                currentPage === item.id 
                  ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-blue-300 font-semibold shadow-sm backdrop-blur-sm border border-blue-500/10' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white/40 dark:hover:bg-white/5 hover:translate-x-1'
              }`}
            >
              <div className={`transition-transform duration-300 ${currentPage === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 mx-4 mb-4 rounded-3xl bg-white/30 dark:bg-black/20 border border-white/20 backdrop-blur-md">
           <div 
             className="flex items-center space-x-3 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
             onClick={() => setShowProfileModal(true)}
             title="Edit Profile"
           >
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/40">
                <img 
                  src={currentUserData?.avatar || "https://picsum.photos/200"} 
                  className="w-full h-full object-cover" 
                  alt="avatar" 
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{session.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">Edit Profile</p>
              </div>
           </div>
           <button 
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 active:scale-95"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
             <span>Sign Out</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 z-10 relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 glass border-b border-white/20 sticky top-0 z-50">
          <div className="flex items-center space-x-2">
             <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
             <span className="font-bold text-gray-800 dark:text-white">CloudChat</span>
          </div>
          <div className="flex items-center space-x-3">
             <div 
               className="w-8 h-8 rounded-full overflow-hidden border border-white/40"
               onClick={() => setShowProfileModal(true)}
             >
                <img src={currentUserData?.avatar || "https://picsum.photos/200"} className="w-full h-full object-cover" alt="me" />
             </div>
            <button onClick={toggleTheme} className="p-2 text-gray-500 dark:text-gray-300">
              {isDarkMode ? '🌞' : '🌙'}
            </button>
          </div>
        </div>

        {/* Mobile Bottom Nav - Enhanced Liquid Glass */}
        <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/30 dark:bg-black/30 backdrop-blur-xl border-t border-white/20 flex justify-around p-3 z-50 pb-safe shadow-lg">
           {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center space-y-1 transition-all duration-300 ${
                currentPage === item.id ? 'text-blue-600 dark:text-blue-400 transform -translate-y-1' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
          <button 
            onClick={logout} 
            className="flex flex-col items-center space-y-1 text-red-500/70"
          >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
             <span className="text-[10px] font-medium">Exit</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-auto relative scroll-smooth">
          <div className="md:p-8 p-4 pb-24 md:pb-8 max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowProfileModal(false)}></div>
           <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-2xl border border-white/20 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-fade-in-up">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">Customize Profile</h3>
              <form onSubmit={saveProfile} className="space-y-6">
                 <div className="flex flex-col items-center">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg mb-4 group">
                       <img src={newAvatar} alt="preview" className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <span className="text-white text-xs font-bold">Change</span>
                       </div>
                       <input 
                         type="file" 
                         accept="image/*" 
                         className="absolute inset-0 opacity-0 cursor-pointer" 
                         onChange={handleFileChange}
                       />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Click image to upload (max 500KB)</p>
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Username</label>
                    <div className="w-full px-4 py-3 bg-gray-100 dark:bg-black/20 rounded-xl text-gray-500 dark:text-gray-400 border border-transparent">
                      {currentUserData?.username} <span className="text-xs italic ml-2">(Read-only)</span>
                    </div>
                 </div>

                 <div className="flex justify-end space-x-3 pt-2">
                   <Button variant="ghost" type="button" onClick={() => setShowProfileModal(false)}>Cancel</Button>
                   <Button type="submit">Save Changes</Button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Layout;