import React, { useState } from 'react';
import { account } from '../lib/appwrite';
import { Keyboard, LogIn, Mail, Lock, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
   const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await account.createEmailPasswordSession(email, password);
     await refreshProfile();          // session yangilash
      navigate('/');    
    } catch (error: any) {
      alert('Tizimga kirishda xatolik yuz berdi: ' + (error.message || 'Xatolik'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-[#0A0A0B]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-10 bg-[#0F0F12] rounded-2xl shadow-2xl border border-zinc-800"
      >
        <div className="flex items-center justify-center w-20 h-20 mx-auto mb-8 bg-cyan-600/10 rounded-2xl border border-cyan-600/20 shadow-[0_0_20px_rgba(8,145,178,0.1)]">
          <Keyboard className="w-10 h-10 text-cyan-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-center text-white mb-2 tracking-tight">ValiTeach <span className="text-cyan-500">Typing</span></h1>
        <p className="text-center text-zinc-500 mb-10 text-sm">Professional tez yozish musobaqasi platformasi</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 ml-1">
              <Mail className="w-3.5 h-3.5 text-cyan-500/50" /> Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.uz"
                className="w-full pl-12 pr-4 py-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 ml-1">
              <Lock className="w-3.5 h-3.5 text-cyan-500/50" /> Parol
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 transition-all text-sm"
              />
            </div>
          </div>
          
          <button
            id="login-btn"
            type="submit"
            disabled={loading}
            className="flex items-center justify-center w-full gap-3 py-4 px-4 bg-cyan-600 border border-cyan-500/50 rounded-xl font-bold text-white hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed group h-14 mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                Kirish
                <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-zinc-800/50 text-center">
          <p className="text-zinc-500 text-sm">
            Hisobingiz yo'qmi?{' '}
            <Link to="/register" className="text-cyan-500 font-medium hover:underline">
              Ro'yxatdan o'ting
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
