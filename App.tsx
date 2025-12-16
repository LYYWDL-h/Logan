import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import TravelDiaries from './pages/TravelDiaries';
import AIChat from './components/AIChat';
import { ViewState, User, DiaryEntry, Comment } from './types';
import { api } from './services/api';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  // Global State
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [user, setUser] = useState<User | null>(null);
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [loadingDiaries, setLoadingDiaries] = useState(false);

  // --- Initialization ---
  useEffect(() => {
    const initApp = async () => {
      try {
        const sessionUser = await api.auth.getSession();
        if (sessionUser) {
          setUser(sessionUser);
          setIsLoggedIn(true);
          fetchDiaries(); // Prefetch diaries
        }
      } catch (e) {
        console.error("Session check failed", e);
      } finally {
        setIsInitializing(false);
      }
    };
    initApp();
  }, []);

  // --- Data Fetching ---
  const fetchDiaries = async () => {
    setLoadingDiaries(true);
    try {
        const data = await api.diaries.list();
        setDiaries(data);
    } catch (e) {
        console.error("Failed to fetch diaries", e);
    } finally {
        setLoadingDiaries(false);
    }
  };

  // --- Event Handlers (Controller Layer) ---

  const handleLogin = async (email: string, name: string) => {
    try {
        const user = await api.auth.login(email, name);
        setUser(user);
        setIsLoggedIn(true);
        fetchDiaries();
    } catch (e) {
        console.error("Login failed", e);
    }
  };

  const handleLogout = async () => {
    await api.auth.logout();
    setIsLoggedIn(false);
    setCurrentView(ViewState.DASHBOARD);
    setUser(null);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    // Optimistic update
    setUser(updatedUser);
    await api.auth.updateProfile(updatedUser);
  };

  const handleAddDiary = async (newEntry: DiaryEntry) => {
    // Optimistic UI update could go here, but for simplicity we await
    try {
        await api.diaries.create(newEntry);
        // Re-fetch to ensure sync with "server"
        await fetchDiaries(); 
        // Or manually prepend: setDiaries(prev => [newEntry, ...prev]);
    } catch (e) {
        console.error("Failed to create diary", e);
    }
  };

  const handleLikeDiary = async (diaryId: string) => {
    if (!user) return;
    
    // Optimistic Update
    setDiaries(prev => prev.map(d => {
        if (d.id === diaryId) {
            const newLiked = !d.isLiked;
            return { ...d, isLiked: newLiked, likes: newLiked ? d.likes + 1 : d.likes - 1 };
        }
        return d;
    }));

    // Background API call
    try {
        await api.diaries.like(diaryId, user.id);
    } catch (e) {
        console.error("Like failed, rolling back", e);
        // Rollback logic would go here
        fetchDiaries();
    }
  };

  const handleAddComment = async (diaryId: string, content: string) => {
    if (!user) return;

    const newComment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      author: { name: user.name, avatar: user.avatar },
      content,
      date: new Date().toLocaleDateString()
    };

    // Optimistic Update
    setDiaries(prev => prev.map(d => {
        if (d.id === diaryId) {
            return { ...d, comments: [...d.comments, newComment] };
        }
        return d;
    }));

    // API Call
    try {
        await api.diaries.comment(diaryId, newComment);
    } catch (e) {
        console.error("Comment failed", e);
    }
  };

  // --- Render ---

  if (isInitializing) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-brand-50">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          </div>
      );
  }

  if (!isLoggedIn || !user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative">
      <Navigation
        user={user}
        currentView={currentView}
        onChangeView={setCurrentView}
        onLogout={handleLogout}
      />
      <main>
        {currentView === ViewState.DASHBOARD && <Dashboard user={user} />}
        
        {currentView === ViewState.DIARIES && (
          <div className="relative">
             {loadingDiaries && diaries.length === 0 && (
                 <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                     <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
                 </div>
             )}
             <TravelDiaries 
                user={user} 
                diaries={diaries} 
                onAddDiary={handleAddDiary} 
                onLike={handleLikeDiary}
                onComment={handleAddComment}
            />
          </div>
        )}
        
        {currentView === ViewState.PROFILE && <Profile user={user} onUpdateUser={handleUpdateUser} />}
      </main>

      {/* Floating AI Chat Widget */}
      <AIChat user={user} />
    </div>
  );
};

export default App;