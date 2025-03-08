# Focus Forge Blocker Architecture

This document provides an overview of the architecture of the Focus Forge Blocker project, including instructions on how to clone the repository, and run the backend (BE), frontend (FE), and Chrome extension.

## Project Structure

The project is organized into the following main components:

- **Backend (BE):** Handles the server-side logic, including user authentication and data management.
- **Frontend (FE):** The user interface for the Focus Forge application, allowing users to manage their schedules and block lists.
- **Chrome Extension:** A browser extension that blocks websites based on the user's Focus Forge schedule.

## Cloning the Repository

To clone the repository, use the following command:

```bash
git clone https://github.com/yourusername/focus-forge-blocker.git
```

Navigate into the project directory:

```bash
cd focus-forge-blocker
```

## Running the Backend (BE)

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install the required dependencies:

   ```bash
   npm install
   ```

3. Start the backend server:

   ```bash
   npm start
   ```

   The backend server will run on `http://localhost:5000`.

## Running the Frontend (FE)

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install the required dependencies:

   ```bash
   npm install
   ```

3. Start the frontend server:

   ```bash
   npm start
   ```

   The frontend application will run on `http://localhost:3000`.

## Running the Chrome Extension

1. Open Chrome and go to `chrome://extensions/`.
2. Enable "Developer mode" in the top right corner.
3. Click "Load unpacked" and select the `extension` folder from the cloned repository.
4. The extension will be installed and displayed in the Chrome toolbar.

## Key Features

- **Automatic Synchronization:** The extension automatically syncs with the user's Focus Forge account.
- **Website Blocking:** Blocks websites based on the user's schedule and block lists.
- **Real-time Updates:** Automatically updates every minute to ensure accurate blocking.

## Troubleshooting

- Ensure that both the backend and frontend servers are running.
- Make sure you are logged in to the Focus Forge website.
- Check the console for any error messages if the extension is not functioning as expected.

## Contact

For any issues or questions, please contact the development team at support@focusforge.com. 