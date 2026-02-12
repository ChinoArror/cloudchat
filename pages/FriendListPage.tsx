import React, { useState, useEffect } from 'react';
import { Session, User, FriendRequest } from '../types';
import { getFriends, sendFriendRequest, respondToRequest, subscribeToFriendRequests, subscribeToSentRequests } from '../services/storage';
import Button from '../components/Button';
import Input from '../components/Input';
import { FriendRequestStatus } from '../types';

interface FriendListPageProps {
  session: Session;
  onStartChat: (friendId: string) => void;
}

const FriendListPage: React.FC<FriendListPageProps> = ({ session, onStartChat }) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'add'>('friends');
  const [friends, setFriends] = useState<User[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [addUsername, setAddUsername] = useState('');
  const [addStatus, setAddStatus] = useState<{success: boolean, message: string} | null>(null);

  // Fetch Friends (Async once on load, or could be real-time if friends status changes often)
  const refreshFriends = async () => {
    const f = await getFriends(session.userId);
    setFriends(f);
  };

  useEffect(() => {
    refreshFriends();
    // Set up listeners for requests
    const unsubRequests = subscribeToFriendRequests(session.userId, (reqs) => setRequests(reqs));
    const unsubSent = subscribeToSentRequests(session.userId, (reqs) => setSentRequests(reqs));

    return () => {
      unsubRequests();
      unsubSent();
    };
  }, [session.userId]);

  // Refresh friends list if requests change (someone accepted)
  useEffect(() => {
    refreshFriends();
  }, [requests.length, sentRequests.length]);


  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUsername.trim()) return;
    
    // Async call
    const result = await sendFriendRequest(session.userId, addUsername);
    setAddStatus(result);
    if (result.success) {
      setAddUsername('');
    }
  };

  const handleRespond = async (requestId: string, status: FriendRequestStatus) => {
    await respondToRequest(requestId, status);
    refreshFriends();
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col animate-fade-in-up">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
         <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Connections</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your network and friendships</p>
         </div>
         <div className="flex bg-white/50 dark:bg-black/30 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-sm self-start sm:self-auto">
           {['friends', 'requests', 'add'].map((tab) => (
             <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 capitalize ${
                activeTab === tab 
                  ? 'bg-white dark:bg-gray-700 shadow-md text-blue-600 dark:text-blue-300 transform scale-105' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
             >
               {tab}
               {tab === 'requests' && requests.length > 0 && (
                 <span className="ml-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-lg shadow-red-500/30">
                   {requests.length}
                 </span>
               )}
             </button>
           ))}
         </div>
       </div>

       <div className="flex-1 overflow-auto custom-scrollbar">
          {activeTab === 'friends' && (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               {friends.length === 0 && (
                 <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400 glass-panel rounded-3xl">
                   <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                     <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                   </div>
                   <p className="text-lg">No friends yet.</p>
                   <p className="text-sm opacity-70">Go to "Add Friend" to connect!</p>
                 </div>
               )}
               {friends.map(friend => (
                 <div key={friend.id} className="glass-panel p-5 rounded-3xl flex items-center space-x-4 hover:transform hover:scale-[1.02] transition-all duration-300 group">
                    <img src={friend.avatar} alt={friend.username} className="w-14 h-14 rounded-full border-2 border-white/50 dark:border-white/10 shadow-md" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate text-lg">{friend.username}</h3>
                      <p className="text-xs text-green-500 font-medium">● Connected</p>
                    </div>
                    <button 
                      onClick={() => onStartChat(friend.id)} 
                      className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-sm"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    </button>
                 </div>
               ))}
             </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-6 max-w-2xl mx-auto">
               {requests.length === 0 && sentRequests.length === 0 && (
                 <div className="text-center py-20 text-gray-400 glass-panel rounded-3xl">No pending requests.</div>
               )}
               
               {/* Incoming */}
               {requests.length > 0 && <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">Incoming</h3>}
               {requests.map(req => (
                 <div key={req.id} className="glass-panel p-5 rounded-2xl flex items-center justify-between hover:shadow-lg transition-shadow">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Friend request from</p>
                      <p className="font-bold text-gray-900 dark:text-white text-lg">User ID: {req.fromUserId.slice(0,8)}...</p> 
                    </div>
                    <div className="flex space-x-3">
                       <Button variant="primary" onClick={() => handleRespond(req.id, FriendRequestStatus.ACCEPTED)}>Accept</Button>
                       <Button variant="secondary" onClick={() => handleRespond(req.id, FriendRequestStatus.REJECTED)}>Decline</Button>
                    </div>
                 </div>
               ))}

               {/* Outgoing */}
               {sentRequests.length > 0 && <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-8 mb-3 px-2">Sent</h3>}
               {sentRequests.map(req => (
                 <div key={req.id} className="bg-white/40 dark:bg-black/20 backdrop-blur-sm p-4 rounded-xl border border-white/10 flex items-center justify-between">
                    <p className="text-gray-700 dark:text-gray-300">To: <span className="font-bold">{req.toUserId.slice(0,8)}...</span></p>
                    <span className="text-xs font-bold px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full border border-yellow-200 dark:border-yellow-700">Pending</span>
                 </div>
               ))}
            </div>
          )}

          {activeTab === 'add' && (
             <div className="max-w-md mx-auto mt-10">
               <div className="glass-panel p-8 rounded-3xl shadow-xl">
                 <div className="w-14 h-14 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl mb-6 shadow-lg shadow-blue-500/30">
                    +
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Add New Connection</h3>
                 <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Enter a username to send a friend request.</p>
                 
                 <form onSubmit={handleSendRequest} className="space-y-5">
                   <Input 
                      placeholder="Username (case sensitive)" 
                      value={addUsername}
                      onChange={e => setAddUsername(e.target.value)}
                      className="bg-white/80 dark:bg-black/40"
                   />
                   <Button fullWidth disabled={!addUsername} className="py-3 text-lg">Send Request</Button>
                   
                   {addStatus && (
                     <div className={`p-4 rounded-xl text-sm font-medium border backdrop-blur-sm flex items-center ${
                       addStatus.success 
                        ? 'bg-green-50/80 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' 
                        : 'bg-red-50/80 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                     }`}>
                       {addStatus.message}
                     </div>
                   )}
                 </form>
               </div>
             </div>
          )}
       </div>
    </div>
  );
};

export default FriendListPage;