import React from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { getFavicon } from './utils/urlUtils';

const CalendarView = ({
                          calendarRef,
                          calendarEvents,
                          handleDatesSet,
                          handleEventClick,
                          handleDateSelect,
                          exportEvents,
                          saveEvents,
                          blockedWebsiteLists,
                          handleLogout
                      }) => {

    return (
        <div className="flex-1 p-2">
            <FullCalendar
                ref={calendarRef}
                plugins={[timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={false}
                events={calendarEvents}
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
                    hour: "numeric",
                    minute: "2-digit",
                    meridiem: false,
                    hour12: false,
                }}
                eventTimeFormat={{
                    hour: "numeric",
                    minute: "2-digit",
                    meridiem: false,
                    hour12: false,
                }}
                dayHeaderFormat={{
                    weekday: "short",
                    omitCommas: true,
                }}
                eventContent={(arg) => {
                    const { event } = arg;
                    console.log("Rendering event:", {
                        event,
                        extendedProps: event.extendedProps,
                        description: event.extendedProps?.description || event._def?.extendedProps?.description || '',
                        focusMode: event.extendedProps?.focusMode,
                        blocklistID: event.extendedProps?.blocklistID,
                        allBlocklists: blockedWebsiteLists
                    });
                    
                    const focusMode = Boolean(event.extendedProps?.focusMode);
                    const blocklistID = event.extendedProps?.blocklistID;
                    
                    // Tìm list bằng cả hai cách (để debug)
                    const selectedListById = blockedWebsiteLists.find(list => list.id === blocklistID);
                    const selectedListByStringId = blockedWebsiteLists.find(list => String(list.id) === String(blocklistID));
                    
                    console.log("List finding debug:", {
                        blocklistID,
                        selectedListById,
                        selectedListByStringId,
                        allListIds: blockedWebsiteLists.map(l => ({id: l.id, type: typeof l.id}))
                    });

                    const selectedList = selectedListByStringId || selectedListById;
                    const websites = selectedList?.websites || [];

                    return (
                        <div
                            className={`absolute inset-0 flex flex-col p-1 rounded-md ${
                                focusMode
                                    ? 'bg-red-100 border-2 border-red-500'
                                    : 'bg-opacity-80'
                            }`}
                        >
                            <div className="flex-1 flex flex-col">
                                <div className="text-[20px] font-semibold">
                                    {event.title}
                                </div>
                                {focusMode && selectedList && (
                                    <div className="flex items-center gap-2 mt-1">
                                        {websites.slice(0, 3).map((site, index) => {
                                            const siteUrl = typeof site === 'string' ? site : site.url;
                                            const favicon = site.icon || getFavicon(siteUrl);
                                            return favicon ? (
                                                <img
                                                    key={index}
                                                    src={favicon}
                                                    alt=""
                                                    className="w-5 h-5 rounded-[1px]"
                                                    onError={(e) => e.target.style.display = "none"}
                                                />
                                            ) : null;
                                        })}
                                        {websites.length > 3 && (
                                            <span className="text-[9px] text-red-500 font-medium">
                                                +{websites.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                }}
            />

            <div className="flex items-center gap-2 p-2 border-t">
                <button
                    onClick={exportEvents}
                    className="flex items-center gap-1 bg-blue-600 text-white rounded px-3 py-1 text-sm"
                >
                    Export
                </button>

                <button
                    onClick={saveEvents}
                    className="flex items-center gap-1 bg-green-600 text-white rounded px-3 py-1 text-sm"
                >
                    Save
                </button>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 bg-red-600 text-white rounded px-3 py-1 text-sm ml-auto"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default CalendarView;