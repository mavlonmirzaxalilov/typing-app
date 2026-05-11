import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Keyboard, LogOut, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  const { profile, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-[#0F0F12]/80 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-4">
            <div className="w-10 h-10 bg-cyan-600 rounded flex items-center justify-center font-bold text-xl text-white">V</div>
            <span className="font-semibold tracking-tight text-zinc-100 hidden sm:block text-xl">
              ValiTeach <span className="text-cyan-500">TypingMaster</span>
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase">Real-time Sync</span>
            </div>

            <div className="h-8 w-[1px] bg-zinc-800 hidden md:block"></div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-zinc-200">
                  {profile?.name} {profile?.surname}
                </span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">
                  {profile?.role === 'admin' ? 'Admin Dashboard' : `${profile?.branch} Filiali`}
                </span>
              </div>
              
              <button
                id="logout-btn"
                onClick={() => logout()}
                className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                title="Chiqish"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
