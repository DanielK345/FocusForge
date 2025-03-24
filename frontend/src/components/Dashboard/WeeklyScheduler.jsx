import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import CalendarSidebar from './CalendarSidebar';
import CalendarView from './CalendarView';
import EventModal from './EventModal';
import AddListModal from './AddListModal';
import BlockedWebsiteModal from './BlockedWebsiteModal';
import { eventColors, getRandomEventColor } from './utils/colorUtils';
import { fetchUserData, saveUserData } from './utils/apiUtils';
import { validateUrl, getFavicon } from './utils/urlUtils';

const WeeklyScheduler = () => {
  const [showModal, setShowModal] = useState(false); //event modal
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState('2025-02-26');
  const calendarRef = useRef(null);
  const navigate = useNavigate();

  // State for blocked website lists
  const [blockedWebsiteLists, setBlockedWebsiteLists] = useState([]);
  const [showAddListModal, setShowAddListModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [activeList, setActiveList] = useState(null);
  const [newListName, setNewListName] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for calendar events
  const [calendarEventsMap, setCalendarEventsMap] = useState({});

  // Add new calendar
  const handleAddCalendar = () => {
    const calendarName = prompt('Enter calendar name:', 'New Calendar');
    if (!calendarName) return;

    // Lưu events của calendar hiện tại vào map
    if (activeCalendarId) {
        setCalendarEventsMap(prev => ({
            ...prev,
            [activeCalendarId]: calendarEvents
        }));
    }

    // Tạo ID mới bằng cách lấy ID lớn nhất hiện tại + 1
    const newCalendarId = Math.max(0, ...calendars.map(c => Number(c.id))) + 1;
    
    const newCalendar = {
        id: newCalendarId,
        name: calendarName,
        events: [],
        active: false
    };

    setCalendars(prev => {
        // Nếu chưa có calendar nào
        if (prev.length === 0) {
            setActiveCalendarId(newCalendarId);
            setCalendarEvents([]);
            setCalendarEventsMap({ [newCalendarId]: [] });
            return [{ ...newCalendar, active: true }];
        }

        // Nếu đã có calendar, tạo mới và giữ nguyên active calendar
        const updatedCalendars = [
            ...prev.map(cal => ({ ...cal, active: cal.id === activeCalendarId })),
            newCalendar
        ];

        // Cập nhật calendarEventsMap với calendar mới
        setCalendarEventsMap(prev => ({
            ...prev,
            [newCalendarId]: []
        }));

        return updatedCalendars;
    });
};

  // Activate calendar
  const handleCalendarActivate = (calendarId) => {
    // Lưu events của calendar hiện tại vào map (nếu có events)
    if (activeCalendarId && calendarEvents.length > 0) {
      setCalendarEventsMap(prev => {
        const updatedMap = { ...prev };
        updatedMap[activeCalendarId] = [...calendarEvents];
        return updatedMap;
      });
    }

    // Cập nhật active calendar
    setCalendars(prev => {
      const updatedCalendars = prev.map(cal => ({
        ...cal,
        active: cal.id === calendarId
      }));
      return updatedCalendars;
    });
    
    // Cập nhật activeCalendarId
    setActiveCalendarId(calendarId);

    // Load events của calendar mới
    const newCalendarEvents = calendarEventsMap[calendarId] || [];
    
    // Chỉ cập nhật state, không cần cập nhật view vì FullCalendar sẽ tự động render lại
    setCalendarEvents(newCalendarEvents);
  };

  // Update calendar name
  const handleCalendarNameChange = (calendarId, newName) => {
    setCalendars(prev => prev.map(cal =>
      cal.id === calendarId ? { ...cal, name: newName } : cal
    ));
  };

  // Delete calendar
  const handleCalendarDelete = (calendarId) => {
    // Do not allow deletion if there is only one calendar
    if (calendars.length <= 1) {
      alert("Cannot delete the only calendar.");
      return;
    }

    if (window.confirm('Are you sure you want to delete this calendar?')) {
      // Xóa calendar khỏi danh sách
      setCalendars(prev => {
        const newCalendars = prev.filter(cal => cal.id !== calendarId);
        // If we're deleting the active calendar, activate another one if available
        if (calendarId === activeCalendarId) {
          const newActiveId = newCalendars[0].id;
          setActiveCalendarId(newActiveId);
          
          // Cập nhật calendarEvents với sự kiện của calendar mới
          const newActiveEvents = calendarEventsMap[newActiveId] || [];
          setCalendarEvents(newActiveEvents);
          
          return newCalendars.map((cal, index) => 
            index === 0 ? { ...cal, active: true } : cal
          );
        }
        return newCalendars;
      });
      
      // Xóa calendar khỏi calendarEventsMap
      setCalendarEventsMap(prev => {
        const updatedMap = { ...prev };
        delete updatedMap[calendarId];
        return updatedMap;
      });
    }
  };

  const [calendars, setCalendars] = useState([]);
  const [activeCalendarId, setActiveCalendarId] = useState(null);

  const [history, setHistory] = useState([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);

  // Add to history whenever calendar events change
  const addToHistory = (events) => {
    const newHistory = history.slice(0, currentHistoryIndex + 1);
    newHistory.push([...events]);
    setHistory(newHistory);
    setCurrentHistoryIndex(newHistory.length - 1);
  };

  // Handle undo with Ctrl+Z
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'z' && currentHistoryIndex > 0) {
        setCurrentHistoryIndex(prev => prev - 1);
        setCalendarEvents(history[currentHistoryIndex - 1]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, currentHistoryIndex]);

  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const token = localStorage.getItem('token');
            const userID = localStorage.getItem('userID');

            if (!userID) {
                console.error("No user ID found. Redirecting to home...");
                navigate("/");
                return;
            }
            
            const { calendarsData, blocklistData } = await fetchUserData(userID, token);
            console.log("Calendars Data:", calendarsData);
            console.log("Blocklist Data:", blocklistData);
            
            // Xử lý dữ liệu calendar
            if (calendarsData && Array.isArray(calendarsData.calendars) && calendarsData.calendars.length > 0) {
                // Có dữ liệu calendar
                setCalendars(calendarsData.calendars);
                setActiveCalendarId(calendarsData.calendars[0].id);
                
                // Tạo map events cho từng calendar
                const eventsMap = {};
                calendarsData.calendars.forEach(calendar => {
                    eventsMap[calendar.id] = calendar.events || [];
                });
                setCalendarEventsMap(eventsMap);
                setCalendarEvents(eventsMap[calendarsData.calendars[0].id] || []);
            } else {
                // Không có dữ liệu calendar, tạo calendar mặc định
                const defaultCalendar = {
                    id: 1,
                    name: 'Default Calendar',
                    events: [],
                    active: true
                };
                setCalendars([defaultCalendar]);
                setActiveCalendarId(defaultCalendar.id);
                setCalendarEvents([]);
                setCalendarEventsMap({ [defaultCalendar.id]: [] });
            }

            // Xử lý dữ liệu blocklist
            console.log("Processing blocklist data:", blocklistData);
            if (blocklistData && blocklistData.lists && Array.isArray(blocklistData.lists) && blocklistData.lists.length > 0) {
                // Đảm bảo mỗi list có id dạng số và websites là mảng
                const processedLists = blocklistData.lists.map(list => ({
                    ...list,
                    id: Number(list.id),
                    websites: Array.isArray(list.websites) ? list.websites.map(site => {
                        if (typeof site === 'string') {
                            return { url: site, icon: null };
                        }
                        return {
                            url: site.url,
                            icon: site.icon || null
                        };
                    }) : []
                }));
                
                console.log("Setting blockedWebsiteLists:", processedLists);
                setBlockedWebsiteLists(processedLists);
            } else {
                // Tạo một list mặc định nếu không có dữ liệu
                console.log("No list data, creating default list");
                setBlockedWebsiteLists([{
                    id: 1,
                    name: 'Default List',
                    websites: []
                }]);
            }
        } catch (err) {
            console.error("Error loading data:", err);
            setError("Failed to load your calendar data. Please try refreshing the page.");
            // Initialize with empty data on error
            const defaultCalendar = {
                id: 1,
                name: 'Default Calendar',
                events: [],
                active: true
            };
            setCalendars([defaultCalendar]);
            setActiveCalendarId(defaultCalendar.id);
            setCalendarEvents([]);
            setBlockedWebsiteLists([{
                id: 1,
                name: 'Default List',
                websites: []
            }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    loadData();
  }, [navigate]);

  // Handle date change
  const handleDatesSet = (arg) => {
    setCurrentDate(arg.start.toISOString().slice(0, 10));
  };
  
  // Handle event click
  const handleEventClick = (info) => {
    // Đảm bảo ID là một chuỗi để so sánh nhất quán
    const eventId = String(info.event.id);
    
    // Lấy mô tả từ extendedProps
    const description = info.event.extendedProps?.description || '';
    
    const eventData = {
      id: eventId,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      description: description, // Thiết lập mô tả ở cấp cao nhất
      focusMode: Boolean(info.event.extendedProps?.focusMode),
      blocklistID: info.event.extendedProps?.blocklistID || null,
      backgroundColor: info.event.backgroundColor,
      borderColor: info.event.borderColor,
      textColor: info.event.textColor,
      colorIndex: info.event.extendedProps?.colorIndex || 0,
      extendedProps: {
        ...info.event.extendedProps,
        description: description, // Đồng thời thiết lập trong extendedProps
        focusMode: Boolean(info.event.extendedProps?.focusMode),
        blocklistID: info.event.extendedProps?.blocklistID || null
      }
    };
    
    setSelectedEvent(eventData);
    setShowModal(true);
  };

  // Handle event creation
  const handleDateSelect = (selectInfo) => {
    const title = prompt('Enter a title for your event:');
    if (title) {
        const calendarApi = selectInfo.view.calendar;
        calendarApi.unselect();
        
        const eventColor = getRandomEventColor(eventColors);
        const colorIndex = eventColors.findIndex(color => 
            color.backgroundColor === eventColor.backgroundColor);
        
        // Tạo ID số cho event mới
        const existingIds = calendarEvents.map(event => Number(event.id));
        const newEventId = Math.max(0, ...existingIds, 0) + 1;
        
        const newEvent = {
            id: String(newEventId), // Đảm bảo ID là chuỗi để so sánh nhất quán
            title,
            start: selectInfo.startStr,
            end: selectInfo.endStr,
            backgroundColor: eventColor.backgroundColor,
            borderColor: eventColor.borderColor,
            textColor: eventColor.textColor,
            description: '', // Thêm mô tả ở cấp cao nhất
            extendedProps: {
                description: '', // Đồng thời thiết lập trong extendedProps
                colorIndex: colorIndex,
                focusMode: false,
                blocklistID: null
            }
        };

        // Cập nhật calendarEvents
        const updatedEvents = Array.isArray(calendarEvents) ? [...calendarEvents, newEvent] : [newEvent];
        setCalendarEvents(updatedEvents);
        
        // Cập nhật calendarEventsMap cho calendar hiện tại
        setCalendarEventsMap(prev => {
            const updatedMap = { ...prev };
            updatedMap[activeCalendarId] = updatedEvents;
            return updatedMap;
        });
        
        // Thêm vào lịch sử
        addToHistory(updatedEvents);
    }
  };

  // Toggle event focus mode
  const toggleEventFocusMode = (eventId) => {
    setCalendarEvents(prevEvents => {
      const updatedEvents = prevEvents.map(event => {
        if (event.id === eventId) {
          const description = event.extendedProps?.description || event.description || '';
          
          return {
            ...event,
            description: description,
            extendedProps: {
              ...event.extendedProps,
              description: description,
              focusMode: !event.extendedProps?.focusMode
            }
          };
        }
        return event;
      });
      
      // Cập nhật calendarEventsMap cho calendar hiện tại
      setCalendarEventsMap(prev => {
        const updatedMap = { ...prev };
        updatedMap[activeCalendarId] = updatedEvents;
        return updatedMap;
      });
      
      return updatedEvents;
    });
  };

  // Xóa sự kiện
  const deleteEvent = (eventId) => {
    if (!eventId) {
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        // Lọc sự kiện cần xóa khỏi calendarEvents hiện tại
        const newEvents = calendarEvents.filter(event => {
          const currentEventId = String(event.id);
          return currentEventId !== String(eventId);
        });
        
        // Cập nhật calendarEvents
        setCalendarEvents(newEvents);
        
        // Cập nhật calendarEventsMap cho calendar hiện tại
        setCalendarEventsMap(prev => {
          const updatedMap = { ...prev };
          updatedMap[activeCalendarId] = newEvents;
          return updatedMap;
        });
        
        // Thêm vào lịch sử
        addToHistory(newEvents);
        
        // Đóng modal và xóa sự kiện đã chọn
        setShowModal(false);
        setSelectedEvent(null);
      } catch (error) {
        console.error("Error deleting event:", error);
      }
    }
  };

  // Export events as JSON
  const exportEvents = () => {
    const dataToExport = {
      userID: localStorage.getItem('userID'),
      calendarEvents: calendarEvents,
      blockedWebsiteLists: blockedWebsiteLists
    };

    const jsonData = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `calendar-export-${currentDate}.json`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Save events to server
  const saveEvents = async () => {
    const userID = localStorage.getItem('userID');

    if (!userID) {
        console.error("No user ID found");
        return;
    }

    try {
        // Ensure calendars data is properly structured
        const calendarsToSave = calendars.map(calendar => {
            const events = calendarEventsMap[calendar.id] || [];
            
            // Đảm bảo trạng thái active được thiết lập đúng
            const isActive = calendar.id === activeCalendarId;
            
            return {
                id: Number(calendar.id),
                name: calendar.name,
                events: events.map(event => {
                    // Lấy mô tả từ cả hai nguồn có thể
                    const description = event.extendedProps?.description || event.description || '';
                    
                    
                    return {
                        id: Number(event.id),
                        title: event.title,
                        start: event.start,
                        end: event.end,
                        backgroundColor: event.backgroundColor,
                        borderColor: event.borderColor,
                        textColor: event.textColor,
                        description: description, // Thêm description ở cấp cao nhất
                        extendedProps: {
                            description: description,
                            colorIndex: Number(event.extendedProps?.colorIndex || 0),
                            focusMode: Boolean(event.extendedProps?.focusMode),
                            blocklistID: event.extendedProps?.blocklistID ? Number(event.extendedProps.blocklistID) : null
                        }
                    };
                }),
                active: isActive // Sử dụng giá trị đã tính toán
            };
        });

        // Ensure blocklist data is properly structured
        const blockedWebsitesToSave = blockedWebsiteLists.map(list => {
            // Đảm bảo mỗi list có id dạng số và websites là mảng
            const id = typeof list.id === 'number' ? list.id : Number(list.id);
            const name = String(list.name || '');
            
            // Đảm bảo websites là mảng và có cấu trúc đúng
            let websites = [];
            if (Array.isArray(list.websites)) {
                websites = list.websites.map(site => {
                    if (typeof site === 'string') {
                        return { 
                            url: site,
                            icon: null
                        };
                    } else if (site && typeof site === 'object') {
                        return {
                            url: String(site.url || ''),
                            icon: site.icon || null
                        };
                    }
                    return null;
                }).filter(site => site && site.url); // Lọc bỏ các site không hợp lệ
            }
            
            return { id, name, websites };
        });

        console.log("Saving data to server...");

        const {eventsResponse, blocklistResponse} = await saveUserData(
            userID,
            calendarsToSave,
            blockedWebsitesToSave
        );
        
        if (!eventsResponse || !blocklistResponse) {
            throw new Error("Failed to get response from server");
        }

        const blocklistData = await blocklistResponse.json();
        const eventsData = await eventsResponse.json();
        
        if (!eventsResponse.ok) {
            throw new Error(eventsData.error || "Failed to save events");
        }

        if (!blocklistResponse.ok) {
            throw new Error(blocklistData.error || "Failed to save blocked websites");
        }

        alert("Events & Blocklist updated successfully! 🎉");
        console.log("Saved Events:", eventsData);
        console.log("Updated Blocklist:", blocklistData);
        
        // Cập nhật dữ liệu blocklist từ server nếu có
        if (blocklistData && blocklistData.lists && Array.isArray(blocklistData.lists)) {
            // Đảm bảo mỗi list có id dạng số và websites là mảng
            const processedLists = blocklistData.lists.map(list => ({
                ...list,
                id: Number(list.id),
                websites: Array.isArray(list.websites) ? list.websites.map(site => {
                    if (typeof site === 'string') {
                        return { url: site, icon: null };
                    }
                    return {
                        url: site.url,
                        icon: site.icon || null
                    };
                }) : []
            }));
            
            setBlockedWebsiteLists(processedLists);
        }
    } catch (error) {
        console.error("Error saving events:", error);
        alert(`Error: ${error.message}`);
    }
  };

  // Blocked websites management functions
  const addBlockedWebsiteList = (name) => {
    // Kiểm tra xem tên đã tồn tại chưa
    const existingNames = blockedWebsiteLists.map(list => list.name);
    let newName = name;
    let counter = 1;

    // Nếu tên đã tồn tại, thêm số vào sau
    while (existingNames.includes(newName)) {
        newName = `${name}(${counter})`;
        counter++;
    }

    // Tạo ID số cho list mới
    const existingIds = blockedWebsiteLists.map(list => Number(list.id));
    const newListId = Math.max(0, ...existingIds, 0) + 1;

    const newList = {
        id: newListId,
        name: newName,
        websites: []
    };

    // Lưu lại các sự kiện hiện tại để giữ thông tin focus mode
    const currentEvents = [...calendarEvents];

    setBlockedWebsiteLists(prevLists => {
        const updatedLists = [...prevLists, newList];
        
        // Cập nhật lại calendar events để giữ nguyên thông tin focus mode
        setCalendarEvents(currentEvents.map(event => ({
            ...event,
            extendedProps: {
                ...event.extendedProps,
                focusMode: event.extendedProps?.focusMode || false,
                blocklistID: event.extendedProps?.blocklistID || null
            }
        })));

        return updatedLists;
    });
  };

  const updateListName = (listId, newName) => {
    setBlockedWebsiteLists(prevLists => 
      prevLists.map(list => 
        list.id === listId ? { ...list, name: newName } : list
      )
    );
  };

  const removeBlockedWebsiteList = (listId) => {
    setBlockedWebsiteLists(prevLists => 
      prevLists.filter(list => list.id !== listId)
    );
    if (activeList === listId) {
      setActiveList(null);
      setShowListModal(false);
    }
  };

  const addBlockedWebsite = (url) => {
    const validatedUrl = validateUrl(url);
    if (validatedUrl && activeList) {
      setBlockedWebsiteLists(currentLists => {
        return currentLists.map(list => {
          if (list.id === activeList) {
            // Check if website already exists in this list
            const exists = list.websites.some(site => 
              (typeof site === 'string' ? site : site.url) === validatedUrl
            );
            
            if (!exists) {
              // Tạo website mới với cấu trúc đúng
              const newWebsite = {
                url: validatedUrl,
                icon: getFavicon(validatedUrl)
              };
              
              return {
                ...list,
                websites: [
                  ...list.websites,
                  newWebsite
                ]
              };
            }
          }
          return list;
        });
      });
    }
  };

  const removeBlockedWebsite = (url) => {
    if (activeList) {
      setBlockedWebsiteLists(currentLists => {
        return currentLists.map(list => {
          if (list.id === activeList) {
            // Lọc bỏ website cần xóa
            const updatedWebsites = list.websites.filter(site => {
              const siteUrl = typeof site === 'string' ? site : site.url;
              return siteUrl !== url;
            });
            
            return {
              ...list,
              websites: updatedWebsites
            };
          }
          return list;
        });
      });
    }
  };
  
  const handleListClick = (listId) => {
    setActiveList(listId);
    setShowListModal(true);
  };

  // Thêm hàm handleLogout
  const handleLogout = () => {
    // Xóa token và thông tin người dùng từ localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userID');
    
    // Chuyển hướng người dùng đến trang đăng nhập
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center bg-red-50 p-6 rounded-lg max-w-md">
          <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        <CalendarSidebar
          calendars={calendars}
          activeCalendarId={activeCalendarId}
          onCalendarActivate={handleCalendarActivate}
          onCalendarNameChange={handleCalendarNameChange}
          onCalendarDelete={handleCalendarDelete}
          onAddCalendar={handleAddCalendar}
          blockedWebsiteLists={blockedWebsiteLists}
          handleListClick={handleListClick}
          setShowAddListModal={setShowAddListModal}
          removeBlockedWebsiteList={removeBlockedWebsiteList}
        />
        
        <CalendarView
          calendarRef={calendarRef}
          calendarEvents={Array.isArray(calendarEvents) ? calendarEvents : []}
          handleDatesSet={handleDatesSet}
          handleEventClick={handleEventClick}
          handleDateSelect={handleDateSelect}
          exportEvents={exportEvents}
          saveEvents={saveEvents}
          blockedWebsiteLists={blockedWebsiteLists}
          handleLogout={handleLogout}
        />
      </div>
      
      {showModal && selectedEvent && (
        <>
          <EventModal
            selectedEvent={selectedEvent}
            setCalendarEvents={setCalendarEvents}
            setCalendarEventsMap={setCalendarEventsMap}
            activeCalendarId={activeCalendarId}
            setSelectedEvent={setSelectedEvent}
            eventColors={eventColors}
            deleteEvent={deleteEvent}
            setShowModal={setShowModal}
            blockedWebsiteLists={blockedWebsiteLists}
            toggleEventFocusMode={toggleEventFocusMode}
          />
        </>
      )}

      {showAddListModal && (
        <AddListModal
          newListName={newListName}
          setNewListName={setNewListName}
          addBlockedWebsiteList={addBlockedWebsiteList}
          setShowAddListModal={setShowAddListModal}
        />
      )}
      
      {showListModal && activeList && (
        <BlockedWebsiteModal
          blockedWebsiteLists={blockedWebsiteLists}
          activeList={activeList}
          newWebsite={newWebsite}
          setNewWebsite={setNewWebsite}
          addBlockedWebsite={addBlockedWebsite}
          removeBlockedWebsite={removeBlockedWebsite}
          updateListName={updateListName}
          setShowListModal={setShowListModal}
        />
      )}
    </div>
  );
};

export default WeeklyScheduler;