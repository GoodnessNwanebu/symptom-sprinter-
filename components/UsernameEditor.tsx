import React, { useState, useEffect, useRef } from 'react';

interface UsernameEditorProps {
  initialUsername: string;
  onSave: (username: string) => void;
}

export const UsernameEditor: React.FC<UsernameEditorProps> = ({ 
  initialUsername, 
  onSave 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(initialUsername);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUsername(initialUsername);
  }, [initialUsername]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    const trimmed = username.trim();
    if (trimmed) {
      onSave(trimmed);
    } else {
      // Revert to initial if empty
      setUsername(initialUsername);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setUsername(initialUsername);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-1 md:gap-2">
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="bg-white/90 backdrop-blur-sm px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl text-sm md:text-sm font-bold text-slate-800 border-2 border-medical-400 focus:border-medical-500 focus:outline-none shadow-sm min-w-[80px] md:min-w-[100px]"
          maxLength={20}
        />
      ) : (
        <button
          onClick={handleClick}
          className="bg-white/90 backdrop-blur-sm px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl text-sm md:text-sm font-bold text-slate-800 active:bg-white md:hover:bg-white transition-colors shadow-sm border-2 border-transparent active:border-medical-200 md:hover:border-medical-200 flex items-center gap-1 md:gap-1.5 group"
        >
          <span className="truncate max-w-[70px] md:max-w-[120px] text-left">{username}</span>
          <svg 
            className="w-3 h-3 md:w-4 md:h-4 text-medical-500 opacity-60 group-active:opacity-100 md:group-hover:opacity-100 transition-opacity flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </div>
  );
};
