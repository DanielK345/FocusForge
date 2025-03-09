export function validateUrl(url) {
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

export function getFavicon(url) {
    try {
        return `https://www.google.com/s2/favicons?sz=32&domain=${new URL(url).hostname}`;
    } catch (e) {
        return '';
    }
};

export function getDomain(url) {
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


