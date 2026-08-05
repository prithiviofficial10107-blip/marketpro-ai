import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import { ThemeProvider, useTheme } from './store/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from './services/api';
import LoginPage from './pages/LoginPage';
import AssetsPage from './pages/AssetsPage';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import NotificationsPage from './pages/NotificationsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import ActivityLogPage from './pages/ActivityLogPage';
import DamagedAssetsPage from './pages/DamagedAssetsPage';
import ServicePage from './pages/ServicePage';
import BillingPage from './pages/BillingPage';
import BillingHistoryPage from './pages/BillingHistoryPage';
import AIAssistant from './components/AIAssistant';
import {
  LayoutDashboard,
  Package,
  Users,
  Bell,
  FileBarChart,
  Settings,
  LogOut,
  Moon,
  Sun,
  ShieldAlert,
  Wrench,
  History,
  ShoppingCart
} from 'lucide-react';
import { cn } from './lib/utils';

const SidebarItem = ({ to, icon: Icon, label, active, badge }) => (
  <Link
    to={to}
    className={cn(
      "flex items-center justify-between py-3 px-5 rounded-xl transition-all duration-200 group",
      active
        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    )}
  >
    <div className="flex items-center gap-4">
      <Icon size={22} className={cn("transition-transform duration-200 group-hover:scale-110", active ? "text-white" : "text-slate-500")} />
      <span className="font-bold text-sm tracking-tight">{label}</span>
    </div>
    {badge > 0 && (
      <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg shadow-red-500/40 animate-pulse">
        {badge}
      </span>
    )}
  </Link>
);

const Sidebar = () => {
  const { logout, user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  // Sync language with user profile
  useEffect(() => {
    if (user?.language) {
      const langCode = user.language === 'Tamil' ? 'ta' : 'en';
      if (i18n.language !== langCode) {
        i18n.changeLanguage(langCode);
      }
    }
  }, [user, i18n]);

  const fetchUnread = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.data.count);
    } catch (err) {
      console.error("Failed to fetch unread count", err);
    }
  };

  useEffect(() => {
    fetchUnread();

    // Listen for custom refresh events from the notifications page
    window.addEventListener('notificationsUpdated', fetchUnread);
    return () => window.removeEventListener('notificationsUpdated', fetchUnread);
  }, []);

  return (
    <aside className="w-72 bg-slate-950 text-white h-screen p-6 flex flex-col sticky top-0 border-r border-slate-800 z-50 overflow-y-auto">
      <div className="flex items-center gap-3 mb-10 px-2 shrink-0">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Package size={24} className="text-white" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-lg font-bold leading-tight uppercase tracking-tighter">MarketPro</h2>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">AI Inventory</span>
        </div>
      </div>

      <nav className="space-y-1 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <SidebarItem to="/" icon={LayoutDashboard} label={t('sidebar.dashboard')} active={location.pathname === '/'} />
        <SidebarItem to="/billing" icon={ShoppingCart} label={t('sidebar.billing')} active={location.pathname === '/billing'} />
        <SidebarItem to="/assets" icon={Package} label={t('sidebar.inventory')} active={location.pathname === '/assets'} />
        <SidebarItem to="/employees" icon={Users} label={t('sidebar.staff')} active={location.pathname === '/employees'} />

        <div className="pt-4 pb-2">
          <span className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">{t('sidebar.nav_reports')}</span>
        </div>
        <SidebarItem to="/damaged" icon={ShieldAlert} label={t('sidebar.wastage')} active={location.pathname === '/damaged'} />
        <SidebarItem to="/service" icon={Wrench} label={t('sidebar.procurement')} active={location.pathname === '/service'} />

        <div className="pt-4 pb-2">
          <span className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">{t('sidebar.nav_analytics')}</span>
        </div>
        <SidebarItem
           to="/notifications"
           icon={Bell}
           label={t('sidebar.notifications')}
           active={location.pathname === '/notifications'}
           badge={unreadCount}
        />
        <SidebarItem to="/reports" icon={FileBarChart} label={t('sidebar.reports')} active={location.pathname === '/reports'} />
        <SidebarItem to="/audit" icon={History} label={t('sidebar.audit')} active={location.pathname === '/audit'} />
      </nav>

      <div className="pt-6 mt-auto space-y-2 border-t border-slate-900">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full py-2 px-4 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          <span className="font-medium">{isDarkMode ? t('sidebar.light_mode') : t('sidebar.dark_mode')}</span>
        </button>
        <SidebarItem to="/settings" icon={Settings} label={t('sidebar.settings')} active={location.pathname === '/settings'} />
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full py-2 px-4 rounded-lg text-red-400 hover:bg-red-950/30 transition-all group"
        >
          <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
          <span className="font-medium">{t('sidebar.signout')}</span>
        </button>
      </div>
    </aside>
  );
};

const ProtectedLayout = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"
      />
    </div>
  );

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 h-screen overflow-hidden transition-colors duration-300 font-sans">
      <Sidebar />
      <main className="flex-1 h-full overflow-hidden flex flex-col relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto"
          >
            {children}
          </motion.div>
        </AnimatePresence>

        {/* ChatGPT Style Floating Assistant */}
        <div className="fixed bottom-6 right-6 z-50">
          <AIAssistant />
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster position="top-right" reverseOrder={false} />
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
            <Route path="/assets" element={<ProtectedLayout><AssetsPage /></ProtectedLayout>} />
            <Route path="/employees" element={<ProtectedLayout><EmployeesPage /></ProtectedLayout>} />
            <Route path="/billing" element={<ProtectedLayout><BillingPage /></ProtectedLayout>} />
            <Route path="/billing/history" element={<ProtectedLayout><BillingHistoryPage /></ProtectedLayout>} />
            <Route path="/notifications" element={<ProtectedLayout><NotificationsPage /></ProtectedLayout>} />
            <Route path="/reports" element={<ProtectedLayout><ReportsPage /></ProtectedLayout>} />
            <Route path="/settings" element={<ProtectedLayout><SettingsPage /></ProtectedLayout>} />
            <Route path="/audit" element={<ProtectedLayout><ActivityLogPage /></ProtectedLayout>} />
            <Route path="/damaged" element={<ProtectedLayout><DamagedAssetsPage /></ProtectedLayout>} />
            <Route path="/service" element={<ProtectedLayout><ServicePage /></ProtectedLayout>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
