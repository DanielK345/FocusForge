import React, { useState } from 'react';

const CalendarListItem = ({ 
  calendar, 
  isActive, 
  onActivate, 
  onNameChange,
  onDelete 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(calendar.name);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditedName(calendar.name);
  };

  const handleNameSave = () => {
    if (editedName.trim()) {
      onNameChange(calendar.id, editedName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleNameSave();
    }
  };

  return (
    <div 
      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors duration-200 ${
        isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
      }`}
      onClick={() => onActivate(calendar.id)}
    >
      <div
        className={`w-3 h-3 rounded-full ${
          isActive ? 'bg-blue-500' : 'bg-gray-300'
        }`}
      />

      {isEditing ? (
        <input
          type="text"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          onBlur={handleNameSave}
          onKeyPress={handleKeyPress}
          className="flex-1 border rounded px-2 py-1 text-sm"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          onDoubleClick={(e) => {
            e.stopPropagation();
            handleDoubleClick();
          }}
          className={`flex-1 text-sm ${isActive ? 'font-medium' : ''}`}
        >
          {calendar.name}
        </span>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(calendar.id);
        }}
        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        ×
      </button>
    </div>
  );
};

export default CalendarListItem; 