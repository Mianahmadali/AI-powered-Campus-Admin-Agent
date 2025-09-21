import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  RiDashboardLine, 
  RiChat3Line, 
  RiGroupLine, 
  RiBarChartLine, 
  RiSettings3Line,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
  RiLogoutBoxLine,
  RiUser3Line,
  RiNotification3Line
} from 'react-icons/ri';
import styles from './Sidebar.module.scss';

const Sidebar = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);

  const navigationItems = [
    {
      id: 'dashboard',
      path: '/',
      icon: RiDashboardLine,
      label: 'Dashboard',
      description: 'Overview & Analytics'
    },
    {
      id: 'chat',
      path: '/chat',
      icon: RiChat3Line,
      label: 'AI Agent Chat',
      description: 'Chat with Campus AI',
      badge: 3
    },
    {
      id: 'students',
      path: '/students',
      icon: RiGroupLine,
      label: 'Students',
      description: 'Manage Students'
    },
    {
      id: 'analytics',
      path: '/analytics',
      icon: RiBarChartLine,
      label: 'Analytics',
      description: 'Reports & Insights'
    },
    {
      id: 'settings',
      path: '/settings',
      icon: RiSettings3Line,
      label: 'Settings',
      description: 'System Configuration'
    }
  ];

  const bottomNavItems = [
    {
      id: 'profile',
      path: '/profile',
      icon: RiUser3Line,
      label: 'Profile',
      description: 'Account Settings'
    }
  ];

  const handleItemHover = (itemId) => {
    if (isCollapsed) {
      setHoveredItem(itemId);
    }
  };

  const handleItemLeave = () => {
    setHoveredItem(null);
  };

  return (
    <>
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <RiUser3Line />
            </div>
            {!isCollapsed && (
              <div className={styles.logoText}>
                <h2>Campus Admin</h2>
                <span>Agent System</span>
              </div>
            )}
          </div>
          
          <button 
            className={styles.toggleButton} 
            onClick={onToggle}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <RiMenuUnfoldLine /> : <RiMenuFoldLine />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={styles.navigation}>
          <div className={styles.navSection}>
            <ul className={styles.navList}>
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.path;
                const IconComponent = item.icon;
                
                return (
                  <li 
                    key={item.id}
                    className={styles.navItem}
                    onMouseEnter={() => handleItemHover(item.id)}
                    onMouseLeave={handleItemLeave}
                  >
                    <NavLink
                      to={item.path}
                      className={({ isActive }) => 
                        `${styles.navLink} ${isActive ? styles.active : ''}`
                      }
                    >
                      <div className={styles.navLinkContent}>
                        <div className={styles.iconWrapper}>
                          <IconComponent className={styles.icon} />
                          {item.badge && (
                            <span className={styles.badge}>{item.badge}</span>
                          )}
                        </div>
                        
                        {!isCollapsed && (
                          <div className={styles.labelWrapper}>
                            <span className={styles.label}>{item.label}</span>
                            <span className={styles.description}>{item.description}</span>
                          </div>
                        )}
                        
                        {isActive && <div className={styles.activeIndicator} />}
                      </div>
                    </NavLink>

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && hoveredItem === item.id && (
                      <div className={styles.tooltip}>
                        <span className={styles.tooltipLabel}>{item.label}</span>
                        <span className={styles.tooltipDescription}>{item.description}</span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Quick Stats */}
        {!isCollapsed && (
          <div className={styles.quickStats}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <RiGroupLine />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statNumber}>1,234</span>
                <span className={styles.statLabel}>Total Students</span>
              </div>
            </div>
            
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <RiNotification3Line />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statNumber}>5</span>
                <span className={styles.statLabel}>Notifications</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className={styles.bottomNav}>
          <div className={styles.navSection}>
            <ul className={styles.navList}>
              {bottomNavItems.map((item) => {
                const IconComponent = item.icon;
                
                return (
                  <li 
                    key={item.id}
                    className={styles.navItem}
                    onMouseEnter={() => handleItemHover(item.id)}
                    onMouseLeave={handleItemLeave}
                  >
                    <NavLink
                      to={item.path}
                      className={({ isActive }) => 
                        `${styles.navLink} ${isActive ? styles.active : ''}`
                      }
                    >
                      <div className={styles.navLinkContent}>
                        <div className={styles.iconWrapper}>
                          <IconComponent className={styles.icon} />
                        </div>
                        
                        {!isCollapsed && (
                          <div className={styles.labelWrapper}>
                            <span className={styles.label}>{item.label}</span>
                            <span className={styles.description}>{item.description}</span>
                          </div>
                        )}
                      </div>
                    </NavLink>

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && hoveredItem === item.id && (
                      <div className={styles.tooltip}>
                        <span className={styles.tooltipLabel}>{item.label}</span>
                        <span className={styles.tooltipDescription}>{item.description}</span>
                      </div>
                    )}
                  </li>
                );
              })}
              
              {/* Logout Button */}
              <li className={styles.navItem}>
                <button 
                  className={styles.logoutButton}
                  onMouseEnter={() => handleItemHover('logout')}
                  onMouseLeave={handleItemLeave}
                  title="Logout"
                >
                  <div className={styles.navLinkContent}>
                    <div className={styles.iconWrapper}>
                      <RiLogoutBoxLine className={styles.icon} />
                    </div>
                    
                    {!isCollapsed && (
                      <div className={styles.labelWrapper}>
                        <span className={styles.label}>Logout</span>
                        <span className={styles.description}>Sign out</span>
                      </div>
                    )}
                  </div>
                </button>

                {/* Tooltip for logout in collapsed state */}
                {isCollapsed && hoveredItem === 'logout' && (
                  <div className={styles.tooltip}>
                    <span className={styles.tooltipLabel}>Logout</span>
                    <span className={styles.tooltipDescription}>Sign out</span>
                  </div>
                )}
              </li>
            </ul>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div className={styles.overlay} onClick={onToggle} />
      )}
    </>
  );
};

export default Sidebar;