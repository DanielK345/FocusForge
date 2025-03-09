import React, { useState, useEffect } from 'react';
import { X, Edit2, Check } from 'lucide-react';
import { validateUrl, getFavicon } from './utils/urlUtils';

const BlockedWebsiteModal = ({
                               blockedWebsiteLists,
                               activeList,
                               newWebsite,
                               setNewWebsite,
                               addBlockedWebsite,
                               removeBlockedWebsite,
                               updateListName,
                               setShowListModal
                             }) => {
  console.log("BlockedWebsiteModal received:", {
    blockedWebsiteLists,
    activeList
  });
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  // Đảm bảo blockedWebsiteLists là một mảng
  const websiteLists = Array.isArray(blockedWebsiteLists) ? blockedWebsiteLists : [];
  
  // Tìm list hiện tại
  const activeWebsiteList = websiteLists.find(list => Number(list.id) === Number(activeList));
  console.log("Active website list:", activeWebsiteList);
  
  // Đảm bảo websites là một mảng
  const websites = activeWebsiteList && Array.isArray(activeWebsiteList.websites) 
    ? activeWebsiteList.websites 
    : [];
  
  // Thiết lập tên ban đầu cho việc chỉnh sửa
  useEffect(() => {
    if (activeWebsiteList) {
      setEditedName(activeWebsiteList.name || '');
    }
  }, [activeWebsiteList]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      const validatedUrl = validateUrl(newWebsite);
      if (validatedUrl) {
        addBlockedWebsite(validatedUrl);
        setNewWebsite('');
      } else {
        alert("Please enter a valid URL");
      }
    }
  };

  const handleAddWebsite = () => {
    const validatedUrl = validateUrl(newWebsite);
    if (validatedUrl) {
      addBlockedWebsite(validatedUrl);
      setNewWebsite('');
    } else {
      alert("Please enter a valid URL");
    }
  };

  const handleSaveName = () => {
    if (editedName.trim()) {
      updateListName(activeList, editedName);
      setIsEditingName(false);
    }
  };

  return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[80vh] flex flex-col">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-4">
            {isEditingName ? (
                <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
                    onBlur={handleSaveName}
                    autoFocus
                    className="border p-1 text-lg font-bold w-full"
                />
            ) : (
                <h2 className="text-xl font-bold flex-1 truncate">{activeWebsiteList?.name || 'Manage Blocked Websites'}</h2>
            )}
            <button onClick={() => {
              if (!isEditingName) {
                setEditedName(activeWebsiteList?.name || '');
                setIsEditingName(true);
              } else {
                handleSaveName();
              }
            }} className="ml-2 text-gray-500 hover:text-gray-700">
              {isEditingName ? <Check size={18} /> : <Edit2 size={18} />}
            </button>
          </div>

          {/* Website List */}
          <div className="overflow-y-auto mb-4 flex-1">
            {!websites.length ? (
                <p className="text-gray-500 text-center py-4">No websites in this list yet.</p>
            ) : (
                <ul>
                  {websites.map((site, index) => {
                    const siteUrl = typeof site === 'string' ? site : site.url;
                    const favicon = typeof site === 'object' && site.icon ? site.icon : getFavicon(siteUrl);

                    return (
                        <li key={index} className="flex justify-between items-center p-2 border-b">
                          <div className="flex items-center">
                            {favicon && (
                                <img
                                    src={favicon}
                                    alt="Website Icon"
                                    className="w-5 h-5 mr-2"
                                    onError={(e) => (e.target.style.display = "none")}
                                />
                            )}
                            <span className="flex-1 truncate">{siteUrl}</span>
                          </div>
                          <button
                              onClick={() => removeBlockedWebsite(siteUrl)}
                              className="text-red-500 hover:text-red-700 ml-2"
                          >
                            <X size={16} />
                          </button>
                        </li>
                    );
                  })}
                </ul>
            )}
          </div>

          {/* Input for Adding Websites */}
          <div className="mt-auto">
            <div className="flex mb-4">
              <input
                  type="text"
                  value={newWebsite}
                  onChange={(e) => setNewWebsite(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter website URL (e.g., example.com)"
                  className="border p-2 flex-1 rounded-l"
              />
              <button
                  onClick={handleAddWebsite}
                  className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
              >
                Add
              </button>
            </div>

            {/* Done Button */}
            <div className="flex justify-end">
              <button
                  onClick={() => setShowListModal(false)}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
  );
};

export default BlockedWebsiteModal;
