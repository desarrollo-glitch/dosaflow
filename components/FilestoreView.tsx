import React, { useState } from 'react';
import { COLLECTIONS, getAllFromCollection, updateDocument } from '../utils/firestore';
import { SpinnerIcon, EditIcon, CheckIcon, XIcon } from './Icons';

// Define schemas for display purposes, as Firestore is schema-less
const collectionSchemas: Record<string, string[]> = {
    tasks: ['id', 'requirement', 'requirementType', 'moduleId', 'targetId', 'platformId', 'statusId', 'link', 'startDate'],
    task_assignments: ['id', 'taskId', 'programmerId', 'endDate'],
    programmers: ['id', 'name', 'color'],
    modules: ['id', 'name', 'color'],
    platforms: ['id', 'name', 'color'],
    targets: ['id', 'name', 'color'],
    managedStatuses: ['id', 'name', 'color'],
    suggestions: ['id', 'text', 'completed'],
};

interface DataTableProps {
    documents: any[];
    collectionName: string;
    onDataChange: () => void;
}

const DataTable: React.FC<DataTableProps> = ({ documents, collectionName, onDataChange }) => {
    const [editingDocId, setEditingDocId] = useState<string | null>(null);
    const [editedData, setEditedData] = useState<any | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    if (!documents || documents.length === 0) return null;

    const headers = Object.keys(documents[0]);

    const handleEdit = (doc: any) => {
        setEditingDocId(doc.docId);
        setEditedData({ ...doc });
    };

    const handleCancel = () => {
        setEditingDocId(null);
        setEditedData(null);
    };

    const handleSave = async () => {
        if (!editedData) return;
        setIsSaving(true);
        try {
            await updateDocument(collectionName, editedData.docId, editedData);
            handleCancel();
            onDataChange();
        } catch (error) {
            console.error("Error saving document:", error);
            alert("No se pudo guardar el documento. Revisa la consola.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string, type: 'string' | 'boolean' | 'number') => {
        if (!editedData) return;
        let value: any = e.target.value;
        if (type === 'boolean') {
             value = e.target.value.toLowerCase() === 'true' || e.target.value === '1' || e.target.value.toLowerCase() === 'yes';
        } else if (type === 'number') {
            value = e.target.value === '' ? null : Number(e.target.value);
        }
        setEditedData({ ...editedData, [field]: value });
    };

    return (
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Acciones
                    </th>
                    {headers.map(header => (
                        <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {documents.map((doc, index) => {
                    const isEditing = editingDocId === doc.docId;
                    return (
                        <tr key={doc.docId || doc.id || index} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${isEditing ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-2">
                                    {isEditing ? (
                                        <>
                                            <button onClick={handleSave} disabled={isSaving} className="text-green-500 hover:text-green-700 disabled:opacity-50" title="Guardar cambios">
                                                {isSaving ? <SpinnerIcon className="w-5 h-5" /> : <CheckIcon className="w-5 h-5" />}
                                            </button>
                                            <button onClick={handleCancel} className="text-red-500 hover:text-red-700" title="Cancelar edición">
                                                <XIcon className="w-5 h-5" />
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => handleEdit(doc)} className="text-brand-primary hover:text-indigo-700 dark:hover:text-indigo-300" title="Editar fila">
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </td>
                            {headers.map(header => {
                                const value = doc[header];
                                const valueType = typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string';
                                
                                return (
                                    <td key={`${doc.docId || doc.id}-${header}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {isEditing && header !== 'docId' ? (
                                            <input
                                                type={valueType === 'number' ? 'number' : 'text'}
                                                value={editedData[header] ?? ''}
                                                onChange={(e) => handleInputChange(e, header, valueType)}
                                                className="w-full text-sm px-2 py-1 border border-brand-primary rounded-md focus:outline-none bg-white dark:bg-white dark:text-gray-900"
                                            />
                                        ) : (
                                            <span className="truncate block" style={{ maxWidth: '200px' }} title={String(value)}>
                                                {String(value)}
                                            </span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};


export const FilestoreView: React.FC = () => {
    const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshData = async (collectionName: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAllFromCollection<any>(collectionName);
            setDocuments(data);
        } catch (e: any) {
            console.error("Error fetching collection data:", e);
            setError(`No se pudieron cargar los datos para ${collectionName}. Revisa la consola para más detalles.`);
            setDocuments([]);
        } finally {
            setIsLoading(false);
        }
    };


    const handleViewData = (collectionName: string) => {
        if (selectedCollection === collectionName) {
            // Toggle off
            setSelectedCollection(null);
            setDocuments([]);
            return;
        }
        setSelectedCollection(collectionName);
        refreshData(collectionName);
    };

    const collectionKeys = Object.keys(COLLECTIONS) as (keyof typeof COLLECTIONS)[];
    const collectionNames = collectionKeys.map(key => COLLECTIONS[key]);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Explorador de Firestore</h1>
            <p className="mb-8 text-gray-600 dark:text-gray-400">
                Visualiza la estructura y los datos en tiempo real de las colecciones de tu base de datos. Haz clic en "Ver Datos" para cargar y editar los documentos.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {collectionNames.map(name => (
                    <div key={name} className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-5 flex flex-col justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-brand-primary dark:text-indigo-400 capitalize">{name.replace(/_/g, ' ')}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-4">Campos principales:</p>
                            <div className="flex flex-wrap gap-2">
                                {(collectionSchemas[name] || ['N/A']).map(field => (
                                    <span key={field} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-mono px-2 py-1 rounded">
                                        {field}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => handleViewData(name)}
                            className={`mt-5 w-full text-white font-bold py-2 px-4 rounded-lg shadow transition duration-300 flex items-center justify-center ${
                                selectedCollection === name ? 'bg-gray-500 hover:bg-gray-600' : 'bg-brand-primary hover:bg-indigo-700'
                            }`}
                        >
                            {isLoading && selectedCollection === name ? <SpinnerIcon className="w-5 h-5 mr-2"/> : null}
                            {selectedCollection === name ? 'Ocultar Datos' : 'Ver Datos'}
                        </button>
                    </div>
                ))}
            </div>

            {selectedCollection && (
                <div className="mt-12">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
                        Documentos en: <span className="text-brand-primary">{selectedCollection}</span>
                    </h2>
                    {isLoading ? (
                        <div className="flex justify-center items-center p-8">
                            <SpinnerIcon className="w-8 h-8 text-brand-primary" />
                            <span className="ml-4 text-gray-600 dark:text-gray-400">Cargando documentos...</span>
                        </div>
                    ) : error ? (
                        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded relative" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    ) : documents.length > 0 ? (
                        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                            <DataTable 
                                documents={documents} 
                                collectionName={selectedCollection}
                                onDataChange={() => refreshData(selectedCollection)}
                            />
                        </div>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 mt-4">No se encontraron documentos en esta colección o está vacía.</p>
                    )}
                </div>
            )}
        </div>
    );
};
