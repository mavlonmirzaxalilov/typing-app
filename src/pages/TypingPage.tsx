import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { databases, APPWRITE_CONFIG, ID } from '../lib/appwrite';
import { Query } from 'appwrite';
import { TypingText } from '../types';
import { useAuth } from '../hooks/useAuth';
import { ChevronLeft, RefreshCw, Trophy, Zap, Target, Loader2, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const TypingPage: React.FC = () => {
  const { textId } = useParams<{ textId: string }>();
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  
  const [text, setText] = useState<TypingText | null>(null);
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [results, setResults] = useState<{ wpm: number; accuracy: number } | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timeExpired, setTimeExpired] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!textId || !APPWRITE_CONFIG.databaseId || !APPWRITE_CONFIG.collections.texts) return;
      try {
        const response = await databases.getDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.texts,
          textId
        );
        setText({ id: response.$id, ...response } as unknown as TypingText);

        if (user && APPWRITE_CONFIG.collections.results) {
          const existing = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.results,
            [
              Query.equal('userId', user.$id),
              Query.equal('textId', textId),
            ]
          );
          if (existing.total > 0) {
            const prev = existing.documents[0];
            setResults({ wpm: prev.wpm, accuracy: prev.accuracy });
            setAlreadyCompleted(true);
            setIsFinished(true);
          }
        }
      } catch (error) {
        console.error('Error fetching text:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [textId, user]);

  useEffect(() => {
    if (!startTime || !text?.duration || text.duration === 0) return;

    const totalSeconds = text.duration * 60;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = totalSeconds - elapsed;

      if (remaining <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        setTimeExpired(true);
        if (!isFinished) {
          finishTest(userInput);
        }
      } else {
        setTimeLeft(Math.ceil(remaining));
      }
    }, 500);

    return () => clearInterval(interval);
  }, [startTime, text, isFinished]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isFinished) return;
    
    const value = e.target.value;
    
    if (!startTime && value.length > 0) {
      setStartTime(Date.now());
    }
    
    setUserInput(value);
    
    if (text && value.length >= text.content.length) {
      finishTest(value);
    }
  };

  const finishTest = useCallback(async (finalInput: string) => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    if (!startTime || !text || !profile || !user || !APPWRITE_CONFIG.databaseId || !APPWRITE_CONFIG.collections.results) return;
    
    const now = Date.now();
    setEndTime(now);
    setIsFinished(true);
    
    const timeInSeconds = (now - startTime) / 1000;
    const timeInMinutes = timeInSeconds / 60;
    const charCount = finalInput.length;

    const errors = finalInput.split('').filter((char, i) => char !== text.content[i]).length;
    const grossWpm = (charCount / 5) / timeInMinutes;
    const netWpm = Math.max(0, Math.round(grossWpm - (errors / timeInMinutes)));
    const correctChars = charCount - errors;
    const accuracy = Math.round((correctChars / text.content.length) * 100);
    
    setResults({ wpm: netWpm, accuracy });
    setSaving(true);
    
    try {
      await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.results,
        ID.unique(),
        {
          userId: user.$id,
          textId: text.id,
          wpm: netWpm,
          accuracy,
          completedAt: now,
          userName: profile.name,
          userSurname: profile.surname,
          branch: profile.branch || 'Noma\'lum',
          ageCategory: profile.ageCategory || 'Noma\'lum'
        }
      );
    } catch (err) {
      console.error('Error saving result:', err);
    } finally {
      setSaving(false);
    }
  }, [startTime, text, profile, user]);

  const resetTest = () => {
    setUserInput('');
    setStartTime(null);
    setEndTime(null);
    setIsFinished(false);
    setResults(null);
    setTimeLeft(null);
    setTimeExpired(false);
    hasSubmittedRef.current = false;
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const renderText = () => {
    if (!text) return null;
    return text.content.split('').map((char, i) => {
      let color = 'text-zinc-600';
      if (i < userInput.length) {
        color = userInput[i] === char ? 'text-green-500' : 'text-red-500 bg-red-950/30';
      } else if (i === userInput.length) {
        color = 'text-white border-b-2 border-cyan-500 animate-pulse';
      }
      return (
        <span key={i} className={`${color} transition-colors duration-150`}>
          {char}
        </span>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0B]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (!text) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0A0B] p-4">
        <h1 className="text-2xl font-bold text-white mb-4">Matn topilmadi</h1>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-cyan-600 text-white rounded-xl">Qaytish</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col min-h-screen">
        <header className="flex justify-between items-center mb-12">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 text-zinc-500 hover:text-zinc-200 transition-colors group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back
          </button>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase">Live Tracking</span>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {!isFinished ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key="typing"
              className="flex-1 flex flex-col"
            >
              <div className="mb-6">
                <h2 className="text-[10px] text-zinc-600 uppercase tracking-[0.4em] mb-2 font-black text-center">Active Challenge</h2>
                <h1 className="text-3xl font-bold text-white text-center tracking-tight">{text.title}</h1>
              </div>

              {/* Timer — sarlavha va matn orasida */}
              {text.duration && text.duration > 0 && startTime && (
                <div className="flex justify-center mb-6">
                  <span className={`text-5xl font-mono font-bold tracking-tighter ${
                    timeLeft !== null && timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-cyan-400'
                  }`}>
                    {timeLeft !== null ? timeLeft : text.duration * 60}
                    <span className="text-xl text-zinc-600 ml-2">s</span>
                  </span>
                </div>
              )}
              
              <div 
                className="flex-1 relative p-12 bg-zinc-900/40 rounded-[40px] border border-zinc-800 shadow-2xl font-mono text-3xl leading-relaxed text-justify mb-12 select-none overflow-y-auto"
                onClick={() => inputRef.current?.focus()}
              >
                {renderText()}
                <textarea
                  id="typing-input"
                  ref={inputRef}
                  autoFocus
                  className="absolute inset-0 opacity-0 cursor-default resize-none"
                  value={userInput}
                  onChange={handleInputChange}
                  disabled={isFinished}
                  spellCheck={false}
                  autoComplete="off"
                  autoCapitalize="off"
                />
              </div>

              <footer className="h-28 bg-[#0F0F12] border border-zinc-800 rounded-3xl flex items-center px-12 gap-16 mb-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1 bg-cyan-600 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-300" style={{ width: `${Math.round((userInput.length / text.content.length) * 100)}%` }}></div>
                
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-zinc-500 tracking-widest mb-1 font-black">Progress</span>
                  <span className="text-3xl font-mono font-bold text-white tracking-tighter">
                    {Math.round((userInput.length / text.content.length) * 100)}<span className="text-sm text-zinc-600 ml-1">%</span>
                  </span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-zinc-500 tracking-widest mb-1 font-black">Characters</span>
                  <span className="text-3xl font-mono font-bold text-white tracking-tighter">
                    {userInput.length} <span className="text-sm text-zinc-600">/ {text.content.length}</span>
                  </span>
                </div>

                <div className="flex-1"></div>

                <div className="flex items-center gap-4">
                  <button 
                    onClick={resetTest}
                    className="p-4 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-2xl hover:text-white hover:border-zinc-700 transition-all active:scale-95"
                  >
                    <RefreshCw className="w-6 h-6" />
                  </button>
                </div>
              </footer>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              key="results"
              className="max-w-2xl mx-auto py-12 w-full"
            >
              <div className="bg-[#0F0F12] p-12 rounded-[50px] shadow-2xl border border-zinc-800 text-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600" />
                
                <div className="w-24 h-24 bg-cyan-600/10 border border-cyan-500/20 rounded-3xl flex items-center justify-center mx-auto mb-10 rotate-3 shadow-[0_0_40px_rgba(6,182,212,0.1)]">
                  {alreadyCompleted
                    ? <Lock className="w-12 h-12 text-cyan-500 -rotate-3" />
                    : <Trophy className="w-12 h-12 text-cyan-500 -rotate-3" />
                  }
                </div>
                
                {alreadyCompleted ? (
                  <>
                    <h2 className="text-4xl font-black text-white mb-3 tracking-tight">Allaqachon yozgansiz!</h2>
                    <p className="text-zinc-500 mb-12 font-medium tracking-tight uppercase text-xs tracking-[0.2em]">Bu matn faqat 1 marta yoziladi</p>
                  </>
                ) : timeExpired ? (
                  <>
                    <h2 className="text-4xl font-black text-white mb-3 tracking-tight">Vaqt tugadi!</h2>
                    <p className="text-amber-400 mb-12 font-medium tracking-tight uppercase text-xs tracking-[0.2em]">⏱ Natijangiz saqlandi</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-4xl font-black text-white mb-3 tracking-tight">Challenge Completed!</h2>
                    <p className="text-zinc-500 mb-12 font-medium tracking-tight uppercase text-xs tracking-[0.2em]">Your stats have been synchronized</p>
                  </>
                )}
                
                <div className="grid grid-cols-2 gap-8 mb-12">
                  <div className="bg-zinc-950 p-10 rounded-[32px] border border-zinc-800 text-left relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Zap className="w-16 h-16 text-cyan-500" />
                    </div>
                    <Zap className="w-6 h-6 text-cyan-500 mb-6" />
                    <div className="text-5xl font-mono font-bold text-white mb-1 tracking-tighter">{results?.wpm}</div>
                    <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Net WPM</div>
                  </div>
                  <div className="bg-zinc-950 p-10 rounded-[32px] border border-zinc-800 text-left relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Target className="w-16 h-16 text-green-500" />
                    </div>
                    <Target className="w-6 h-6 text-green-500 mb-6" />
                    <div className="text-5xl font-mono font-bold text-white mb-1 tracking-tighter">{results?.accuracy}<span className="text-2xl ml-1">%</span></div>
                    <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Accuracy</div>
                  </div>
                </div>

                <button
                  id="finish-btn"
                  onClick={() => navigate('/')}
                  className="w-full py-5 bg-cyan-600 text-white rounded-2xl font-bold hover:bg-cyan-500 transition-all shadow-xl shadow-cyan-900/20 active:scale-[0.98]"
                >
                  Bosh sahifaga
                </button>

                {saving && (
                  <div className="mt-8 flex items-center justify-center gap-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-500" /> Data Synchronizing...
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TypingPage;
