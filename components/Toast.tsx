import React, { useEffect } from 'react';
import { CheckCircleIcon } from './Icons';

interface ToastProps {
    show: boolean;
    message: string;
    subMessage?: string;
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ show, message, subMessage, onClose }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    return (
        <div
            className={`fixed top-5 right-5 z-50 transition-all duration-300 ease-in-out ${
                show ? 'transform translate-y-0 opacity-100' : 'transform -translate-y-10 opacity-0'
            }`}
            style={{ pointerEvents: show ? 'auto' : 'none' }}
        >
            <div
                className="flex items-center bg-emerald-500 text-white text-sm font-bold px-4 py-3 rounded-lg shadow-2xl cursor-pointer"
                onClick={onClose}
            >
                <CheckCircleIcon className="w-6 h-6 mr-3" />
                <div>
                    <p>{message}</p>
                    {subMessage && <p className="text-xs opacity-80 mt-1">{subMessage}</p>}
                </div>
            </div>
        </div>
    );
};