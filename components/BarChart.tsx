import React from 'react';

interface BarSegment {
    value: number;
    color: string;
    label?: string;
}

interface BarChartProps {
    data: { name: string; values: BarSegment[] }[];
    orientation: 'vertical' | 'horizontal';
}

export const BarChart: React.FC<BarChartProps> = ({ data, orientation }) => {
    const totalValues = data.map(d => d.values.reduce((sum, v) => sum + v.value, 0));
    const maxValue = Math.max(...totalValues, 0);
    
    if (maxValue === 0) {
        return <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">No hay datos para mostrar.</div>;
    }

    const animationStyles = `
        @keyframes bar-grow-y { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes bar-grow-x { from { transform: scaleX(0); } to { transform: scaleX(1); } }
    `;

    const verticalChartBody = (
        <div className="flex items-end h-64 space-x-4">
            {data.map((item, index) => {
                const itemTotal = item.values.reduce((sum, v) => sum + v.value, 0);
                const barHeight = maxValue > 0 ? (itemTotal / maxValue) * 100 : 0;
                return (
                    <div key={index} className="flex flex-col items-center group relative h-full w-8 flex-shrink-0">
                        <div className="absolute -top-7 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2 pointer-events-none z-10">
                            {itemTotal}
                        </div>
                        <div
                            className="w-full rounded-t-md flex flex-col justify-end"
                            style={{
                                height: `${barHeight}%`,
                                transformOrigin: 'bottom',
                                animation: `bar-grow-y 0.5s ${index * 50}ms ease-out forwards`,
                            }}
                        >
                            {item.values.map((segment, segIndex) => (
                                <div
                                    key={segIndex}
                                    className="w-full"
                                    style={{
                                        height: itemTotal > 0 ? `${(segment.value / itemTotal) * 100}%` : '0%',
                                        backgroundColor: segment.color,
                                    }}
                                    title={`${item.name} - ${segment.label || ''}: ${segment.value}`}
                                />
                            ))}
                        </div>
                        <span className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400 w-full break-words">{item.name}</span>
                    </div>
                );
            })}
        </div>
    );

    const horizontalChartBody = (
         <div className="space-y-2">
            {data.map((item, index) => {
                const itemTotal = item.values.reduce((sum, v) => sum + v.value, 0);
                return (
                    <div key={index} className="flex items-center group w-full">
                        <span className="text-xs w-24 truncate pr-2 text-gray-600 dark:text-gray-300 text-right">{item.name}</span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-5 relative">
                            <div
                                className="h-5 rounded-full flex overflow-hidden"
                                style={{
                                    width: `${(itemTotal / maxValue) * 100}%`,
                                    transformOrigin: 'left',
                                    animation: `bar-grow-x 0.5s ${index * 50}ms ease-out forwards`,
                                }}
                            >
                                {item.values.map((segment, segIndex) => (
                                    <div
                                        key={segIndex}
                                        className="h-full"
                                        style={{
                                            width: itemTotal > 0 ? `${(segment.value / itemTotal) * 100}%` : '0%',
                                            backgroundColor: segment.color,
                                        }}
                                        title={`${item.name} - ${segment.label || ''}: ${segment.value}`}
                                    />
                                ))}
                            </div>
                            <span className="absolute left-0 top-0 bottom-0 flex items-center text-xs font-bold text-white pl-2 pointer-events-none">
                                {itemTotal > 0 ? itemTotal : ''}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );


    return (
        <div className="w-full h-full">
            <style>{animationStyles}</style>
            {orientation === 'vertical' ? (
                <div className="overflow-x-auto w-full h-full pb-4">
                    {verticalChartBody}
                </div>
            ) : (
                horizontalChartBody
            )}
        </div>
    );
};
