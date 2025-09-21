# Campus Admin Agent - Setup Instructions

## Quick Start

### Method 1: Using the Batch Script (Windows)
1. Double-click `start-dev.bat` in the project root directory
2. This will start both the backend and frontend servers automatically

### Method 2: Manual Setup

#### Backend Setup
1. Open a terminal/command prompt
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Set the Python path and start the server:
   ```bash
   set PYTHONPATH=%cd%
   python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```

#### Frontend Setup
1. Open another terminal/command prompt
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install dependencies (first time only):
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Access URLs
- **Frontend**: http://localhost:5173
- **Backend API**: http://127.0.0.1:8000
- **Backend Docs**: http://127.0.0.1:8000/docs

## Common Issues and Solutions

### 1. "ModuleNotFoundError: No module named 'db'"
- **Cause**: Python cannot find the backend modules
- **Solution**: Make sure to set `PYTHONPATH` and run from the backend directory:
  ```bash
  cd backend
  set PYTHONPATH=%cd%
  python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
  ```

### 2. React Hooks Error: "Rendered fewer hooks than expected"
- **Cause**: Early returns before hooks in React components
- **Solution**: This has been fixed in the latest version. Make sure you have the updated components.

### 3. Token Verification Failed
- **Cause**: Backend not running or network connectivity issues
- **Solution**: 
  - Ensure backend is running on port 8000
  - Check if MongoDB is connected (backend logs will show this)
  - The app now handles network errors gracefully

### 4. CORS Issues
- **Cause**: Frontend and backend running on different ports
- **Solution**: The backend is already configured to allow all origins during development

### 5. MongoDB Connection Issues
- **Cause**: MongoDB not running or incorrect connection string
- **Solution**: 
  - Check the backend logs for MongoDB connection status
  - Ensure MongoDB is running (the app uses MongoDB Atlas by default)
  - Set `BACKEND_SKIP_DB=1` environment variable to run without database

## Environment Variables

### Backend (.env in backend directory)
```
JWT_SECRET_KEY=your-super-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
MONGODB_URI=mongodb+srv://your-connection-string
MONGODB_DB=campus_admin
BACKEND_SKIP_DB=0
```

### Frontend (.env in frontend directory)
```
VITE_API_BASE_URL=http://localhost:8000
```

## Development Workflow
1. Start both servers using the batch script or manually
2. Make changes to your code
3. Both servers support hot reload, so changes will be reflected automatically
4. Access the frontend at http://localhost:5173
5. The backend API docs are available at http://127.0.0.1:8000/docs

## Database
The application uses MongoDB Atlas by default. The connection is already configured and should work out of the box. If you see database connection logs in the backend terminal, it means the connection is successful.

## Authentication Flow
1. Sign up for a new account at http://localhost:5173/signup
2. The backend will create a user in MongoDB
3. You'll be automatically logged in and redirected to the dashboard
4. The frontend stores the JWT token in localStorage
5. All API requests include the token for authentication

## Troubleshooting Tips
- Check both terminal windows for error messages
- Ensure no other applications are using ports 5173 or 8000
- Clear browser localStorage if you encounter auth issues
- Check the browser's developer console for frontend errors
- Look at the backend terminal for API error logs