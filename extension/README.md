# Focus Forge Blocker

Chrome extension to block websites based on your Focus Forge schedule.

## Features

- Automatically sync with your Focus Forge account
- Automatically fetch login information from the Focus Forge website
- Block websites based on your schedule and block lists
- Display information about current events and block lists
- Automatically update every minute to ensure accurate blocking

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the `extension` folder
5. The extension will be installed and displayed in the Chrome toolbar

## Usage

1. Log in to the Focus Forge website (http://localhost:3000)
2. Click on the Focus Forge Blocker icon in the Chrome toolbar
3. Click "Auto Connect" to fetch login information from the website
4. The extension will automatically block websites based on your schedule and block lists

If auto connect doesn't work, you can still enter your User ID and token manually:

1. Click on the Focus Forge Blocker icon in the Chrome toolbar
2. Enter your User ID and token from your Focus Forge account
3. Click "Manual Connect" to sync data

## Directory Structure

```
extension/
├── manifest.json     # Extension configuration
├── background.js     # Background script handling blocking logic
├── popup.html        # Popup interface
├── popup.js          # Popup logic
├── blocked.html      # Page displayed when a website is blocked
└── images/           # Directory containing icons
```

## Requirements

- Chrome 88 or higher
- Focus Forge account

## Troubleshooting

If the extension is not working properly:

1. Make sure you are logged in to the Focus Forge website (http://localhost:3000)
2. Try refreshing the data by clicking the "Refresh" button
3. If auto connect doesn't work, try manual connection
4. Check if your calendar has any active events
5. Check if the events have a block list assigned
6. Make sure you have an internet connection

## Contact

If you encounter any issues or have questions, please contact us via email: support@focusforge.com 