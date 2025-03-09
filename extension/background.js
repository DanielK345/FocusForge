// Dữ liệu người dùng
let userData = {
  calendars: [],
  blockedWebsiteLists: []
};

// Biến toàn cục
let activeCalendar = null;
let currentEvents = [];
let isInitialized = false;
let contentScriptLoaded = false;

// Khởi tạo extension
function initialize() {
  console.log('Đang khởi tạo Focus Forge Blocker...');
  
  // Tải dữ liệu từ local storage
  chrome.storage.local.get(['userData', 'lastUpdated'], function(result) {
    if (result.userData) {
      console.log('Đã tìm thấy dữ liệu người dùng trong local storage');
      userData = result.userData;
      processUserData();
    } else {
      console.log('Không tìm thấy dữ liệu người dùng, thử lấy từ trang web Focus Forge');
      // Thử lấy thông tin xác thực từ trang web Focus Forge
      fetchAuthFromFocusForge();
    }
    
    // Thiết lập alarm để cập nhật sự kiện hiện tại mỗi phút
    chrome.alarms.create('updateCurrentEvents', { periodInMinutes: 1 });
    
    // Thiết lập alarm để làm mới dữ liệu mỗi 30 phút
    chrome.alarms.create('refreshData', { periodInMinutes: 30 });
    
    isInitialized = true;
  });
}

// Lấy thông tin xác thực từ trang web Focus Forge
function fetchAuthFromFocusForge() {
  // Truy cập vào localStorage của trang web Focus Forge
  chrome.tabs.query({url: 'http://localhost:3000/*'}, function(tabs) {
    if (tabs.length === 0) {
      console.log('Không tìm thấy trang Focus Forge đang mở');
      return;
    }
    
    if (!contentScriptLoaded) {
      console.log('Content script chưa được tải, thử phương pháp cũ');
      tryLegacyAuthFetch(tabs[0].id);
      return;
    }
    
    try {
      // Gửi tin nhắn đến content script để lấy thông tin xác thực
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getAuthInfo' }, function(response) {
        if (chrome.runtime.lastError) {
          console.error('Lỗi khi gửi tin nhắn đến content script:', chrome.runtime.lastError);
          
          // Thử phương pháp cũ nếu content script không hoạt động
          tryLegacyAuthFetch(tabs[0].id);
          return;
        }
        
        if (response && response.success) {
          const { userId, token } = response;
          console.log('Đã lấy thông tin xác thực từ content script');
          
          // Lưu thông tin xác thực vào storage
          chrome.storage.local.set({
            userId: userId,
            token: token
          }, function() {
            // Lấy dữ liệu từ server
            fetchDataFromServer(userId, token);
          });
        } else {
          console.log('Content script không thể lấy thông tin xác thực');
          
          // Thử phương pháp cũ nếu content script không lấy được thông tin
          tryLegacyAuthFetch(tabs[0].id);
        }
      });
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn đến content script:', error);
      
      // Thử phương pháp cũ nếu có lỗi
      tryLegacyAuthFetch(tabs[0].id);
    }
  });
}

// Thử phương pháp cũ để lấy thông tin xác thực
function tryLegacyAuthFetch(tabId) {
  try {
    console.log('Đang thử phương pháp cũ để lấy thông tin xác thực...');
    // Lấy thông tin xác thực từ localStorage của trang web
    chrome.scripting.executeScript({
      target: {tabId: tabId},
      function: function() {
        try {
          const userId = localStorage.getItem('userID');
          const token = localStorage.getItem('token');
          return {userId, token, success: true};
        } catch (error) {
          console.error('Lỗi khi truy cập localStorage:', error);
          return {success: false, error: error.message};
        }
      }
    }, function(results) {
      if (chrome.runtime.lastError) {
        console.error('Lỗi khi truy cập localStorage:', chrome.runtime.lastError);
        return;
      }
      
      if (!results || !results[0] || !results[0].result) {
        console.log('Không thể lấy thông tin xác thực từ trang web');
        return;
      }
      
      const result = results[0].result;
      
      if (!result.success) {
        console.error('Lỗi khi truy cập localStorage:', result.error);
        return;
      }
      
      const {userId, token} = result;
      
      if (userId && token) {
        console.log('Đã lấy thông tin xác thực từ trang web Focus Forge (phương pháp cũ)');
        
        // Lưu thông tin xác thực vào storage
        chrome.storage.local.set({
          userId: userId,
          token: token
        }, function() {
          // Lấy dữ liệu từ server
          fetchDataFromServer(userId, token);
        });
      } else {
        console.log('Không tìm thấy thông tin xác thực trong localStorage của trang web');
      }
    });
  } catch (error) {
    console.error('Lỗi khi thực thi script:', error);
  }
}

