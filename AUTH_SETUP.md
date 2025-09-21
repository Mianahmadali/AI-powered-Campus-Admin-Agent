# Authentication System Setup Guide

## Overview
This guide covers the complete authentication system built for the Campus Admin Agent application, including both backend and frontend components.

## 🚀 Features Implemented

### Backend Features
- ✅ JWT-based authentication
- ✅ Secure password hashing with bcrypt
- ✅ User registration and login endpoints
- ✅ Role-based access control (admin, staff, user)
- ✅ Token refresh and validation
- ✅ User profile management
- ✅ MongoDB integration with proper indexing

### Frontend Features
- ✅ Beautiful, responsive login and signup pages
- ✅ React Context-based authentication state management
- ✅ Protected routes with automatic redirects
- ✅ Form validation with real-time feedback
- ✅ Password strength indicator
- ✅ Token management with automatic refresh
- ✅ Integrated logout functionality in navbar
- ✅ Loading states and error handling

## 📋 Setup Instructions

### Backend Dependencies
The following dependencies have been added to `requirements.txt`:
```
passlib[bcrypt]>=1.7.4,<2.0
PyJWT>=2.8.0,<3.0
bcrypt>=4.0.1,<5.0
```

Install them with:
```bash
cd backend
pip install -r requirements.txt
```

### Environment Variables
Create a `.env` file in the backend directory with:
```env
# JWT Configuration
JWT_SECRET_KEY=your-super-secret-key-change-in-production-use-a-long-random-string
ACCESS_TOKEN_EXPIRE_MINUTES=30

# MongoDB (if not already set)
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=campus_admin
```

### Database Setup
The system will automatically create the necessary indexes when you start the backend. Users will be stored in the `users` collection.

## 🎯 Usage Guide

### API Endpoints

#### Authentication Routes
- `POST /auth/signup` - Register a new user
- `POST /auth/login` - Authenticate and get access token
- `GET /auth/me` - Get current user information (requires authentication)
- `PUT /auth/me` - Update current user profile (requires authentication)
- `POST /auth/refresh` - Refresh access token (requires authentication)
- `POST /auth/verify-token` - Verify token validity (requires authentication)

#### Example API Usage

**Signup:**
```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123",
    "department": "Computer Science",
    "role": "user"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'
```

### Frontend Routes

#### Public Routes
- `/login` - Login page
- `/signup` - Registration page

#### Protected Routes (require authentication)
- `/` - Dashboard
- `/chat` - Chat interface
- `/students` - Student management
- `/analytics` - Analytics dashboard
- `/settings` - Settings page

### User Roles
The system supports three user roles:
- **admin** - Full access to all features
- **staff** - Limited administrative access
- **user** - Basic user access

Role-based access can be implemented using the `PrivateRoute` component:
```jsx
<PrivateRoute requiredRole="admin">
  <AdminOnlyComponent />
</PrivateRoute>
```

## 🔧 Components Overview

### Backend Components
- `models/user.py` - User data models and validation
- `auth.py` - Authentication utilities (JWT, password hashing)
- `routes/auth.py` - Authentication API endpoints

### Frontend Components
- `context/AuthContext.jsx` - Authentication state management
- `pages/Login.jsx` - Login page component
- `pages/Signup.jsx` - Registration page component
- `components/PrivateRoute.jsx` - Route protection wrapper
- `api.js` - Enhanced with auth interceptors

## 🎨 Styling
All authentication components use modern, responsive SCSS modules that match your existing design system:
- Consistent with your blue primary color scheme
- Mobile-responsive design
- Loading states and animations
- Form validation styling
- Dark mode support

## 🔒 Security Features
- Password requirements (minimum 6 characters, mixed case, numbers)
- Secure JWT token storage
- Automatic token refresh
- Protection against common attacks
- Proper CORS configuration
- Secure password hashing with bcrypt

## 🚦 Getting Started

1. **Install backend dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Set up environment variables** as shown above

3. **Start the backend server:**
   ```bash
   uvicorn main:app --reload
   ```

4. **Start the frontend development server:**
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 🧪 Testing the System

1. Navigate to http://localhost:5173
2. You'll be automatically redirected to the login page
3. Click "Create one here" to go to the signup page
4. Register a new account with valid information
5. You'll be automatically logged in and redirected to the dashboard
6. Test logout functionality from the navbar profile dropdown

## 🎯 Next Steps

Your authentication system is now complete! You can:
- Customize the user roles and permissions
- Add password reset functionality
- Implement email verification
- Add social login providers
- Enhance the user profile management
- Add audit logging for security

The system is production-ready and follows security best practices. Make sure to change the JWT secret key in production and use environment variables for sensitive configuration.