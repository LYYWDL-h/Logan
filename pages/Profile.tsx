import React, { useState } from 'react';
import { User } from '../types';
import { Map, Trophy, Compass, Star, TrendingUp, Edit2, Check, X } from 'lucide-react';

interface ProfileProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<User>(user);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // Update avatar if name changed to keep it consistent (optional, but nice)
    const updatedUser = {
        ...editForm,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(editForm.name)}&background=0ea5e9&color=fff`
    }
    onUpdateUser(updatedUser);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm(user);
    setIsEditing(false);
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Header Card */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 border border-gray-100 relative">
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 h-32 relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            
            <div className="absolute top-4 right-4">
                 {!isEditing ? (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                        <Edit2 className="w-4 h-4" /> Edit Profile
                    </button>
                 ) : (
                    <div className="flex gap-2">
                         <button 
                            onClick={handleSave}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-lg transition-colors"
                        >
                            <Check className="w-4 h-4" /> Save
                        </button>
                        <button 
                            onClick={handleCancel}
                            className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                        >
                            <X className="w-4 h-4" /> Cancel
                        </button>
                    </div>
                 )}
            </div>
        </div>
        
        <div className="px-8 pb-8">
          <div className="relative flex items-end -mt-12 mb-6">
            <div className="relative">
              <img
                className="h-32 w-32 rounded-full border-4 border-white shadow-lg object-cover bg-gray-100"
                src={isEditing ? `https://ui-avatars.com/api/?name=${encodeURIComponent(editForm.name)}&background=0ea5e9&color=fff` : user.avatar}
                alt={user.name}
              />
              <span className="absolute bottom-1 right-1 bg-green-400 w-5 h-5 border-2 border-white rounded-full"></span>
            </div>
            <div className="ml-6 mb-2 flex-1">
              {isEditing ? (
                  <div className="space-y-3 max-w-sm mt-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">Display Name</label>
                        <input
                            type="text"
                            name="name"
                            value={editForm.name}
                            onChange={handleEditChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={editForm.email}
                            onChange={handleEditChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">Travel Persona</label>
                        <select
                            name="persona"
                            value={editForm.persona}
                            onChange={handleEditChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2"
                        >
                            <option value="Free Spirit">Free Spirit</option>
                            <option value="Deep Explorer">Deep Explorer</option>
                            <option value="Efficiency Planner">Efficiency Planner</option>
                            <option value="Creative Traveler">Creative Traveler</option>
                        </select>
                      </div>
                  </div>
              ) : (
                  <>
                    <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                    <p className="text-gray-500 flex items-center gap-1">
                        <Compass className="w-4 h-4" />
                        {user.persona}
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="text-sm">{user.email}</span>
                    </p>
                  </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
             <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                 <div className="inline-flex items-center justify-center p-3 bg-blue-100 text-blue-600 rounded-xl mb-3">
                     <Map className="w-6 h-6" />
                 </div>
                 <div className="text-2xl font-bold text-gray-800">{user.stats.tripsPlanned}</div>
                 <div className="text-sm text-gray-500 font-medium">Trips Planned</div>
             </div>
             <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                 <div className="inline-flex items-center justify-center p-3 bg-purple-100 text-purple-600 rounded-xl mb-3">
                     <Trophy className="w-6 h-6" />
                 </div>
                 <div className="text-2xl font-bold text-gray-800">{user.stats.placesVisited}</div>
                 <div className="text-sm text-gray-500 font-medium">Places Visited</div>
             </div>
             <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                 <div className="inline-flex items-center justify-center p-3 bg-orange-100 text-orange-600 rounded-xl mb-3">
                     <TrendingUp className="w-6 h-6" />
                 </div>
                 <div className="text-2xl font-bold text-gray-800">{user.stats.kmTraveled}</div>
                 <div className="text-sm text-gray-500 font-medium">Km Traveled</div>
             </div>
          </div>
        </div>
      </div>

      {/* Travel Persona Section based on Slides */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Star className="text-yellow-500 fill-current" />
            Travel Persona Analysis
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <p className="text-gray-600 leading-relaxed">
                    Based on your travel history, you are identified as a <span className="font-bold text-brand-600">{user.persona}</span>.
                </p>
                <p className="text-sm text-gray-500">
                    You refuse templates and pursue personalization and flexibility. You prefer discovering hidden gems over crowded hotspots.
                </p>

                <div className="mt-6">
                    <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
                        <span>Spontaneity</span>
                        <span>85%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-brand-500 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
                        <span>Planning Detail</span>
                        <span>40%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: '40%' }}></div>
                    </div>
                </div>
            </div>

            <div className="bg-brand-50 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-md mb-4">
                    <Compass className="w-12 h-12 text-brand-500" />
                </div>
                <h4 className="font-bold text-lg text-gray-800 mb-2">Recommended for you</h4>
                <p className="text-sm text-gray-600">
                    "Try the <span className="font-semibold text-brand-600">Free Marking</span> mode in our planner. It's designed for travelers like you who want to build their own path without constraints."
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;