import React from 'react';

interface DonutChartProps {
    data: { name: string; value: number; color: string }[];
}

const DonutSegment: React.FC<{
    color: string;
    radius: number;
    strokeWidth: number;
    startAngle: number;
    endAngle: number;
}> = ({ color, radius, strokeWidth, startAngle, endAngle }) => {
    const getCoordinatesForAngle = (angle: number, r: number) => {
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        return [x, y];
    };

    const [startX, startY] = getCoordinatesForAngle(startAngle, radius);
    const [endX, endY] = getCoordinatesForAngle(endAngle, radius);

    const largeArcFlag = endAngle - startAngle <= Math.PI ? 0 : 1;

    const pathData = [
        `M ${startX} ${startY}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
    ].join(' ');

    const circumference = 2 * Math.PI * radius;
    const dasharray = circumference;

    return (
        <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            className="transition-all duration-500 ease-out"
            style={{
                strokeDasharray: dasharray,
                strokeDashoffset: dasharray,
                animation: `donut-fill 1s ease-out forwards`,
            }}
        />
    );
};

export const DonutChart: React.FC<DonutChartProps> = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
        return <div className="flex items-center justify-center h-full text-gray-500">No hay datos para mostrar.</div>;
    }

    const radius = 60;
    const strokeWidth = 20;
    const viewBoxSize = (radius + strokeWidth) * 2;

    let cumulativeAngle = -Math.PI / 2;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-center h-full">
            <style>
                {`
                @keyframes donut-fill {
                    to {
                        stroke-dashoffset: 0;
                    }
                }
                `}
            </style>
            <div className="relative w-48 h-48 sm:w-56 sm:h-56">
                <svg
                    viewBox={`-${viewBoxSize / 2} -${viewBoxSize / 2} ${viewBoxSize} ${viewBoxSize}`}
                    className="transform -rotate-90"
                >
                    {data.map((item, index) => {
                        const angle = (item.value / total) * 2 * Math.PI;
                        const startAngle = cumulativeAngle;
                        cumulativeAngle += angle;
                        const endAngle = cumulativeAngle;

                        return (
                            <DonutSegment
                                key={index}
                                color={item.color}
                                radius={radius}
                                strokeWidth={strokeWidth}
                                startAngle={startAngle}
                                endAngle={endAngle}
                            />
                        );
                    })}
                </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-gray-800 dark:text-white">{total}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
                </div>
            </div>
            <ul className="mt-6 sm:mt-0 sm:ml-8 space-y-2 text-sm">
                {data.map((item, index) => (
                    <li key={index} className="flex items-center">
                        <span
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: item.color }}
                        ></span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{item.name}:</span>
                        <span className="ml-2 text-gray-500 dark:text-gray-400">{item.value} ({((item.value / total) * 100).toFixed(1)}%)</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};