// Xử lý dữ liệu người dùng
function processUserData() {
  if (!userData || !userData.calendars || !userData.blockedWebsiteLists) {
    console.log('Dữ liệu người dùng không hợp lệ');
    return;
  }
  
  // Tìm lịch đang hoạt động
  activeCalendar = findActiveCalendar();
  
  // Cập nhật sự kiện hiện tại
  updateCurrentEvents();
  
  console.log('Đã xử lý dữ liệu người dùng:', {
    activeCalendar: activeCalendar ? activeCalendar.name : 'Không có',
    currentEvents: currentEvents.length
  });
}

// Tìm lịch đang hoạt động
function findActiveCalendar() {
  if (!userData.calendars || userData.calendars.length === 0) {
    return null;
  }
  
  // Tìm lịch có trạng thái active = true
  const active = userData.calendars.find(cal => cal.active === true);
  return active || userData.calendars[0]; // Trả về lịch đầu tiên nếu không tìm thấy lịch active
}

// Cập nhật danh sách sự kiện hiện tại
function updateCurrentEvents() {
  currentEvents = [];
  
  if (!activeCalendar || !activeCalendar.events) {
    return;
  }
  
  const now = new Date();
  console.log('Thời gian hiện tại:', now.toISOString());
  
  // Lọc các sự kiện đang diễn ra
  activeCalendar.events.forEach(event => {
    try {
      console.log('Đang kiểm tra sự kiện:', event);
      
      // Xử lý định dạng thời gian từ MongoDB
      let eventStart, eventEnd;
      
      // Kiểm tra nếu sự kiện có daysOfWeek (định dạng lặp lại hàng tuần)
      if (event.daysOfWeek && Array.isArray(event.daysOfWeek)) {
        const currentDay = now.getDay(); // 0 = Chủ Nhật, 1-6 = Thứ 2-7
        
        // Kiểm tra xem ngày hiện tại có trong daysOfWeek không
        if (!event.daysOfWeek.includes(currentDay)) {
          console.log('Sự kiện không diễn ra vào ngày hôm nay');
          return; // Bỏ qua sự kiện này
        }
        
        // Phân tích thời gian bắt đầu và kết thúc
        const [startHour, startMinute] = (event.start || "00:00").split(':').map(Number);
        const [endHour, endMinute] = (event.end || "23:59").split(':').map(Number);
        
        // Tạo đối tượng Date cho thời gian bắt đầu và kết thúc của sự kiện
        eventStart = new Date();
        eventStart.setHours(startHour, startMinute, 0, 0);
        
        eventEnd = new Date();
        eventEnd.setHours(endHour, endMinute, 0, 0);
      } 
      // Kiểm tra nếu sự kiện có start và end là chuỗi ISO (định dạng MongoDB)
      else if (typeof event.start === 'string' && typeof event.end === 'string') {
        // Kiểm tra nếu là định dạng ISO
        if (event.start.includes('T') && event.end.includes('T')) {
          eventStart = new Date(event.start);
          eventEnd = new Date(event.end);
        } 
        // Nếu không phải định dạng ISO, thử phân tích như HH:MM
        else {
          const [startHour, startMinute] = (event.start || "00:00").split(':').map(Number);
          const [endHour, endMinute] = (event.end || "23:59").split(':').map(Number);
          
          eventStart = new Date();
          eventStart.setHours(startHour, startMinute, 0, 0);
          
          eventEnd = new Date();
          eventEnd.setHours(endHour, endMinute, 0, 0);
        }
      }
      // Nếu start và end là đối tượng Date
      else if (event.start instanceof Date && event.end instanceof Date) {
        eventStart = event.start;
        eventEnd = event.end;
      }
      // Nếu không có thông tin thời gian hợp lệ
      else {
        console.log('Sự kiện không có thông tin thời gian hợp lệ');
        return; // Bỏ qua sự kiện này
      }
      
      console.log('Thời gian sự kiện:', {
        start: eventStart.toISOString(),
        end: eventEnd.toISOString()
      });
      
      // Kiểm tra xem sự kiện có đang diễn ra không
      if (now >= eventStart && now < eventEnd) {
        console.log('Sự kiện đang diễn ra:', event.title || 'Không có tiêu đề');
        
        // Lấy blocklistID từ extendedProps nếu có
        let blocklistId = null;
        if (event.blocklistId) {
          blocklistId = event.blocklistId;
        } else if (event.extendedProps && event.extendedProps.blocklistID) {
          blocklistId = event.extendedProps.blocklistID;
        } else if (event.extendedProps && event.extendedProps.blocklistId) {
          blocklistId = event.extendedProps.blocklistId;
        }
        
        // Kiểm tra xem sự kiện có chế độ tập trung không
        let focusMode = false;
        if (event.focusMode !== undefined) {
          focusMode = event.focusMode;
        } else if (event.extendedProps && event.extendedProps.focusMode !== undefined) {
          focusMode = event.extendedProps.focusMode;
        }
        
        // Chỉ thêm sự kiện nếu có chế độ tập trung và có blocklistId
        if (focusMode && blocklistId) {
          currentEvents.push({
            ...event,
            start: eventStart,
            end: eventEnd,
            blocklistId: blocklistId
          });
        } else {
          console.log('Sự kiện không có chế độ tập trung hoặc không có danh sách chặn');
        }
      } else {
        console.log('Sự kiện không diễn ra vào thời điểm hiện tại');
      }
    } catch (error) {
      console.error('Lỗi khi xử lý sự kiện:', error, event);
    }
  });
  
  console.log(`Đã cập nhật sự kiện hiện tại: ${currentEvents.length} sự kiện đang diễn ra`);
  currentEvents.forEach(event => {
    console.log('- Sự kiện:', event.title, 'với danh sách chặn ID:', event.blocklistId);
  });
}

