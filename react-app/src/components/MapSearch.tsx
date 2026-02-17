import React, { useState, useEffect, useRef } from 'react';
import './MapSearch.css';

interface MapSearchProps {
    regions: string[];
    raions: string[];
    onSelectRegion: (regionName: string) => void;
    onSelectRaion: (raionName: string) => void;
    onResetZoom: () => void;
}

const MapSearch: React.FC<MapSearchProps> = ({ regions, raions, onSelectRegion, onSelectRaion, onResetZoom }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<{ name: string, type: 'oblast' | 'raion' }[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);

        if (value.length > 1) {
            const filteredOblasts = regions
                .filter(r => r.toLowerCase().includes(value.toLowerCase()))
                .slice(0, 3)
                .map(r => ({ name: r, type: 'oblast' as const }));

            const filteredRaions = raions
                .filter(r => r.toLowerCase().includes(value.toLowerCase()))
                .slice(0, 5)
                .map(r => ({ name: r, type: 'raion' as const }));

            setSuggestions([...filteredOblasts, ...filteredRaions]);
            setIsOpen(true);
        } else {
            setSuggestions([]);
            setIsOpen(false);
        }
    };

    const handleSelect = (item: { name: string, type: 'oblast' | 'raion' }) => {
        setQuery(item.name);
        setIsOpen(false);
        if (item.type === 'oblast') {
            onSelectRegion(item.name);
        } else {
            onSelectRaion(item.name);
        }
    };

    return (
        <div className="map-controls-container">
            <div className="search-wrapper" ref={wrapperRef}>
                <div className="search-input-container">
                    <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Пошук області..."
                        value={query}
                        onChange={handleInputChange}
                        onFocus={() => query.length > 1 && setIsOpen(true)}
                    />
                    {query && (
                        <button className="clear-btn" onClick={() => { setQuery(''); setSuggestions([]); }}>
                            ✕
                        </button>
                    )}
                </div>

                {isOpen && suggestions.length > 0 && (
                    <div className="suggestions-dropdown">
                        {suggestions.map((s, i) => (
                            <div key={i} className="suggestion-item" onClick={() => handleSelect(s)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{s.name}</span>
                                <span style={{ fontSize: '10px', background: s.type === 'oblast' ? '#3b82f6' : '#94a3b8', color: 'white', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                                    {s.type === 'oblast' ? 'обл.' : 'р-н'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button className="reset-zoom-btn" onClick={onResetZoom} title="Скинути масштаб">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
            </button>
        </div>
    );
};

export default MapSearch;
