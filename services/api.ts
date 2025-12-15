import { User, DiaryEntry, Comment } from '../types';

// Constants for LocalStorage
const STORAGE_KEYS = {
  USER_SESSION: 'jiantu_session',
  DIARIES: 'jiantu_diaries',
};

// Simulate Network Latency (ms)
const NETWORK_DELAY = 800;

// Default / Seed Data
const SEED_DIARIES: DiaryEntry[] = [
  {
    id: '1',
    author: { name: 'Sarah Chen', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d', isCurrentUser: false },
    title: 'Hidden Gems in Beijing Hutongs',
    content: 'Spent the afternoon getting lost in the winding alleys near the Drum Tower. Found a tiny coffee shop that serves the best hand-drip brew. The juxtaposition of old grey bricks and modern lifestyle is fascinating.',
    location: 'Beijing, Dongcheng',
    date: '2023-10-15',
    imageUrl: 'https://images.unsplash.com/photo-1603206240216-29729a43a759?auto=format&fit=crop&q=80&w=800',
    likes: 124,
    isLiked: false,
    comments: [
      { id: 'c1', author: { name: 'David Li', avatar: 'https://i.pravatar.cc/150?u=david' }, content: 'I know exactly where this is! Love that spot.', date: '2023-10-15' }
    ],
    tags: ['Deep Explorer', 'Culture']
  },
  {
    id: '2',
    author: { name: 'Mike Ross', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', isCurrentUser: false },
    title: 'Efficiency Run: Great Wall',
    content: 'Managed to beat the crowds at Mutianyu by arriving at 7 AM. The morning mist over the wall was absolutely magical. Took the toboggan down - highly recommended!',
    location: 'Mutianyu Great Wall',
    date: '2023-10-12',
    imageUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&q=80&w=800',
    likes: 89,
    isLiked: true,
    comments: [],
    tags: ['Efficiency Planner', 'Hiking']
  }
];

// --- Internal "Database" Helpers ---
const db = {
  getDiaries: (): DiaryEntry[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.DIARIES);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.DIARIES, JSON.stringify(SEED_DIARIES));
      return SEED_DIARIES;
    }
    return JSON.parse(stored);
  },
  saveDiaries: (diaries: DiaryEntry[]) => {
    localStorage.setItem(STORAGE_KEYS.DIARIES, JSON.stringify(diaries));
  },
  getUser: (): User | null => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
    return stored ? JSON.parse(stored) : null;
  },
  saveUser: (user: User) => {
    localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(user));
  },
  clearUser: () => {
    localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
  }
};

// Helper to simulate async network call
const delay = <T>(data: T): Promise<T> => {
  return new Promise(resolve => {
    setTimeout(() => resolve(data), NETWORK_DELAY);
  });
};

// --- API Service Layer ---
export const api = {
  auth: {
    login: async (email: string, name: string): Promise<User> => {
      // Simulate backend logic: generate token/user
      const user: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: name || 'Traveler',
        email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Traveler')}&background=0ea5e9&color=fff`,
        persona: 'Free Spirit', // Default
        stats: { tripsPlanned: 0, placesVisited: 0, kmTraveled: 0 }
      };
      db.saveUser(user);
      return delay(user);
    },
    logout: async (): Promise<void> => {
      db.clearUser();
      return delay(undefined);
    },
    getSession: async (): Promise<User | null> => {
      // Check if user is already logged in (persist session)
      return delay(db.getUser());
    },
    updateProfile: async (user: User): Promise<User> => {
        db.saveUser(user);
        return delay(user);
    }
  },

  diaries: {
    list: async (): Promise<DiaryEntry[]> => {
      return delay(db.getDiaries());
    },
    
    create: async (entry: DiaryEntry): Promise<DiaryEntry> => {
      const current = db.getDiaries();
      const updated = [entry, ...current];
      db.saveDiaries(updated);
      return delay(entry);
    },

    like: async (diaryId: string, userId: string): Promise<{ id: string, likes: number, isLiked: boolean }> => {
        // In a real DB, we would have a Likes table. Here we toggle on the object.
        const current = db.getDiaries();
        let result = { id: diaryId, likes: 0, isLiked: false };

        const updated = current.map(d => {
            if (d.id === diaryId) {
                const newIsLiked = !d.isLiked; // Toggle logic
                const newLikes = newIsLiked ? d.likes + 1 : d.likes - 1;
                result = { id: diaryId, likes: newLikes, isLiked: newIsLiked };
                return { ...d, isLiked: newIsLiked, likes: newLikes };
            }
            return d;
        });
        db.saveDiaries(updated);
        return delay(result);
    },

    comment: async (diaryId: string, comment: Comment): Promise<Comment> => {
        const current = db.getDiaries();
        const updated = current.map(d => {
            if (d.id === diaryId) {
                return { ...d, comments: [...d.comments, comment] };
            }
            return d;
        });
        db.saveDiaries(updated);
        return delay(comment);
    }
  }
};