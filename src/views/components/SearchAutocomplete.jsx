import { useState, useRef, useEffect } from 'react'

const normalize = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function SearchAutocomplete({
  value,
  onChange,
  onSelect,
  suggestions = [],
  placeholder,
  inputClassName,
  wrapperStyle,
  inputProps = {},
}) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef(null)

  const q = value.trim()
  const filtered =
    q.length > 1
      ? suggestions
          .filter((s) => normalize(s).includes(normalize(q)) && normalize(s) !== normalize(q))
          .slice(0, 8)
      : []

  useEffect(() => {
    setOpen(filtered.length > 0)
    setActiveIndex(-1)
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const handleSelect = (suggestion) => {
    onChange(suggestion)
    onSelect?.(suggestion)
    setOpen(false)
  }

  const handleKeyDown = (e) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(filtered[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="autocomplete-wrapper" style={wrapperStyle}>
      <input
        {...inputProps}
        className={inputClassName}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => filtered.length > 0 && setOpen(true)}
      />
      {open && (
        <ul className="autocomplete-list" role="listbox">
          {filtered.map((s, i) => (
            <li
              key={s}
              role="option"
              aria-selected={i === activeIndex}
              className={`autocomplete-item${i === activeIndex ? ' active' : ''}`}
              onMouseDown={() => handleSelect(s)}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