// Lấy dữ liệu từ server
async function fetchDataFromServer(userId, token) {
  try {
    console.log('Đang lấy dữ liệu từ server...');
    
    // Gọi API để lấy dữ liệu lịch
    const calendarResponse = await fetch(`http://localhost:5000/api/dashboard/events/get?userID=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!calendarResponse.ok) {
      throw new Error(`Không thể lấy dữ liệu lịch: ${calendarResponse.status} ${calendarResponse.statusText}`);
    }
    
    const calendarData = await calendarResponse.json();
    console.log('Dữ liệu lịch:', calendarData);
    
    // Gọi API để lấy dữ liệu danh sách chặn
    const blocklistResponse = await fetch(`http://localhost:5000/api/dashboard/blocklist/get?userID=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!blocklistResponse.ok) {
      throw new Error(`Không thể lấy dữ liệu danh sách chặn: ${blocklistResponse.status} ${blocklistResponse.statusText}`);
    }
    
    const blocklistData = await blocklistResponse.json();
    console.log('Dữ liệu danh sách chặn:', blocklistData);
    
    // Cập nhật dữ liệu người dùng
    userData = {
      calendars: calendarData.calendars || [],
      blockedWebsiteLists: blocklistData.lists || []
    };
    
    // Lưu dữ liệu vào local storage
    chrome.storage.local.set({
      userData: userData,
      lastUpdated: new Date().toISOString()
    });
    
    // Xử lý dữ liệu mới
    processUserData();
    
    console.log('Đã cập nhật dữ liệu từ server thành công');
    return true;
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu từ server:', error);
    return false;
  }
}

// Lấy user ID từ local storage
function getUserId() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['userId'], function(result) {
      resolve(result.userId);
    });
  });
}

// Lấy token từ local storage
function getToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['token'], function(result) {
      resolve(result.token);
    });
  });
}

