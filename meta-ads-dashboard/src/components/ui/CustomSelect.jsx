import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Loader2, Search } from 'lucide-react';
import './CustomSelect.css';

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Seleccionar...',
  disabled = false,
  loading = false,
  icon: IconProp = null,
  searchable = false,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  // options: [{ value, label, icon?, description? }] or ['string', ...]
  const normalizedOptions = options.map(opt =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const filteredOptions = searchQuery
    ? normalizedOptions.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : normalizedOptions;

  const selectedOption = normalizedOptions.find(opt => String(opt.value) === String(value));

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('.custom-select-option');
      if (items[focusedIndex]) {
        items[focusedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  const handleKeyDown = useCallback((e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
          onChange({ target: { value: filteredOptions[focusedIndex].value } });
          setIsOpen(false);
          setSearchQuery('');
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        break;
    }
  }, [isOpen, focusedIndex, filteredOptions, onChange]);

  const handleSelect = (optValue) => {
    onChange({ target: { value: optValue } });
    setIsOpen(false);
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className={`custom-select ${className}`}>
        <div className="custom-select-trigger disabled">
          <div className="custom-select-loading">
            <Loader2 size={16} />
            <span>Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`custom-select ${isOpen ? 'custom-select--open' : ''} ${className}`} ref={containerRef}>
      <div
        className={`custom-select-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {IconProp && (
          <span className="custom-select-trigger-icon">
            <IconProp size={16} />
          </span>
        )}
        <span className={`custom-select-trigger-text ${!selectedOption ? 'placeholder' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={`custom-select-chevron ${isOpen ? 'open' : ''}`}>
          <ChevronDown size={16} />
        </span>
      </div>

      {isOpen && (
        <div className="custom-select-dropdown" role="listbox" ref={listRef}>
          {searchable && (
            <div className="custom-select-search">
              <input
                ref={searchRef}
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setFocusedIndex(0);
                }}
                onKeyDown={handleKeyDown}
              />
            </div>
          )}

          {filteredOptions.length === 0 ? (
            <div className="custom-select-empty">
              {searchQuery ? 'Sin resultados' : 'Sin opciones'}
            </div>
          ) : (
            filteredOptions.map((opt, idx) => (
              <div
                key={opt.value}
                className={`custom-select-option ${String(opt.value) === String(value) ? 'selected' : ''} ${idx === focusedIndex ? 'focused' : ''}`}
                onClick={() => handleSelect(opt.value)}
                role="option"
                aria-selected={String(opt.value) === String(value)}
              >
                {opt.icon && (
                  <span className="custom-select-option-icon">
                    {typeof opt.icon === 'function' ? <opt.icon size={16} /> : opt.icon}
                  </span>
                )}
                <div>
                  <div className="custom-select-option-text">{opt.label}</div>
                  {opt.description && (
                    <div className="custom-select-option-desc">{opt.description}</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
