import React, { useState, useEffect } from 'react';
import { ManagedItem } from '../types';
import { EditIcon, TrashIcon, PlusIcon, CheckIcon, XIcon } from './Icons';

interface SimpleManagementCardProps {
    title: string;
    items: ManagedItem[];
    onAddItem: (item: Omit<ManagedItem, 'id' | 'docId'>) => Promise<void>;
    onUpdateItem: (item: ManagedItem) => Promise<void>;
    onDeleteItem: (item: ManagedItem) => void;
    colorConfig: { bg: string; titleBg: string; titleText: string };
}

const generateUniqueRandomColor = (existingColors: string[]): string => {
    let color;
    const existingSet = new Set(existingColors);
    do {
        color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    } while (existingSet.has(color));
    return color;
};

export const SimpleManagementCard: React.FC<SimpleManagementCardProps> = ({ title, items, onAddItem, onUpdateItem, onDeleteItem, colorConfig }) => {
    const [newItem, setNewItem] = useState({ name: '', color: '#CCCCCC' });
    const [editingItem, setEditingItem] = useState<ManagedItem | null>(null);

    useEffect(() => {
        setNewItem(prev => ({ ...prev, color: generateUniqueRandomColor(items.map(i => i.color)) }));
    }, [items]);


    const handleAddItem = async () => {
        const trimmedName = newItem.name.trim();
        if (!trimmedName) {
            alert('El nombre no puede estar vacío.');
            return;
        }
        if (items.some(item => item.name.toLowerCase() === trimmedName.toLowerCase())) {
            alert(`El elemento "${trimmedName}" ya existe.`);
            return;
        }
        await onAddItem({ name: trimmedName, color: newItem.color });
        setNewItem(prev => ({...prev, name: ''}));
    };

    const handleRemoveItem = (item: ManagedItem) => {
        onDeleteItem(item);
    };

    const handleStartEdit = (item: ManagedItem) => {
        setEditingItem({ ...item });
    };

    const handleCancelEdit = () => {
        setEditingItem(null);
    };

    const handleSaveEdit = async () => {
        if (!editingItem) {
            handleCancelEdit();
            return;
        }
        const trimmedName = editingItem.name.trim();
        if (!trimmedName) {
            alert('El nombre no puede estar vacío.');
            return; 
        }
        if (items.some(item => item.name.toLowerCase() === trimmedName.toLowerCase() && item.docId !== editingItem.docId)) {
            alert(`El elemento "${trimmedName}" ya existe.`);
            return;
        }
        await onUpdateItem({ ...editingItem, name: trimmedName });
        handleCancelEdit();
    };

    return (
        <div className={`shadow-lg rounded-lg flex flex-col h-full overflow-hidden ${colorConfig.bg}`}>
            <h2 className={`text-xl font-bold p-4 ${colorConfig.titleBg} ${colorConfig.titleText}`}>{title}</h2>
            <div className="p-4 flex-1 flex flex-col">
                <div className="mb-4 flex space-x-2">
                    <input
                        type="text"
                        value={newItem.name}
                        onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                        placeholder="Añadir nuevo..."
                        className="flex-grow w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-white dark:text-gray-900 dark:placeholder-gray-500"
                    />
                    <input
                        type="color"
                        value={newItem.color}
                        onChange={(e) => setNewItem(prev => ({ ...prev, color: e.target.value }))}
                        className="h-10 w-12 p-1 border-none rounded-md cursor-pointer bg-transparent"
                    />
                    <button
                        onClick={handleAddItem}
                        className="bg-brand-primary hover:bg-indigo-700 text-white font-bold p-2 rounded-md shadow transition duration-300 flex-shrink-0"
                    >
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </div>
                <ul className="space-y-2 flex-grow overflow-y-auto max-h-60 pr-2">
                    {items.map((item) => (
                        <li key={item.docId} className="flex items-center justify-between bg-white/50 dark:bg-gray-700/50 p-2 rounded-md">
                            {editingItem && editingItem.docId === item.docId ? (
                                <div className="flex-grow flex items-center space-x-2">
                                    <input
                                        type="color"
                                        value={editingItem.color}
                                        onChange={(e) => setEditingItem(s => s ? { ...s, color: e.target.value } : null)}
                                        className="h-8 w-10 p-1 border-none rounded-md cursor-pointer bg-transparent"
                                    />
                                    <input
                                        type="text"
                                        value={editingItem.name}
                                        onChange={(e) => setEditingItem(s => s ? { ...s, name: e.target.value } : null)}
                                        className="flex-grow px-2 py-1 border border-brand-primary rounded-md bg-white dark:bg-white dark:text-gray-900"
                                        autoFocus
                                        onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                                    />
                                    <button onClick={handleSaveEdit} className="text-green-500 hover:text-green-700"><CheckIcon className="w-5 h-5" /></button>
                                    <button onClick={handleCancelEdit} className="text-red-500 hover:text-red-700"><XIcon className="w-5 h-5" /></button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center truncate">
                                        <span className="w-4 h-4 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400 mr-2">[{item.id}]</span>
                                        <span className="text-gray-700 dark:text-gray-300 truncate">{item.name}</span>
                                    </div>
                                    <div className="flex space-x-2 flex-shrink-0 ml-2">
                                        <button onClick={() => handleStartEdit(item)} className="text-gray-500 hover:text-blue-500">
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleRemoveItem(item)} className="text-gray-500 hover:text-red-500">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};