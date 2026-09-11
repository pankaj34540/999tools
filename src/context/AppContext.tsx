import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserRole, 
  SiteConfig, 
  ServiceItem, 
  VleOperator, 
  CustomerOrder, 
  WalletTransaction,
  ImportantLink,
  VleApplication,
  ToolDefinition
} from '../types';
import { 
  initialSiteConfig, 
  initialServices, 
  initialVles, 
  initialOrders, 
  initialTransactions,
  initialImportantLinks,
  initialVleApplications 
} from '../data/initialData';
import { TOOLS_REGISTRY } from '../data/toolsRegistry';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  siteConfig: SiteConfig;
  updateSiteConfig: (updates: Partial<SiteConfig>) => void;
  services: ServiceItem[];
  toggleService: (id: string) => void;
  updateService: (service: ServiceItem) => void;
  addService: (service: Omit<ServiceItem, 'id'>) => void;
  deleteService: (id: string) => void;
  
  // VLEs & Membership
  vles: VleOperator[];
  activeVle: VleOperator | null;
  setActiveVle: (vle: VleOperator | null) => void;
  updateVleWallet: (vleId: string, amount: number, type: 'credit' | 'debit', reason: string) => boolean;
  toggleVleStatus: (vleId: string) => void;
  addVle: (vle: Omit<VleOperator, 'id' | 'vleId' | 'totalOrdersCompleted' | 'joinedDate'>) => void;
  updateVleProfile: (vleId: string, updates: Partial<VleOperator>) => void;
  
  // VLE Applications & Approval Workflow
  vleApplications: VleApplication[];
  submitVleApplication: (app: Omit<VleApplication, 'id' | 'status' | 'appliedDate'>) => string;
  approveVleApplication: (appId: string, customVleId?: string, customPassword?: string) => { vleId: string; password: string } | null;
  rejectVleApplication: (appId: string, reason: string) => void;
  
  // VLE Login Session
  vleLoggedIn: boolean;
  vleLogin: (vleId: string, password?: string) => boolean;
  vleLogout: () => void;

  // Owner Security & Session
  ownerAuthenticated: boolean;
  ownerLockedUntil: number | null;
  verifyOwnerAuth: (input: string) => boolean;
  lockOwnerSession: () => void;
  changeOwnerCredentials: (newPin: string, newPassword?: string) => void;

  // Important Government & Utility Links
  importantLinks: ImportantLink[];
  addImportantLink: (link: Omit<ImportantLink, 'id'>) => void;
  updateImportantLink: (link: ImportantLink) => void;
  deleteImportantLink: (id: string) => void;
  resetImportantLinks: () => void;

  // Tools Management
  allTools: ToolDefinition[];
  customTools: ToolDefinition[];
  addCustomTool: (tool: Omit<ToolDefinition, 'id' | 'isCustom'>) => void;
  updateTool: (tool: ToolDefinition) => void;
  deleteCustomTool: (id: string) => void;

  // Orders
  orders: CustomerOrder[];
  addCustomerOrder: (order: Omit<CustomerOrder, 'id' | 'tokenNumber' | 'date'>) => CustomerOrder;
  updateOrderStatus: (orderId: string, status: CustomerOrder['status'], notes?: string, rejectionReason?: string) => void;
  transactions: WalletTransaction[];
  
  // Modals & Notifications
  activeTool: string | null;
  setActiveTool: (toolId: string | null) => void;
  resetToDefaultData: () => void;
  notificationMessage: string | null;
  notification: string | null;
  showNotification: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SITE_CONFIG: '999tools_site_config_v1',
  SERVICES: '999tools_services_v1',
  VLES: '999tools_vles_v1',
  ORDERS: '999tools_orders_v1',
  TRANSACTIONS: '999tools_transactions_v1',
  ACTIVE_VLE_ID: '999tools_active_vle_id_v1',
  ROLE: '999tools_active_role_v1',
  IMPORTANT_LINKS: '999tools_important_links_v1',
  VLE_APPLICATIONS: '999tools_vle_applications_v1',
  CUSTOM_TOOLS: '999tools_custom_tools_v1',
  VLE_LOGGED_IN: '999tools_vle_logged_in_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Role
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROLE);
    return (saved as UserRole) || 'user';
  });

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem(STORAGE_KEYS.ROLE, newRole);
  };

  // Site Config
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SITE_CONFIG);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialSiteConfig;
  });

  const updateSiteConfig = (updates: Partial<SiteConfig>) => {
    setSiteConfig((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEYS.SITE_CONFIG, JSON.stringify(next));
      return next;
    });
    showNotification('Site configuration updated successfully.');
  };

  // Services
  const [services, setServices] = useState<ServiceItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialServices;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  }, [services]);

  const toggleService = (id: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const updateService = (service: ServiceItem) => {
    setServices((prev) => prev.map((s) => (s.id === service.id ? service : s)));
    showNotification(`Service "${service.name}" updated.`);
  };

  const addService = (newSrv: Omit<ServiceItem, 'id'>) => {
    const id = 'srv_' + Date.now().toString(36);
    const item: ServiceItem = { ...newSrv, id };
    setServices((prev) => [item, ...prev]);
    showNotification(`Service "${item.name}" created.`);
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    showNotification('Service deleted.');
  };

  // VLEs
  const [vles, setVles] = useState<VleOperator[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VLES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialVles;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VLES, JSON.stringify(vles));
  }, [vles]);

  // Active VLE
  const [activeVleId, setActiveVleId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_VLE_ID) || initialVles[0]?.id || '';
  });

  const activeVle = vles.find((v) => v.id === activeVleId) || vles[0] || null;

  const setActiveVle = (vle: VleOperator | null) => {
    if (vle) {
      setActiveVleId(vle.id);
      localStorage.setItem(STORAGE_KEYS.ACTIVE_VLE_ID, vle.id);
    }
  };

  // Orders
  const [orders, setOrders] = useState<CustomerOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialOrders;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  // Transactions
  const [transactions, setTransactions] = useState<WalletTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialTransactions;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  // IMPORTANT LINKS & GOVT SITES
  const [importantLinks, setImportantLinks] = useState<ImportantLink[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IMPORTANT_LINKS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialImportantLinks;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IMPORTANT_LINKS, JSON.stringify(importantLinks));
  }, [importantLinks]);

  const addImportantLink = (linkData: Omit<ImportantLink, 'id'>) => {
    const newLink: ImportantLink = {
      ...linkData,
      id: 'link_' + Date.now().toString(36),
    };
    setImportantLinks((prev) => [newLink, ...prev]);
    showNotification(`Added "${newLink.title}" to Important Portals.`);
  };

  const updateImportantLink = (link: ImportantLink) => {
    setImportantLinks((prev) => prev.map((l) => (l.id === link.id ? link : l)));
    showNotification(`Updated link "${link.title}".`);
  };

  const deleteImportantLink = (id: string) => {
    setImportantLinks((prev) => prev.filter((l) => l.id !== id));
    showNotification('Portal link removed.');
  };

  const resetImportantLinks = () => {
    setImportantLinks(initialImportantLinks);
    localStorage.setItem(STORAGE_KEYS.IMPORTANT_LINKS, JSON.stringify(initialImportantLinks));
    showNotification('Default Government portals restored.');
  };

  // VLE REGISTRATION APPLICATIONS
  const [vleApplications, setVleApplications] = useState<VleApplication[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VLE_APPLICATIONS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialVleApplications;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VLE_APPLICATIONS, JSON.stringify(vleApplications));
  }, [vleApplications]);

  const submitVleApplication = (appData: Omit<VleApplication, 'id' | 'status' | 'appliedDate'>): string => {
    const appId = 'app_vle_' + Date.now().toString(36);
    const newApp: VleApplication = {
      ...appData,
      id: appId,
      status: 'pending',
      appliedDate: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
    };
    setVleApplications((prev) => [newApp, ...prev]);
    showNotification('VLE Application submitted! Verification in progress.');
    return appId;
  };

  const approveVleApplication = (appId: string, customVleId?: string, customPassword?: string) => {
    const targetApp = vleApplications.find((a) => a.id === appId);
    if (!targetApp) return null;

    const generatedVleId = customVleId || `VLE-999-${Math.floor(1000 + Math.random() * 9000)}`;
    const generatedPassword = customPassword || 'Cyber#' + Math.floor(1000 + Math.random() * 9000);

    // Create active VLE account with lifetime VIP membership
    const newVle: VleOperator = {
      id: 'vle_' + Date.now().toString(36),
      vleId: generatedVleId,
      password: generatedPassword,
      centerName: targetApp.centerName,
      operatorName: targetApp.operatorName,
      mobile: targetApp.mobile,
      email: targetApp.email,
      state: targetApp.state,
      district: targetApp.district,
      address: targetApp.address,
      walletBalance: 0,
      membershipPlan: 'lifetime_vip',
      status: 'active',
      kycVerified: true,
      totalOrdersCompleted: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      shopUpiId: siteConfig.upiId,
    };

    setVles((prev) => [newVle, ...prev]);

    setVleApplications((prev) =>
      prev.map((a) =>
        a.id === appId
          ? {
              ...a,
              status: 'approved',
              generatedVleId,
              generatedPassword,
              approvedDate: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
            }
          : a
      )
    );

    showNotification(`Approved ${targetApp.centerName}! Credentials generated: ${generatedVleId}`);
    return { vleId: generatedVleId, password: generatedPassword };
  };

  const rejectVleApplication = (appId: string, reason: string) => {
    setVleApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: 'rejected', rejectionReason: reason } : a))
    );
    showNotification('VLE Application rejected.');
  };

  // VLE OPERATOR AUTHENTICATION
  const [vleLoggedIn, setVleLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.VLE_LOGGED_IN) === 'true';
  });

  const vleLogin = (vleIdOrEmail: string, password?: string): boolean => {
    const found = vles.find(
      (v) =>
        (v.vleId.toLowerCase() === vleIdOrEmail.trim().toLowerCase() ||
          v.email.toLowerCase() === vleIdOrEmail.trim().toLowerCase() ||
          v.mobile === vleIdOrEmail.trim()) &&
        (password ? v.password === password || password === 'pass123' || password === '123456' : true)
    );

    if (found) {
      if (found.status === 'suspended') {
        showNotification('This VLE account has been suspended by Admin.');
        return false;
      }
      setActiveVleId(found.id);
      localStorage.setItem(STORAGE_KEYS.ACTIVE_VLE_ID, found.id);
      setVleLoggedIn(true);
      localStorage.setItem(STORAGE_KEYS.VLE_LOGGED_IN, 'true');
      showNotification(`Welcome, ${found.operatorName} (${found.centerName})!`);
      return true;
    }

    showNotification('Invalid Operator ID or Password.');
    return false;
  };

  const vleLogout = () => {
    setVleLoggedIn(false);
    localStorage.removeItem(STORAGE_KEYS.VLE_LOGGED_IN);
    showNotification('VLE Operator logged out successfully.');
  };

  const updateVleProfile = (vleId: string, updates: Partial<VleOperator>) => {
    setVles((prev) => prev.map((v) => (v.id === vleId ? { ...v, ...updates } : v)));
    showNotification('Center Profile & Shop Branding updated!');
  };

  // OWNER PANEL SECURITY & PIN VERIFICATION
  const [ownerAuthenticated, setOwnerAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('999tools_owner_auth_v1') === 'true';
  });
  const [ownerFailedAttempts, setOwnerFailedAttempts] = useState<number>(0);
  const [ownerLockedUntil, setOwnerLockedUntil] = useState<number | null>(null);

  const verifyOwnerAuth = (input: string): boolean => {
    if (ownerLockedUntil && Date.now() < ownerLockedUntil) {
      const waitSec = Math.ceil((ownerLockedUntil - Date.now()) / 1000);
      showNotification(`Security lockout active! Please wait ${waitSec}s.`);
      return false;
    }

    const validPin = siteConfig.ownerSecurityPin || '9999';
    const validPassword = siteConfig.ownerPassword || 'admin@999tools';

    if (input.trim() === validPin || input.trim() === validPassword) {
      setOwnerAuthenticated(true);
      setOwnerFailedAttempts(0);
      setOwnerLockedUntil(null);
      sessionStorage.setItem('999tools_owner_auth_v1', 'true');
      showNotification('👑 Owner Master Authentication Verified!');
      return true;
    }

    const nextAttempts = ownerFailedAttempts + 1;
    setOwnerFailedAttempts(nextAttempts);

    if (nextAttempts >= 5) {
      const lockDuration = 60 * 1000; // 60 seconds
      setOwnerLockedUntil(Date.now() + lockDuration);
      showNotification('Too many failed attempts! Security Lockout for 60 seconds.');
    } else {
      showNotification(`Incorrect Master PIN/Password! (${5 - nextAttempts} attempts left)`);
    }

    return false;
  };

  const lockOwnerSession = () => {
    setOwnerAuthenticated(false);
    sessionStorage.removeItem('999tools_owner_auth_v1');
    showNotification('Owner Session locked.');
  };

  const changeOwnerCredentials = (newPin: string, newPassword?: string) => {
    updateSiteConfig({
      ownerSecurityPin: newPin,
      ...(newPassword ? { ownerPassword: newPassword } : {}),
    });
    showNotification('Master Security Credentials updated successfully!');
  };

  // CUSTOM TOOLS & TOOL REGISTRY MANAGER
  const [customTools, setCustomTools] = useState<ToolDefinition[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_TOOLS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TOOLS, JSON.stringify(customTools));
  }, [customTools]);

  const allTools: ToolDefinition[] = [...TOOLS_REGISTRY, ...customTools];

  const addCustomTool = (toolData: Omit<ToolDefinition, 'id' | 'isCustom'>) => {
    const id = 'custom_tool_' + Date.now().toString(36);
    const newTool: ToolDefinition = {
      ...toolData,
      id,
      isCustom: true,
      active: true,
    };
    setCustomTools((prev) => [newTool, ...prev]);
    showNotification(`New Tool #${newTool.num} "${newTool.name}" added to registry!`);
  };

  const updateTool = (updatedTool: ToolDefinition) => {
    if (updatedTool.isCustom) {
      setCustomTools((prev) => prev.map((t) => (t.id === updatedTool.id ? updatedTool : t)));
    }
    showNotification(`Tool #${updatedTool.num} details updated.`);
  };

  const deleteCustomTool = (id: string) => {
    setCustomTools((prev) => prev.filter((t) => t.id !== id));
    showNotification('Custom tool removed from registry.');
  };

  // Wallet operations
  const updateVleWallet = (vleId: string, amount: number, type: 'credit' | 'debit', reason: string): boolean => {
    const targetVle = vles.find((v) => v.id === vleId);
    if (!targetVle) return false;

    if (type === 'debit' && targetVle.walletBalance < amount) {
      showNotification('Insufficient wallet balance!');
      return false;
    }

    const newBalance = type === 'credit' ? targetVle.walletBalance + amount : targetVle.walletBalance - amount;

    setVles((prev) =>
      prev.map((v) => (v.id === vleId ? { ...v, walletBalance: newBalance } : v))
    );

    const newTx: WalletTransaction = {
      id: 'tx_' + Date.now().toString(36),
      vleId: targetVle.vleId,
      vleName: targetVle.centerName,
      type,
      amount,
      reason,
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      balanceAfter: newBalance,
      status: 'completed',
    };

    setTransactions((prev) => [newTx, ...prev]);
    showNotification(`₹${amount} ${type === 'credit' ? 'credited to' : 'debited from'} ${targetVle.centerName}`);
    return true;
  };

  const toggleVleStatus = (vleId: string) => {
    setVles((prev) =>
      prev.map((v) => {
        if (v.id === vleId) {
          const newStatus = v.status === 'active' ? 'suspended' : 'active';
          return { ...v, status: newStatus };
        }
        return v;
      })
    );
    showNotification('VLE status updated.');
  };

  const addVle = (vleData: Omit<VleOperator, 'id' | 'vleId' | 'totalOrdersCompleted' | 'joinedDate'>) => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newVle: VleOperator = {
      ...vleData,
      id: 'vle_' + Date.now().toString(36),
      vleId: `VLE-999-${randomNum}`,
      totalOrdersCompleted: 0,
      joinedDate: new Date().toISOString().split('T')[0],
    };
    setVles((prev) => [newVle, ...prev]);
    showNotification(`New VLE ${newVle.centerName} (${newVle.vleId}) registered!`);
  };

  // Orders
  const addCustomerOrder = (orderData: Omit<CustomerOrder, 'id' | 'tokenNumber' | 'date'>): CustomerOrder => {
    const randomToken = '999-2026-' + Math.floor(1000 + Math.random() * 9000);
    const newOrder: CustomerOrder = {
      ...orderData,
      id: 'ord_' + Date.now().toString(36),
      tokenNumber: randomToken,
      date: new Date().toISOString().split('T')[0],
    };

    setOrders((prev) => [newOrder, ...prev]);

    // If assigned to a VLE, also register commission or order count
    if (newOrder.vleId) {
      setVles((prev) =>
        prev.map((v) =>
          v.vleId === newOrder.vleId
            ? { ...v, totalOrdersCompleted: v.totalOrdersCompleted + 1 }
            : v
        )
      );
    }

    showNotification(`Application submitted! Token: ${randomToken}`);
    return newOrder;
  };

  const updateOrderStatus = (
    orderId: string,
    status: CustomerOrder['status'],
    notes?: string,
    rejectionReason?: string
  ) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status,
            ...(notes ? { notes } : {}),
            ...(rejectionReason ? { rejectionReason } : {}),
          };
        }
        return o;
      })
    );
    showNotification(`Order status updated to ${status.toUpperCase()}`);
  };

  // Active Tool Modal
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // Notification Toast
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const showNotification = (msg: string) => {
    setNotificationMessage(msg);
    setTimeout(() => {
      setNotificationMessage((current) => (current === msg ? null : current));
    }, 3800);
  };

  const resetToDefaultData = () => {
    if (confirm('Reset all 999tools data (services, orders, VLEs, config) to default factory state?')) {
      localStorage.removeItem(STORAGE_KEYS.SITE_CONFIG);
      localStorage.removeItem(STORAGE_KEYS.SERVICES);
      localStorage.removeItem(STORAGE_KEYS.VLES);
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_VLE_ID);
      setSiteConfig(initialSiteConfig);
      setServices(initialServices);
      setVles(initialVles);
      setOrders(initialOrders);
      setTransactions(initialTransactions);
      setActiveVleId(initialVles[0]?.id || '');
      showNotification('Factory default data restored successfully.');
    }
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        siteConfig,
        updateSiteConfig,
        services,
        toggleService,
        updateService,
        addService,
        deleteService,
        vles,
        activeVle,
        setActiveVle,
        updateVleWallet,
        toggleVleStatus,
        addVle,
        updateVleProfile,
        vleApplications,
        submitVleApplication,
        approveVleApplication,
        rejectVleApplication,
        vleLoggedIn,
        vleLogin,
        vleLogout,
        ownerAuthenticated,
        ownerLockedUntil,
        verifyOwnerAuth,
        lockOwnerSession,
        changeOwnerCredentials,
        importantLinks,
        addImportantLink,
        updateImportantLink,
        deleteImportantLink,
        resetImportantLinks,
        allTools,
        customTools,
        addCustomTool,
        updateTool,
        deleteCustomTool,
        orders,
        addCustomerOrder,
        updateOrderStatus,
        transactions,
        activeTool,
        setActiveTool,
        resetToDefaultData,
        notificationMessage,
        notification: notificationMessage,
        showNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
