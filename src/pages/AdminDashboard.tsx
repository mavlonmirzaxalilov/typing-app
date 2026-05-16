import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { databases, client, APPWRITE_CONFIG, ID } from '../lib/appwrite';
import { Query } from 'appwrite';
import { TypingText, TypingResult, UserProfile } from '../types';
import { useAuth } from '../hooks/useAuth';
import { Plus, Trash2, Trophy, FileText, CheckCircle, Users, Activity, Loader2, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [texts, setTexts] = useState<TypingText[]>([]);
  const [results, setResults] = useState<TypingResult[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'texts' | 'results' | 'users'>('texts');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [newText, setNewText] = useState({ title: '', content: '', duration: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchTexts = async () => {
    if (!APPWRITE_CONFIG.databaseId || !APPWRITE_CONFIG.collections.texts) return;
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.texts,
        [Query.orderDesc('createdAt')]
      );
      setTexts(response.documents.map(doc => ({ id: doc.$id, ...doc } as unknown as TypingText)));
    } catch (error) {
      console.error('Error fetching texts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    if (!APPWRITE_CONFIG.databaseId || !APPWRITE_CONFIG.collections.results) return;
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.results,
        [Query.orderDesc('wpm')]
      );
      setResults(response.documents.map(doc => ({ id: doc.$id, ...doc } as unknown as TypingResult)));
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const fetchUsers = async () => {
    if (!APPWRITE_CONFIG.databaseId || !APPWRITE_CONFIG.collections.users) return;
    setUsersLoading(true);
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.users,
        [Query.orderDesc('createdAt')]
      );
      setUsers(response.documents.map(doc => ({ ...doc } as unknown as UserProfile)));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchTexts();

    const unsubscribe = client.subscribe(
      `databases.${APPWRITE_CONFIG.databaseId}.collections.${APPWRITE_CONFIG.collections.texts}.documents`,
      (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*.create') ||
            response.events.includes('databases.*.collections.*.documents.*.update') ||
            response.events.includes('databases.*.collections.*.documents.*.delete')) {
          fetchTexts();
        }
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchResults();

    const unsubscribe = client.subscribe(
      `databases.${APPWRITE_CONFIG.databaseId}.collections.${APPWRITE_CONFIG.collections.results}.documents`,
      () => fetchResults()
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const handleAddText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !APPWRITE_CONFIG.databaseId || !APPWRITE_CONFIG.collections.texts) return;
    try {
      if (editingId) {
        await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.texts,
          editingId,
          {
            title: newText.title,
            content: newText.content,
            duration: newText.duration,
          }
        );
      } else {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.texts,
          ID.unique(),
          {
            title: newText.title,
            content: newText.content,
            authorId: user.$id,
            createdAt: Date.now(),
            isActive: false,
            duration: newText.duration,
          }
        );
      }
      setNewText({ title: '', content: '', duration: 0 });
      setEditingId(null);
      setShowModal(false);
      fetchTexts();
    } catch (error) {
      console.error('Error saving text:', error);
    }
  };

  const openEditModal = (text: TypingText) => {
    setNewText({ title: text.title, content: text.content, duration: text.duration ?? 0 });
    setEditingId(text.id);
    setShowModal(true);
  };

  const closeAndResetModal = () => {
    setShowModal(false);
    setNewText({ title: '', content: '', duration: 0 });
    setEditingId(null);
  };

  const toggleActive = async (textId: string, currentStatus: boolean) => {
    if (!APPWRITE_CONFIG.databaseId || !APPWRITE_CONFIG.collections.texts) return;
    try {
      if (!currentStatus) {
        const activeOne = texts.find(t => t.isActive);
        if (activeOne) {
          await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.texts,
            activeOne.id,
            { isActive: false }
          );
        }
      }
      await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.texts,
        textId,
        { isActive: !currentStatus }
      );
      fetchTexts();
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  };

  const deleteText = async (id: string) => {
    if (!confirm('Ushbu matnni o\'chirmoqchimisiz?')) return;
    if (!APPWRITE_CONFIG.databaseId || !APPWRITE_CONFIG.collections.texts) return;
    try {
      await databases.deleteDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.texts, id);
      fetchTexts();
    } catch (error) {
      console.error('Error deleting text:', error);
    }
  };

  const deleteResult = async (id: string) => {
    if (!confirm('Ushbu natijani o\'chirmoqchimisiz?')) return;
    if (!APPWRITE_CONFIG.databaseId || !APPWRITE_CONFIG.collections.results) return;
    try {
      await databases.deleteDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.results, id);
      fetchResults();
    } catch (error) {
      console.error('Error deleting result:', error);
    }
  };

  const deleteUser = async (uid: string) => {
    if (!confirm('Ushbu foydalanuvchini o\'chirmoqchimisiz?')) return;
    if (!APPWRITE_CONFIG.databaseId || !APPWRITE_CONFIG.collections.users) return;
    try {
      await databases.deleteDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.users, uid);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const updateUserRole = async (uid: string, currentRole: string) => {
    if (!APPWRITE_CONFIG.databaseId || !APPWRITE_CONFIG.collections.users) return;
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Rolni "${newRole}" ga o'zgartirmoqchimisiz?`)) return;
    try {
      await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.users,
        uid,
        { role: newRole }
      );
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Admin Dashboard</h1>
            <p className="text-zinc-500 font-medium">Manage typing contents and monitor real-time performance</p>
          </div>
          
          <div className="flex bg-[#0F0F12] p-1 border border-zinc-800 rounded-xl">
            <button
              id="tab-texts"
              onClick={() => setActiveTab('texts')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'texts' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/20' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <FileText className="w-4 h-4" /> Matnlar
            </button>
            <button
              id="tab-results"
              onClick={() => setActiveTab('results')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'results' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/20' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Activity className="w-4 h-4" /> Natijalar
            </button>
            <button
              id="tab-users"
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'users' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/20' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Users className="w-4 h-4" /> Foydalanuvchilar
            </button>
          </div>
        </div>

        {/* TEXTS TAB */}
        {activeTab === 'texts' && (
          <div className="space-y-8">
            <div className="flex justify-end">
              <button
                id="open-add-modal-btn"
                onClick={() => {
                  setEditingId(null);
                  setNewText({ title: '', content: '', duration: 0 });
                  setShowModal(true);
                }}
                className="flex items-center gap-2 bg-zinc-950 text-white px-8 py-3.5 rounded-xl font-bold border border-zinc-800 hover:border-cyan-500 transition-all shadow-xl group"
              >
                <Plus className="w-5 h-5 text-cyan-500 group-hover:scale-125 transition-transform" /> Yangi matn qo'shish
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-24">
                <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {texts.map(text => (
                  <motion.div 
                    layout
                    key={text.id}
                    className={`bg-[#0F0F12] p-8 rounded-2xl border transition-all ${text.isActive ? 'border-cyan-500/50 shadow-[0_0_30px_rgba(8,145,178,0.1)] ring-1 ring-cyan-500/20' : 'border-zinc-800 shadow-sm'}`}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-3 rounded-xl ${text.isActive ? 'bg-cyan-500/10 text-cyan-500' : 'bg-zinc-900 text-zinc-500'}`}>
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleActive(text.id, text.isActive)}
                          className={`p-2.5 rounded-lg transition-all ${text.isActive ? 'text-cyan-400 bg-cyan-400/10' : 'text-zinc-600 hover:text-cyan-500 hover:bg-zinc-800'}`}
                          title={text.isActive ? "Deaktivatsiya" : "Aktivatsiya"}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openEditModal(text)}
                          className="p-2.5 text-zinc-600 hover:text-cyan-500 hover:bg-zinc-800 rounded-lg transition-all"
                          title="Tahrirlash"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteText(text.id)}
                          className="p-2.5 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          title="O'chirish"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{text.title}</h3>
                    <p className="text-zinc-500 text-sm line-clamp-3 mb-6 font-medium leading-relaxed">{text.content}</p>
                    <div className="flex items-center justify-between pt-6 border-t border-zinc-800/50">
                      <span className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-mono font-bold">
                        {new Date(text.createdAt).toLocaleDateString()}
                      </span>
                      {text.isActive && (
                        <span className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase tracking-widest rounded border border-cyan-500/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                          Active Now
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RESULTS TAB */}
        {activeTab === 'results' && (
          <div className="bg-[#0F0F12] rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cyan-600/10 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-cyan-500" /> 
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Barcha Natijalar</h2>
                  <p className="text-xs text-zinc-500 font-mono tracking-widest uppercase mt-0.5">Barcha vaqtdagi natijalar</p>
                </div>
              </div>
              <div className="px-4 py-2 bg-zinc-900 rounded-xl border border-zinc-800 text-xs text-zinc-400 font-medium">
                <span className="text-cyan-500 font-bold">{results.length}</span> ta natija
              </div>
            </div>
            
            <div className="overflow-x-auto">
              {results.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-950/40">
                      <th className="p-5 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Rank</th>
                      <th className="p-5 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Student</th>
                      <th className="p-5 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Filial</th>
                      <th className="p-5 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] text-center">Toifa</th>
                      <th className="p-5 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] text-right">WPM</th>
                      <th className="p-5 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] text-right">Aniqlik</th>
                      <th className="p-5 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] text-center">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/30">
                    {results.map((res, index) => (
                      <motion.tr 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={res.id} 
                        className={`hover:bg-cyan-500/[0.02] transition-colors group ${index === 0 ? 'bg-cyan-500/[0.01]' : ''}`}
                      >
                        <td className="p-5">
                          <span className={`${index < 3 ? 'text-cyan-500' : 'text-zinc-600'} font-mono font-bold text-lg`}>
                            {index + 1 < 10 ? `0${index + 1}` : index + 1}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="font-bold text-zinc-100">{res.userName} {res.userSurname}</div>
                          <div className="text-[10px] text-zinc-600 font-mono tracking-tighter uppercase mt-0.5">{new Date(res.completedAt).toLocaleTimeString()}</div>
                        </td>
                        <td className="p-5">
                          <span className="text-sm text-zinc-400 font-medium">{res.branch}</span>
                        </td>
                        <td className="p-5 text-center">
                          <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-md text-[10px] font-bold text-zinc-400">
                            {res.ageCategory}
                          </span>
                        </td>
                        <td className="p-5 text-right">
                          <span className="text-2xl font-mono font-bold text-white tracking-tighter">{res.wpm}</span>
                        </td>
                        <td className="p-5 text-right">
                          <span className={`text-sm font-mono font-bold ${res.accuracy > 95 ? 'text-green-500' : 'text-zinc-400'}`}>
                            {res.accuracy}%
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          <button
                            onClick={() => deleteResult(res.id)}
                            className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            title="O'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-32 text-center flex flex-col items-center gap-6">
                  <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 shadow-inner">
                    <Activity className="w-8 h-8 text-zinc-700" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-zinc-300 font-bold text-lg">Hozircha natijalar yo'q</p>
                    <p className="text-zinc-600 text-sm max-w-xs mx-auto">Talabalar yozishni boshlaganidan keyin natijalar bu yerda ko'rinadi.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="bg-[#0F0F12] rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cyan-600/10 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-cyan-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Foydalanuvchilar</h2>
                  <p className="text-xs text-zinc-500 font-mono tracking-widest uppercase mt-0.5">Barcha ro'yxatdan o'tgan foydalanuvchilar</p>
                </div>
              </div>
              <div className="px-4 py-2 bg-zinc-900 rounded-xl border border-zinc-800 text-xs text-zinc-400 font-medium">
                <span className="text-cyan-500 font-bold">{users.length}</span> ta foydalanuvchi
              </div>
            </div>

            <div className="overflow-x-auto">
              {usersLoading ? (
                <div className="flex justify-center py-24">
                  <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
                </div>
              ) : users.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-950/40">
                      <th className="p-5 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Ism</th>
                      <th className="p-5 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Email</th>
                      <th className="p-5 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Filial</th>
                      <th className="p-5 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] text-center">Yosh toifasi</th>
                      <th className="p-5 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] text-center">Rol</th>
                      <th className="p-5 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] text-center">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/30">
                    {users.map((u) => (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={u.uid}
                        className="hover:bg-zinc-800/20 transition-colors"
                      >
                        <td className="p-5">
                          <div className="font-bold text-zinc-100">{u.name} {u.surname}</div>
                          <div className="text-[10px] text-zinc-600 font-mono mt-0.5">{new Date(u.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td className="p-5">
                          <span className="text-sm text-zinc-400 font-medium">{u.email ?? '—'}</span>
                        </td>
                        <td className="p-5">
                          <span className="text-sm text-zinc-400 font-medium">{u.branch ?? '—'}</span>
                        </td>
                        <td className="p-5 text-center">
                          <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-md text-[10px] font-bold text-zinc-400">
                            {u.ageCategory ?? '—'}
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => updateUserRole(u.uid, u.role)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                                u.role === 'admin'
                                  ? 'text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10'
                                  : 'text-zinc-400 border-zinc-700 hover:bg-zinc-800'
                              }`}
                              title="Rolni o'zgartirish"
                            >
                              {u.role === 'admin' ? '→ User' : '→ Admin'}
                            </button>
                            <button
                              onClick={() => deleteUser(u.uid)}
                              className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                              title="O'chirish"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-32 text-center flex flex-col items-center gap-6">
                  <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 shadow-inner">
                    <Users className="w-8 h-8 text-zinc-700" />
                  </div>
                  <p className="text-zinc-300 font-bold text-lg">Foydalanuvchilar yo'q</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-[#0F0F12] w-full max-w-2xl rounded-2xl shadow-2xl p-10 border border-zinc-800"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-cyan-600/10 rounded-xl text-cyan-500">
                    {editingId ? <Edit className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    {editingId ? 'Matnni tahrirlash' : 'Yangi musobaqa matni'}
                  </h2>
                </div>

                <form onSubmit={handleAddText} className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Sarlavha</label>
                    <input
                      id="text-title-input"
                      required
                      type="text"
                      className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-xl focus:border-cyan-500 outline-none text-white placeholder-zinc-700 transition-all font-medium"
                      placeholder="Mavzu sarlavhasi (masalan: Tabiat haqida)"
                      value={newText.title}
                      onChange={e => setNewText({ ...newText, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Matn tarkibi</label>
                    <textarea
                      id="text-content-input"
                      required
                      rows={8}
                      className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-xl focus:border-cyan-500 outline-none text-white placeholder-zinc-700 transition-all resize-none font-mono leading-relaxed"
                      placeholder="Ushbu matnni o'quvchilar yozishadi..."
                      value={newText.content}
                      onChange={e => setNewText({ ...newText, content: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Vaqt chegarasi (daqiqa)</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-xl focus:border-cyan-500 outline-none text-white placeholder-zinc-700 transition-all font-medium"
                      placeholder="0 = vaqt cheklanmagan"
                      value={newText.duration}
                      onChange={e => setNewText({ ...newText, duration: Number(e.target.value) })}
                    />
                    <p className="text-xs text-zinc-600 ml-1">0 qo'ysangiz — vaqt cheklanmaydi</p>
                  </div>
                  <div className="flex gap-4 pt-6">
                    <button
                      id="cancel-add-btn"
                      type="button"
                      onClick={closeAndResetModal}
                      className="flex-1 py-4 bg-zinc-900 text-zinc-400 rounded-xl font-bold hover:bg-zinc-800 transition-colors border border-zinc-800"
                    >
                      Bekor qilish
                    </button>
                    <button
                      id="save-text-btn"
                      type="submit"
                      className="flex-1 py-4 bg-cyan-600 text-white rounded-xl font-bold hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-900/20 active:scale-[0.98]"
                    >
                      {editingId ? 'Saqlash' : 'Saqlash va yaratish'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminDashboard;
