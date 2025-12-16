import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Settings, MessageSquare, Loader2, Minimize2, Trash2, Sparkles, Maximize2 } from 'lucide-react';
import { ChatMessage, User } from '../types';

interface AIChatProps {
  user: User;
}

const AIChat: React.FC<AIChatProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  // Default messages
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `你好 ${user.name}！我是您的简途 AI 旅行助手。我可以帮您规划行程、推荐景点或回答旅行相关的问题。`,
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [apiToken, setApiToken] = useState('');
  const [botId, setBotId] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Load settings from local storage
  useEffect(() => {
    const savedToken = localStorage.getItem('coze_token');
    const savedBotId = localStorage.getItem('coze_bot_id');
    if (savedToken) setApiToken(savedToken);
    if (savedBotId) setBotId(savedBotId);
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem('coze_token', apiToken);
    localStorage.setItem('coze_bot_id', botId);
    setShowSettings(false);
  };

  const clearHistory = () => {
    setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `你好 ${user.name}！我是您的简途 AI 旅行助手。`,
          timestamp: Date.now()
        }
    ]);
  };

  // Helper to wait
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // --- Core Message Sending Logic ---
  const sendMessageToCoze = async (content: string) => {
    if (isLoading) return;

    if (!apiToken || !botId) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        content: '请先点击右上角设置图标，配置您的 Coze API Token 和 Bot ID。',
        timestamp: Date.now()
      }]);
      setShowSettings(true);
      return;
    }

    // Add User Message to UI
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // 1. Initiate Chat
      const chatResponse = await fetch('https://api.coze.cn/v3/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bot_id: botId,
          user_id: user.id,
          stream: false,
          auto_save_history: true,
          additional_messages: [
            {
              role: 'user',
              content: content,
              content_type: 'text'
            }
          ]
        })
      });

      if (!chatResponse.ok) {
        throw new Error('发送消息失败，请检查 Token 或 Bot ID');
      }

      const chatData = await chatResponse.json();
      if (chatData.code !== 0) throw new Error(chatData.msg || 'API Error');

      const conversationId = chatData.data.conversation_id;
      const chatId = chatData.data.id;
      let status = chatData.data.status;

      // 2. Poll for completion
      let attempts = 0;
      while (status === 'in_progress' && attempts < 40) { // Timeout after ~40s
        await wait(1000); 
        attempts++;

        const retrieveResponse = await fetch(`https://api.coze.cn/v3/chat/retrieve?chat_id=${chatId}&conversation_id=${conversationId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const retrieveData = await retrieveResponse.json();
        if (retrieveData.code === 0) {
            status = retrieveData.data.status;
            if (status === 'failed' || status === 'requires_action') {
                throw new Error(`智能体处理失败: ${retrieveData.data.last_error?.msg || status}`);
            }
        }
      }

      if (status !== 'completed') {
        throw new Error('等待响应超时');
      }

      // 3. Get the generated messages
      const listResponse = await fetch(`https://api.coze.cn/v3/chat/message/list?chat_id=${chatId}&conversation_id=${conversationId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
        }
      });

      const listData = await listResponse.json();
      
      if (listData.code === 0 && listData.data) {
         const aiMessages = listData.data.filter((m: any) => m.role === 'assistant' && m.type === 'answer');
         
         if (aiMessages.length > 0) {
             aiMessages.forEach((m: any) => {
                 setMessages(prev => [...prev, {
                    id: m.id,
                    role: 'assistant',
                    content: m.content,
                    timestamp: m.created_at * 1000
                 }]);
             });
         } else {
             setMessages(prev => [...prev, {
                 id: Date.now().toString(),
                 role: 'system',
                 content: '智能体已完成处理，但未返回文本内容。',
                 timestamp: Date.now()
             }]);
         }
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: `出错啦: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handlers ---

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const text = inputValue;
    setInputValue(''); // Clear input immediately
    sendMessageToCoze(text);
  };

  const handleGenerateFromBio = () => {
    if (!user.bio) {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: '您的个人简介(Bio)是空的。请先去“个人中心”填写您的心情或简介，我才能为您定制行程哦！',
            timestamp: Date.now()
        }]);
        return;
    }
    
    // Construct the prompt
    const prompt = `我现在的个人简介/心情是：“${user.bio}”。我的旅行画像是“${user.persona}”。请根据这些信息，直接为我生成一条适合今天的单日旅行路线规划。`;
    sendMessageToCoze(prompt);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-brand-600 hover:bg-brand-700 text-white p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 z-[100] flex items-center justify-center group"
      >
        <Bot className="w-8 h-8" />
        <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          AI 旅行助手
        </span>
      </button>
    );
  }

  // Responsive: Fixed full screen on mobile, Widget on desktop (sm)
  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 w-full h-full sm:w-96 sm:h-[600px] bg-white sm:rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-[100] overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="bg-brand-600 p-4 flex justify-between items-center text-white shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6" />
          <h3 className="font-bold">简途 AI 助手</h3>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleGenerateFromBio} 
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors bg-white/10" 
            title="✨ 根据简介一键生成行程"
          >
            <Sparkles className="w-5 h-5 text-yellow-300 fill-current" />
          </button>
          <div className="w-px h-4 bg-white/20 mx-1"></div>
          <button onClick={clearHistory} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="清空对话">
            <Trash2 className="w-5 h-5" />
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="设置 API">
            <Settings className="w-5 h-5" />
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-50 p-4 border-b border-gray-200 shrink-0 animate-in slide-in-from-top-2">
          <h4 className="text-sm font-bold text-gray-700 mb-3">API 配置 (Coze.cn)</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Coze Token (pat_...)</label>
              <input 
                type="password" 
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                className="w-full text-xs p-2 border rounded"
                placeholder="在此粘贴您的 Token"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bot ID</label>
              <input 
                type="text" 
                value={botId}
                onChange={(e) => setBotId(e.target.value)}
                className="w-full text-xs p-2 border rounded"
                placeholder="输入智能体 ID"
              />
            </div>
            <button 
              onClick={handleSaveSettings}
              className="w-full bg-brand-500 text-white text-xs py-2 rounded hover:bg-brand-600"
            >
              保存配置
            </button>
            <p className="text-[10px] text-gray-400">
              * Token 仅保存在本地浏览器中，请勿泄露。
            </p>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm whitespace-pre-wrap ${
                msg.role === 'user' 
                  ? 'bg-brand-500 text-white rounded-tr-none' 
                  : msg.role === 'system'
                  ? 'bg-red-50 text-red-600 border border-red-100'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 border border-gray-100 shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
              <span className="text-xs text-gray-500">对方正在输入...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleFormSubmit} className="p-3 bg-white border-t border-gray-100 flex gap-2 shrink-0 safe-area-bottom">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={apiToken ? "问问旅行建议..." : "请先配置 API"}
          className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
        />
        <button 
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="bg-brand-600 text-white p-2.5 rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default AIChat;