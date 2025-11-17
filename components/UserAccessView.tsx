import React from 'react';
import { UserAccessDoc } from '../types';
import { CheckIcon, XIcon } from './Icons';

interface UserAccessViewProps {
    requests: UserAccessDoc[];
    processingId: string | null;
    onApprove: (docId: string) => void;
    onRevoke: (docId: string) => void;
}

const statusStyles: Record<UserAccessDoc['status'], { label: string; classes: string }> = {
    pending: { label: 'Pendiente', classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
    approved: { label: 'Aprobado', classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200' },
    revoked: { label: 'Revocado', classes: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200' },
};

export const UserAccessView: React.FC<UserAccessViewProps> = ({ requests, processingId, onApprove, onRevoke }) => {
    const sortedRequests = [...requests].sort((a, b) => {
        if (a.status === b.status) {
            return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
        }
        if (a.status === 'pending') return -1;
        if (b.status === 'pending') return 1;
        if (a.status === 'approved') return -1;
        return 1;
    });

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Activar Usuarios</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Aprueba o revoca el acceso de los usuarios que han solicitado entrar.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/40">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Correo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Solicitado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actualizado</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedRequests.map(request => {
                            const status = statusStyles[request.status];
                            const isProcessing = processingId === request.docId;
                            return (
                                <tr key={request.docId}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">{request.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{request.displayName || '—'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${status.classes}`}>
                                            {status.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(request.requestedAt).toLocaleString('es-ES')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {request.updatedAt ? new Date(request.updatedAt).toLocaleString('es-ES') : '—'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button
                                            onClick={() => onApprove(request.docId)}
                                            disabled={request.status === 'approved' || isProcessing}
                                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white disabled:opacity-40"
                                        >
                                            <CheckIcon className="w-4 h-4 mr-1" /> Aprobar
                                        </button>
                                        <button
                                            onClick={() => onRevoke(request.docId)}
                                            disabled={request.status === 'revoked' || isProcessing}
                                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white disabled:opacity-40"
                                        >
                                            <XIcon className="w-4 h-4 mr-1" /> Revocar
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}

                        {sortedRequests.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                    No hay solicitudes registradas todavía.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
