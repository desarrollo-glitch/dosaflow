import { useEffect, useState } from 'react';

export const useIsMobile = (breakpoint = 1024) => {
    const getMatches = () => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
    };

    const [isMobile, setIsMobile] = useState<boolean>(getMatches);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
        const listener = (event: MediaQueryListEvent) => setIsMobile(event.matches);

        // Ensure initial state is synced
        setIsMobile(mediaQuery.matches);

        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', listener);
            return () => mediaQuery.removeEventListener('change', listener);
        } else {
            mediaQuery.addListener(listener);
            return () => mediaQuery.removeListener(listener);
        }
    }, [breakpoint]);

    return isMobile;
};
