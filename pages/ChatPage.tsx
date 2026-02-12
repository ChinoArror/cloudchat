import React, { useState, useEffect, useRef } from 'react';
import { Session, User, Message } from '../types';
import { getFriends, subscribeToMessages, sendMessage } from '../services/storage';
import { EMOJI_LIST } from '../constants';

interface ChatPageProps {
  session: Session;
  initialChatId?: string; // Friend's User ID
}

const ChatPage: React.FC<ChatPageProps> = ({ session, initialChatId }) => {
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(initialChatId || null);
  const [friends, setFriends] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load Friends (Async)
  useEffect(() => {
    const loadFriends = async () => {
      const f = await getFriends(session.userId);
      setFriends(f);
    };
    loadFriends();
  }, [session.userId]);

  // Update selection if prop changes
  useEffect(() => {
    if (initialChatId) setSelectedFriendId(initialChatId);
  }, [initialChatId]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!selectedFriendId) return;

    // Use the real-time listener instead of polling
    const unsubscribe = subscribeToMessages(session.userId, selectedFriendId, (msgs) => {
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [selectedFriendId, session.userId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !selectedFriendId) return;
    
    const contentToSend = input;
    setInput(''); // Optimistic clear
    setShowEmoji(false);

    try {
      await sendMessage(session.userId, selectedFriendId, contentToSend);
    } catch (e) {
      console.error("Failed to send message", e);
      setInput(contentToSend); // Revert on failure
    }
  };

  const insertEmoji = (emoji: string) => {
    setInput(prev => prev + emoji);
  };

  const selectedFriend = friends.find(f => f.id === selectedFriendId);

  return (
    <div className="flex h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] glass-panel rounded-3xl overflow-hidden shadow-2xl relative z-10">
      
      {/* Sidebar List (Friends) */}
      <div className={`w-full md:w-80 border-r border-white/20 bg-white/40 dark:bg-black/20 backdrop-blur-xl flex flex-col ${selectedFriendId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 border-b border-white/10 font-bold text-gray-800 dark:text-white tracking-wide">Messages</div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {friends.length === 0 && <p className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center italic">No active conversations.</p>}
          {friends.map(friend => (
            <button
              key={friend.id}
              onClick={() => setSelectedFriendId(friend.id)}
              className={`w-full p-3 rounded-2xl flex items-center space-x-4 transition-all duration-300 ${
                selectedFriendId === friend.id 
                  ? 'bg-white/80 dark:bg-white/10 shadow-lg scale-[1.02]' 
                  : 'hover:bg-white/40 dark:hover:bg-white/5 hover:scale-[1.02]'
              }`}
            >
              <div className="relative">
                <img src={friend.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-white/50 dark:border-white/10 shadow-sm" alt="" />
                {/* Status indicator can be enhanced later with real-time user presence */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="font-bold text-gray-900 dark:text-white truncate text-sm">{friend.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">Click to chat</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm ${!selectedFriendId ? 'hidden md:flex' : 'flex'}`}>
        {selectedFriendId ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center space-x-4 bg-white/60 dark:bg-black/20 backdrop-blur-md">
              <button className="md:hidden text-gray-500 dark:text-gray-300 hover:text-blue-500 transition-colors" onClick={() => setSelectedFriendId(null)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <img src={selectedFriend?.avatar} className="w-10 h-10 rounded-full border-2 border-white/40 dark:border-white/10 shadow-sm" alt="" />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">{selectedFriend?.username || 'Unknown User'}</h3>
                <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === session.userId;
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                    <div className={`max-w-[75%] md:max-w-[60%] px-5 py-3 shadow-lg relative ${
                      isMe 
                        ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-2xl rounded-tr-none' 
                        : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-gray-800 dark:text-gray-100 border border-white/40 dark:border-white/5 rounded-2xl rounded-tl-none'
                    }`}>
                      <p className="leading-relaxed text-[15px]">{msg.content}</p>
                      <p className={`text-[10px] mt-1.5 text-right font-medium opacity-70`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 relative">
              <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-lg border-t border-white/20"></div>
              <div className="relative z-10 max-w-4xl mx-auto">
                {showEmoji && (
                  <div className="absolute bottom-full left-4 mb-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-3 w-72 h-64 overflow-y-auto grid grid-cols-6 gap-2 z-20 custom-scrollbar">
                    {EMOJI_LIST.map(emoji => (
                      <button 
                        key={emoji} 
                        onClick={() => insertEmoji(emoji)}
                        className="text-2xl hover:bg-black/5 dark:hover:bg-white/10 p-2 rounded-xl transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                
                <form onSubmit={handleSend} className="flex items-center gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowEmoji(!showEmoji)}
                    className="p-3 text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors hover:scale-110 transform duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </button>
                  
                  {/* FIXED INPUT VISIBILITY */}
                  <input 
                    className="flex-1 bg-white/70 dark:bg-gray-800/70 border-0 rounded-full px-6 py-3.5 
                               text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
                               focus:ring-2 focus:ring-blue-500/50 focus:bg-white dark:focus:bg-gray-700
                               shadow-inner transition-all duration-300"
                    placeholder="Type your message..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                  />
                  
                  <button 
                    type="submit" 
                    disabled={!input.trim()}
                    className="p-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9-2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-32 h-32 bg-gradient-to-tr from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mb-6 animate-pulse-slow">
              <svg className="w-16 h-16 text-blue-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Select a Conversation</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs">Choose a friend from the sidebar to start sending encrypted messages.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;