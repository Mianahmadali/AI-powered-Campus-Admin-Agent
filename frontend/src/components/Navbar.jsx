import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiSearchLine,
  RiNotification3Line,
  RiUser3Line,
  RiMoonLine,
  RiSunLine,
  RiSettings3Line,
  RiLogoutBoxLine,
  RiMenuLine,
  RiGlobalLine,
  RiArrowDownSLine,
  RiCheckLine
} from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.scss';

const Navbar = ({ 
  onSidebarToggle, 
  sidebarCollapsed
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [theme, setTheme] = useState('light');
  const [searchFocused, setSearchFocused] = useState(false);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const searchRef = useRef(null);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  // Mock notifications data
  const notifications = [
    {
      id: 1,
      title: 'New Student Registration',
      message: 'John Doe has registered for Fall 2024',
      time: '2 minutes ago',
      unread: true,
      type: 'info'
    },
    {
      id: 2,
      title: 'System Maintenance',
      message: 'Scheduled maintenance tonight at 2 AM',
      time: '1 hour ago',
      unread: true,
      type: 'warning'
    },
    {
      id: 3,
      title: 'Chat Response Needed',
      message: '3 students waiting for response',
      time: '3 hours ago',
      unread: false,
      type: 'success'
    }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Theme toggle
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      // Implement search functionality
    }
  };

  const handleNotificationClick = (notification) => {
    console.log('Notification clicked:', notification);
    // Mark as read and handle click
  };

  const clearAllNotifications = () => {
    console.log('Clear all notifications');
    // Implement clear all functionality
  };
  
  const handleLogout = () => {
    logout();
    setShowProfile(false);
    navigate('/login');
  };
  
  const handleProfileNavigation = () => {
    setShowProfile(false);
    navigate('/settings');
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.navbarContent}>
        {/* Left Section */}
        <div className={styles.leftSection}>
          {/* Mobile menu button */}
          <button
            className={styles.mobileMenuButton}
            onClick={onSidebarToggle}
            aria-label="Toggle navigation menu"
          >
            <RiMenuLine />
          </button>

          {/* Search Bar */}
          <form 
            className={`${styles.searchContainer} ${searchFocused ? styles.focused : ''}`}
            onSubmit={handleSearchSubmit}
          >
            <div className={styles.searchInputWrapper}>
              <RiSearchLine className={styles.searchIcon} />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search students, chat history, analytics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button
                  type="button"
                  className={styles.clearSearch}
                  onClick={() => setSearchQuery('')}
                >
                  ×
                </button>
              )}
            </div>
            
            {/* Search suggestions dropdown */}
            {searchFocused && searchQuery && (
              <div className={styles.searchSuggestions}>
                <div className={styles.suggestionGroup}>
                  <h4>Quick Actions</h4>
                  <button className={styles.suggestion}>
                    <RiUser3Line />
                    <span>Search students named "{searchQuery}"</span>
                  </button>
                </div>
                <div className={styles.suggestionGroup}>
                  <h4>Recent Searches</h4>
                  <button className={styles.suggestion}>
                    <RiSearchLine />
                    <span>Computer Science students</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Right Section */}
        <div className={styles.rightSection}>
          {/* Language Toggle */}
          <button className={`${styles.iconButton} ${styles.iconButtonLarge}`} title="Change Language">
            <RiGlobalLine />
          </button>

          {/* Theme Toggle */}
          <button 
            className={`${styles.iconButton} ${styles.iconButtonLarge}`}
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <RiMoonLine /> : <RiSunLine />}
          </button>

          {/* Notifications */}
          <div className={styles.dropdownContainer} ref={notificationRef}>
            <button
              className={`${styles.iconButton} ${styles.iconButtonLarge} ${showNotifications ? styles.active : ''}`}
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
            >
              <RiNotification3Line />
              {unreadCount > 0 && (
                <span className={styles.badge}>{unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownHeader}>
                  <h3>Notifications</h3>
                  <button 
                    className={styles.clearAllButton}
                    onClick={clearAllNotifications}
                  >
                    Clear all
                  </button>
                </div>
                
                <div className={styles.notificationList}>
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`${styles.notificationItem} ${notification.unread ? styles.unread : ''}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className={styles.notificationContent}>
                          <div className={styles.notificationTitle}>
                            {notification.title}
                          </div>
                          <div className={styles.notificationMessage}>
                            {notification.message}
                          </div>
                          <div className={styles.notificationTime}>
                            {notification.time}
                          </div>
                        </div>
                        {notification.unread && (
                          <div className={styles.unreadIndicator} />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className={styles.emptyState}>
                      <RiCheckLine />
                      <span>No new notifications</span>
                    </div>
                  )}
                </div>

                <div className={styles.dropdownFooter}>
                  <button className={styles.viewAllButton}>
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className={styles.dropdownContainer} ref={profileRef}>
            <button
              className={`${styles.profileButton} ${showProfile ? styles.active : ''}`}
              onClick={() => setShowProfile(!showProfile)}
            >
              <div className={styles.profileAvatar}>
                <RiUser3Line />
              </div>
              <div className={styles.profileInfo}>
                <span className={styles.profileName}>{user?.name || 'User'}</span>
                <span className={styles.profileRole}>
                  {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
                </span>
              </div>
              <RiArrowDownSLine className={styles.dropdownArrow} />
            </button>

            {showProfile && (
              <div className={styles.dropdown}>
                <div className={styles.profileDropdownHeader}>
                  <div className={styles.profileAvatar}>
                    <RiUser3Line />
                  </div>
                  <div className={styles.profileDetails}>
                    <div className={styles.profileName}>{user?.name || 'User'}</div>
                    <div className={styles.profileEmail}>{user?.email || ''}</div>
                    {user?.department && (
                      <div className={styles.profileDepartment}>{user.department}</div>
                    )}
                  </div>
                </div>

                <div className={styles.profileDropdownContent}>
                  <button 
                    className={styles.profileMenuItem}
                    onClick={handleProfileNavigation}
                  >
                    <RiUser3Line />
                    <span>View Profile</span>
                  </button>
                  <button 
                    className={styles.profileMenuItem}
                    onClick={handleProfileNavigation}
                  >
                    <RiSettings3Line />
                    <span>Account Settings</span>
                  </button>
                  <div className={styles.dropdownDivider} />
                  <button 
                    className={`${styles.profileMenuItem} ${styles.danger}`}
                    onClick={handleLogout}
                  >
                    <RiLogoutBoxLine />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;