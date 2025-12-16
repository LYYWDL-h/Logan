import React, { useState, useEffect } from 'react';
import InteractiveMap from '../components/InteractiveMap';
import { Waypoint, RouteData, User, Place } from '../types';
import { fetchRoute, fetchOptimizedRoute, searchLocation } from '../services/osrmService';
import { MapPin, Navigation as NavIcon, Clock, MoveVertical, Trash2, PlusCircle, AlertCircle, ArrowUp, ArrowDown, Sparkles, Search, Compass, Star, Plus, FileText, GripVertical } from 'lucide-react';

// Mock Data for Recommendations
const RECOMMENDED_PLACES: Place[] = [
  { id: '1', name: '故宫博物院', category: '历史', lat: 39.9163, lng: 116.3972, rating: 4.9, price: 60, image: 'https://images.unsplash.com/photo-1599571234909-29ed5d1321d6?auto=format&fit=crop&q=80&w=300&h=200', tags: ['Deep Explorer', 'Efficiency Planner'] },
  { id: '2', name: '环球影城', category: '娱乐', lat: 39.8595, lng: 116.6661, rating: 4.7, price: 418, image: 'https://images.unsplash.com/photo-1533618840-7e30d66c1524?auto=format&fit=crop&q=80&w=300&h=200', tags: ['Free Spirit', 'Creative Traveler'] },
  { id: '3', name: '颐和园', category: '自然', lat: 39.9993, lng: 116.2753, rating: 4.8, price: 30, image: 'https://images.unsplash.com/photo-1546153673-a63e9f802148?auto=format&fit=crop&q=80&w=300&h=200', tags: ['Free Spirit', 'Deep Explorer'] },
  { id: '4', name: '798艺术区', category: '艺术', lat: 39.9839, lng: 116.4950, rating: 4.6, price: 0, image: 'https://images.unsplash.com/photo-1550951298-5c7b95a66b21?auto=format&fit=crop&q=80&w=300&h=200', tags: ['Creative Traveler', 'Free Spirit'] },
  { id: '5', name: '天坛', category: '历史', lat: 39.8822, lng: 116.4066, rating: 4.7, price: 15, image: 'https://images.unsplash.com/photo-1598418037309-84d72836214f?auto=format&fit=crop&q=80&w=300&h=200', tags: ['Deep Explorer'] },
  { id: '6', name: '三里屯太古里', category: '购物', lat: 39.9360, lng: 116.4549, rating: 4.5, price: 0, image: 'https://images.unsplash.com/photo-1555406059-42b7858c440a?auto=format&fit=crop&q=80&w=300&h=200', tags: ['Efficiency Planner', 'Free Spirit'] },
  { id: '7', name: '慕田峪长城', category: '冒险', lat: 40.4320, lng: 116.5629, rating: 4.9, price: 45, image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&q=80&w=300&h=200', tags: ['Deep Explorer', 'Creative Traveler'] },
];

const PERSONA_DISPLAY_MAP: Record<string, string> = {
  'Free Spirit': '自由灵魂',
  'Deep Explorer': '深度探索者',
  'Efficiency Planner': '效率规划师',
  'Creative Traveler': '创意旅行家'
};

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'itinerary' | 'explore'>('itinerary');
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Schedule state
  const [startTime, setStartTime] = useState("08:00");

  // Drag state
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  useEffect(() => {
    if (waypoints.length >= 2) {
      calculateRoute(waypoints);
    } else {
      setRouteData(null);
    }
  }, [waypoints.length]); 

  const handleMapClick = (lat: number, lng: number) => {
    addWaypoint(`地点 ${waypoints.length + 1}`, lat, lng);
  };

  const addWaypoint = (name: string, lat: number, lng: number) => {
    const newWaypoint: Waypoint = {
      id: Math.random().toString(36).substr(2, 9),
      lat,
      lng,
      name,
      duration: 60,
    };
    const newWaypoints = [...waypoints, newWaypoint];
    setWaypoints(newWaypoints);
    if (newWaypoints.length >= 2) {
         calculateRoute(newWaypoints);
    }
    // Switch back to itinerary view when adding
    setActiveTab('itinerary');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    const result = await searchLocation(searchQuery);
    setSearchLoading(false);

    if (result) {
      addWaypoint(result.name, result.lat, result.lng);
      setSearchQuery('');
    } else {
      setError('未找到该地点，请尝试其他名称。');
      setTimeout(() => setError(null), 3000);
    }
  };

  const removeWaypoint = (id: string) => {
    const newWaypoints = waypoints.filter((wp) => wp.id !== id);
    setWaypoints(newWaypoints);
    if (newWaypoints.length >= 2) {
        calculateRoute(newWaypoints);
    } else {
        setRouteData(null);
    }
  };

  const moveWaypoint = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === waypoints.length - 1)
    ) {
      return;
    }

    const newWaypoints = [...waypoints];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newWaypoints[index], newWaypoints[swapIndex]] = [newWaypoints[swapIndex], newWaypoints[index]];
    
    setWaypoints(newWaypoints);
    calculateRoute(newWaypoints);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Make the ghost image transparent or custom if needed
    // e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;

    // Perform the swap visually immediately
    const newWaypoints = [...waypoints];
    const draggedItem = newWaypoints[draggedItemIndex];
    
    // Remove dragged item
    newWaypoints.splice(draggedItemIndex, 1);
    // Insert at new index
    newWaypoints.splice(index, 0, draggedItem);

    setWaypoints(newWaypoints);
    setDraggedItemIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
    // Recalculate route after drop
    if (waypoints.length >= 2) {
        calculateRoute(waypoints);
    }
  };


  const updateWaypoint = (id: string, updates: Partial<Waypoint>) => {
    setWaypoints(waypoints.map(wp => wp.id === id ? { ...wp, ...updates } : wp));
  };

  const calculateRoute = async (currentWaypoints: Waypoint[]) => {
    if (currentWaypoints.length < 2) {
      setRouteData(null);
      return;
    }

    setLoading(true);
    setError(null);
    const data = await fetchRoute(currentWaypoints);
    setLoading(false);

    if (data) {
      setRouteData(data);
    } else {
      setError('无法计算这些点之间的路线。');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleSmartOptimize = async () => {
    if (waypoints.length < 3) {
      setError('请至少添加3个地点以进行优化。');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);
    
    const result = await fetchOptimizedRoute(waypoints);
    setLoading(false);

    if (result && 'sortedWaypoints' in result && result.sortedWaypoints) {
      setWaypoints(result.sortedWaypoints);
      if (result.routeData) {
        setRouteData(result.routeData);
      }
    } else if (result && 'error' in result) {
      setError(`优化失败: ${result.error}`);
      setTimeout(() => setError(null), 6000); // Show longer for readability
    } else {
      setError('优化失败，服务器可能繁忙。');
      setTimeout(() => setError(null), 4000);
    }
  };

  const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatTime = (minutesFromMidnight: number) => {
    let h = Math.floor(minutesFromMidnight / 60) % 24;
    let m = Math.floor(minutesFromMidnight % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Filter recommendations based on user persona
  const recommendedPlaces = RECOMMENDED_PLACES.sort((a, b) => {
    const aMatch = a.tags.includes(user.persona);
    const bMatch = b.tags.includes(user.persona);
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row bg-gray-50">
      {/* Sidebar Controls */}
      <div className="w-full md:w-[480px] bg-white border-r border-gray-200 flex flex-col shadow-xl z-20">
        
        {/* Search Bar Header */}
        <div className="p-4 border-b border-gray-100 bg-white">
             <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="搜索地点..." 
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500"></div>
                    </div>
                )}
             </form>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50/50">
            <button 
                onClick={() => setActiveTab('itinerary')}
                className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${activeTab === 'itinerary' ? 'text-brand-600 border-b-2 border-brand-500 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <MapPin className="w-4 h-4" /> 行程单
            </button>
            <button 
                onClick={() => setActiveTab('explore')}
                className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${activeTab === 'explore' ? 'text-brand-600 border-b-2 border-brand-500 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <Compass className="w-4 h-4" /> 探索
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50">
          
          {/* ITINERARY TAB */}
          {activeTab === 'itinerary' && (
              <div className="p-4">
                {/* Stats Header */}
                <div className="mb-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                         <div className="flex items-center gap-2 text-sm text-gray-700 font-bold">
                            <Clock className="w-4 h-4 text-brand-500" />
                            <span>出发时间:</span>
                            <input 
                                type="time" 
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="bg-gray-100 border-none p-1 rounded text-sm w-24 cursor-pointer"
                            />
                         </div>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500">
                         <div>距离: <span className="font-bold text-gray-800">{routeData ? (routeData.distance / 1000).toFixed(1) : 0} km</span></div>
                         <div>行程: <span className="font-bold text-gray-800">{routeData ? Math.round(routeData.duration / 60) : 0} 分钟</span></div>
                    </div>
                </div>

                {waypoints.length === 0 && (
                    <div className="text-center py-10 text-gray-400">
                        <PlusCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">点击地图或搜索添加地点</p>
                    </div>
                )}
                
                <div className="relative space-y-0">
                    {waypoints.length > 1 && <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-200 z-0"></div>}

                    {waypoints.map((wp, index) => {
                        let arrivalTime = parseTime(startTime);
                        let travelTime = 0;
                        if (index > 0 && routeData && routeData.legs[index - 1]) {
                            let accumulated = parseTime(startTime);
                            for (let i = 0; i < index; i++) {
                                accumulated += waypoints[i].duration;
                                if (routeData.legs[i]) accumulated += Math.round(routeData.legs[i].duration / 60);
                            }
                            arrivalTime = accumulated;
                            travelTime = Math.round(routeData.legs[index - 1].duration / 60);
                        }
                        const departureTime = arrivalTime + parseInt(wp.duration.toString());

                        return (
                            <div 
                              key={wp.id} 
                              className={`relative z-10 mb-4 transition-all duration-200 ${draggedItemIndex === index ? 'opacity-40 scale-95' : 'opacity-100'}`}
                              draggable
                              onDragStart={(e) => handleDragStart(e, index)}
                              onDragOver={(e) => handleDragOver(e, index)}
                              onDragEnd={handleDragEnd}
                            >
                                {index > 0 && (
                                    <div className="ml-14 mb-2 flex items-center gap-2 text-xs text-gray-500 font-medium">
                                        <MoveVertical className="w-3 h-3" />
                                        <span>路程 {travelTime} 分钟</span>
                                    </div>
                                )}
                                <div className="flex gap-3 items-start group">
                                    <div className="flex-shrink-0 w-12 flex flex-col items-center pt-1 cursor-grab active:cursor-grabbing hover:scale-105 transition-transform">
                                        <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-sm shadow ring-4 ring-white relative group-hover:ring-brand-100">
                                            <span className="group-hover:hidden">{index + 1}</span>
                                            <GripVertical className="hidden group-hover:block w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2 text-sm font-bold text-brand-700">
                                                <span>{formatTime(arrivalTime)}</span>
                                                <span className="text-gray-300">-</span>
                                                <span>{formatTime(departureTime)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => moveWaypoint(index, 'up')} disabled={index === 0} className="p-1 text-gray-300 hover:text-brand-600 disabled:opacity-0"><ArrowUp className="w-3 h-3" /></button>
                                                <button onClick={() => moveWaypoint(index, 'down')} disabled={index === waypoints.length - 1} className="p-1 text-gray-300 hover:text-brand-600 disabled:opacity-0"><ArrowDown className="w-3 h-3" /></button>
                                                <button onClick={() => removeWaypoint(wp.id)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <input 
                                                type="text"
                                                value={wp.name}
                                                onChange={(e) => updateWaypoint(wp.id, { name: e.target.value })}
                                                className="w-full text-sm font-semibold text-gray-800 border-none p-0 focus:ring-0 placeholder-gray-400"
                                                placeholder="地点名称"
                                            />
                                            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                                                <Clock className="w-3 h-3" />
                                                <span>停留:</span>
                                                <input 
                                                    type="number"
                                                    value={wp.duration}
                                                    onChange={(e) => updateWaypoint(wp.id, { duration: parseInt(e.target.value) || 0 })}
                                                    className="w-12 bg-transparent border-b border-gray-300 text-center focus:border-brand-500 focus:outline-none p-0 text-gray-700 font-medium"
                                                />
                                                <span>分钟</span>
                                            </div>
                                            <div className="relative">
                                                <FileText className="absolute top-2 left-2 w-3 h-3 text-gray-400" />
                                                <textarea
                                                    value={wp.notes || ''}
                                                    onChange={(e) => updateWaypoint(wp.id, { notes: e.target.value })}
                                                    className="w-full text-xs text-gray-600 bg-white border border-gray-200 rounded-lg pl-7 pr-2 py-1.5 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 resize-none placeholder-gray-400"
                                                    rows={2}
                                                    placeholder="添加备注..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
              </div>
          )}

          {/* EXPLORE TAB */}
          {activeTab === 'explore' && (
              <div className="p-4 space-y-4">
                  <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-4">
                      <h3 className="font-bold text-brand-800 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" /> 为您推荐
                      </h3>
                      <p className="text-xs text-brand-600 mt-1">
                          基于您的 <strong>{PERSONA_DISPLAY_MAP[user.persona]}</strong> 画像精选地点。
                      </p>
                  </div>

                  {recommendedPlaces.map((place) => (
                      <div key={place.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                          <div className="h-32 overflow-hidden relative">
                              <img src={place.image} alt={place.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
                                  <Star className="w-3 h-3 text-yellow-500 fill-current" /> {place.rating}
                              </div>
                              <div className="absolute bottom-2 left-2">
                                   <span className="px-2 py-1 bg-black/50 text-white text-xs rounded-lg backdrop-blur-sm">
                                      {place.category}
                                   </span>
                              </div>
                          </div>
                          <div className="p-3">
                              <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-bold text-gray-800">{place.name}</h4>
                                  <span className="text-xs font-semibold text-green-600">
                                      {place.price === 0 ? '免费' : `¥${place.price}`}
                                  </span>
                              </div>
                              <div className="flex justify-between items-center mt-3">
                                  <div className="flex gap-1">
                                      {place.tags.slice(0, 2).map(tag => (
                                          <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                              {tag}
                                          </span>
                                      ))}
                                  </div>
                                  <button 
                                      onClick={() => addWaypoint(place.name, place.lat, place.lng)}
                                      className="bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white p-2 rounded-lg transition-colors"
                                      title="添加到行程"
                                  >
                                      <Plus className="w-4 h-4" />
                                  </button>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          )}
        </div>

        {/* Footer Actions */}
        {activeTab === 'itinerary' && (
            <div className="p-4 bg-white border-t border-gray-200">
            {error && (
                <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm flex items-start gap-2 mb-3">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="break-words">{error}</span>
                </div>
            )}
            <div className="grid grid-cols-1 gap-3">
                <button
                    onClick={handleSmartOptimize}
                    disabled={loading || waypoints.length < 3}
                    className={`w-full py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 ${loading || waypoints.length < 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <Sparkles className="w-5 h-5" />
                    智能路线优化
                </button>
                <button
                    onClick={() => calculateRoute(waypoints)}
                    disabled={loading || waypoints.length < 2}
                    className="w-full py-3 rounded-xl font-semibold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                    {loading ? '刷新中...' : <><NavIcon className="w-5 h-5" /> 重置顺序</>}
                </button>
            </div>
            </div>
        )}
      </div>

      {/* Map Area */}
      <div className="flex-1 p-0 h-[50vh] md:h-full relative z-0">
        <InteractiveMap
          waypoints={waypoints}
          routeData={routeData}
          onMapClick={handleMapClick}
          onMarkerDelete={removeWaypoint}
        />
      </div>
    </div>
  );
};

export default Dashboard;