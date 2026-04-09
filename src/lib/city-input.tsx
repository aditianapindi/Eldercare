"use client";

import { useState, useRef, useEffect } from "react";
import { searchCities } from "./indian-cities";

export function CityInput({
  value,
  onChange,
  placeholder = "City",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const handleChange = (v: string) => {
    onChange(v);
    const results = searchCities(v);
    setSuggestions(results);
    setShowDropdown(results.length > 0);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          const results = searchCities(value);
          if (results.length > 0) setShowDropdown(true);
        }}
        placeholder={placeholder}
        className={className}
      />
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-border-subtle rounded-[10px] shadow-lg overflow-hidden max-h-[200px] overflow-y-auto">
          {suggestions.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => {
                onChange(city);
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-sage-light transition-colors"
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
