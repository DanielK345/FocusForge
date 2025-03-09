import React from 'react';
import { Pencil, Trash, Plus } from 'lucide-react';
import { getFavicon } from './utils/urlUtils';
import CalendarListItem from './CalendarListItem';

const CalendarSidebar = ({
  calendars,
  activeCalendarId,
  onCalendarActivate,
  onCalendarNameChange,
  onCalendarDelete,
  onAddCalendar,
  blockedWebsiteLists,
  handleListClick,
  setShowAddListModal,
  removeBlockedWebsiteList
}) => {
  console.log("CalendarSidebar received blockedWebsiteLists:", blockedWebsiteLists);
  
  // Đảm bảo blockedWebsiteLists là một mảng
  const websiteLists = Array.isArray(blockedWebsiteLists) ? blockedWebsiteLists : [];
  
  return (
    <div className="w-64 border-r flex flex-col">
      {/* Calendar Management */}
      <div className="p-4 flex-1">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Calendars</h2>
          <button 
            onClick={onAddCalendar}
            className="text-blue-500 hover:text-blue-700"
            title="Add new calendar"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="space-y-1">
          {calendars.map(calendar => (
            <CalendarListItem
              key={calendar.id}
              calendar={calendar}
              isActive={calendar.id === activeCalendarId}
              onActivate={onCalendarActivate}
              onNameChange={onCalendarNameChange}
              onDelete={onCalendarDelete}
            />
          ))}
        </div>
      </div>

      {/* Blocked Website Lists */}
      <div className="flex-1 border-t p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Blocked Websites</h2>
          <button 
            onClick={() => setShowAddListModal(true)}
            className="text-blue-500 hover:text-blue-700"
          >
            <Plus size={18} />
          </button>
        </div>

        {websiteLists.length > 0 ? (
          <ul className="space-y-2">
            {websiteLists.map((list) => (
              <WebsiteListItem
                key={list.id}
                list={list}
                handleListClick={handleListClick}
                removeBlockedWebsiteList={removeBlockedWebsiteList}
              />
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm text-center">No website lists yet.</p>
        )}
      </div>
    </div>
  );
};

const WebsiteListItem = ({ list, handleListClick, removeBlockedWebsiteList }) => {
  console.log("Rendering WebsiteListItem:", list);
  
  // Đảm bảo list.websites là một mảng
  const websites = Array.isArray(list.websites) ? list.websites : [];
  
  return (
    <li className="p-3 border border-gray-200 rounded-lg flex flex-col hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div 
          className="flex-1 cursor-pointer"
          onClick={() => handleListClick(list.id)}
        >
          <p className="font-medium text-gray-700 truncate">{list.name}</p>
          <p className="text-xs text-gray-500">
            {websites.length} {websites.length === 1 ? 'site' : 'sites'}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`Delete list "${list.name}"?`)) {
              removeBlockedWebsiteList(list.id);
            }
          }}
          className="text-red-500 hover:text-red-700 ml-2"
        >
          <Trash size={16} />
        </button>
      </div>

      {websites.length > 0 && (
        <div className="flex items-center gap-1 mt-2">
          {websites.slice(0, 3).map((site, index) => {
            const siteUrl = typeof site === 'string' ? site : site.url;
            const favicon = typeof site === 'object' && site.icon ? site.icon : getFavicon(siteUrl);
            return favicon ? (
              <img
                key={index}
                src={favicon}
                alt=""
                className="w-4 h-4 rounded bg-white border border-gray-200"
                onError={(e) => e.target.style.display = "none"}
              />
            ) : null;
          })}
          {websites.length > 3 && (
            <span className="text-xs text-gray-500 font-medium">
              +{websites.length - 3}
            </span>
          )}
        </div>
      )}
    </li>
  );
};

export default CalendarSidebar;