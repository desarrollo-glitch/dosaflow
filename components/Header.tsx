import React from 'react';
import { MenuIcon, ExportIcon } from './Icons';
import type { User } from 'firebase/auth';

interface HeaderProps {
  onAddTaskClick: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
  onExportCsv: () => void;
  user: User | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onAddTaskClick, isDarkMode, onToggleTheme, onToggleSidebar, onExportCsv, user, onLogout }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center flex-shrink-0 z-10">
      <div className="flex items-center space-x-3">
        <button onClick={onToggleSidebar} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
          <MenuIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        </button>
        <div className="flex items-center space-x-3">
          <svg className="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <h1 className="hidden sm:block text-3xl font-bold text-gray-800 dark:text-white font-logo tracking-wider">DosaFlow</h1>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden md:inline">{user?.email}</span>
            <button onClick={onLogout} title="Cerrar sesión" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            </button>
        </div>
        <div className="hidden sm:flex items-center">
            <span className="mr-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                {isDarkMode ? 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg> : 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
                }
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={isDarkMode} onChange={onToggleTheme} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
        </div>
        <button
          onClick={onExportCsv}
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow transition duration-300 ease-in-out transform hover:-translate-y-px flex items-center space-x-2"
        >
          <ExportIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Exportar CSV</span>
        </button>
        <button
          onClick={onAddTaskClick}
          className="bg-brand-primary hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow transition duration-300 ease-in-out transform hover:-translate-y-px flex items-center space-x-2"
        >
          <span className="text-xl">+</span>
          <span className="hidden sm:inline">Añadir Requisito</span>
        </button>
      </div>
    </header>
  );
};
