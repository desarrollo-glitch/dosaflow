import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import { LoadingScreen } from './LoadingScreen';

export const StyleguideView: React.FC = () => {
    const [markdown, setMarkdown] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMarkdown = async () => {
            try {
                const response = await fetch('/CODING_GUIDELINES.md');
                if (!response.ok) {
                    throw new Error(`Error ${response.status}: No se pudo cargar el fichero de guías de estilo.`);
                }
                const text = await response.text();
                setMarkdown(text);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMarkdown();
    }, []);

    if (loading) {
        return <LoadingScreen />;
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-500">
                <h1 className="text-2xl font-bold">Error al Cargar la Guía</h1>
                <p>{error}</p>
            </div>
        );
    }
    
    const getHtml = () => {
        // Configure marked to add Tailwind classes
        const renderer = new marked.Renderer();
        renderer.heading = (text, level) => {
            const baseClasses = 'font-bold mt-8 mb-4 pb-2 border-b-2 border-brand-primary';
            if (level === 1) return `<h1 class="text-4xl ${baseClasses}">${text}</h1>`;
            if (level === 2) return `<h2 class="text-3xl ${baseClasses}">${text}</h2>`;
            if (level === 3) return `<h3 class="text-2xl font-semibold mt-6 mb-3">${text}</h3>`;
            return `<h${level} class="text-xl">${text}</h${level}>`;
        };
        renderer.paragraph = (text) => `<p class="my-4 text-base leading-relaxed">${text}</p>`;
        renderer.list = (body, ordered) => {
            const tag = ordered ? 'ol' : 'ul';
            return `<${tag} class="list-disc list-inside my-4 pl-4 space-y-2">${body}</${tag}>`;
        };
        renderer.code = (code, language) => {
            return `<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm my-4"><code>${code}</code></pre>`;
        };
        renderer.strong = (text) => `<strong class="font-semibold text-gray-800 dark:text-gray-200">${text}</strong>`;
        renderer.hr = () => `<hr class="my-8 border-gray-300 dark:border-gray-600"/>`;

        return marked(markdown, { renderer });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 text-gray-700 dark:text-gray-300 max-w-4xl mx-auto">
            <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: getHtml() }}
            />
        </div>
    );
};