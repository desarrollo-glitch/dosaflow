import React, { useState, useEffect, useRef } from 'react';
import { 
    CalendarIcon, KanbanIcon, TableIcon, DatabaseIcon, LightbulbIcon, DashboardIcon, BookOpenIcon, CloudIcon, ListBulletIcon, ClipboardDocumentListIcon, CogIcon, ChevronDownIcon, UsersIcon 
} from './Icons';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  onSetView: (view: View) => void;
  isOpen: boolean;
}

const NavItem: React.FC<{
    onClick: () => void;
    isActive: boolean;
    icon: React.ReactNode;
    label: string;
    isSidebarOpen: boolean;
}> = ({ onClick, isActive, icon, label, isSidebarOpen }) => (
    <button
        onClick={onClick}
        title={label}
        className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            isActive
                ? 'bg-brand-primary text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        } ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}
    >
        <span className="w-6 h-6">{icon}</span>
        {isSidebarOpen && <span className="ml-4">{label}</span>}
    </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onSetView, isOpen }) => {
    const utilityViews: View[] = ['dbManagement', 'filestore', 'activityLog', 'suggestions', 'documentation'];
    const isAUtilityViewActive = utilityViews.includes(currentView);
    
    const [isUtilitiesOpen, setIsUtilitiesOpen] = useState(isAUtilityViewActive);
    const utilitiesButtonRef = useRef<HTMLButtonElement>(null);
    const flyoutRef = useRef<HTMLDivElement>(null);
    const [flyoutTop, setFlyoutTop] = useState(0);

    // Keep utilities open if an item within it is active, but only for expanded sidebar
    useEffect(() => {
        if (isOpen && isAUtilityViewActive && !isUtilitiesOpen) {
            setIsUtilitiesOpen(true);
        }
    }, [isAUtilityViewActive, isUtilitiesOpen, isOpen]);

    // Calculate position for the fly-out menu
    useEffect(() => {
        if (utilitiesButtonRef.current) {
            setFlyoutTop(utilitiesButtonRef.current.offsetTop);
        }
    }, [isOpen]); // Recalculate when sidebar state changes

    // Close fly-out on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const isOutsideButton = utilitiesButtonRef.current && !utilitiesButtonRef.current.contains(event.target as Node);
            const isOutsideFlyout = flyoutRef.current && !flyoutRef.current.contains(event.target as Node);

            if (!isOpen && isUtilitiesOpen && isOutsideButton && isOutsideFlyout) {
                setIsUtilitiesOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, isUtilitiesOpen]);

    const handleUtilityViewClick = (view: View) => {
        onSetView(view);
        if (!isOpen) {
            setIsUtilitiesOpen(false); // Close flyout on selection
        }
    };
    
    const renderUtilityItems = (isFlyout: boolean) => (
        <>
            <NavItem 
                onClick={() => handleUtilityViewClick('dbManagement')} 
                isActive={currentView === 'dbManagement'} 
                icon={<DatabaseIcon />} 
                label="Gestión DB"
                isSidebarOpen={isFlyout || isOpen}
            />
             <NavItem 
                onClick={() => handleUtilityViewClick('filestore')} 
                isActive={currentView === 'filestore'} 
                icon={<CloudIcon />} 
                label="Firestore"
                isSidebarOpen={isFlyout || isOpen}
            />
            <NavItem 
                onClick={() => handleUtilityViewClick('activityLog')} 
                isActive={currentView === 'activityLog'} 
                icon={<ListBulletIcon />} 
                label="Registro Actividad"
                isSidebarOpen={isFlyout || isOpen}
            />
            <NavItem 
                onClick={() => handleUtilityViewClick('suggestions')} 
                isActive={currentView === 'suggestions'} 
                icon={<LightbulbIcon />} 
                label="Sugerencias"
                isSidebarOpen={isFlyout || isOpen}
            />
            <NavItem 
                onClick={() => handleUtilityViewClick('documentation')} 
                isActive={currentView === 'documentation'} 
                icon={<BookOpenIcon />} 
                label="Documentación"
                isSidebarOpen={isFlyout || isOpen}
            />
        </>
    );

    return (
        <aside className={`relative bg-white dark:bg-gray-800 shadow-xl flex-shrink-0 transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-20'}`}>
            <nav className="p-4 space-y-2 mt-16">
                <NavItem 
                    onClick={() => onSetView('dashboard')} 
                    isActive={currentView === 'dashboard'} 
                    icon={<DashboardIcon />} 
                    label="Dashboard"
                    isSidebarOpen={isOpen}
                />
                <NavItem 
                    onClick={() => onSetView('table')} 
                    isActive={currentView === 'table'} 
                    icon={<TableIcon />} 
                    label="Tabla"
                    isSidebarOpen={isOpen}
                />
                <NavItem 
                    onClick={() => onSetView('board')} 
                    isActive={currentView === 'board'} 
                    icon={<KanbanIcon />} 
                    label="Kanban"
                    isSidebarOpen={isOpen}
                />
                <NavItem 
                    onClick={() => onSetView('planner')} 
                    isActive={currentView === 'planner'} 
                    icon={<CalendarIcon />} 
                    label="Planificador"
                    isSidebarOpen={isOpen}
                />
                <NavItem 
                    onClick={() => onSetView('dailyLog')} 
                    isActive={currentView === 'dailyLog'} 
                    icon={<ClipboardDocumentListIcon />} 
                    label="Bitácora Diaria"
                    isSidebarOpen={isOpen}
                />
                 <NavItem 
                    onClick={() => onSetView('meetings')} 
                    isActive={currentView === 'meetings'} 
                    icon={<UsersIcon />} 
                    label="Reuniones"
                    isSidebarOpen={isOpen}
                />

                {/* Utilities Submenu */}
                <div>
                    <button
                        ref={utilitiesButtonRef}
                        onClick={() => setIsUtilitiesOpen(!isUtilitiesOpen)}
                        className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                            isAUtilityViewActive
                                ? 'bg-brand-primary text-white shadow-lg'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        } ${isOpen ? 'justify-between' : 'justify-center'}`}
                    >
                        <div className="flex items-center">
                            <span className="w-6 h-6"><CogIcon /></span>
                            {isOpen && <span className="ml-4">Utilidades</span>}
                        </div>
                        {isOpen && <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isUtilitiesOpen ? 'rotate-180' : ''}`} />}
                    </button>
                    
                    {isUtilitiesOpen && isOpen && (
                        <div className="pl-4 mt-2 space-y-2">
                            {renderUtilityItems(false)}
                        </div>
                    )}
                </div>
            </nav>

             {/* Fly-out menu for collapsed state */}
            {!isOpen && isUtilitiesOpen && (
                <div
                    ref={flyoutRef}
                    className="absolute left-full ml-2 z-30 w-56 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 space-y-1"
                    style={{ top: `${flyoutTop}px` }}
                >
                    {renderUtilityItems(true)}
                </div>
            )}
        </aside>
    );
};