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
import {
  saveSiteConfigToFirebase,
  loadSiteConfigFromFirebase,
  subscribeToSiteConfig,
  saveVlesToFirebase,
  loadVlesFromFirebase,
  subscribeToVles,
  saveApplicationsToFirebase,
  loadApplicationsFromFirebase,
  saveOrdersToFirebase,
  loadOrdersFromFirebase,
  saveCustomToolsToFirebase,
  loadCustomToolsFromFirebase,
  saveLinksToFirebase,
  loadLinksFromFirebase,
} from '../services/firebaseSync';

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
  
  vles: VleOperator[];
  activeVle: VleOperator | null;
  setActiveVle: (vle: VleOperator | null) => void;
  updateVleWallet: (vleId: string, amount: number, type: 'credit' | 'debit', reason: string) => boolean;
  toggleVleStatus: (vleId: string) => void;
  addVle: (vle: Omit<VleOperator, 'id' | 'vleId' | 'totalOrdersCompleted' | 'joinedDate'>) => void;
  updateVleProfile: (vleId: string, updates: Partial<VleOperator>) => void;
  
  vleApplications: VleApplication[];
  submitVleApplication: (app: Omit<VleApplication, 'id' | 'status' | 'appliedDate'>) => string;
  approveVleApplication: (appId: string, customVleId?: string, customPassword?: string) => { vleId: string; password: string } | null;
  rejectVleApplication: (appId: string, reason: string) => void;
  
  vleLoggedIn: boolean;
  vleLogin: (vleId: string, password?: string) => boolean;
  vleLogout: () => void;

  ownerAuthenticated: boolean;
  ownerLockedUntil: number | null;
  verifyOwnerAuth: (input: string) => boolean;
  lockOwnerSession: () => void;
  changeOwnerCredentials: (newPin: string, newPassword?: string) => void;

  importantLinks: ImportantLink[];
  addImportantLink: (link: Omit<ImportantLink, 'id'>) => void;
  updateImportantLink: (link: ImportantLink) => void;
  deleteImportantLink: (id: string) => void;
  resetImportantLinks: () => void;

  allTools: ToolDefinition[];
  customTools: ToolDefinition[];
  addCustomTool: (tool: Omit<ToolDefinition, 'id' | 'isCustom'>) => void;
  updateTool: (tool: ToolDefinition) => void;
  deleteCustomTool: (id: string) => void;

  orders: CustomerOrder[];
  addCustomerOrder: (order: Omit<CustomerOrder, 'id' | 'tokenNumber' | 'date'>) => CustomerOrder;
  updateOrderStatus: (orderId: string, status: CustomerOrder['status'], notes?: string, rejectionReason?: string) => void;
  transactions: WalletTransaction[];
  
  activeTool: string | null;
  setActiveTool: (toolId: string | null) => void;
  resetToDefaultData: () => void;
  notificationMessage: string | null;
  notification: string | null;
  showNotification: (msg: string) => void;
  firebaseReady: boolean;
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
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotificationMessage(msg);
    setTimeout(() => {
      setNotificationMessage((current) => (current === msg ? null : current));
    }, 3800);
  };

  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROLE);
    return (saved as UserRole) || 'user';
  });

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem(STORAGE_KEYS.ROLE, newRole);
  };

  // SITE CONFIG
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SITE_CONFIG);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialSiteConfig;
  });

  // SERVICES
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

  // VLEs
  const [vles, setVles] = useState<VleOperator[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VLES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialVles;
  });

  // ORDERS
  const [orders, setOrders] = useState<CustomerOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialOrders;
  });

  // TRANSACTIONS
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

  // IMPORTANT LINKS
  const [importantLinks, setImportantLinks] = useState<ImportantLink[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IMPORTANT_LINKS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialImportantLinks;
  });

  // VLE APPLICATIONS
  const [vleApplications, setVleApplications] = useState<VleApplication[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VLE_APPLICATIONS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialVleApplications;
  });

  // CUSTOM TOOLS
  const [customTools, setCustomTools] = useState<ToolDefinition[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_TOOLS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  // ============================================
  // FIREBASE — Initial Load
  // ============================================
  useEffect(() => {
    const loadFromFirebase = async () => {
      // Load site config
      const fbConfig = await loadSiteConfigFromFirebase();
      if (fbConfig) {
        setSiteConfig(fbConfig);
        localStorage.setItem(STORAGE_KEYS.SITE_CONFIG, JSON.stringify(fbConfig));
      } else {
        await saveSiteConfigToFirebase(siteConfig);
      }

      // Load VLEs
      const fbVles = await loadVlesFromFirebase();
      if (fbVles && fbVles.length > 0) {
        setVles(fbVles);
        localStorage.setItem(STORAGE_KEYS.VLES, JSON.stringify(fbVles));
      }

      // Load applications
      const fbApps = await loadApplicationsFromFirebase();
      if (fbApps && fbApps.length > 0) {
        setVleApplications(fbApps);
        localStorage.setItem(STORAGE_KEYS.VLE_APPLICATIONS, JSON.stringify(fbApps));
      }

      // Load orders
      const fbOrders = await loadOrdersFromFirebase();
      if (fbOrders && fbOrders.length > 0) {
        setOrders(fbOrders);
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(fbOrders));
      }

      // Load custom tools
      const fbTools = await loadCustomToolsFromFirebase();
      if (fbTools && fbTools.length > 0) {
        setCustomTools(fbTools);
        localStorage.setItem(STORAGE_KEYS.CUSTOM_TOOLS, JSON.stringify(fbTools));
      }

      // Load links
      const fbLinks = await loadLinksFromFirebase();
      if (fbLinks && fbLinks.length > 0) {
        setImportantLinks(fbLinks);
        localStorage.setItem(STORAGE_KEYS.IMPORTANT_LINKS, JSON.stringify(fbLinks));
      }

      setFirebaseReady(true);
      console.log('✅ Firebase sync ready');
    };

    loadFromFirebase();
  }, []);

  // ============================================
  // FIREBASE — Real-time listeners
  // ============================================
  useEffect(() => {
    if (!firebaseReady) return;
    
    const unsubConfig = subscribeToSiteConfig((config) => {
      setSiteConfig(config);
      localStorage.setItem(STORAGE_KEYS.SITE_CONFIG, JSON.stringify(config));
    });

    const unsubVles = subscribeToVles((fbVles) => {
      setVles(fbVles);
      localStorage.setItem(STORAGE_KEYS.VLES, JSON.stringify(fbVles));
    });

    return () => {
      unsubConfig();
      unsubVles();
    };
  }, [firebaseReady]);

  // ============================================
  // AUTO-SYNC TO FIREBASE
  // ============================================
  useEffect(() => {
    if (!firebaseReady) return;
    localStorage.setItem(STORAGE_KEYS.VLES, JSON.stringify(vles));
    saveVlesToFirebase(vles);
  }, [vles, firebaseReady]);

  useEffect(() => {
    if (!firebaseReady) return;
    localStorage.setItem(STORAGE_KEYS.VLE_APPLICATIONS, JSON.stringify(vleApplications));
    saveApplicationsToFirebase(vleApplications);
  }, [vleApplications, firebaseReady]);

  useEffect(() => {
    if (!firebaseReady) return;
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    saveOrdersToFirebase(orders);
  }, [orders, firebaseReady]);

  useEffect(() => {
    if (!firebaseReady) return;
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TOOLS, JSON.stringify(customTools));
    saveCustomToolsToFirebase(customTools);
  }, [customTools, firebaseReady]);

  useEffect(() => {
    if (!firebaseReady) return;
    localStorage.setItem(STORAGE_KEYS.IMPORTANT_LINKS, JSON.stringify(importantLinks));
    saveLinksToFirebase(importantLinks);
  }, [importantLinks, firebaseReady]);

  // ============================================
  // UPDATE FUNCTIONS
  // ============================================
  const updateSiteConfig = async (updates: Partial<SiteConfig>) => {
    const next = { ...siteConfig, ...updates };
    setSiteConfig(next);
    localStorage.setItem(STORAGE_KEYS.SITE_CONFIG, JSON.stringify(next));
    
    await saveSiteConfigToFirebase(next);
    
    showNotification('✅ Settings saved to cloud!');
  };

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

  // ============================================
  // ACTIVE VLE
  // ============================================
  const [activeVleId, setActiveVleId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_VLE_ID) || '';
  });

  const activeVle = vles.find((v) => v.id === activeVleId) || null;

  const setActiveVle = (vle: VleOperator | null) => {
    if (vle) {
      setActiveVleId(vle.id);
      localStorage.setItem(STORAGE_KEYS.ACTIVE_VLE_ID, vle.id);
    } else {
      setActiveVleId('');
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_VLE_ID);
    }
  };

  // ============================================
  // IMPORTANT LINKS FUNCTIONS
  // ============================================
  const addImportantLink = (linkData: Omit<ImportantLink, 'id'>) => {
    const newLink: ImportantLink = {
      ...linkData,
      id: 'link_' + Date.now().toString(36),
    };
    setImportantLinks((prev) => [newLink, ...prev]);
    showNotification(`Added "${newLink.title}"`);
  };

  const updateImportantLink = (link: ImportantLink) => {
    setImportantLinks((prev) => prev.map((l) => (l.id === link.id ? link : l)));
    showNotification(`Updated "${link.title}"`);
  };

  const deleteImportantLink = (id: string) => {
    setImportantLinks((prev) => prev.filter((l) => l.id !== id));
    showNotification('Link removed.');
  };

  const resetImportantLinks = () => {
    setImportantLinks(initialImportantLinks);
    showNotification('Default links restored.');
  };

  // ============================================
  // VLE APPLICATIONS FUNCTIONS
  // ============================================
  const submitVleApplication = (appData: Omit<VleApplication, 'id' | 'status' | 'appliedDate'>): string => {
    const appId = 'app_vle_' + Date.now().toString(36);
    const newApp: VleApplication = {
      ...appData,
      id: appId,
      status: 'pending',
      appliedDate: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
    };
    setVleApplications((prev) => [newApp, ...prev]);
    showNotification('Application submitted!');
    return appId;
  };

  const approveVleApplication = (appId: string, customVleId?: string, customPassword?: string) => {
    const targetApp = vleApplications.find((a) => a.id === appId);
    if (!targetApp) return null;

    const generatedVleId = customVleId || `VLE-999-${Math.floor(1000 + Math.random() * 9000)}`;
    const generatedPassword = customPassword || 'Cyber#' + Math.floor(1000 + Math.random() * 9000);

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

    showNotification(`Approved! ID: ${generatedVleId}`);
    return { vleId: generatedVleId, password: generatedPassword };
  };

  const rejectVleApplication = (appId: string, reason: string) => {
    setVleApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: 'rejected', rejectionReason: reason } : a))
    );
    showNotification('Application rejected.');
  };

  // ============================================
  // VLE AUTH
  // ============================================
  const [vleLoggedIn, setVleLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.VLE_LOGGED_IN) === 'true';
  });

  const vleLogin = (vleIdOrEmail: string, password?: string): boolean => {
    const found = vles.find(
      (v) =>
        (v.vleId.toLowerCase() === vleIdOrEmail.trim().toLowerCase() ||
          v.email.toLowerCase() === vleIdOrEmail.trim().toLowerCase() ||
          v.mobile === vleIdOrEmail.trim()) &&
        (password ? v.password === password : true)
    );

    if (found) {
      if (found.status === 'suspended') {
        showNotification('Account suspended by Admin.');
        return false;
      }
      setActiveVleId(found.id);
      localStorage.setItem(STORAGE_KEYS.ACTIVE_VLE_ID, found.id);
      setVleLoggedIn(true);
      localStorage.setItem(STORAGE_KEYS.VLE_LOGGED_IN, 'true');
      showNotification(`Welcome, ${found.operatorName}!`);
      return true;
    }

    showNotification('Invalid ID or Password.');
    return false;
  };

  const vleLogout = () => {
    setVleLoggedIn(false);
    setActiveVleId('');
    localStorage.removeItem(STORAGE_KEYS.VLE_LOGGED_IN);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_VLE_ID);
    showNotification('Logged out successfully.');
  };

  const updateVleProfile = (vleId: string, updates: Partial<VleOperator>) => {
    setVles((prev) => prev.map((v) => (v.id === vleId ? { ...v, ...updates } : v)));
    showNotification('Profile updated!');
  };

  // ============================================
  // OWNER AUTH
  // ============================================
  const [ownerAuthenticated, setOwnerAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('999tools_owner_auth_v1') === 'true';
  });
  const [ownerFailedAttempts, setOwnerFailedAttempts] = useState<number>(0);
  const [ownerLockedUntil, setOwnerLockedUntil] = useState<number | null>(null);

  const verifyOwnerAuth = (input: string): boolean => {
    if (ownerLockedUntil && Date.now() < ownerLockedUntil) {
      const waitSec = Math.ceil((ownerLockedUntil - Date.now()) / 1000);
      showNotification(`Lockout! Wait ${waitSec}s.`);
      return false;
    }

    const validPin = siteConfig.ownerSecurityPin || '9999';
    const validPassword = siteConfig.ownerPassword || 'admin@999tools';

    if (input.trim() === validPin || input.trim() === validPassword) {
      setOwnerAuthenticated(true);
      setOwnerFailedAttempts(0);
      setOwnerLockedUntil(null);
      sessionStorage.setItem('999tools_owner_auth_v1', 'true');
      showNotification('👑 Owner Verified!');
      return true;
    }

    const nextAttempts = ownerFailedAttempts + 1;
    setOwnerFailedAttempts(nextAttempts);

    if (nextAttempts >= 5) {
      setOwnerLockedUntil(Date.now() + 60 * 1000);
      showNotification('Too many attempts! Lockout 60s.');
    } else {
      showNotification(`Incorrect! (${5 - nextAttempts} left)`);
    }

    return false;
  };

  const lockOwnerSession = () => {
    setOwnerAuthenticated(false);
    sessionStorage.removeItem('999tools_owner_auth_v1');
    showNotification('Session locked.');
  };

  const changeOwnerCredentials = (newPin: string, newPassword?: string) => {
    updateSiteConfig({
      ownerSecurityPin: newPin,
      ...(newPassword ? { ownerPassword: newPassword } : {}),
    });
    showNotification('Credentials updated!');
  };

  // ============================================
  // TOOLS
  // ============================================
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
    showNotification(`Tool #${newTool.num} added!`);
  };

  const updateTool = (updatedTool: ToolDefinition) => {
    if (updatedTool.isCustom) {
      setCustomTools((prev) => prev.map((t) => (t.id === updatedTool.id ? updatedTool : t)));
    }
    showNotification(`Tool #${updatedTool.num} updated.`);
  };

  const deleteCustomTool = (id: string) => {
    setCustomTools((prev) => prev.filter((t) => t.id !== id));
    showNotification('Tool removed.');
  };

  // ============================================
  // WALLET
  // ============================================
  const updateVleWallet = (vleId: string, amount: number, type: 'credit' | 'debit', reason: string): boolean => {
    const targetVle = vles.find((v) => v.id === vleId);
    if (!targetVle) return false;

    if (type === 'debit' && targetVle.walletBalance < amount) {
      showNotification('Insufficient balance!');
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
    showNotification(`₹${amount} ${type === 'credit' ? 'credited' : 'debited'}`);
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
    showNotification('Status updated.');
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
    showNotification('New VLE registered!');
  };

  // ============================================
  // ORDERS
  // ============================================
  const addCustomerOrder = (orderData: Omit<CustomerOrder, 'id' | 'tokenNumber' | 'date'>): CustomerOrder => {
    const randomToken = '999-2026-' + Math.floor(1000 + Math.random() * 9000);
    const newOrder: CustomerOrder = {
      ...orderData,
      id: 'ord_' + Date.now().toString(36),
      tokenNumber: randomToken,
      date: new Date().toISOString().split('T')[0],
    };

    setOrders((prev) => [newOrder, ...prev]);

    if (newOrder.vleId) {
      setVles((prev) =>
        prev.map((v) =>
          v.vleId === newOrder.vleId
            ? { ...v, totalOrdersCompleted: v.totalOrdersCompleted + 1 }
            : v
        )
      );
    }

    showNotification(`Token: ${randomToken}`);
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
    showNotification(`Status: ${status.toUpperCase()}`);
  };

  const [activeTool, setActiveTool] = useState<string | null>(null);

  const resetToDefaultData = () => {
    if (confirm('Reset all data?')) {
      localStorage.clear();
      sessionStorage.clear();
      location.reload();
    }
  };

  return (
    <AppContext.Provider
      value={{
        role, setRole,
        siteConfig, updateSiteConfig,
        services, toggleService, updateService, addService, deleteService,
        vles, activeVle, setActiveVle, updateVleWallet, toggleVleStatus, addVle, updateVleProfile,
        vleApplications, submitVleApplication, approveVleApplication, rejectVleApplication,
        vleLoggedIn, vleLogin, vleLogout,
        ownerAuthenticated, ownerLockedUntil, verifyOwnerAuth, lockOwnerSession, changeOwnerCredentials,
        importantLinks, addImportantLink, updateImportantLink, deleteImportantLink, resetImportantLinks,
        allTools, customTools, addCustomTool, updateTool, deleteCustomTool,
        orders, addCustomerOrder, updateOrderStatus, transactions,
        activeTool, setActiveTool, resetToDefaultData,
        notificationMessage, notification: notificationMessage, showNotification,
        firebaseReady,
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
