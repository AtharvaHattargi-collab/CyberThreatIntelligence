import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import CommandPalette from '../components/ui/CommandPalette';
import KeyboardShortcutsModal from '../components/ui/KeyboardShortcutsModal';
import { useAppContext } from '../context/AppContext';

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  
  const navigate = useNavigate();
  const { preferences } = useAppContext();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => window.location.reload(), 300);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if inside an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.key === '/') {
        e.preventDefault();
        setCmdOpen(true);
      } else if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setShortcutsOpen(true);
      } else if (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setCmdOpen(true);
      } else if (e.key === 'Escape') {
        setCmdOpen(false);
        setShortcutsOpen(false);
      } else if (!cmdOpen && !shortcutsOpen) {
        // Navigation shortcuts
        switch(e.key.toLowerCase()) {
          case 'g': navigate('/'); break;
          case 't': navigate('/monitor'); break;
          case 'e': navigate('/events'); break;
          case 'a': navigate('/detection'); break;
          case 'm': navigate('/performance'); break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, cmdOpen, shortcutsOpen]);

  const sidebarWidth = collapsed ? 'pl-20' : 'pl-[260px]';

  return (
    <div className="flex h-screen bg-background text-text-primary font-sans overflow-hidden w-full">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      
      <div className={`flex-1 ${sidebarWidth} flex flex-col h-screen overflow-hidden transition-all duration-300 min-w-0`}>
        <Topbar 
          onRefresh={handleRefresh} 
          isRefreshing={isRefreshing} 
          onOpenSearch={() => setCmdOpen(true)}
          onOpenShortcuts={() => setShortcutsOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="max-w-[1400px] mx-auto pb-8">
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
