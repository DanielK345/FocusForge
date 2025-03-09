document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const loginSection = document.getElementById('loginSection');
  const dataSection = document.getElementById('dataSection');
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const userIdInput = document.getElementById('userIdInput');
  const tokenInput = document.getElementById('tokenInput');
  const loginButton = document.getElementById('loginButton');
  const refreshButton = document.getElementById('refreshButton');
  const calendarInfo = document.getElementById('calendarInfo');
  const eventsList = document.getElementById('eventsList');
  const lastUpdated = document.getElementById('lastUpdated');
  const autoConnectButton = document.getElementById('autoConnectButton');
  const errorMessage = document.getElementById('errorMessage');

  // Check login status when popup opens
  checkLoginStatus();

  // Handle login event
  loginButton.addEventListener('click', function() {
    const userId = userIdInput.value.trim();
    const token = tokenInput.value.trim();
    
    if (!userId || !token) {
      showError('Please enter User ID and Token');
      return;
    }
    
    // Show loading status
    showLoading('Connecting...');
    hideError();
    
    // Save login information to storage
    chrome.storage.local.set({
      userId: userId,
      token: token
    }, function() {
      // Send message to background script to get data
      chrome.runtime.sendMessage({
        action: 'fetchData',
        userId: userId,
        token: token
      }, function(response) {
        if (chrome.runtime.lastError) {
          showError('Error sending message to background script: ' + chrome.runtime.lastError.message);
          return;
        }
        
        if (response && response.success) {
          hideError();
          updateUI(response.data);
          showLoggedInState();
        } else {
          const errorMsg = response && response.error 
            ? response.error 
            : 'Unable to connect to Focus Forge. Please check your login information and ensure the server is running.';
          showError(errorMsg);
        }
      });
    });
  });

  // Handle auto connect event
  autoConnectButton.addEventListener('click', function() {
    // Show loading status
    showLoading('Auto connecting...');
    hideError();
    
    // Send message to background script to get authentication info from website
    chrome.runtime.sendMessage({
      action: 'refreshData'
    }, function(response) {
      if (chrome.runtime.lastError) {
        showError('Error sending message to background script: ' + chrome.runtime.lastError.message);
        return;
      }
      
      if (response && response.success) {
        hideError();
        updateUI(response.data);
        showLoggedInState();
      } else {
        const errorMsg = response && response.error 
          ? response.error 
          : 'Unable to auto connect. Please open the Focus Forge website and log in first, or ensure the server is running.';
        showError(errorMsg);
      }
    });
  });

  // Handle refresh data event
  refreshButton.addEventListener('click', function() {
    // Show loading status
    showLoading('Refreshing data...');
    hideError();
    
    chrome.runtime.sendMessage({
      action: 'refreshData'
    }, function(response) {
      if (chrome.runtime.lastError) {
        showError('Error sending message to background script: ' + chrome.runtime.lastError.message);
        return;
      }
      
      if (response && response.success) {
        hideError();
        updateUI(response.data);
        updateLastUpdated();
      } else {
        const errorMsg = response && response.error 
          ? response.error 
          : 'Unable to refresh data. Please try again later or ensure the server is running.';
        showError(errorMsg);
      }
    });
  });

  // Show error message
  function showError(message) {
    if (errorMessage) {
      errorMessage.textContent = message;
      errorMessage.classList.remove('hidden');
    } else {
      alert(message);
    }
    
    // Reset status
    statusIndicator.classList.remove('status-loading');
    statusIndicator.classList.add('status-inactive');
    statusText.textContent = 'Not connected';
  }

  // Hide error message
  function hideError() {
    if (errorMessage) {
      errorMessage.classList.add('hidden');
    }
  }

  // Show loading status
  function showLoading(message) {
    statusText.textContent = message;
    statusIndicator.classList.remove('status-active', 'status-inactive');
    statusIndicator.classList.add('status-loading');
  }

  // Check login status
  function checkLoginStatus() {
    chrome.storage.local.get(['userId', 'token'], function(result) {
      if (result.userId && result.token) {
        // Show loading status
        showLoading('Checking connection...');
        hideError();
        
        // Already logged in, get current data
        chrome.runtime.sendMessage({
          action: 'getData'
        }, function(response) {
          if (chrome.runtime.lastError) {
            showError('Error sending message to background script: ' + chrome.runtime.lastError.message);
            return;
          }
          
          if (response && response.success) {
            hideError();
            updateUI(response.data);
            showLoggedInState();
            
            // Fill login form
            userIdInput.value = result.userId;
            tokenInput.value = result.token;
          } else {
            showLoggedOutState();
            const errorMsg = response && response.error 
              ? response.error 
              : 'Unable to get data. Please try connecting again or ensure the server is running.';
            showError(errorMsg);
          }
        });
      } else {
        showLoggedOutState();
      }
    });
  }

  // Show logged in state
  function showLoggedInState() {
    loginSection.classList.add('hidden');
    dataSection.classList.remove('hidden');
    statusIndicator.classList.remove('status-inactive', 'status-loading');
    statusIndicator.classList.add('status-active');
    statusText.textContent = 'Connected';
    updateLastUpdated();
  }

  // Show logged out state
  function showLoggedOutState() {
    loginSection.classList.remove('hidden');
    dataSection.classList.add('hidden');
    statusIndicator.classList.remove('status-active', 'status-loading');
    statusIndicator.classList.add('status-inactive');
    statusText.textContent = 'Not connected';
  }

  // Update UI with new data
  function updateUI(data) {
    if (!data) return;
    
    try {
      console.log('Updating UI with data:', data);
      
      // Update calendar info
      if (data.activeCalendar) {
        calendarInfo.innerHTML = `
          <div class="event-item">
            <div class="event-title">${data.activeCalendar.name || 'Unnamed calendar'}</div>
            <div class="event-focus">ID: ${data.activeCalendar.id}</div>
          </div>
        `;
      } else {
        calendarInfo.textContent = 'No active calendar';
      }
      
      // Update current events list
      if (data.currentEvents && data.currentEvents.length > 0) {
        let eventsHtml = '';
        
        data.currentEvents.forEach(event => {
          try {
            // Process time
            let startTime, endTime;
            
            if (event.start instanceof Date) {
              startTime = event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            } else if (typeof event.start === 'string' && event.start.includes('T')) {
              startTime = new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            } else {
              startTime = event.start;
            }
            
            if (event.end instanceof Date) {
              endTime = event.end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            } else if (typeof event.end === 'string' && event.end.includes('T')) {
              endTime = new Date(event.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            } else {
              endTime = event.end;
            }
            
            // Get blocklist info
            let blocklistHtml = '';
            const blocklistId = event.blocklistId || (event.extendedProps && (event.extendedProps.blocklistID || event.extendedProps.blocklistId));
            
            if (blocklistId) {
              const blocklist = findBlocklist(data.blockedWebsiteLists, blocklistId);
              if (blocklist) {
                blocklistHtml = `
                  <div class="blocklist">Block list: ${blocklist.name || 'Unnamed'}</div>
                  <div class="website-list">
                    ${(blocklist.websites || []).map(site => {
                      const siteUrl = typeof site === 'string' ? site : (site.url || '');
                      const siteIcon = site && site.icon ? site.icon : '';
                      return `
                        <div class="website-item">
                          ${siteIcon ? `<img src="${siteIcon}" class="website-icon" alt="">` : ''}
                          ${siteUrl}
                        </div>
                      `;
                    }).join('')}
                  </div>
                `;
              }
            }
            
            // Get focus mode info
            let focusModeHtml = '';
            const focusMode = event.focusMode !== undefined ? event.focusMode : 
                             (event.extendedProps && event.extendedProps.focusMode !== undefined ? 
                              event.extendedProps.focusMode : false);
            
            if (focusMode) {
              focusModeHtml = `<div class="event-focus">Focus mode: On</div>`;
            }
            
            eventsHtml += `
              <div class="event-item">
                <div class="event-title">${event.title || 'Untitled event'}</div>
                <div class="event-time">${startTime} - ${endTime}</div>
                ${focusModeHtml}
                ${blocklistHtml}
              </div>
            `;
          } catch (error) {
            console.error('Error processing event:', error, event);
          }
        });
        
        eventsList.innerHTML = eventsHtml;
      } else {
        eventsList.textContent = 'No events currently active';
      }
    } catch (error) {
      console.error('Error updating UI:', error);
      showError('Error displaying data: ' + error.message);
    }
  }

  // Find blocklist by ID
  function findBlocklist(blocklists, id) {
    if (!blocklists || !Array.isArray(blocklists)) return null;
    return blocklists.find(list => String(list.id) === String(id));
  }

  // Update last updated time
  function updateLastUpdated() {
    const now = new Date();
    lastUpdated.textContent = now.toLocaleString();
  }
}); 