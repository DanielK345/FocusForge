// Content script to access localStorage and send authentication information to background script

console.log('Focus Forge Blocker content script loaded');

// Thông báo cho background script rằng content script đã được tải
chrome.runtime.sendMessage({
  action: 'contentScriptLoaded'
}, function(response) {
  if (chrome.runtime.lastError) {
    console.error('Lỗi khi thông báo content script đã tải:', chrome.runtime.lastError);
  } else if (response && response.success) {
    console.log('Background script đã nhận thông báo content script đã tải');
  }
});

// Function to get authentication information from localStorage
function getAuthInfo() {
  const userId = localStorage.getItem('userID');
  const token = localStorage.getItem('token');
  
  if (userId && token) {
    console.log('Authentication information found in localStorage');
    
    // Send authentication information to background script
    chrome.runtime.sendMessage({
      action: 'setAuthInfo',
      userId: userId,
      token: token
    }, function(response) {
      if (chrome.runtime.lastError) {
        console.error('Error sending authentication information to background script:', chrome.runtime.lastError);
      } else if (response && response.success) {
        console.log('Authentication information sent to background script successfully');
      } else {
        console.error('Unable to send authentication information to background script');
      }
    });
  } else {
    console.log('No authentication information found in localStorage');
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Content script nhận tin nhắn:', request);
  
  if (request.action === 'getAuthInfo') {
    const userId = localStorage.getItem('userID');
    const token = localStorage.getItem('token');
    
    console.log('Content script trả về thông tin xác thực:', { success: !!(userId && token) });
    
    sendResponse({
      success: !!(userId && token),
      userId: userId,
      token: token
    });
  }
  
  return true; // Keep connection open for async response
});

// Listen for localStorage changes
window.addEventListener('storage', function(event) {
  if (event.key === 'userID' || event.key === 'token') {
    console.log('Change detected in localStorage:', event.key);
    getAuthInfo();
  }
});

// Get authentication information when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Wait a bit to ensure localStorage is set up
  setTimeout(getAuthInfo, 1000);
});

// Get authentication information immediately (in case page is already loaded)
setTimeout(getAuthInfo, 500); 