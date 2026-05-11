import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { databases, client, APPWRITE_CONFIG } from '../lib/appwrite';
import { Query } from 'appwrite';
import { TypingText, TypingResult } from '../types';
import { useAuth } from '../hooks/useAuth';
import { Play, Trophy, History, ArrowRight, Loader2, Info, Keyboard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

const UserDashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const [activeText, setActiveText] = useState<TypingText | null>(null);
  const [myResults, setMyResults] = useState<TypingResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveText = async () => {
    if (!APPWRITE_CONFIG.databaseId || !APPWRITE_CONFIG.collections.texts) return;
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.texts,
        [Query.equal('isActive', [true]), Query.limit(1)]
      );
      if (response.documents.length > 0) {
        const doc = response.documents[0];
        setActiveText({ id: doc.$id, ...doc } as unknown as TypingText);
      } else {
        setActiveText(null);
      }
    } catch (error) {
      console.error('Error fetching active text:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyResults = async (userId: string) => {
    if (!APPWRITE_CONFIG.databaseId || !APPWRITE_CONFIG.collections.results) return;
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.results,
        [
          Query.equal('userId', [userId]),
          Query.orderDesc('completedAt'),
          Query.limit(10)
        ]
      );
      setMyResults(response.documents.map(doc => ({ id: doc.$id, ...doc } as unknown as TypingResult)));
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  useEffect(() => {
    fetchActiveText();

    // Subscribe to texts collection for updates
    const unsubscribe = client.subscribe(
      `databases.${APPWRITE_CONFIG.databaseId}.collections.${APPWRITE_CONFIG.collections.texts}.documents`,
      (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*.update') ||
            response.events.includes('databases.*.collections.*.documents.*.create')) {
          fetchActiveText();
        }
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchMyResults(user.$id);
  }, [user]);

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-14 space-y-2 text-center sm:text-left">
          <h1 className="text-4xl font-bold text-white tracking-tight">Xush kelibsiz, {profile?.name}!</h1>
          <div className="flex items-center justify-center sm:justify-start gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
            <p className="text-zinc-500 font-medium tracking-tight">Tayyor bo'lsangiz, bugungi musobaqani boshlang</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-12">
            {/* Active Contest Card */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Hozirda faol</h2>
              </div>
              
              {loading ? (
                <div className="bg-[#0F0F12] p-24 rounded-[40px] flex justify-center border border-zinc-800 shadow-2xl">
                  <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
                </div>
              ) : activeText ? (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0F0F12] p-12 rounded-[40px] border border-zinc-800 shadow-2xl relative overflow-hidden group border-cyan-900/30"
                >
                  <div className="absolute -top-12 -right-12 p-8 opacity-5 group-hover:opacity-10 transition-all duration-700 group-hover:scale-125">
                    <Keyboard className="w-64 h-64 text-cyan-500 rotate-12" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-900/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest rounded-full mb-6 border border-cyan-800/30">
                      Live Challenge
                    </div>
                    <h3 className="text-4xl font-bold text-white mb-6 tracking-tight leading-tight max-w-xl text-center sm:text-left">{activeText.title}</h3>
                    <p className="text-zinc-500 mb-10 max-w-lg leading-relaxed font-medium text-center sm:text-left">
                      Ushbu matnni maksimal tezlik va aniqlik bilan yozishga harakat qiling. Natijangiz avtomatik ravishda reytingga qo'shiladi.
                    </p>
                    <div className="flex justify-center sm:justify-start">
                      <Link
                        id="start-typing-btn"
                        to={`/typing/${activeText.id}`}
                        className="inline-flex items-center gap-4 px-10 py-5 bg-cyan-600 text-white rounded-2xl font-bold hover:bg-cyan-500 transition-all shadow-xl shadow-cyan-900/20 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Hoziroq boshlash <ArrowRight className="w-6 h-6" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-[#0F0F12] p-16 rounded-[40px] border border-dashed border-zinc-800 flex flex-col items-center text-center gap-6">
                  <div className="w-20 h-20 bg-zinc-950 rounded-full flex items-center justify-center border border-zinc-800">
                    <Info className="w-10 h-10 text-zinc-700" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-zinc-200 tracking-tight">Navbatdagi musobaqani kuting</h3>
                    <p className="text-zinc-600 max-w-xs mx-auto font-medium">Musobaqa boshlanishi bilan bu yerda yangi matn paydo bo'ladi.</p>
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className="lg:col-span-4 space-y-12">
            <section>
              <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-6">Oxirgi urinishlarim</h2>
              <div className="space-y-4">
                {myResults.length > 0 ? (
                  myResults.map(res => (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={res.id} 
                      className="bg-[#0F0F12] p-6 rounded-2xl border border-zinc-800 shadow-sm hover:border-zinc-700 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="px-2 py-0.5 bg-zinc-950 rounded text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-tighter border border-zinc-800">
                          {new Date(res.completedAt).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">
                          {res.accuracy}% Accuracy
                        </div>
                      </div>
                      <div className="flex items-end justify-between">
                        <div className="text-3xl font-mono font-bold text-white leading-none tracking-tighter">
                          {res.wpm} <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest ml-1">WPM</span>
                        </div>
                        <div className="w-16 h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                          <div 
                            className="h-full bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.5)]" 
                            style={{ width: `${Math.min(res.wpm, 100)}%` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="bg-zinc-950/40 p-10 rounded-2xl border border-dashed border-zinc-800 text-center">
                    <p className="text-xs text-zinc-600 font-medium italic">Hali natijalar mavjud emas</p>
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
