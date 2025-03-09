import React from 'react';

const AddListModal = ({ 
  newListName, 
  setNewListName, 
  addBlockedWebsiteList, 
  setShowAddListModal 
}) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && newListName.trim()) {
      addBlockedWebsiteList(newListName);
      setNewListName('');
      setShowAddListModal(false);
    }
  };

  const handleAddList = () => {
    if (newListName.trim()) {
      addBlockedWebsiteList(newListName);
      setNewListName('');
      setShowAddListModal(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-80">
        <h2 className="text-xl font-bold mb-4">Add New List</h2>
        <input 
          type="text" 
          value={newListName} 
          onChange={(e) => setNewListName(e.target.value)}
          placeholder="Enter list name" 
          className="border p-2 w-full mb-4 rounded"
          onKeyPress={handleKeyPress}
        />
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => setShowAddListModal(false)} 
            className="px-4 py-2 border rounded hover:bg-gray-200"
          >
            Cancel
          </button>
          <button 
            onClick={handleAddList} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddListModal;