// Lấy danh sách trang web bị chặn theo ID
function getBlockedWebsites(blocklistId) {
  if (!userData || !userData.blockedWebsiteLists || !blocklistId) {
    return [];
  }
  
  const blocklist = userData.blockedWebsiteLists.find(list => 
    String(list.id) === String(blocklistId)
  );
  
  if (!blocklist || !blocklist.websites) {
    return [];
  }
  
  return blocklist.websites;
}

// Kiểm tra xem URL có bị chặn không
function isUrlBlocked(url) {
  if (!currentEvents || currentEvents.length === 0) {
    console.log('Không có sự kiện nào đang diễn ra, không chặn URL:', url);
    return false;
  }
  
  console.log('Đang kiểm tra URL:', url);
  
  // Kiểm tra từng sự kiện hiện tại
  for (const event of currentEvents) {
    // Nếu sự kiện không có blocklistId, bỏ qua
    if (!event.blocklistId) {
      console.log('Sự kiện không có blocklistId:', event.title);
      continue;
    }
    
    console.log('Kiểm tra sự kiện:', event.title, 'với blocklistId:', event.blocklistId);
    
    // Tìm danh sách chặn tương ứng
    const blocklist = userData.blockedWebsiteLists.find(list => 
      String(list.id) === String(event.blocklistId)
    );
    
    if (!blocklist) {
      console.log('Không tìm thấy danh sách chặn với ID:', event.blocklistId);
      continue;
    }
    
    if (!blocklist.websites || !Array.isArray(blocklist.websites) || blocklist.websites.length === 0) {
      console.log('Danh sách chặn không có trang web nào:', blocklist.name);
      continue;
    }
    
    console.log('Kiểm tra URL với danh sách chặn:', blocklist.name, 'có', blocklist.websites.length, 'trang web');
    
    // Kiểm tra xem URL có trong danh sách chặn không
    for (const website of blocklist.websites) {
      let siteUrl;
      
      if (typeof website === 'string') {
        siteUrl = website;
      } else if (website && typeof website === 'object') {
        siteUrl = website.url;
      } else {
        continue; // Bỏ qua nếu không phải chuỗi hoặc đối tượng
      }
      
      if (!siteUrl) continue;
      
      // Chuẩn hóa URL để so sánh
      try {
        // Lấy domain từ URL
        const urlDomain = new URL(url).hostname;
        
        // Chuẩn hóa siteUrl
        let siteDomain;
        if (siteUrl.startsWith('http://') || siteUrl.startsWith('https://')) {
          siteDomain = new URL(siteUrl).hostname;
        } else {
          siteDomain = siteUrl;
        }
        
        console.log('So sánh domain:', urlDomain, 'với', siteDomain);
        
        // Kiểm tra xem domain có khớp không
        if (urlDomain.includes(siteDomain) || siteDomain.includes(urlDomain)) {
          console.log('Đã tìm thấy URL bị chặn:', url, 'khớp với', siteUrl);
          return {
            blocked: true,
            event: event,
            blocklist: blocklist
          };
        }
      } catch (error) {
        console.error('Lỗi khi so sánh URL:', error);
      }
    }
  }
  
  console.log('URL không bị chặn:', url);
  return false;
}

// Xử lý sự kiện điều hướng web
chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
  // Chỉ xử lý frame chính
  if (details.frameId !== 0) return;
  
  // Bỏ qua các URL của extension
  if (details.url.startsWith('chrome-extension://')) return;
  
  // Kiểm tra xem URL có bị chặn không
  const blockResult = isUrlBlocked(details.url);
  
  if (blockResult && blockResult.blocked) {
    console.log(`Đã chặn URL: ${details.url}`);
    
    // Chuyển hướng đến trang chặn
    const event = blockResult.event;
    const blocklist = blockResult.blocklist;
    
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL('blocked.html') + 
           `?eventTitle=${encodeURIComponent(event.title || 'Sự kiện không có tiêu đề')}` +
           `&eventStart=${encodeURIComponent(event.start.getTime())}` +
           `&eventEnd=${encodeURIComponent(event.end.getTime())}` +
           `&blocklistName=${encodeURIComponent(blocklist.name || 'Danh sách chặn')}` +
           `&blocklistId=${encodeURIComponent(blocklist.id)}` +
           `&blockedUrl=${encodeURIComponent(details.url)}`
    });
  }
});

// Xử lý sự kiện alarm
chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === 'updateCurrentEvents') {
    updateCurrentEvents();
  } else if (alarm.name === 'refreshData') {
    // Làm mới dữ liệu từ server
    Promise.all([getUserId(), getToken()])
      .then(([userId, token]) => {
        if (userId && token) {
          fetchDataFromServer(userId, token);
        } else {
          // Thử lấy thông tin xác thực từ trang web Focus Forge
          fetchAuthFromFocusForge();
        }
      });
  }
});

// Xử lý tin nhắn từ popup và content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Đã nhận tin nhắn:', request, 'từ:', sender);
  
  switch (request.action) {
    case 'contentScriptLoaded':
      // Đánh dấu content script đã được tải
      contentScriptLoaded = true;
      console.log('Content script đã được tải');
      sendResponse({ success: true });
      break;
      
    case 'getData':
      // Trả về dữ liệu hiện tại
      sendResponse({
        success: true,
        data: {
          activeCalendar: activeCalendar,
          currentEvents: currentEvents,
          blockedWebsiteLists: userData.blockedWebsiteLists
        }
      });
      break;
      
    case 'getBlockedWebsites':
      // Trả về danh sách trang web bị chặn theo ID
      if (request.blocklistId) {
        const websites = getBlockedWebsites(request.blocklistId);
        sendResponse({
          success: true,
          websites: websites
        });
      } else {
        sendResponse({
          success: false,
          message: 'Thiếu blocklistId'
        });
      }
      break;
      
    case 'fetchData':
      // Lấy dữ liệu từ server
      fetchDataFromServer(request.userId, request.token)
        .then(success => {
          sendResponse({
            success: success,
            data: success ? {
              activeCalendar: activeCalendar,
              currentEvents: currentEvents,
              blockedWebsiteLists: userData.blockedWebsiteLists
            } : null
          });
        })
        .catch(error => {
          console.error('Lỗi khi lấy dữ liệu:', error);
          sendResponse({
            success: false,
            error: error.message
          });
        });
      return true; // Giữ kết nối mở cho phản hồi bất đồng bộ
      
    case 'refreshData':
      // Làm mới dữ liệu từ server
      Promise.all([getUserId(), getToken()])
        .then(([userId, token]) => {
          if (!userId || !token) {
            // Thử lấy thông tin xác thực từ trang web Focus Forge
            fetchAuthFromFocusForge();
            sendResponse({ success: false, message: 'Đang thử lấy thông tin xác thực từ trang web' });
            return;
          }
          
          return fetchDataFromServer(userId, token);
        })
        .then(success => {
          if (success) {
            sendResponse({
              success: true,
              data: {
                activeCalendar: activeCalendar,
                currentEvents: currentEvents,
                blockedWebsiteLists: userData.blockedWebsiteLists
              }
            });
          } else {
            sendResponse({ success: false, message: 'Không thể làm mới dữ liệu' });
          }
        })
        .catch(error => {
          console.error('Lỗi khi làm mới dữ liệu:', error);
          sendResponse({
            success: false,
            error: error.message
          });
        });
      return true; // Giữ kết nối mở cho phản hồi bất đồng bộ
      
    case 'setAuthInfo':
      // Lưu thông tin xác thực từ content script
      const { userId, token } = request;
      
      if (userId && token) {
        // Lưu thông tin xác thực vào storage
        chrome.storage.local.set({
          userId: userId,
          token: token
        }, function() {
          // Lấy dữ liệu từ server
          fetchDataFromServer(userId, token)
            .then(success => {
              sendResponse({ success: success });
            })
            .catch(error => {
              console.error('Lỗi khi lấy dữ liệu:', error);
              sendResponse({
                success: false,
                error: error.message
              });
            });
        });
        
        return true; // Giữ kết nối mở cho phản hồi bất đồng bộ
      } else {
        sendResponse({ success: false, message: 'Thông tin xác thực không hợp lệ' });
      }
      break;
  }
});

// Xử lý kết nối từ các trang khác
chrome.runtime.onConnect.addListener(function(port) {
  console.log('Đã nhận kết nối từ:', port.name);
});

// Khởi tạo extension khi được cài đặt
initialize(); 