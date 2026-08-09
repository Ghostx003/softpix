import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = (value) => {
        try {
            if (value instanceof Function) {
                setStoredValue(prev => {
                    const valueToStore = value(prev);
                    if (typeof window !== 'undefined') {
                        window.localStorage.setItem(key, JSON.stringify(valueToStore));
                    }
                    return valueToStore;
                });
            } else {
                setStoredValue(value);
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem(key, JSON.stringify(value));
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
}
