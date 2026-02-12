import React, { useState, useEffect } from 'react';
import { User, UserRole, UserStatus } from '../types';
import { getUsers, saveUser, deleteUser } from '../services/storage';
import Button from '../components/Button';
import Input from '../components/Input';
import { ADMIN_USER_ID } from '../constants';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});
  const [tempAvatar, setTempAvatar] = useState<string>('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const u = await getUsers();
    setUsers(u);
  };

  const handleDelete = async (id: string) => {
    if (id === ADMIN_USER_ID) {
      alert("Cannot delete root admin.");
      return;
    }
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      await deleteUser(id);
      loadUsers();
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (user.id === ADMIN_USER_ID) {
      alert("Cannot pause root admin.");
      return;
    }
    const newStatus = user.status === UserStatus.ACTIVE ? UserStatus.PAUSED : UserStatus.ACTIVE;
    const confirmMsg = newStatus === UserStatus.PAUSED 
      ? `Pause ${user.username}? They will be logged out immediately.` 
      : `Resume ${user.username}?`;
      
    if (confirm(confirmMsg)) {
      const updatedUser = { ...user, status: newStatus };
      await saveUser(updatedUser);
      loadUsers();
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setTempAvatar(user.avatar || '');
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    const randomAvatar = `https://picsum.photos/200/200?random=${Date.now()}`;
    setEditingUser({
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      avatar: randomAvatar
    });
    setTempAvatar(randomAvatar);
    setIsModalOpen(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) {
        alert("File too large. Max 500KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser.username || !editingUser.password) {
      alert("Username and Password are required");
      return;
    }

    // Root Admin Protection Checks
    if (editingUser.id === ADMIN_USER_ID) {
      // Logic inside storage.ts also prevents this, but UI should also be robust
    }

    const newUser: User = {
      id: editingUser.id || crypto.randomUUID(),
      username: editingUser.username,
      password: editingUser.password,
      role: editingUser.role || UserRole.USER,
      status: editingUser.status || UserStatus.ACTIVE,
      createdAt: editingUser.createdAt || Date.now(),
      avatar: tempAvatar
    };

    await saveUser(newUser);
    setIsModalOpen(false);
    loadUsers();
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Control access, roles, and account status</p>
        </div>
        <Button onClick={handleCreate} className="shadow-lg shadow-blue-500/20">
            <span className="mr-2 text-xl">+</span> Add New User
        </Button>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
            <thead className="bg-gray-50/50 dark:bg-white/5">
              <tr>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User Profile</th>
                <th className="px-4 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-4 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                <th className="px-6 py-5 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
              {users.map((user) => {
                const isRoot = user.id === ADMIN_USER_ID;
                return (
                  <tr key={user.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors duration-200">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <img className="h-10 w-10 rounded-full border border-white dark:border-gray-600 shadow-sm object-cover" src={user.avatar} alt="" />
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center">
                            {user.username}
                            {isRoot && <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 px-1.5 rounded border border-blue-200">ROOT</span>}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5 opacity-70">ID: {user.id.slice(0, 6)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${
                          user.role === UserRole.ADMIN 
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800' 
                          : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border-blue-100 dark:border-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-5 whitespace-nowrap">
                       <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${
                          user.status === UserStatus.PAUSED
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 border-red-200 dark:border-red-800'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 border-green-200 dark:border-green-800'
                       }`}>
                         {user.status || 'ACTIVE'}
                       </span>
                    </td>
                    <td className="px-4 py-5 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        {!isRoot && (
                           <button 
                             onClick={() => handleToggleStatus(user)} 
                             className={`text-xs font-semibold px-2 py-1 rounded transition-colors ${
                               user.status === UserStatus.PAUSED 
                               ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                               : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                             }`}
                           >
                             {user.status === UserStatus.PAUSED ? 'Resume' : 'Pause'}
                           </button>
                        )}
                        <button onClick={() => handleEdit(user)} className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200 transition-colors">Edit</button>
                        {!isRoot && (
                           <button onClick={() => handleDelete(user.id)} className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200 transition-colors">Del</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/20 rounded-3xl max-w-md w-full p-8 shadow-2xl animate-fade-in-up">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {editingUser.id ? (editingUser.id === ADMIN_USER_ID ? 'Edit Root Admin' : 'Edit User') : 'Create New User'}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-5">
              
              {/* Avatar Upload */}
              <div className="flex flex-col items-center mb-4">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600 shadow-sm group">
                      <img src={tempAvatar} alt="avatar preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <span className="text-white text-xs">Upload</span>
                      </div>
                      <input type="file" accept="image/*" onChange={handleAvatarChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Click to change avatar</p>
              </div>

              <Input 
                label="Username" 
                value={editingUser.username || ''} 
                onChange={e => setEditingUser({...editingUser, username: e.target.value})}
                disabled={editingUser.id === ADMIN_USER_ID} // Lock username for Root Admin
                className={editingUser.id === ADMIN_USER_ID ? 'opacity-50 cursor-not-allowed' : ''}
              />
              
              <Input 
                label="Password" 
                type="text"
                value={editingUser.password || ''} 
                onChange={e => setEditingUser({...editingUser, password: e.target.value})} 
                placeholder="Enter new password"
              />

              <div>
                 <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">Role</label>
                 <div className="relative">
                    <select 
                        className={`w-full px-4 py-3 bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 rounded-xl shadow-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none
                        ${editingUser.id === ADMIN_USER_ID ? 'opacity-50 cursor-not-allowed' : ''}`}
                        value={editingUser.role}
                        onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                        disabled={editingUser.id === ADMIN_USER_ID} // Lock role for Root Admin
                    >
                    <option value={UserRole.USER} className="text-gray-900">User</option>
                    <option value={UserRole.ADMIN} className="text-gray-900">Admin</option>
                    </select>
                 </div>
                 {editingUser.id === ADMIN_USER_ID && <p className="text-xs text-yellow-600 mt-1 ml-1">Root Admin role cannot be changed.</p>}
              </div>

              <div className="flex justify-end space-x-3 mt-8">
                <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;