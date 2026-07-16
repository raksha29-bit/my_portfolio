import { useState, useEffect, useRef } from 'react';
import { Moon, Sunset, Monitor, ChevronDown } from 'lucide-react';

export default function ThemeToggle({ themeMode, onChangeTheme }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const themes = [
    { id: 'moonlight', label: 'Moonlight', icon: Moon },
    { id: 'twilight', label: 'Twilight', icon: Sunset },
    { id: 'system', label: 'System', icon: Monitor }
  ];

  const currentTheme = themes.find(t => t.id === themeMode) || themes[0];
  const CurrentIcon = currentTheme.icon;

  return (
    <div className="sky-theme-selector" ref={dropdownRef}>
      <button className="sky-btn" onClick={() => setIsOpen(!isOpen)}>
        <CurrentIcon size={14} style={{ color: 'var(--accent-color)' }} />
        <span>Sky: {currentTheme.label}</span>
        <ChevronDown size={12} style={{ opacity: 0.6, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div className="sky-dropdown">
          {themes.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                className={`sky-item ${themeMode === t.id ? 'active' : ''}`}
                onClick={() => {
                  onChangeTheme(t.id);
                  setIsOpen(false);
                }}
              >
                <Icon size={13} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
