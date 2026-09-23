import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Preferences
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('cti_preferences');
    return saved ? JSON.parse(saved) : {
      theme: 'dark',
      compactMode: false,
      animations: true,
      autoRefresh: false
    };
  });

  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('cyber-threat-theme');
    return saved ? saved : 'dark';
  });

  const [resolvedTheme, setResolvedTheme] = useState('dark');

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('cyber-threat-theme', newTheme);
    updatePreference('theme', newTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    let activeTheme = theme;

    if (theme === 'system') {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      activeTheme = isSystemDark ? 'dark' : 'light';
    }

    setResolvedTheme(activeTheme);

    if (activeTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  // System theme listener
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (theme === 'system') {
        const root = document.documentElement;
        const newTheme = e.matches ? 'dark' : 'light';
        setResolvedTheme(newTheme);
        if (newTheme === 'dark') {
          root.classList.add('dark');
          root.classList.remove('light');
        } else {
          root.classList.add('light');
          root.classList.remove('dark');
        }
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Notifications
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('cti_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  // Saved Views
  const [savedViews, setSavedViews] = useState(() => {
    const saved = localStorage.getItem('cti_saved_views');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cti_preferences', JSON.stringify(preferences));
    if (!preferences.animations) {
      document.body.classList.add('no-animations');
    } else {
      document.body.classList.remove('no-animations');
    }
  }, [preferences]);

  const addNotification = (notif) => {
    setNotifications(prev => [{
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notif
    }, ...prev].slice(0, 50)); // Keep last 50
  };

  const markNotificationRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const updatePreference = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const saveView = (name, filters) => {
    setSavedViews(prev => [...prev.filter(v => v.name !== name), { id: Date.now().toString(), name, filters }]);
  };

  const deleteView = (id) => {
    setSavedViews(prev => prev.filter(v => v.id !== id));
  };

  return (
    <AppContext.Provider value={{
      theme, setTheme, resolvedTheme,
      preferences, updatePreference,
      notifications, addNotification, markNotificationRead, markAllNotificationsRead, clearNotifications,
      savedViews, saveView, deleteView
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
