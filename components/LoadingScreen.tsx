import React from 'react';
import { SpinnerIcon } from './Icons';

export const LoadingScreen: React.FC = () => {
    return (
        <div className="flex flex-col justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
            <div className="flex items-center space-x-4">
                <SpinnerIcon className="w-12 h-12 text-brand-primary" />
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Cargando Planificador...</h1>
            </div>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Preparando tus datos, por favor espera un momento.
            </p>
        </div>
    );
};