import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarPlus, Download, Pencil, Trash, X } from 'lucide-react';

const WeeklyScheduler = () => {

  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [calendars, setCalendars] = useState([{ id: 1, name: 'Default Calendar' }]);
  const [activeCalendar, setActiveCalendar] = useState(1);
  const [calendarEvents, setCalendarEvents] = useState({ 1: [] }); // Store events per calendar
  const [currentDate, setCurrentDate] = useState('2025-02-26');
  const calendarRef = useRef(null);
  const navigate = useNavigate();

  // State for blocked website lists
  const [blockedWebsiteLists, setBlockedWebsiteLists] = useState([]);
  const [activeList, setActiveList] = useState(1);
  const [newWebsite, setNewWebsite] = useState('');
  const [showListModal, setShowListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showAddListModal, setShowAddListModal] = useState(false);

  // Modified the colors to include both background and border colors for use with events
  const eventColors = [
    { backgroundColor: '#d1e7ff', borderColor: '#7cb0ff', textColor: '#333' }, // Blue
    { backgroundColor: '#d1ffdb', borderColor: '#7cff9c', textColor: '#333' }, // Green
    { backgroundColor: '#e7d1ff', borderColor: '#b37cff', textColor: '#333' }, // Purple
    { backgroundColor: '#ffd1e7', borderColor: '#ff7cb0', textColor: '#333' }, // Pink
    { backgroundColor: '#fff9d1', borderColor: '#ffe77c', textColor: '#333' }  // Yellow
  ];

  useEffect(() => { 
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      const userID = localStorage.getItem("userID");
  
      if (!userID) {
        console.error("No user ID found. Redirecting to home...");
        navigate("/");
        return;
      }
  
      try {
        const eventsResponse = await fetch(`http://localhost:5000/api/dashboard/events/get?userID=${userID}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        const blocklistResponse = await fetch(`http://localhost:5000/api/dashboard/blocklist/get?userID=${userID}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        // Parse both responses
        const eventsData = await eventsResponse.json();
        const blocklistData = await blocklistResponse.json();
  
        console.log("Blocklist Data:", blocklistData);
  
        if (!eventsResponse.ok) {
          console.error("Error fetching events:", eventsData.error);
        } else {
          console.log("Fetched Events:", eventsData);
  
          if (Array.isArray(eventsData.calendars) && eventsData.calendars.length > 0) {
            setCalendars(eventsData.calendars);
            const eventsByCalendar = {};
            eventsData.calendars.forEach((calendar) => {
              eventsByCalendar[calendar.id] = calendar.events || [];
            });
            setCalendarEvents(eventsByCalendar);
          } else {
            setCalendars([{ id: 1, name: 'Default Calendar' }]);
            setCalendarEvents({ 1: [] });
          }
        }
  
        if (blocklistResponse.ok) {
          if (blocklistData && Array.isArray(blocklistData.blockedLists)) {
            // Process and fetch favicons for each website
            const processedLists = blocklistData.blockedLists.map((list) => ({
              ...list,
              favicons: list.websites.map((website) => {
                try {
                  const domain = new URL(website).hostname;
                  return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
                } catch (error) {
                  console.error("Invalid URL:", website);
                  return null; // Return null for invalid URLs
                }
              }),
            }));
  
            setBlockedWebsiteLists(processedLists);
          } else {
            setBlockedWebsiteLists([{ id: 1, name: 'Default List', websites: [], favicons: [] }]);
          }
        } else {
          console.error("Error fetching blocklist:", blocklistData.error);
          setBlockedWebsiteLists([{ id: 1, name: 'Default List', websites: [], favicons: [] }]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setCalendars([{ id: 1, name: 'Default Calendar' }]);
        setCalendarEvents({ 1: [] });
        setBlockedWebsiteLists([{ id: 1, name: 'Default List', websites: [], favicons: [] }]);
      }
    };
  
    fetchData();
  }, [navigate]);
  
  



  // Get a random color object for events
  function getRandomEventColor() {
    const randomIndex = Math.floor(Math.random() * eventColors.length);
    return eventColors[randomIndex];
  }

  // Handle date change
  const handleDatesSet = (arg) => {
    setCurrentDate(arg.start.toISOString().slice(0, 10));
  };
  
  // Handle event click - Modified to include color information
  const handleEventClick = (info) => {
    setSelectedEvent({
      id: info.event.id,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      description: info.event.extendedProps.description || '',
      backgroundColor: info.event.backgroundColor,
      borderColor: info.event.borderColor,
      textColor: info.event.textColor,
      colorIndex: info.event.extendedProps.colorIndex || 0 // Store color index for selection
    });
    setShowModal(true);
  };

  // Handle event creation
  const handleDateSelect = (selectInfo) => {
    const title = prompt('Enter a title for your event:');
    if (title) {
      const calendarApi = selectInfo.view.calendar;
      calendarApi.unselect(); // Clear date selection
      
      // Get a random color for the new event
      const eventColor = getRandomEventColor();
      const colorIndex = eventColors.findIndex(color => 
        color.backgroundColor === eventColor.backgroundColor);
      
      const newEvent = {
        id: String(Date.now()), // Use timestamp for unique ID
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        backgroundColor: eventColor.backgroundColor,
        borderColor: eventColor.borderColor,
        textColor: eventColor.textColor,
        extendedProps: {
          description: '', // Initialize with empty description
          colorIndex: colorIndex // Store the color index for future reference
        }
      };
      
      setCalendarEvents({
        ...calendarEvents,
        [activeCalendar]: [...(calendarEvents[activeCalendar] || []), newEvent] // Save event to active calendar
      });
    }
  };

  // Add a new blank calendar
  const addNewCalendar = () => {
    // Prompt for calendar name
    const calendarName = prompt('Enter a name for your new calendar:', `Calendar ${calendars.length + 1}`);
    
    if (calendarName) {
      const newCalendarId = calendars.length + 1;
      
      // Create new empty calendar with no events
      const newCalendar = {
        id: newCalendarId,
        name: calendarName,
        events: []
      };
      
      // Add new calendar to state
      setCalendars([...calendars, newCalendar]);
      
      // Set the new calendar as active
      setActiveCalendar(newCalendarId);
      
      // Initialize empty events for new calendar
      setCalendarEvents({
        ...calendarEvents,
        [newCalendarId]: []
      });
      
      // Reset calendar view
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.removeAllEvents(); // Clear events from UI
        calendarApi.today(); // Reset to today
      }
    }
  };

  // Add function to switch between calendars
  const switchCalendar = (calendarId) => {
    setActiveCalendar(calendarId);
  
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.removeAllEvents(); // Clear current events
  
      // Re-add the selected calendar's events
      if (calendarEvents[calendarId]) {
        calendarEvents[calendarId].forEach(event => {
          calendarApi.addEvent(event);
        });
      }
    }
  };
  
  // Delete calendar
  const deleteCalendar = (calendarId, e) => {
    e.stopPropagation(); // Prevent triggering calendar selection
    
    // Don't allow deleting the last calendar
    if (calendars.length <= 1) {
      alert("You cannot delete the only calendar.");
      return;
    }
    
    // Confirm deletion
    if (window.confirm(`Are you sure you want to delete this calendar and all its events?`)) {
      // Remove calendar from state
      const updatedCalendars = calendars.filter(cal => cal.id !== calendarId);
      setCalendars(updatedCalendars);
      
      // Remove events for this calendar
      const { [calendarId]: _, ...remainingEvents } = calendarEvents;
      setCalendarEvents(remainingEvents);
      
      // If the active calendar was deleted, switch to another calendar
      if (activeCalendar === calendarId) {
        const newActiveCalendar = updatedCalendars[0]?.id || 1;
        setActiveCalendar(newActiveCalendar);
      }
    }
  };

  // Delete an event
  const deleteEvent = (eventId) => {
    if (activeCalendar in calendarEvents) {
      // Filter out the event with the given ID from the active calendar
      const updatedCalendarEvents = {
        ...calendarEvents,
        [activeCalendar]: calendarEvents[activeCalendar].filter(event => event.id !== eventId)
      };
      
      setCalendarEvents(updatedCalendarEvents);
      setShowModal(false);
      setSelectedEvent(null);
    }
  };

  // Export events as JSON
  const exportEvents = () => {
    const dataToExport = {
        calendars: calendars.map(calendar => ({
            id: calendar.id,
            name: calendar.name,
            events: calendarEvents[calendar.id] || []
        }))
    };

    const jsonData = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `calendar-export-${currentDate}.json`;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // SAVE EVENTS TO SERVER
const saveEvents = async () => {
  console.log("Blocked Websites Before Sending:", blockedWebsiteLists); // ✅ Check state before fetch
  const userID = localStorage.getItem("userID");

  if (!userID) {
    console.error("User not logged in.");
    alert("You must be logged in to save events.");
    return;
  }

  // Prepare JSON data for events
  const dataToSave = {
    userID,
    calendars: calendars.map(calendar => ({
      id: calendar.id,
      name: calendar.name,
      events: calendarEvents[calendar.id] || [],
    })),
  };

  // FIXED: Use blockedLists instead of lists to match the API expectation
  const blocklistToSave = {
    userID,
    blockedLists: blockedWebsiteLists  // Changed from lists to blockedLists to match API
  };

  try {
    // Save events first, then update blocklist
    const eventsResponse = await fetch("http://localhost:5000/api/dashboard/events/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSave),
    });

    const eventsData = await eventsResponse.json();

    if (!eventsResponse.ok) {
      throw new Error(eventsData.error || "Failed to save events");
    }

    // Now update blocklist
    const blocklistResponse = await fetch("http://localhost:5000/api/dashboard/blocklist/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(blocklistToSave),
    });

    const blocklistData = await blocklistResponse.json();

    if (!blocklistResponse.ok) {
      throw new Error(blocklistData.error || "Failed to update blocklist");
    }

    alert("Events & Blocklist updated successfully! 🎉");
    console.log("Saved Events:", eventsData);
    console.log("Updated Blocklist:", blocklistData);
  } catch (error) {
    console.error("Error saving data:", error);
    alert("Something went wrong. Please try again.");
  }
};


  // Function to validate and format URL
  const validateUrl = (url) => {
    if (!url.trim()) return '';
    
    // Add protocol if missing
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    
    try {
      new URL(url);
      return url;
    } catch (e) {
      return '';
    }
  };

  // Add website to selected list - FIXED VERSION
