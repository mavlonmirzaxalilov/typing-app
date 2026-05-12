import React, { useState,useEffect } from 'react';
import { account, databases, APPWRITE_CONFIG, ID } from '../lib/appwrite';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import { motion } from 'motion/react';
import { User, MapPin, Calendar, Lock, Phone, Loader2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const { checkSession, user } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>('user');
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    phone: '',
    password: '',
    branch: '',
    ageCategory: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const branches = ['Toshkent', 'Samarqand', 'Buxoro', 'Namangan', 'Andijon', 'Farg\'ona', 'Qarshi', 'Nukus', 'Xiva'];
  const ageCategories = ['7-10 yosh', '11-14 yosh', '15-18 yosh', '19+ yosh'];

  // Telefon raqamdan fake email yaratish
  const phoneToEmail = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return `${digits}@valiteach.uz`;
  };
useEffect(() => {
  if (user) navigate('/');
}, [user]);

  // Telefon raqam formatlash — faqat raqam kiritishga ruxsat
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d+\s()-]/g, '');
    setFormData({ ...formData, phone: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!APPWRITE_CONFIG.databaseId || !APPWRITE_CONFIG.collections.users) {
      alert('Tizim sozlanmagan (Appwrite config missing)');
      return;
    }

    const digits = formData.phone.replace(/\D/g, '');
    if (digits.length < 9) {
      alert('Telefon raqam noto\'g\'ri kiritildi');
      return;
    }

    setSubmitting(true);
    try {
      const userId = ID.unique();
      const fakeEmail = phoneToEmail(formData.phone);

      // 1. Appwrite account yaratish
      await account.create(
        userId,
        fakeEmail,
        formData.password,
        `${formData.name} ${formData.surname}`
      );

      // 2. Session ochish
      await account.createEmailPasswordSession(fakeEmail, formData.password);

      // 3. Profil yaratish
      const profileData = {
        uid: userId,
        name: formData.name,
        surname: formData.surname,
        role: role,
        email: formData.phone, // email field da telefon raqam saqlanadi
        createdAt: Date.now(),
        branch: role === 'user' ? formData.branch : '',
        ageCategory: role === 'user' ? formData.ageCategory : ''
      };

      await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.users,
        userId,
        profileData
      );

      await checkSession();
      navigate('/');
    } catch (error: any) {
      console.error('Error during registration:', error);
      alert('Ro\'yxatdan o\'tishda xatolik: ' + (error.message || 'Xatolik'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-[#0A0A0B]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg p-10 bg-[#0F0F12] rounded-2xl shadow-2xl border border-zinc-800"
      >
        <div className="flex items-center justify-between mb-8">
          <Link to="/login" className="p-2 text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">Ro'yxatdan o'tish</h1>
          <div className="w-9" />
        </div>
        
        <div className="flex p-1 bg-zinc-950 rounded-xl mb-8 border border-zinc-800">
          <button
            type="button"
            onClick={() => setRole('user')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${role === 'user' ? 'bg-cyan-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            O'quvchi
          </button>
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${role === 'admin' ? 'bg-cyan-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                <User className="w-3.5 h-3.5 text-cyan-500/50" /> Ism
              </label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-xl focus:border-cyan-500 outline-none transition-all text-white placeholder-zinc-700"
                placeholder="Ismingiz"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                <User className="w-3.5 h-3.5 text-cyan-500/50" /> Familiya
              </label>
              <input
                required
                type="text"
                value={formData.surname}
                onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-xl focus:border-cyan-500 outline-none transition-all text-white placeholder-zinc-700"
                placeholder="Familiyangiz"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 ml-1">
              <Phone className="w-3.5 h-3.5 text-cyan-500/50" /> Telefon raqam
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                required
                type="tel"
                value={formData.phone}
                onChange={handlePhoneChange}
                className="w-full pl-12 pr-4 p-4 bg-zinc-950 border border-zinc-800 rounded-xl focus:border-cyan-500 outline-none transition-all text-white placeholder-zinc-700 text-sm"
                placeholder="+998 90 123 45 67"
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
                required
                type="password"
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-12 pr-4 p-4 bg-zinc-950 border border-zinc-800 rounded-xl focus:border-cyan-500 outline-none transition-all text-white placeholder-zinc-700 text-sm"
                placeholder="Kamida 8 ta belgi"
              />
            </div>
          </div>

          {role === 'user' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-500/50" /> Filial
                </label>
                <select
                  required
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-xl focus:border-cyan-500 outline-none transition-all text-white appearance-none cursor-pointer"
                >
                  <option value="" className="bg-zinc-950">Tanlang</option>
                  {branches.map(b => <option key={b} value={b} className="bg-zinc-950">{b}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <Calendar className="w-3.5 h-3.5 text-cyan-500/50" /> Yosh
                </label>
                <select
                  required
                  value={formData.ageCategory}
                  onChange={(e) => setFormData({ ...formData, ageCategory: e.target.value })}
                  className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-xl focus:border-cyan-500 outline-none transition-all text-white appearance-none cursor-pointer"
                >
                  <option value="" className="bg-zinc-950">Tanlang</option>
                  {ageCategories.map(c => <option key={c} value={c} className="bg-zinc-950">{c}</option>)}
                </select>
              </div>
            </div>
          )}

          <button
            disabled={submitting}
            type="submit"
            className="w-full h-14 bg-cyan-600 text-white rounded-xl font-bold hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-900/20 mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ro\'yxatdan o\'tish'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;
