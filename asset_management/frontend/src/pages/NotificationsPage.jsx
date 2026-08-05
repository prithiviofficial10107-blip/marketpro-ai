import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Check,
  Trash2,
  Loader2,
  Package,
  Clock,
  Truck,
  Users,
  AlertCircle,
  Settings,
  ChevronRight,
  Info,
  CheckCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const navigate = useNavigate();

  const tabs = [
    { id: 'ALL', label: 'All Alerts' },
    { id: 'STOCK', label: 'Inventory', types: ['low_stock', 'out_of_stock'] },
    { id: 'EXPIRY', label: 'Expiry', types: ['expiring_soon'] },
    { id: 'PROCUREMENT', label: 'Orders', types: ['po_shipped', 'po_received'] },
    { id: 'STAFF', label: 'Team', types: ['staff_added', 'staff_inactive'] }
  ];

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications/');
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      // Dispatch custom event to update sidebar count
      window.dispatchEvent(new Event('notificationsUpdated'));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    if (!window.confirm("Remove this alert from history?")) return;
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
      window.dispatchEvent(new Event('notificationsUpdated'));
      toast.success("Notification removed");
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      window.dispatchEvent(new Event('notificationsUpdated'));
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to update notifications");
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) markAsRead(notif.id);

    // Navigate based on related entity
    if (notif.related_entity_type === 'product') {
       navigate(`/assets?search=${notif.related_entity_id}`);
    } else if (notif.related_entity_type === 'purchase_order') {
       navigate('/service');
    } else if (notif.related_entity_type === 'staff') {
       navigate('/employees');
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'ALL') return true;
    const tab = tabs.find(t => t.id === activeTab);
    return tab.types.includes(n.type);
  });

  const getIcon = (type) => {
    switch (type) {
      case 'low_stock':
      case 'out_of_stock': return <Package className="text-orange-500" size={20} />;
      case 'expiring_soon': return <Clock className="text-amber-500" size={20} />;
      case 'po_shipped':
      case 'po_received': return <Truck className="text-blue-500" size={20} />;
      case 'staff_added':
      case 'staff_inactive': return <Users className="text-indigo-500" size={20} />;
      default: return <Info className="text-slate-400" size={20} />;
    }
  };

  const getTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="p-5 h-full flex flex-col space-y-6 overflow-y-auto pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Activity Center</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-bold italic text-[10px] uppercase tracking-widest">Real-time System Intelligence</p>
        </div>
        <div className="flex gap-3">
           <button
             onClick={markAllRead}
             className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 transition-all"
           >
             Mark all as read
           </button>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex bg-white dark:bg-slate-900 p-1 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm w-fit overflow-x-auto no-scrollbar">
         {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-slate-900 text-white dark:bg-blue-600 shadow-lg"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              )}
            >
               {tab.label}
            </button>
         ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-50 dark:bg-slate-900 animate-pulse rounded-3xl" />)}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 p-32 text-center space-y-6">
             <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <Bell size={48} />
             </div>
             <div>
                <p className="text-xl font-bold text-slate-700 dark:text-slate-300">All caught up!</p>
                <p className="text-sm text-slate-500 mt-1">No unread alerts in this category.</p>
             </div>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <motion.div
              key={notif.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleNotificationClick(notif)}
              className={cn(
                "group p-6 rounded-[2rem] border transition-all cursor-pointer relative overflow-hidden",
                notif.is_read
                  ? "bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 opacity-60 grayscale-[0.5]"
                  : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none hover:border-blue-300"
              )}
            >
              {/* Severity Indicator */}
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1.5",
                notif.severity === 'critical' ? "bg-red-500" :
                notif.severity === 'warning' ? "bg-amber-500" : "bg-blue-500"
              )} />

              <div className="flex gap-6 items-start">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-inner">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                       <h3 className={cn("text-lg font-black tracking-tight", notif.is_read ? "text-slate-700 dark:text-slate-300" : "text-slate-900 dark:text-white")}>
                          {notif.title}
                       </h3>
                       {!notif.is_read && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />}
                    </div>
                    <div className="flex items-center gap-4">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{getTimeAgo(notif.created_at)}</span>
                       <button
                         onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                         className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
                         title="Remove Alert"
                       >
                          <Trash2 size={16} />
                       </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl">{notif.message}</p>
                </div>

                <div className="flex items-center self-center text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all">
                   <ChevronRight size={24} />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
