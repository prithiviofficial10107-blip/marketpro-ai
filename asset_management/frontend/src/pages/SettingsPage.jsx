import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Bell,
  Shield,
  Database,
  Globe,
  Palette,
  ChevronRight,
  X,
  Check,
  Save,
  Download,
  Lock,
  Smartphone,
  Eye,
  EyeOff
} from 'lucide-react';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import api from '../services/api';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

const SettingItem = ({ icon: Icon, title, description, action, onClick }) => (
  <div
    onClick={onClick}
    className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group"
  >
    <div className="flex items-center gap-5">
      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-all">
        <Icon size={22} />
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-white">{title}</h4>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      {action}
      <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
    </div>
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const SettingsPage = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, updateProfileState } = useAuth();
  const { t } = useTranslation();
  const [activeModal, setActiveModal] = useState(null);

  // Forms State
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    avatar_url: user?.avatar_url || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [showPassword, setShowPassword] = useState(false);

  // Update profileForm when user changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        avatar_url: user.avatar_url || ''
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/auth/profile', profileForm);
      updateProfileState(res.data.data);
      toast.success("Profile updated successfully");
      setActiveModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleUpdatePreference = async (key, value) => {
    try {
      const res = await api.put('/auth/settings', { [key]: value });
      updateProfileState(res.data.data);

      if (key === 'language') {
        const langCode = value === 'Tamil' ? 'ta' : 'en';
        i18n.changeLanguage(langCode);
      }

      toast.success("Preference updated");
    } catch (err) {
      toast.error("Failed to update setting");
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      return toast.error("New passwords do not match");
    }
    try {
      await api.post('/auth/change-password', {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password
      });
      toast.success("Password changed successfully");
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
      setActiveModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    }
  };

  const handleExport = async () => {
    const loadingToast = toast.loading("Generating export...");
    try {
      const res = await api.get('/reports/export');
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data.data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `inventory_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      toast.success("Export successful", { id: loadingToast });
    } catch (err) {
      toast.error("Export failed", { id: loadingToast });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-12 pb-24 h-full overflow-y-auto scrollbar-hide">
      <header className="space-y-2">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{t('settings.title')}</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">{t('settings.subtitle')}</p>
      </header>

      <div className="grid grid-cols-1 gap-12">
        {/* Personal Section */}
        <section className="space-y-4">
          <h3 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('settings.personal_workspace')}</h3>
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
            <SettingItem
              icon={User}
              title={t('settings.profile')}
              description="Customize your public identity and contact details."
              onClick={() => setActiveModal('profile')}
              action={<div className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded uppercase">{user?.username}</div>}
            />
            <SettingItem
              icon={Palette}
              title={t('settings.appearance')}
              description="Switch between light and dark visual modes."
              onClick={toggleTheme}
              action={
                <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {isDarkMode ? t('sidebar.dark_mode') : t('sidebar.light_mode')}
                </div>
              }
            />
            <SettingItem
              icon={Bell}
              title={t('settings.notifications')}
              description="Configure how you stay informed about stock and alerts."
              onClick={() => setActiveModal('notifications')}
            />
          </div>
        </section>

        {/* Security & System */}
        <section className="space-y-4">
          <h3 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('settings.security_data')}</h3>
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
            <SettingItem
              icon={Shield}
              title={t('settings.privacy')}
              description="Protect your account with passwords and encryption."
              onClick={() => setActiveModal('security')}
            />
            <SettingItem
              icon={Database}
              title={t('settings.data_mgmt')}
              description="Generate backups and manage inventory exports."
              onClick={() => setActiveModal('data')}
            />
            <SettingItem
              icon={Globe}
              title={t('settings.language')}
              description="Set your primary interaction language."
              onClick={() => setActiveModal('language')}
              action={<div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.language || 'English'}</div>}
            />
          </div>
        </section>
      </div>

      <footer className="pt-10 flex flex-col items-center gap-4 border-t border-slate-100 dark:border-slate-800 opacity-50">
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.6em]">Enterprise Cloud Node • v2.1.0</p>
      </footer>

      {/* --- MODALS --- */}

      {/* Profile Modal */}
      <Modal isOpen={activeModal === 'profile'} onClose={() => setActiveModal(null)} title="Update Profile">
        <form onSubmit={handleUpdateProfile} className="space-y-6">
           <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-xl">
                 {user?.username?.[0].toUpperCase()}
              </div>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">First Name</label>
                <input
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none dark:text-white"
                  value={profileForm.first_name}
                  onChange={e => setProfileForm({...profileForm, first_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Last Name</label>
                <input
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none dark:text-white"
                  value={profileForm.last_name}
                  onChange={e => setProfileForm({...profileForm, last_name: e.target.value})}
                />
              </div>
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Email Address</label>
              <input
                type="email"
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none dark:text-white"
                value={profileForm.email}
                onChange={e => setProfileForm({...profileForm, email: e.target.value})}
              />
           </div>
           <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
              <Save size={18} /> Save Changes
           </button>
        </form>
      </Modal>

      {/* Notifications Modal */}
      <Modal isOpen={activeModal === 'notifications'} onClose={() => setActiveModal(null)} title="Alert Preferences">
        <div className="space-y-4">
          {[
            { id: 'email_notifications', label: 'Email Alerts', sub: 'Weekly stock and sales summaries.', icon: Bell },
            { id: 'push_notifications', label: 'Push Notifications', sub: 'Real-time low stock and critical warnings.', icon: Smartphone }
          ].map(pref => (
            <div key={pref.id} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-800">
               <div className="flex items-center gap-4">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-xl text-blue-500 shadow-sm"><pref.icon size={18} /></div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{pref.label}</p>
                    <p className="text-[10px] text-slate-500">{pref.sub}</p>
                  </div>
               </div>
               <button
                 onClick={() => handleUpdatePreference(pref.id, !user?.[pref.id])}
                 className={cn("w-12 h-6 rounded-full relative transition-all duration-300", user?.[pref.id] ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700")}
               >
                 <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300", user?.[pref.id] ? "right-1" : "left-1")} />
               </button>
            </div>
          ))}
        </div>
      </Modal>

      {/* Security Modal */}
      <Modal isOpen={activeModal === 'security'} onClose={() => setActiveModal(null)} title="Security Center">
        <div className="space-y-10">
           <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Update Password</h4>
              <div className="relative">
                 <input
                   type={showPassword ? "text" : "password"}
                   placeholder="Current Password"
                   className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                   value={passwordForm.old_password}
                   onChange={e => setPasswordForm({...passwordForm, old_password: e.target.value})}
                   required
                 />
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                 </button>
              </div>
              <input
                type="password"
                placeholder="New Password"
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                value={passwordForm.new_password}
                onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                value={passwordForm.confirm_password}
                onChange={e => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                required
              />
              <button type="submit" className="w-full bg-slate-900 dark:bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl hover:opacity-90 active:scale-95 transition-all text-xs uppercase tracking-widest">
                 Authorize Reset
              </button>
           </form>

           <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Identity Protection</h4>
              <div className="flex items-center justify-between p-5 bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-3xl">
                 <div className="flex gap-4">
                    <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20"><Lock size={20} /></div>
                    <div>
                       <p className="text-sm font-bold text-slate-800 dark:text-white">2FA Verification</p>
                       <p className="text-[10px] text-slate-500">Secure access with mobile OTP.</p>
                    </div>
                 </div>
                 <button
                   onClick={() => handleUpdatePreference('two_factor_enabled', !user?.two_factor_enabled)}
                   className={cn("w-12 h-6 rounded-full relative transition-all duration-300", user?.two_factor_enabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700")}
                 >
                   <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300", user?.two_factor_enabled ? "right-1" : "left-1")} />
                 </button>
              </div>
           </div>
        </div>
      </Modal>

      {/* Data Management Modal */}
      <Modal isOpen={activeModal === 'data'} onClose={() => setActiveModal(null)} title="Data Management">
        <div className="text-center space-y-8">
           <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-[2.5rem] flex items-center justify-center mx-auto text-blue-600 shadow-inner">
              <Database size={40} />
           </div>
           <div className="space-y-2 px-4">
              <h4 className="text-lg font-bold text-slate-800 dark:text-white">Inventory Backup</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                 Download a comprehensive snapshot of your supermarket database in structured JSON format for auditing and archival purposes.
              </p>
           </div>
           <button onClick={handleExport} className="w-full bg-blue-600 text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 hover:bg-blue-700 shadow-2xl shadow-blue-500/30 active:scale-95 transition-all text-xs tracking-widest">
              <Download size={20} /> INITIATE EXPORT
           </button>
           <p className="text-[9px] text-slate-400 font-bold uppercase italic">Automatic backups are generated every 24 hours.</p>
        </div>
      </Modal>

      {/* Language Modal */}
      <Modal isOpen={activeModal === 'language'} onClose={() => setActiveModal(null)} title="System Language">
        <div className="grid grid-cols-1 gap-3">
          {['English', 'Tamil'].map(lang => (
            <button
              key={lang}
              onClick={() => { handleUpdatePreference('language', lang); setActiveModal(null); }}
              className={cn(
                "flex items-center justify-between p-6 rounded-[1.5rem] font-bold transition-all border group",
                (user?.language === lang || (!user?.language && lang === 'English'))
                  ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20"
                  : "bg-white border-slate-100 text-slate-600 hover:border-blue-200 dark:bg-slate-800 dark:border-slate-800 dark:text-slate-400"
              )}
            >
              <div className="flex items-center gap-4">
                 <Globe size={20} className={cn((user?.language === lang || (!user?.language && lang === 'English')) ? "text-white" : "text-slate-300 group-hover:text-blue-500")} />
                 {lang}
              </div>
              {(user?.language === lang || (!user?.language && lang === 'English')) && <Check size={20} strokeWidth={3} />}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default SettingsPage;