const addBlockedWebsite = () => {
  const validatedUrl = validateUrl(newWebsite);
  if (validatedUrl) {
    // Create a deep copy of the current state
    const updatedLists = blockedWebsiteLists.map(list => {
      if (list.id === activeList) {
        // Make sure websites exists and is an array before spreading
        const currentWebsites = Array.isArray(list.websites) ? list.websites : [];
        return { 
          ...list, 
          websites: [...currentWebsites, validatedUrl] 
        };
      }
      return list;
    });
    
    // Set the updated state
    setBlockedWebsiteLists(updatedLists);
    
    // Debug log to confirm website was added
    console.log("Website added:", validatedUrl);
    console.log("Updated lists:", updatedLists);
    
    setNewWebsite('');
  } else {
    alert("Please enter a valid URL");
  }
};

  // Remove website from list
  const removeBlockedWebsite = (url) => {
    setBlockedWebsiteLists(blockedWebsiteLists.map(list =>
      list.id === activeList
        ? { ...list, websites: list.websites.filter(site => site !== url) }
        : list
    ));
  };

  // Add a new blocked website list
  const addBlockedWebsiteList = () => {
    if (newListName.trim()) {
      const newList = { id: Date.now(), name: newListName.trim(), websites: [] };
      setBlockedWebsiteLists([...blockedWebsiteLists, newList]);
      setNewListName('');
      setShowAddListModal(false);
    }
  };

  // Remove a blocked website list
  const removeBlockedWebsiteList = (listId) => {
    // Don't allow deleting the last list
    if (blockedWebsiteLists.length <= 1) {
      alert("You cannot delete the only list.");
      return;
    }
    
    setBlockedWebsiteLists(blockedWebsiteLists.filter(list => list.id !== listId));
    if (activeList === listId) {
      setActiveList(blockedWebsiteLists[0]?.id || null);
    }
  };

  // Open the modal to manage websites in a list
  const openListModal = (listId) => {
    setActiveList(listId);
    setShowListModal(true);
  };

  // Function to get favicon URL
  const getFavicon = (url) => {
    try {
      return `https://www.google.com/s2/favicons?sz=32&domain=${new URL(url).hostname}`;
    } catch (e) {
      return '';
    }
  };

  function getDomain(url) {
    try {
      // Handle cases where the URL might not have http/https prefix
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      const urlObject = new URL(url);
      return urlObject.hostname;
    } catch (error) {
      // Return the original string if it's not a valid URL
      return url;
    }
  }

  // Handle keypress for website input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addBlockedWebsite();
    }
  };

  return (
    <div className="flex flex-col h-screen">
      
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r flex flex-col">
         
          {/* Calendar list */}
          <div className="p-4 flex-1">
            <div className="flex justify-between items-center mb-4">
              <div className="font-semibold">Calendar List</div>
              <button 
                onClick={addNewCalendar}
                className="text-blue-600"
                title="Add New Calendar"
              >
                <CalendarPlus size={16} />
              </button>
            </div>
            
            <ul>
              {calendars.map(cal => (
                <li 
                  key={cal.id} 
                  className={`p-1 flex justify-between items-center cursor-pointer hover:bg-gray-100 rounded ${activeCalendar === cal.id ? 'font-bold bg-gray-50' : ''}`}
                  onClick={() => switchCalendar(cal.id)}
                >
                  {cal.isEditing ? (
                    <input
                      type="text"
                      value={cal.name}
                      onChange={(e) => {
                        setCalendars(calendars.map(c => 
                          c.id === cal.id ? { ...c, name: e.target.value } : c
                        ));
                      }}
                      onBlur={() => {
                        setCalendars(calendars.map(c => 
                          c.id === cal.id ? { ...c, isEditing: false } : c
                        ));
                      }}
                      className="border p-1 rounded w-full text-sm"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span 
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setCalendars(calendars.map(c => 
                          c.id === cal.id ? { ...c, isEditing: true } : c
                        ));
                      }} 
                      className="flex-grow"
                    >
                      {cal.name}
                    </span>
                  )}

                  <button 
                    className="text-gray-400 hover:text-red-500 p-1"
                    onClick={(e) => deleteCalendar(cal.id, e)}
                    title="Delete Calendar"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Blocked Website Lists (Lower Half) - FIXED */}
          <div className="flex-1 border-t p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">Blocked Websites</h2>
              <button 
                onClick={() => setShowAddListModal(true)} 
                className="text-blue-600 hover:text-blue-800"
              >
                <CalendarPlus size={16} />
              </button>
            </div>
            <ul>
              {blockedWebsiteLists.map((list) => (
                <li 
                  key={list.id} 
                  className="p-2 border-b flex justify-between items-center cursor-pointer hover:bg-gray-100 rounded-lg px-3 py-2"
                  onClick={() => openListModal(list.id)}
                >
                  {/* Left Side: Icons + Website Name */}
                  <div className="flex items-center gap-2">
                    {/* Display first 3 website favicons */}
                    <div className="flex items-center">
                      {Array.isArray(list.favicons) && list.favicons.slice(0, 3).map((favicon, index) => (
                        favicon && (
                          <img 
                            key={index} 
                            src={favicon} 
                            alt="Website Icon" 
                            className="w-5 h-5 rounded-md mr-1" 
                            onError={(e) => e.target.style.display = "none"} // Hide if image fails to load
                          />
                        )
                      ))}
                    </div>
                    
                    {/* Show first website's domain name */}
                    <span className="text-gray-700 text-sm">
                      {Array.isArray(list.websites) && list.websites.length > 0 
                        ? (() => {
                            try {
                              return new URL(list.websites[0]).hostname;
                            } catch {
                              return list.websites[0];
                            }
                          })()
                        : "No websites"
                      }
                    </span>
                    
                    {/* Show "+X more" if more than 3 websites */}
                    {Array.isArray(list.websites) && list.websites.length > 3 && (
                      <span className="text-gray-400 text-xs">
                        & {list.websites.length - 3} more
                      </span>
                    )}
                  </div>
                  
                  {/* Right Side: Edit and Delete Buttons */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        openListModal(list.id); 
                      }} 
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Pencil size={14} />
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        removeBlockedWebsiteList(list.id); 
                      }} 
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>


        </div>
        
        {/* Calendar view */}
        <div className="flex-1 flex flex-col">
          {/* Top section with buttons */}
            <div className="flex items-center gap-2 p-2 border-b">
              <button 
                onClick={exportEvents} 
                className="flex items-center gap-1 bg-blue-600 text-white rounded px-3 py-1 text-sm"
              >
                <Download size={14} />
                <span>Export</span>
              </button>

              <button 
                onClick={saveEvents} 
                className="flex items-center gap-1 bg-blue-600 text-white rounded px-3 py-1 text-sm"
              >
                <span>Save</span>
              </button>
            </div>
          
          {/* Calendar grid */}
          <div className="flex-1 p-2">
            <FullCalendar
              ref={calendarRef}
              plugins={[timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={false}
              events={calendarEvents[activeCalendar] || []}
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              datesSet={handleDatesSet}
              eventClick={handleEventClick}
              select={handleDateSelect}
              height="calc(100vh - 160px)"
              slotMinTime="05:00:00"
              slotMaxTime="24:00:00"
              allDaySlot={false}
              slotDuration="00:15:00"
              slotLabelFormat={{
                hour: 'numeric',
                minute: '2-digit',
                meridiem: false,
                hour12: false
              }}
              eventTimeFormat={{
                hour: 'numeric',
                minute: '2-digit',
                meridiem: false,
                hour12: false
              }}
              dayHeaderFormat={{
                weekday: 'short',
                omitCommas: true
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Event modal */}
      {showModal && selectedEvent && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div 
            className="bg-white p-6 rounded-lg shadow-lg w-96"
            onClick={(e) => e.stopPropagation()}
          >
            <label className="block text-sm font-medium text-gray-700 mb-1">Title:</label>
            <input
              type="text"
              value={selectedEvent.title}
              onChange={(e) => setSelectedEvent(prev => ({ ...prev, title: e.target.value }))}
              className="w-full border rounded p-2 text-sm mb-3"
            />
            
            <label className="block text-sm font-medium text-gray-700">Description:</label>
            <textarea
              value={selectedEvent.description}
              onChange={(e) => setSelectedEvent(prev => ({ ...prev, description: e.target.value }))}
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
                  onClick={() => setSelectedEvent(prev => ({ 
                    ...prev, 
                    backgroundColor: color.backgroundColor,
                    borderColor: color.borderColor,
                    textColor: color.textColor,
                    colorIndex: index
                  }))}
                ></button>
              ))}
            </div>
            
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Start:</span> {new Date(selectedEvent.start).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-semibold">End:</span> {new Date(selectedEvent.end).toLocaleString()}
            </p>
            <div className="flex justify-end gap-2">
              <button 
                className="px-4 py-2 border rounded-lg hover:bg-gray-200"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                onClick={() => {
                  // Update the event with the modified title, description and color
                  setCalendarEvents(prev => {
                    const updatedEvents = prev[activeCalendar].map(event =>
                      event.id === selectedEvent.id ? { 
                        ...event, 
                        title: selectedEvent.title,
                        backgroundColor: selectedEvent.backgroundColor,
                        borderColor: selectedEvent.borderColor,
                        textColor: selectedEvent.textColor,
                        extendedProps: {
                          ...event.extendedProps,
                          description: selectedEvent.description,
                          colorIndex: selectedEvent.colorIndex
                        }
                      } : event
                    );
                    return { ...prev, [activeCalendar]: updatedEvents };
                  });

                  // Force re-render by updating events state
                  setEvents([...calendarEvents[activeCalendar]]);

                  setShowModal(false);
                }}
              >
                Save
              </button>
              <button 
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                onClick={() => deleteEvent(selectedEvent.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blocked Websites Modal - FIXED */}
      {showListModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[80vh] flex flex-col">
            <h2 className="text-xl font-bold mb-4">
              {blockedWebsiteLists.find(list => list.id === activeList)?.name || 'Manage Blocked Websites'}
            </h2>
            
            <div className="overflow-y-auto mb-4 flex-1">
              {blockedWebsiteLists.find(list => list.id === activeList)?.websites.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No websites in this list yet.</p>
              ) : (
                <ul>
                  {blockedWebsiteLists.find(list => list.id === activeList)?.websites.map(site => (
                    <li key={site} className="flex justify-between items-center p-2 border-b">
                      <div className="flex items-center">
                        <img 
                          src={getFavicon(site)} 
                          alt="" 
                          className="w-5 h-5 mr-2"
                          onError={(e) => {e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>'}}
                        />
                        <span className="flex-1 truncate">{site}</span>
                      </div>
                      <button 
                        onClick={() => removeBlockedWebsite(site)} 
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <X size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
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
                  onClick={addBlockedWebsite} 
                  className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
                >
                  Add
                </button>
              </div>
              
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
      )}

      {/* Add List Modal */}
      {showAddListModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80">
            <h2 className="text-xl font-bold mb-4">Add New List</h2>
            <input 
              type="text" 
              value={newListName} 
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Enter list name" 
              className="border p-2 w-full mb-4 rounded"
              onKeyPress={(e) => e.key === 'Enter' && addBlockedWebsiteList()}
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowAddListModal(false)} 
                className="px-4 py-2 border rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button 
                onClick={addBlockedWebsiteList} 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={!newListName.trim()}
              >
                Add List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyScheduler;