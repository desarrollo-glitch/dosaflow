import React from 'react';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex items-center space-x-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className={`p-3 rounded-full bg-gray-100 dark:bg-gray-700 ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{value}</p>
            </div>
        </div>
    );
};