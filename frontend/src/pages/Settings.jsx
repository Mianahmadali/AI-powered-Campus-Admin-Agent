import React, { useState, useEffect } from 'react';
import {
  RiUser3Line,
  RiSettings3Line,
  RiNotification3Line,
  RiShieldCheckLine,
  RiPaintBrushLine,
  RiGlobalLine,
  RiSaveLine,
  RiEyeLine,
  RiEyeOffLine,
  RiEditLine,
  RiCheckLine,
  RiCloseLine,
  RiUploadLine,
  RiDeleteBinLine
} from 'react-icons/ri';
import Card from '../components/Card';
import { api } from '../api';
import styles from './Settings.module.scss';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: 'Admin User',
    email: 'admin@campus.edu',
    role: 'System Administrator',
    department: 'IT Services',
    phone: '+1 (555) 123-4567',
    bio: 'Campus administration system manager with 5+ years of experience.',
    avatar: null
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    systemAlerts: true,
    chatNotifications: false
  });

  const [systemSettings, setSystemSettings] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'UTC-5',
    dateFormat: 'MM/DD/YYYY',
    autoBackup: true,
    maintenanceMode: false
  });

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    passwordPolicy: 'medium',
    loginAttempts: 3
  });

  const [passwordChange, setPasswordChange] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: RiUser3Line },
    { id: 'notifications', label: 'Notifications', icon: RiNotification3Line },
    { id: 'appearance', label: 'Appearance', icon: RiPaintBrushLine },
    { id: 'system', label: 'System', icon: RiSettings3Line },
    { id: 'security', label: 'Security', icon: RiShieldCheckLine }
  ];

  const handleSave = async (section) => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Saving ${section} settings...`);
      // In real app, make API call here
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData(prev => ({ ...prev, avatar: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordChange.newPassword !== passwordChange.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Password changed successfully');
      setPasswordChange({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Password change failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderProfileTab = () => (
    <div className={styles.tabContent}>
      <Card title="Profile Information" className={styles.profileCard}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatar}>
              {profileData.avatar ? (
                <img src={profileData.avatar} alt="Profile" />
              ) : (
                <RiUser3Line />
              )}
            </div>
            <div className={styles.avatarActions}>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className={styles.fileInput}
                id="avatar-upload"
              />
              <label htmlFor="avatar-upload" className={styles.uploadButton}>
                <RiUploadLine /> Upload Photo
              </label>
              {profileData.avatar && (
                <button
                  onClick={() => setProfileData(prev => ({ ...prev, avatar: null }))}
                  className={styles.deleteButton}
                >
                  <RiDeleteBinLine /> Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Full Name</label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Email Address</label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Role</label>
            <select
              value={profileData.role}
              onChange={(e) => setProfileData(prev => ({ ...prev, role: e.target.value }))}
            >
              <option value="System Administrator">System Administrator</option>
              <option value="Campus Admin">Campus Admin</option>
              <option value="Department Head">Department Head</option>
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label>Department</label>
            <input
              type="text"
              value={profileData.department}
              onChange={(e) => setProfileData(prev => ({ ...prev, department: e.target.value }))}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Phone Number</label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Bio</label>
          <textarea
            value={profileData.bio}
            onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
            rows={4}
            placeholder="Tell us about yourself..."
          />
        </div>

        <div className={styles.formActions}>
          <button 
            onClick={() => handleSave('profile')} 
            disabled={saving}
            className={styles.saveButton}
          >
            <RiSaveLine /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Card>

      <Card title="Change Password" className={styles.passwordCard}>
        <form onSubmit={handlePasswordChange}>
          <div className={styles.formGroup}>
            <label>Current Password</label>
            <div className={styles.passwordInput}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordChange.currentPassword}
                onChange={(e) => setPasswordChange(prev => ({ ...prev, currentPassword: e.target.value }))}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.passwordToggle}
              >
                {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>New Password</label>
            <input
              type="password"
              value={passwordChange.newPassword}
              onChange={(e) => setPasswordChange(prev => ({ ...prev, newPassword: e.target.value }))}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Confirm New Password</label>
            <input
              type="password"
              value={passwordChange.confirmPassword}
              onChange={(e) => setPasswordChange(prev => ({ ...prev, confirmPassword: e.target.value }))}
              required
            />
          </div>

          <div className={styles.formActions}>
            <button type="submit" disabled={saving} className={styles.saveButton}>
              <RiSaveLine /> {saving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className={styles.tabContent}>
      <Card title="Notification Preferences">
        <div className={styles.settingsList}>
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <h4>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h4>
                <p>Receive notifications for this category</p>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>
          ))}
        </div>
        
        <div className={styles.formActions}>
          <button onClick={() => handleSave('notifications')} className={styles.saveButton}>
            <RiSaveLine /> Save Preferences
          </button>
        </div>
      </Card>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className={styles.tabContent}>
      <Card title="Theme & Appearance">
        <div className={styles.themeSelector}>
          <div className={styles.themeOptions}>
            <div 
              className={`${styles.themeOption} ${systemSettings.theme === 'light' ? styles.active : ''}`}
              onClick={() => setSystemSettings(prev => ({ ...prev, theme: 'light' }))}
            >
              <div className={styles.themePreview}>
                <div className={styles.lightPreview}></div>
              </div>
              <span>Light</span>
            </div>
            <div 
              className={`${styles.themeOption} ${systemSettings.theme === 'dark' ? styles.active : ''}`}
              onClick={() => setSystemSettings(prev => ({ ...prev, theme: 'dark' }))}
            >
              <div className={styles.themePreview}>
                <div className={styles.darkPreview}></div>
              </div>
              <span>Dark</span>
            </div>
            <div 
              className={`${styles.themeOption} ${systemSettings.theme === 'auto' ? styles.active : ''}`}
              onClick={() => setSystemSettings(prev => ({ ...prev, theme: 'auto' }))}
            >
              <div className={styles.themePreview}>
                <div className={styles.autoPreview}></div>
              </div>
              <span>Auto</span>
            </div>
          </div>
        </div>

        <div className={styles.formActions}>
          <button onClick={() => handleSave('appearance')} className={styles.saveButton}>
            <RiSaveLine /> Apply Theme
          </button>
        </div>
      </Card>
    </div>
  );

  const renderCurrentTab = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'appearance':
        return renderAppearanceTab();
      case 'system':
        return (
          <div className={styles.tabContent}>
            <Card title="System Configuration">
              <p>System settings coming soon...</p>
            </Card>
          </div>
        );
      case 'security':
        return (
          <div className={styles.tabContent}>
            <Card title="Security Settings">
              <p>Security settings coming soon...</p>
            </Card>
          </div>
        );
      default:
        return renderProfileTab();
    }
  };

  return (
    <div className={styles.settings}>
      <div className={styles.settingsHeader}>
        <h1>Settings</h1>
        <p>Manage your account preferences and system configuration</p>
      </div>

      <div className={styles.settingsLayout}>
        <div className={styles.settingsSidebar}>
          <nav className={styles.settingsNav}>
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`${styles.navItem} ${activeTab === tab.id ? styles.active : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <IconComponent />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className={styles.settingsContent}>
          {renderCurrentTab()}
        </div>
      </div>
    </div>
  );
};

export default Settings;