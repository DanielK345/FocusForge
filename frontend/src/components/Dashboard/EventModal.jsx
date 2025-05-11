import React from 'react';
import { getFavicon } from './utils/urlUtils';

const EventModal = ({
  selectedEvent,
  setSelectedEvent,
  setCalendarEvents,
  setCalendarEventsMap,
  activeCalendarId,
  eventColors,
  deleteEvent,
  setShowModal,
  blockedWebsiteLists,
  setHasUnsavedChanges
}) => {
  // Đảm bảo mô tả được hiển thị đúng
  const description = selectedEvent.extendedProps?.description || selectedEvent.description || '';
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="bg-white p-6 rounded-lg shadow-lg w-96"
        onClick={(e) => e.stopPropagation()}
      >
        <label className="block text-sm font-medium text-gray-700 mb-1">Title:</label>
        <input
          type="text"
          value={selectedEvent.title}
          onChange={(e) => {
            setSelectedEvent(prev => ({ ...prev, title: e.target.value }));
            setHasUnsavedChanges(true);
          }}
          className="w-full border rounded p-2 text-sm mb-3"
        />

        <label className="block text-sm font-medium text-gray-700">Description:</label>
        <textarea
          value={description}
          onChange={(e) => {
            const newDescription = e.target.value;
            setSelectedEvent(prev => ({ 
              ...prev, 
              description: newDescription,
              extendedProps: {
                ...prev.extendedProps,
                description: newDescription
              }
            }));
            setHasUnsavedChanges(true);
          }}
          className="w-full border rounded p-2 text-sm mb-4"
          rows="3"
        ></textarea>

        <label className="block text-sm font-medium text-gray-700 mb-2">Color:</label>
        <div className="flex gap-2 mb-4">
          {eventColors.map((color, index) => (
            <button
              key={index}
              className={`w-8 h-8 rounded-full border-2 ${selectedEvent.colorIndex === index ? 'ring-2 ring-blue-500' : ''}`}
              style={{ backgroundColor: color.backgroundColor, borderColor: color.borderColor }}
              onClick={() => {
                setSelectedEvent(prev => ({
                  ...prev,
                  backgroundColor: color.backgroundColor,
                  borderColor: color.borderColor,
                  textColor: color.textColor,
                  colorIndex: index
                }));
                setHasUnsavedChanges(true);
              }}
            ></button>
          ))}
        </div>

        {/* ✅ Focus Mode Toggle Button */}
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="focusMode"
            checked={selectedEvent.focusMode || false}
            onChange={() => {
              const newFocusMode = !(selectedEvent.focusMode || false);
              setSelectedEvent(prev => ({
                ...prev,
                focusMode: newFocusMode,
                blocklistID: newFocusMode ? (prev.blocklistID || null) : null
              }));
              setHasUnsavedChanges(true);
            }}
            className="mr-2"
          />
          <label htmlFor="focusMode" className="text-sm font-medium text-gray-700">
            Enable Focus Mode
          </label>
        </div>

        {/* ✅ Blocklist Selection (Only when Focus Mode is ON) */}
        {selectedEvent.focusMode && blockedWebsiteLists && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Blocklist:</label>
            <div className="relative">
              <select
                className="w-full border rounded p-2 text-sm"
                value={selectedEvent.blocklistID || ""}
                onChange={(e) => {
                  const newBlocklistID = e.target.value;
                  setSelectedEvent(prev => ({
                    ...prev,
                    blocklistID: newBlocklistID ? String(newBlocklistID) : null
                  }));
                  setHasUnsavedChanges(true);
                }}
              >
                <option value="">-- Choose a Blocklist --</option>
                {(blockedWebsiteLists ?? []).map(list => (
                  <option key={list.id} value={list.id} className="py-2">
                    {list.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Preview of selected list */}
            {selectedEvent.blocklistID && (
              <div className="mt-2">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Blocked websites:</h3>
                <div className="max-h-40 overflow-y-auto bg-gray-50 rounded p-2">
                  {blockedWebsiteLists.find(list => String(list.id) === String(selectedEvent.blocklistID))?.websites.map((site, index) => {
                    const siteUrl = typeof site === 'string' ? site : site.url;
                    const favicon = site.icon || getFavicon(siteUrl);
                    return (
                      <div key={index} className="flex items-center gap-2 py-1 border-b border-gray-200 last:border-0">
                        <img
                          src={favicon}
                          alt=""
                          className="w-4 h-4 rounded"
                          onError={(e) => e.target.style.display = "none"}
                        />
                        <span className="text-sm text-gray-600 truncate">
                          {siteUrl}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          
          </div>
        )}

        <p className="text-sm text-gray-600">
          <span className="font-semibold">Start:</span> {new Date(selectedEvent.start).toLocaleString()}
        </p>
        <p className="text-sm text-gray-600 mb-4">
          <span className="font-semibold">End:</span> {new Date(selectedEvent.end).toLocaleString()}
        </p>

        <div className="flex justify-end gap-2">
          
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={() => {
              // Đảm bảo description được lấy từ cả hai nguồn có thể
              const description = selectedEvent.extendedProps?.description || selectedEvent.description || '';
              
              // Tạo sự kiện mới với mô tả được cập nhật
              const updatedEvent = {
                id: selectedEvent.id,
                title: selectedEvent.title,
                start: selectedEvent.start,
                end: selectedEvent.end,
                backgroundColor: selectedEvent.backgroundColor,
                borderColor: selectedEvent.borderColor,
                textColor: selectedEvent.textColor,
                display: 'block',
                description: description, // Thêm description ở cấp cao nhất
                extendedProps: {
                  description: description, // Đảm bảo description trong extendedProps
                  colorIndex: selectedEvent.colorIndex || 0,
                  focusMode: Boolean(selectedEvent.focusMode),
                  blocklistID: selectedEvent.blocklistID || null
                }
              };

              // Cập nhật calendarEvents
              setCalendarEvents(prevEvents => {
                if (!prevEvents || !Array.isArray(prevEvents)) {
                  return [updatedEvent];
                }
                
                // Tạo danh sách sự kiện mới với sự kiện được cập nhật
                const newEvents = prevEvents.map(event => {
                  if (String(event.id) === String(updatedEvent.id)) {
                    // Đảm bảo mô tả được lưu ở cả hai vị trí
                    return {
                      ...updatedEvent,
                      description: description,
                      extendedProps: {
                        ...updatedEvent.extendedProps,
                        description: description
                      }
                    };
                  }
                  return event;
                });
                
                // Cập nhật calendarEventsMap cho calendar hiện tại
                setCalendarEventsMap(prev => {
                  const updatedMap = { ...prev };
                  updatedMap[activeCalendarId] = newEvents;
                  return updatedMap;
                });
                
                return newEvents;
              });

              // Đóng modal
              setShowModal(false);
            }}
          >
            Save
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            onClick={() => {
              if (selectedEvent && selectedEvent.id) {
                deleteEvent(selectedEvent.id);
              } else {
                console.error("Cannot delete event: No valid event ID");
                alert("Cannot delete event: No valid event ID");
              }
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
