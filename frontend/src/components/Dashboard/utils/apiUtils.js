import API from '../../../config';

export async function fetchUserData(userID, token){
    try {
      const eventsResponse = await fetch(`${API.baseURL}${API.endpoints.dashboard.events.fetch}/get?userID=${userID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const blocklistResponse = await fetch(`${API.baseURL}${API.endpoints.dashboard.blocklist.fetch}/get?userID=${userID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Parse both responses
      const calendarsData = await eventsResponse.json();
      const blocklistData = await blocklistResponse.json();
      
      // Đảm bảo mô tả được thiết lập đúng cách cho mỗi sự kiện
      if (calendarsData && calendarsData.calendars) {
        calendarsData.calendars.forEach(calendar => {
          if (calendar.events) {
            calendar.events.forEach(event => {
              // Đảm bảo mô tả được lưu ở cả hai vị trí
              const description = event.extendedProps?.description || '';
              event.description = description;
              if (event.extendedProps) {
                event.extendedProps.description = description;
              }
            });
          }
        });
      }
      
      // Đảm bảo dữ liệu blocklist có cấu trúc đúng
      if (blocklistData) {
        // Nếu không có lists, tạo một mảng rỗng
        if (!blocklistData.lists) {
          blocklistData.lists = [];
        }
        
        // Nếu lists không phải là mảng, chuyển đổi thành mảng
        if (!Array.isArray(blocklistData.lists)) {
          if (typeof blocklistData.lists === 'object') {
            blocklistData.lists = Object.values(blocklistData.lists);
          } else {
            blocklistData.lists = [];
          }
        }
        
        // Đảm bảo mỗi list có id dạng số
        blocklistData.lists.forEach(list => {
          if (list.id) {
            list.id = Number(list.id);
          }
          
          // Đảm bảo websites là một mảng
          if (!list.websites) {
            list.websites = [];
          }
          
          // Đảm bảo mỗi website có cấu trúc đúng
          list.websites = list.websites.map(site => {
            if (typeof site === 'string') {
              return { url: site, icon: null };
            }
            return site;
          });
        });
      }

      return { calendarsData, blocklistData };
    } catch (error) {
        console.error("Error fetching data:", error);
        return { calendarsData: null, blocklistData: null };
    }
}

export async function saveUserData(userID, calendars, blockedWebsites) {
    if (!userID) {
        console.error("User not logged in.");
        alert("You must be logged in to save events.");
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        console.error("No authentication token found");
        alert("Authentication token missing. Please log in again.");
        return;
    }

    // Prepare JSON data for calendars
    const dataToSave = {
        userID,
        calendars: calendars.map(calendar => {
            // Đảm bảo trạng thái active là boolean
            const isActive = Boolean(calendar.active);
            
            return {
                id: Number(calendar.id),
                name: calendar.name,
                events: calendar.events || [],
                active: isActive
            };
        })
    };

    // Prepare JSON data for blocklist
    let blocklistToSave = {
        userID: userID,
        blockedLists: [] // Đổi tên từ lists thành blockedLists theo yêu cầu của backend
    };
    
    // Đảm bảo dữ liệu blocklist có cấu trúc đúng
    if (typeof blockedWebsites !== 'object') {
        blocklistToSave.blockedLists = [];
    } else if (Array.isArray(blockedWebsites)) {
        // Nếu blockedWebsites là một mảng, sử dụng nó trực tiếp
        blocklistToSave.blockedLists = blockedWebsites.map(list => {
            // Đảm bảo id là số
            const id = typeof list.id === 'number' ? list.id : Number(list.id);
            
            // Đảm bảo name là string
            const name = String(list.name || '');
            
            // Đảm bảo websites là mảng và có cấu trúc đúng
            let websites = [];
            if (Array.isArray(list.websites)) {
                websites = list.websites.map(site => {
                    if (typeof site === 'string') {
                        return { url: site, icon: null };
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
    } else if (blockedWebsites.lists && Array.isArray(blockedWebsites.lists)) {
        // Nếu blockedWebsites có thuộc tính lists, sử dụng nó
        blocklistToSave.blockedLists = blockedWebsites.lists.map(list => {
            // Đảm bảo id là số
            const id = typeof list.id === 'number' ? list.id : Number(list.id);
            
            // Đảm bảo name là string
            const name = String(list.name || '');
            
            // Đảm bảo websites là mảng và có cấu trúc đúng
            let websites = [];
            if (Array.isArray(list.websites)) {
                websites = list.websites.map(site => {
                    if (typeof site === 'string') {
                        return { url: site, icon: null };
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
    }

    try {
        // Send both requests concurrently
        const [eventsResponse, blocklistResponse] = await Promise.all([
            fetch(`${API.baseURL}${API.endpoints.dashboard.events.save}`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(dataToSave),
            }),
            fetch(`${API.baseURL}${API.endpoints.dashboard.blocklist.save}`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(blocklistToSave),
            }),
        ]);

        return { eventsResponse, blocklistResponse };
    } catch (error) {
        console.error("Error saving data:", error);
        alert("Network error. Please check your connection and try again.");
        throw error;
    }
}
