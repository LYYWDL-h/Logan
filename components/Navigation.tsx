import React from 'react';
import { ViewState, User } from '../types';
import { Map, User as UserIcon, LogOut, Compass, BookOpen } from 'lucide-react';

interface NavigationProps {
  user: User;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ user, currentView, onChangeView, onLogout }) => {
  return (
    <nav className="bg-white border-b border-brand-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => onChangeView(ViewState.DASHBOARD)}>
              <div className="bg-brand-500 p-1.5 rounded-lg">
                <Compass className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-800 tracking-tight">简途 <span className="text-brand-500 text-sm font-normal">Jiantu</span></span>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <button
                onClick={() => onChangeView(ViewState.DASHBOARD)}
                className={`${
                  currentView === ViewState.DASHBOARD
                    ? 'border-brand-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full transition-colors`}
              >
                <Map className="w-4 h-4 mr-2" />
                行程规划
              </button>
              <button
                onClick={() => onChangeView(ViewState.DIARIES)}
                className={`${
                  currentView === ViewState.DIARIES
                    ? 'border-brand-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full transition-colors`}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                旅行社区
              </button>
              <button
                onClick={() => onChangeView(ViewState.PROFILE)}
                className={`${
                  currentView === ViewState.PROFILE
                    ? 'border-brand-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full transition-colors`}
              >
                <UserIcon className="w-4 h-4 mr-2" />
                个人中心
              </button>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700 font-medium hidden md:block">欢迎, {user.name}</span>
                <img
                  className="h-8 w-8 rounded-full border border-gray-200"
                  src={user.avatar}
                  alt={user.name}
                />
                <button
                  onClick={onLogout}
                  className="ml-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  title="退出登录"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;