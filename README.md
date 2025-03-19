# Focus Forge Blocker Architecture

This document provides an overview of the architecture of the Focus Forge Blocker project, including instructions on how to clone the repository, and run the backend (BE), frontend (FE), and Chrome extension.

## Technology Stack

- **Backend (BE):**
  - **Node.js:** JavaScript runtime built on Chrome's V8 JavaScript engine.
  - **Express.js:** Web application framework for Node.js.
  - **MongoDB:** NoSQL database for storing user data and block lists.

- **Frontend (FE):**
  - **React.js:** JavaScript library for building user interfaces.
  - **Redux:** State management library for JavaScript apps.
  - **Axios:** Promise-based HTTP client for the browser and Node.js.

- **Chrome Extension:**
  - **JavaScript:** Programming language for writing the extension logic.
  - **HTML/CSS:** Markup and styling for the extension's UI.
  - **Chrome APIs:** APIs provided by Chrome for extension development.

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

## Deployment to Heroku

### Backend Deployment

1. Create a Heroku account if you don't have one.
2. Install the Heroku CLI:

   ```bash
   npm install -g heroku
   ```

3. Login to Heroku:

   ```bash
   heroku login
   ```

4. Create a new Heroku app:

   ```bash
   heroku create focus-forge-backend
   ```

5. Set up environment variables:

   ```bash
   heroku config:set MONGODB_URI=your_mongodb_uri
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set NODE_ENV=production
   ```

6. Push your code to Heroku:

   ```bash
   git push heroku main
   ```

### Environment Variables

The application uses the following environment variables:

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Port for the server to run on (set by Heroku)
- `FRONTEND_URL`: URL of the frontend application (for CORS)
- `API_URL`: URL of the backend API (for API requests)

### Setting up in Frontend

After deploying the backend to Heroku, update the frontend configuration to use the Heroku URL:

1. Edit `frontend/src/config.js`:

   ```javascript
   const API = {
     isProd: process.env.NODE_ENV === 'production',
     baseURL: process.env.NODE_ENV === 'production' 
       ? 'https://focus-forge-backend.herokuapp.com' // Your Heroku URL
       : 'http://localhost:5000',
     // Other configurations...
   };
   ```

2. Build and deploy the frontend to your preferred hosting service (Netlify, Vercel, etc.).

## Key Features

- **Automatic Synchronization:** The extension automatically syncs with the user's Focus Forge account.
- **Website Blocking:** Blocks websites based on the user's schedule and block lists.
- **Real-time Updates:** Automatically updates every minute to ensure accurate blocking.

## Troubleshooting

- Ensure that both the backend and frontend servers are running.
- Make sure you are logged in to the Focus Forge website.
- Check the console for any error messages if the extension is not functioning as expected.
- For Heroku deployments, check the logs using `heroku logs --tail`.

## Contact

For any issues or questions, please contact the development team at support@focusforge.com. 