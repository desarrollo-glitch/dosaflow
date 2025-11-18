

import React from 'react';
import { SimpleManagementCard } from './SimpleManagementCard';
import { StatusManagementCard } from './StatusManagementCard';
import { ManagedStatus, ManagedItem } from '../types';

interface DbManagementViewProps {
    programmers: ManagedItem[];
    onProgrammerAdd: (item: Omit<ManagedItem, 'id' | 'docId'>) => Promise<void>;
    onProgrammerUpdate: (item: ManagedItem) => Promise<void>;
    onProgrammerDelete: (item: ManagedItem) => void;
    
    modules: ManagedItem[];
    onModuleAdd: (item: Omit<ManagedItem, 'id' | 'docId'>) => Promise<void>;
    onModuleUpdate: (item: ManagedItem) => Promise<void>;
    onModuleDelete: (item: ManagedItem) => void;

    platforms: ManagedItem[];
    onPlatformAdd: (item: Omit<ManagedItem, 'id' | 'docId'>) => Promise<void>;
    onPlatformUpdate: (item: ManagedItem) => Promise<void>;
    onPlatformDelete: (item: ManagedItem) => void;

    targets: ManagedItem[];
    onTargetAdd: (item: Omit<ManagedItem, 'id' | 'docId'>) => Promise<void>;
    onTargetUpdate: (item: ManagedItem) => Promise<void>;
    onTargetDelete: (item: ManagedItem) => void;

    managedStatuses: ManagedStatus[];
    onStatusAdd: (item: Omit<ManagedStatus, 'id' | 'docId'>) => Promise<void>;
    onStatusUpdate: (item: ManagedStatus) => Promise<void>;
    onStatusDelete: (item: ManagedStatus) => void;
}

const colorPalettes = {
    programmers: { bg: 'bg-slate-50 dark:bg-slate-900/20', titleBg: 'bg-slate-600', titleText: 'text-white' },
    modules: { bg: 'bg-teal-50 dark:bg-teal-900/20', titleBg: 'bg-teal-600', titleText: 'text-white' },
    platforms: { bg: 'bg-sky-50 dark:bg-sky-900/20', titleBg: 'bg-sky-600', titleText: 'text-white' },
    targets: { bg: 'bg-orange-50 dark:bg-orange-900/20', titleBg: 'bg-orange-600', titleText: 'text-white' },
    statuses: { bg: 'bg-rose-50 dark:bg-rose-900/20', titleBg: 'bg-rose-600', titleText: 'text-white' },
};

export const DbManagementView: React.FC<DbManagementViewProps> = (props) => {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Gestión de Datos de la Aplicación</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <SimpleManagementCard 
                    title="Programadores" 
                    items={props.programmers} 
                    onAddItem={props.onProgrammerAdd}
                    onUpdateItem={props.onProgrammerUpdate}
                    onDeleteItem={props.onProgrammerDelete}
                    colorConfig={colorPalettes.programmers} 
                />
                <SimpleManagementCard 
                    title="Módulos" 
                    items={props.modules} 
                    onAddItem={props.onModuleAdd}
                    onUpdateItem={props.onModuleUpdate}
                    onDeleteItem={props.onModuleDelete}
                    colorConfig={colorPalettes.modules} 
                />
                <SimpleManagementCard 
                    title="Plataformas" 
                    items={props.platforms} 
                    onAddItem={props.onPlatformAdd}
                    onUpdateItem={props.onPlatformUpdate}
                    onDeleteItem={props.onPlatformDelete}
                    colorConfig={colorPalettes.platforms} 
                />
                <SimpleManagementCard 
                    title="Destinos" 
                    items={props.targets} 
                    onAddItem={props.onTargetAdd}
                    onUpdateItem={props.onTargetUpdate}
                    onDeleteItem={props.onTargetDelete}
                    colorConfig={colorPalettes.targets} 
                />
                <StatusManagementCard 
                    statuses={props.managedStatuses} 
                    onAddItem={props.onStatusAdd}
                    onUpdateItem={props.onStatusUpdate}
                    onDeleteItem={props.onStatusDelete}
                    colorConfig={colorPalettes.statuses} 
                />
            </div>
        </div>
    );
};
