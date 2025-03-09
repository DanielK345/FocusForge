// Get information from URL
const urlParams = new URLSearchParams(window.location.search);
const eventTitle = urlParams.get('eventTitle') || 'Undefined event';
const eventStart = urlParams.get('eventStart');
const eventEnd = urlParams.get('eventEnd');
const blocklistName = urlParams.get('blocklistName') || 'Default block list';
const blockedUrl = urlParams.get('blockedUrl') || 'Undefined website';
const blocklistId = urlParams.get('blocklistId');

// Update event information
document.getElementById('eventTitle').textContent = eventTitle;
document.getElementById('blocklistName').textContent = blocklistName;

// Get list of blocked websites
function fetchBlockedWebsites() {
  chrome.runtime.sendMessage({
    action: 'getBlockedWebsites',
    blocklistId: blocklistId
  }, function(response) {
    if (response && response.success && response.websites) {
      displayBlockedWebsites(response.websites);
    }
  });
}

// Display list of blocked websites
function displayBlockedWebsites(websites) {
  const container = document.getElementById('websiteListContainer');
  
  if (!websites || websites.length === 0) {
    container.innerHTML = '<div class="website-list">No websites in the block list</div>';
    return;
  }
  
  let html = '<div class="website-list">';
  websites.forEach(site => {
    const url = typeof site === 'string' ? site : (site.url || '');
    html += `<div class="website-item">${url}</div>`;
  });
  html += '</div>';
  
  container.innerHTML = html;
}

// Format time
function setupTimer() {
  if (eventStart && eventEnd) {
    try {
      const startTime = new Date(parseInt(eventStart));
      const endTime = new Date(parseInt(eventEnd));
      
      // Check if time is valid
      if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
        document.getElementById('eventTime').textContent = 
          `${startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        
        // Update timer
        function updateTimer() {
          const now = new Date();
          const timeLeft = endTime - now;
          
          if (timeLeft <= 0) {
            document.getElementById('timer').textContent = "Finished!";
            // Automatically redirect after event ends
            setTimeout(() => {
              window.location.href = blockedUrl;
            }, 1000);
            return;
          }
          
          // Calculate hours, minutes, seconds
          const hours = Math.floor(timeLeft / (1000 * 60 * 60));
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
          
          // Format time
          const formattedTime = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          
          document.getElementById('timer').textContent = formattedTime;
        }
        
        // Update timer every second
        updateTimer();
        setInterval(updateTimer, 1000);
      } else {
        throw new Error('Invalid time');
      }
    } catch (error) {
      console.error('Error processing time:', error);
      document.getElementById('eventTime').textContent = "Undefined time";
      document.getElementById('timer').textContent = "--:--:--";
    }
  } else {
    document.getElementById('eventTime').textContent = "Undefined time";
    document.getElementById('timer').textContent = "--:--:--";
  }
}

// Initialize page
function initPage() {
  // Setup timer
  setupTimer();
  
  // Get list of blocked websites when page loads
  if (blocklistId) {
    fetchBlockedWebsites();
  }
  
  // Connect to background script
  try {
    chrome.runtime.connect({ name: "blocked_page" });
  } catch (error) {
    console.error('Error connecting to background script:', error);
  }
}

// Run when page loads
document.addEventListener('DOMContentLoaded', initPage); 