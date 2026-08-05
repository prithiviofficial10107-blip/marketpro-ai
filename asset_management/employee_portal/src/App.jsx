import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider, useTheme } from './store/ThemeContext';
import { AuthProvider, useAuth } from './store/AuthContext';
import {
  Package,
  User,
  LogOut,
  ShieldAlert,
  LayoutDashboard,
  Moon,
  Sun,
  Wrench,
  Bell
} from 'lucide-react';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AIAssistant from './components/AIAssistant';
import LoginPage from './pages/LoginPage';

const SidebarItem = ({ to, icon: Icon, label, active }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 py-3 px-5 rounded-2xl transition-all duration-300 group ${
      active
        ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/40 translate-x-2"
        : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
    }`}
  >
    <Icon size={20} className={active ? "text-white" : "text-slate-500 group-hover:text-indigo-400"} />
    <span className="font-bold text-xs uppercase tracking-widest">{label}</span>
  </Link>
);

const Sidebar = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <aside className="w-72 bg-slate-950 text-white min-h-screen p-8 flex flex-col fixed left-0 top-0 border-r border-slate-900 z-50">
      <div className="flex items-center gap-4 mb-12 px-2">
        <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 rotate-3">
          <Package size={28} className="text-white" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-xl font-black leading-tight tracking-tighter text-white">STAFF<span className="text-indigo-500 text-3xl leading-[0]">.</span></h2>
          <span className="text-[8px] text-slate-500 uppercase tracking-[0.3em] font-black opacity-80">Employee Cloud</span>
        </div>
      </div>

      <nav className="space-y-2 flex-1">
        <div className="pb-4">
          <span className="px-5 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 block">Main Terminal</span>
          <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} />
          <SidebarItem to="/my-assets" icon={Package} label="Equipment" active={location.pathname === '/my-assets'} />
        </div>

        <div className="pt-6 pb-4">
          <span className="px-5 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 block">Operations</span>
          <SidebarItem to="/tickets" icon={Wrench} label="IT Support" active={location.pathname === '/tickets'} />
          <SidebarItem to="/notifications" icon={Bell} label="Alerts" active={location.pathname === '/notifications'} />
        </div>
      </nav>

      <div className="pt-8 mt-auto space-y-3 border-t border-slate-900/50">
        <button
          onClick={toggleTheme}
          className="flex items-center justify-between w-full py-3.5 px-5 rounded-2xl bg-slate-900/50 text-slate-400 hover:text-white transition-all group border border-slate-800/50"
        >
          <div className="flex items-center gap-3">
            {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-400" />}
            <span className="font-bold text-[10px] uppercase tracking-widest">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
          <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-700'}`}>
             <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all duration-300 ${isDarkMode ? 'right-1' : 'left-1'}`} />
          </div>
        </button>

        <button
          onClick={logout}
          className="flex items-center gap-3 w-full py-3.5 px-5 rounded-2xl text-red-400 hover:bg-red-950/30 transition-all font-black group border border-transparent hover:border-red-900/30"
        >
          <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
          <span className="text-[10px] uppercase tracking-widest">Terminate Session</span>
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
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full shadow-lg shadow-indigo-500/20"
        />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing User Profile...</p>
      </div>
    </div>
  );

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-72 relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
         <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
               {children}
            </motion.div>
         </AnimatePresence>

         <div className="fixed bottom-10 right-10 z-50">
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
        <Toaster
           position="top-right"
           toastOptions={{
             style: {
               background: '#0f172a',
               color: '#fff',
               borderRadius: '1rem',
               fontSize: '12px',
               fontWeight: 'bold',
               border: '1px solid #1e293b'
             }
           }}
        />
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedLayout><EmployeeDashboard /></ProtectedLayout>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
