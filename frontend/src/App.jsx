import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import './styles/globals.scss';
import styles from './App.module.scss';

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <AuthProvider>
      <div className={styles.app}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected Routes */}
          <Route path="/*" element={
            <PrivateRoute>
              <div className={styles.appLayout}>
                {/* Sidebar */}
                <Sidebar 
                  isCollapsed={sidebarCollapsed} 
                  onToggle={handleSidebarToggle}
                />

                {/* Main Content Area */}
                <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
                  {/* Top Navbar */}
                  <Navbar 
                    onSidebarToggle={handleSidebarToggle}
                    sidebarCollapsed={sidebarCollapsed}
                  />

                  {/* Page Content */}
                  <main className={styles.pageContent}>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/chat" element={<Chat />} />
                      <Route path="/students" element={<Students />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/settings" element={<Settings />} />
                    </Routes>
                  </main>

                  {/* Footer */}
                  <footer className={styles.footer}>
                    <div className={styles.footerContent}>
                      <p>&copy; 2024 Campus Admin Agent. All rights reserved.</p>
                      <div className={styles.footerLinks}>
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                        <a href="#">Support</a>
                      </div>
                    </div>
                  </footer>
                </div>
              </div>
            </PrivateRoute>
          } />
        </Routes>
      </div>
    </AuthProvider>
  );
}
