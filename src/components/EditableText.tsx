import React, { useState } from 'react';
import { CheckIcon, XIcon } from './Icons';

interface EditableTextProps {
  value: string;
  onSave: (newValue: string) => void;
}

export const EditableText: React.FC<EditableTextProps> = ({ value, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(value);

  const handleSave = () => {
    if (text.trim() && text.trim() !== value) {
      onSave(text.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setText(value);
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
    }
    if (e.key === 'Escape') handleCancel();
  };

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2 w-full">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-grow px-2 py-1 border border-brand-primary rounded-md bg-white dark:bg-white dark:text-gray-900"
          autoFocus
        />
        <button onClick={handleSave} className="text-green-500 hover:text-green-700 p-1 rounded-full hover:bg-green-100 dark:hover:bg-gray-700">
            <CheckIcon className="w-5 h-5" />
        </button>
        <button onClick={handleCancel} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-gray-700">
            <XIcon className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div onClick={() => setIsEditing(true)} className="cursor-pointer min-h-[36px] p-1 flex items-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 w-full">
      {value}
    </div>
  );
};