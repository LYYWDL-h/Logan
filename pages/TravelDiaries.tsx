import React, { useState } from 'react';
import { User, DiaryEntry } from '../types';
import { PenTool, MapPin, Calendar, Heart, Image as ImageIcon, Send, X, MessageCircle } from 'lucide-react';

interface TravelDiariesProps {
  user: User;
  diaries: DiaryEntry[];
  onAddDiary: (entry: DiaryEntry) => void;
  onLike: (diaryId: string) => void;
  onComment: (diaryId: string, content: string) => void;
}

// Sub-component to handle individual diary card logic (comment state)
const DiaryCard: React.FC<{ 
  entry: DiaryEntry; 
  onLike: (id: string) => void; 
  onComment: (id: string, text: string) => void 
}> = ({ entry, onLike, onComment }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onComment(entry.id, commentText);
    setCommentText('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Author Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-50">
        <div className="flex items-center gap-3">
          <img src={entry.author.avatar} alt={entry.author.name} className="w-10 h-10 rounded-full border border-gray-200" />
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{entry.author.name}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{entry.date}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-brand-600">
                <MapPin className="w-3 h-3" /> {entry.location}
              </span>
            </div>
          </div>
        </div>
        {entry.author.isCurrentUser && (
          <span className="bg-brand-50 text-brand-600 text-xs px-2 py-1 rounded-full font-medium">你</span>
        )}
      </div>

      {/* Content */}
      <div className="p-0">
        {entry.imageUrl && (
          <div className="w-full h-64 overflow-hidden bg-gray-100">
            <img src={entry.imageUrl} alt={entry.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-5">
          <h2 className="text-xl font-bold text-gray-800 mb-2">{entry.title}</h2>
          <p className="text-gray-600 leading-relaxed whitespace-pre-line">{entry.content}</p>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {entry.tags.map(tag => (
              <span key={tag} className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">#{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center gap-6">
        <button 
          onClick={() => onLike(entry.id)}
          className={`flex items-center gap-2 transition-colors group ${entry.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
        >
          <Heart className={`w-5 h-5 ${entry.isLiked ? 'fill-current' : 'group-hover:fill-current'}`} />
          <span className="text-sm font-medium">{entry.likes} 赞</span>
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-2 transition-colors ${showComments ? 'text-brand-600' : 'text-gray-500 hover:text-brand-600'}`}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{entry.comments.length} 评论</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="bg-gray-50 p-5 border-t border-gray-200">
          <div className="space-y-4 mb-4">
            {entry.comments.length === 0 ? (
              <p className="text-sm text-gray-400 italic">暂无评论，快来抢沙发！</p>
            ) : (
              entry.comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <img src={comment.author.avatar} alt={comment.author.name} className="w-8 h-8 rounded-full border border-gray-200 flex-shrink-0" />
                  <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm flex-1">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-bold text-xs text-gray-900">{comment.author.name}</span>
                      <span className="text-[10px] text-gray-400">{comment.date}</span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <form onSubmit={handleSubmitComment} className="flex gap-2">
             <input 
                type="text" 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="写下您的评论..."
                className="flex-1 rounded-full border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm py-2 px-4"
             />
             <button 
                type="submit"
                disabled={!commentText.trim()}
                className="bg-brand-600 text-white p-2 rounded-full hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
             >
                <Send className="w-4 h-4" />
             </button>
          </form>
        </div>
      )}
    </div>
  );
};

const TravelDiaries: React.FC<TravelDiariesProps> = ({ user, diaries, onAddDiary, onLike, onComment }) => {
  const [isWriting, setIsWriting] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newEntry: DiaryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      author: {
        name: user.name,
        avatar: user.avatar,
        isCurrentUser: true,
      },
      title,
      location,
      content,
      imageUrl: imageUrl || undefined,
      date: new Date().toLocaleDateString(),
      likes: 0,
      isLiked: false,
      comments: [],
      tags: ['Travel', user.persona]
    };

    onAddDiary(newEntry);
    
    // Reset and Close
    setTitle('');
    setLocation('');
    setContent('');
    setImageUrl('');
    setIsWriting(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">旅行日记</h1>
          <p className="text-gray-500 mt-1">分享您的旅程，发现他人的故事。</p>
        </div>
        <button
          onClick={() => setIsWriting(!isWriting)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md flex items-center gap-2 transition-all transform hover:scale-105"
        >
          {isWriting ? <X className="w-5 h-5" /> : <PenTool className="w-5 h-5" />}
          {isWriting ? '取消' : '写日记'}
        </button>
      </div>

      {/* Writing Form */}
      {isWriting && (
        <div className="bg-white rounded-2xl shadow-xl border border-brand-100 p-6 mb-8 animate-in slide-in-from-top-4 duration-300">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <PenTool className="w-5 h-5 text-brand-500" />
            新日记
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-2 border"
                  placeholder="我的...之旅"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">地点</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 pl-9 p-2 border"
                    placeholder="城市，地标..."
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">故事</label>
              <textarea
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-2 border resize-none"
                placeholder="今天发生了什么？"
              />
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">封面图片链接 (可选)</label>
               <div className="relative">
                  <ImageIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 pl-9 p-2 border"
                    placeholder="https://images.unsplash.com/..."
                  />
               </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-brand-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-700 flex items-center gap-2"
              >
                <Send className="w-4 h-4" /> 发布
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-6">
        {diaries.map((entry) => (
          <DiaryCard 
            key={entry.id} 
            entry={entry} 
            onLike={onLike} 
            onComment={onComment} 
          />
        ))}

        {diaries.length === 0 && (
           <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无日记。成为第一个分享旅程的人吧！</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default TravelDiaries;