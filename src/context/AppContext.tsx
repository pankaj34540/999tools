import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserRole, SiteConfig, ServiceItem, VleOperator, CustomerOrder, WalletTransaction,
  ImportantLink, VleApplication, ToolDefinition, UserAccount, UserPlan, SubscriptionStatus,
  BillingCycle, PaymentRequest, LedgerEntry, KhatabookStats, CustomerLedgerSummary,
  VleData, Customer, RechargeOrder,
} from '../types';
import { 
  initialSiteConfig, initialServices, initialVles, initialOrders, initialTransactions,
  initialImportantLinks, initialVleApplications 
} from '../data/initialData';
import { TOOLS_REGISTRY, PREMIUM_TOOL_IDS } from '../data/toolsRegistry';
import { DEFAULT_PREMIUM_TOOL_IDS, FREE_USER_DAILY_LIMIT } from '../data/premiumTools';
import {
  saveSiteConfigToFirebase, loadSiteConfigFromFirebase, subscribeToSiteConfig,
  saveVlesToFirebase, loadVlesFromFirebase, subscribeToVles,
  saveApplicationsToFirebase, loadApplicationsFromFirebase,
  saveOrdersToFirebase, loadOrdersFromFirebase,
  saveCustomToolsToFirebase, loadCustomToolsFromFirebase,
  saveLinksToFirebase, loadLinksFromFirebase,
} from '../services/firebaseSync';
import { 
  subscribeToAuth, logoutOwner, loginVle, logoutVle, subscribeToVleAuth,
  createVleAuthAccount, generateVlePassword
} from '../services/firebaseAuth';
import { 
  createOrUpdateVleUser, convertUserToVle, getUserByEmail
} from '../services/subscriptionService';
import {
  createCustomer, updateCustomer, deleteCustomer, subscribeToVleCustomers,
} from '../services/customerService';
import {
  createRechargeOrder, updateRechargeOrder, deleteRechargeOrder,
  subscribeToAllRechargeOrders, subscribeToVleRechargeOrders,
  completeRechargeOrder,
} from '../services/rechargeService';

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
  approveVleApplication: (appId: string, customVleId?: string, customPassword?: string) => Promise<{ vleId: string; password: string } | null>;
  rejectVleApplication: (appId: string, reason: string) => void;
  vleLoggedIn: boolean;
  vleLogin: (vleId: string, password?: string) => Promise<boolean>;
  vleLogout: () => Promise<void>;
  ownerAuthenticated: boolean;
  ownerEmail: string | null;
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
  currentUser: UserAccount | null;
  setCurrentUser: (user: UserAccount | null) => void;
  userAccountLoading: boolean;
  createOrUpdateUserAccount: (user: Partial<UserAccount> & { id: string; email: string; name: string }) => Promise<boolean>;
  checkToolAccess: (toolId: string) => Promise<{ allowed: boolean; remaining: number; isPremium: boolean; limit: number }>;
  recordUsage: (toolId: string) => Promise<void>;
  isUserPremium: () => boolean;
  showAdsForCurrentUser: () => boolean;
  paymentRequests: PaymentRequest[];
  submitPaymentRequest: (data: Omit<PaymentRequest, 'id' | 'status' | 'requestedAt'>) => Promise<PaymentRequest | null>;
  approvePaymentRequest: (paymentId: string, validUntil: Date) => Promise<boolean>;
  rejectPaymentRequest: (paymentId: string, reason: string) => Promise<boolean>;
  premiumToolIds: string[];
  togglePremiumTool: (toolId: string) => void;
  ledgerEntries: LedgerEntry[];
  ledgerLoading: boolean;
  addLedgerEntry: (entry: Omit<LedgerEntry, 'id' | 'createdAt' | 'timestamp' | 'date'>) => Promise<LedgerEntry | null>;
  updateLedgerEntryById: (id: string, updates: Partial<LedgerEntry>) => Promise<boolean>;
  removeLedgerEntry: (id: string) => Promise<boolean>;
  getKhatabookStats: () => KhatabookStats;
  getCustomerSummaries: () => CustomerLedgerSummary[];
  // Customer CRM
  customers: Customer[];
  customersLoading: boolean;
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalOrders' | 'totalSpent' | 'firstVisitDate'>) => Promise<Customer | null>;
  updateCustomerById: (id: string, updates: Partial<Customer>) => Promise<boolean>;
  deleteCustomerById: (id: string) => Promise<boolean>;
  // 🆕 Recharge Orders (Phase 2)
  rechargeOrders: RechargeOrder[];
  rechargeOrdersLoading: boolean;
  addRechargeOrder: (data: Omit<RechargeOrder, 'id' | 'tokenNumber' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<RechargeOrder | null>;
  updateRechargeOrderById: (id: string, updates: Partial<RechargeOrder>) => Promise<boolean>;
  completeRechargeOrderById: (id: string, refNumber: string) => Promise<boolean>;
  deleteRechargeOrderById: (id: string) => Promise<boolean>;
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
  PREMIUM_TOOLS: '999tools_premium_tools_v1',
  CURRENT_USER_ID: '999tools_current_user_id_v1',
};

const STORAGE_VERSION = '3.0.0';
const STORAGE_VERSION_KEY = '999tools_storage_version';
const FORCE_RESET_FLAG = '999tools_force_firebase_reset';

const clearOldStorageIfNeeded = (): boolean => {
  try {
    const currentVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    if (currentVersion !== STORAGE_VERSION) {
      console.log(`🧹 Version mismatch: was ${currentVersion}, now ${STORAGE_VERSION}`);
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('999tools_') || key.startsWith('vle_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
      localStorage.setItem(FORCE_RESET_FLAG, 'true');
      console.log(`✅ Cleared ${keysToRemove.length} localStorage keys. Firebase reset pending...`);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Storage cleanup error:', e);
    return false;
  }
};

const forceResetFirebaseIfNeeded = async () => {
  try {
    const shouldReset = localStorage.getItem(FORCE_RESET_FLAG);
    if (shouldReset !== 'true') return false;
    console.log('🔥 Force resetting Firebase with clean data...');
    await saveSiteConfigToFirebase(initialSiteConfig);
    await saveVlesToFirebase([]);
    await saveApplicationsToFirebase([]);
    await saveOrdersToFirebase([]);
    await saveCustomToolsToFirebase([]);
    await saveLinksToFirebase(initialImportantLinks);
    localStorage.removeItem(FORCE_RESET_FLAG);
    console.log('✅ Firebase force reset complete');
    return true;
  } catch (e) {
    console.error('❌ Firebase force reset error:', e);
    return false;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  clearOldStorageIfNeeded();

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

  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SITE_CONFIG);
    if (saved) { try { return JSON.parse(saved); } catch (e) { console.error(e); } }
    return initialSiteConfig;
  });

  const [services, setServices] = useState<ServiceItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
    if (saved) { try { return JSON.parse(saved); } catch (e) { console.error(e); } }
    return initialServices;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  }, [services]);

  const [vles, setVles] = useState<VleOperator[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VLES);
    if (saved) { try { return JSON.parse(saved); } catch (e) { console.error(e); } }
    return initialVles;
  });

  const [orders, setOrders] = useState<CustomerOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (saved) { try { return JSON.parse(saved); } catch (e) { console.error(e); } }
    return initialOrders;
  });

  const [transactions, setTransactions] = useState<WalletTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (saved) { try { return JSON.parse(saved); } catch (e) { console.error(e); } }
    return initialTransactions;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  const [importantLinks, setImportantLinks] = useState<ImportantLink[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IMPORTANT_LINKS);
    if (saved) { try { return JSON.parse(saved); } catch (e) { console.error(e); } }
    return initialImportantLinks;
  });

  const [vleApplications, setVleApplications] = useState<VleApplication[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VLE_APPLICATIONS);
    if (saved) { try { return JSON.parse(saved); } catch (e) { console.error(e); } }
    return initialVleApplications;
  });

  const [customTools, setCustomTools] = useState<ToolDefinition[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_TOOLS);
    if (saved) { try { return JSON.parse(saved); } catch (e) { console.error(e); } }
    return [];
  });

  const [premiumToolIds, setPremiumToolIds] = useState<string[]>(() => DEFAULT_PREMIUM_TOOL_IDS);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PREMIUM_TOOLS, JSON.stringify(premiumToolIds));
  }, [premiumToolIds]);

  const togglePremiumTool = (toolId: string) => {
    setPremiumToolIds((prev) => 
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
    showNotification('Premium tool list updated');
  };

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [userAccountLoading, setUserAccountLoading] = useState(false);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Customer CRM state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  // 🆕 Recharge Orders state
  const [rechargeOrders, setRechargeOrders] = useState<RechargeOrder[]>([]);
  const [rechargeOrdersLoading, setRechargeOrdersLoading] = useState(false);

  useEffect(() => {
    const loadFromFirebase = async () => {
      const didReset = await forceResetFirebaseIfNeeded();
      if (didReset) {
        setSiteConfig(initialSiteConfig);
        setVles([]);
        setOrders([]);
        setVleApplications([]);
        setCustomTools([]);
        setImportantLinks(initialImportantLinks);
        setFirebaseReady(true);
        console.log('✅ Firebase sync ready (after reset)');
        return;
      }

      const fbConfig = await loadSiteConfigFromFirebase();
      if (fbConfig) {
        setSiteConfig(fbConfig);
        localStorage.setItem(STORAGE_KEYS.SITE_CONFIG, JSON.stringify(fbConfig));
      } else {
        await saveSiteConfigToFirebase(siteConfig);
      }

      const fbVles = await loadVlesFromFirebase();
      if (fbVles && fbVles.length > 0) {
        setVles(fbVles);
        localStorage.setItem(STORAGE_KEYS.VLES, JSON.stringify(fbVles));
      }

      const fbApps = await loadApplicationsFromFirebase();
      if (fbApps && fbApps.length > 0) {
        setVleApplications(fbApps);
        localStorage.setItem(STORAGE_KEYS.VLE_APPLICATIONS, JSON.stringify(fbApps));
      }

      const fbOrders = await loadOrdersFromFirebase();
      if (fbOrders && fbOrders.length > 0) {
        setOrders(fbOrders);
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(fbOrders));
      }

      const fbTools = await loadCustomToolsFromFirebase();
      if (fbTools && fbTools.length > 0) {
        setCustomTools(fbTools);
        localStorage.setItem(STORAGE_KEYS.CUSTOM_TOOLS, JSON.stringify(fbTools));
      }

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
    return () => { unsubConfig(); unsubVles(); };
  }, [firebaseReady]);

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

  const updateSiteConfig = async (updates: Partial<SiteConfig>) => {
    const next = { ...siteConfig, ...updates };
    setSiteConfig(next);
    localStorage.setItem(STORAGE_KEYS.SITE_CONFIG, JSON.stringify(next));
    await saveSiteConfigToFirebase(next);
    showNotification('✅ Settings saved!');
  };

  const toggleService = (id: string) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
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

  const addImportantLink = (linkData: Omit<ImportantLink, 'id'>) => {
    const newLink: ImportantLink = { ...linkData, id: 'link_' + Date.now().toString(36) };
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

  const submitVleApplication = (appData: Omit<VleApplication, 'id' | 'status' | 'appliedDate'>): string => {
    const appId = 'app_vle_' + Date.now().toString(36);
    const newApp: VleApplication = {
      ...appData,
      id: appId,
      status: 'pending',
      appliedDate: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
    };
    const updatedList = [newApp, ...vleApplications];
    setVleApplications(updatedList);
    
    (async () => {
      try {
        console.log('📤 Submitting VLE application to Firebase...');
        const success = await saveApplicationsToFirebase(updatedList);
        if (success) {
          console.log('✅ VLE Application saved to Firestore');
          showNotification('✅ Application submitted successfully!');
        } else {
          console.error('❌ VLE Application save failed');
          showNotification('⚠️ Application saved locally, sync pending');
        }
      } catch (error: any) {
        console.error('❌ Firebase error:', error);
        showNotification('⚠️ Sync issue — Owner will verify soon');
      }
    })();
    return appId;
  };

  const approveVleApplication = async (appId: string, customVleId?: string, customPassword?: string): Promise<{ vleId: string; password: string } | null> => {
    const targetApp = vleApplications.find((a) => a.id === appId);
    if (!targetApp) return null;

    const generatedVleId = customVleId || `VLE-999-${Math.floor(1000 + Math.random() * 9000)}`;
    const generatedPassword = customPassword || generateVlePassword();

    console.log('📝 Creating Firebase Auth account for VLE...');
    const authResult = await createVleAuthAccount(targetApp.email, generatedPassword);
    if (!authResult.success) {
      showNotification(`❌ VLE Auth fail: ${authResult.error}`);
      return null;
    }

    const vleData: VleData = {
      vleId: generatedVleId,
      centerName: targetApp.centerName,
      operatorName: targetApp.operatorName,
      mobile: targetApp.mobile,
      state: targetApp.state,
      district: targetApp.district,
      address: targetApp.address || '',
      cscId: targetApp.cscId || '',
      status: 'active',
      kycVerified: true,
      totalOrdersCompleted: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      shopUpiId: siteConfig.upiId,
    };

    const userResult = await createOrUpdateVleUser(
      targetApp.email, targetApp.operatorName, targetApp.mobile, vleData, 1, authResult.uid
    );

    if (!userResult.success) {
      console.error('⚠️ User account creation failed:', userResult.error);
      showNotification('⚠️ VLE created but user account sync pending');
    }

    const newVle: VleOperator = {
      id: 'vle_' + Date.now().toString(36),
      vleId: generatedVleId,
      password: '***firebase***',
      centerName: targetApp.centerName,
      operatorName: targetApp.operatorName,
      mobile: targetApp.mobile,
      email: targetApp.email,
      state: targetApp.state,
      district: targetApp.district,
      address: targetApp.address,
      walletBalance: 0,
      membershipPlan: 'regular',
      status: 'active',
      kycVerified: true,
      totalOrdersCompleted: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      shopUpiId: siteConfig.upiId,
      subscriptionStatus: 'active',
    };

    setVles((prev) => [newVle, ...prev]);
    setVleApplications((prev) =>
      prev.map((a) =>
        a.id === appId
          ? { ...a, status: 'approved', generatedVleId, generatedPassword,
              approvedDate: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) }
          : a
      )
    );

    showNotification(`✅ VLE Approved! User account ready for ${targetApp.email}`);
    return { vleId: generatedVleId, password: generatedPassword };
  };

  const rejectVleApplication = (appId: string, reason: string) => {
    setVleApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: 'rejected', rejectionReason: reason } : a))
    );
    showNotification('Application rejected.');
  };

  const [vleLoggedIn, setVleLoggedIn] = useState<boolean>(false);

  const vleLogin = async (emailOrVleId: string, password?: string): Promise<boolean> => {
    if (!password) { showNotification('Password required'); return false; }
    const input = emailOrVleId.trim().toLowerCase();
    let found: VleOperator | null = vles.find(
      (v) => v.email.toLowerCase() === input || v.vleId.toLowerCase() === input
    ) || null;

    if (!found) {
      const userAccount = await getUserByEmail(input);
      if (userAccount && userAccount.plan === 'vle' && userAccount.vleData) {
        found = {
          id: userAccount.id, vleId: userAccount.vleData.vleId, email: userAccount.email,
          centerName: userAccount.vleData.centerName, operatorName: userAccount.vleData.operatorName,
          mobile: userAccount.vleData.mobile, state: userAccount.vleData.state,
          district: userAccount.vleData.district, address: userAccount.vleData.address,
          walletBalance: 0, status: userAccount.vleData.status,
          kycVerified: userAccount.vleData.kycVerified,
          totalOrdersCompleted: userAccount.vleData.totalOrdersCompleted,
          joinedDate: userAccount.vleData.joinedDate, shopUpiId: userAccount.vleData.shopUpiId,
        };
      }
    }

    if (!found) { showNotification('VLE account not found. Please register first.'); return false; }
    if (found.status === 'suspended') { showNotification('Account suspended.'); return false; }

    const result = await loginVle(found.email, password);
    if (!result.success) { showNotification(result.error || 'Login failed'); return false; }

    setActiveVleId(found.id);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_VLE_ID, found.id);
    setVleLoggedIn(true);
    localStorage.setItem(STORAGE_KEYS.VLE_LOGGED_IN, 'true');

    const userAcc = await getUserByEmail(found.email);
    if (userAcc) {
      setCurrentUser(userAcc);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userAcc.id);
    }
    showNotification(`Welcome, ${found.operatorName}!`);
    return true;
  };

  const vleLogout = async () => {
    await logoutVle();
    setVleLoggedIn(false);
    setActiveVleId('');
    localStorage.removeItem(STORAGE_KEYS.VLE_LOGGED_IN);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_VLE_ID);
    showNotification('Logout successful.');
  };

  const updateVleProfile = (vleId: string, updates: Partial<VleOperator>) => {
    setVles((prev) => prev.map((v) => (v.id === vleId ? { ...v, ...updates } : v)));
    showNotification('Profile updated!');
  };

  useEffect(() => {
    const unsubscribe = subscribeToVleAuth((user) => {
      if (user) {
        const foundVle = vles.find(v => v.email.toLowerCase() === user.email?.toLowerCase());
        if (foundVle) {
          setActiveVleId(foundVle.id);
          setVleLoggedIn(true);
          localStorage.setItem(STORAGE_KEYS.VLE_LOGGED_IN, 'true');
          localStorage.setItem(STORAGE_KEYS.ACTIVE_VLE_ID, foundVle.id);
        }
      } else {
        setVleLoggedIn(false);
      }
    });
    return () => unsubscribe();
  }, [vles]);

  const [ownerAuthenticated, setOwnerAuthenticated] = useState<boolean>(false);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
  const [ownerLockedUntil, setOwnerLockedUntil] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((isOwner, user) => {
      setOwnerAuthenticated(isOwner);
      setOwnerEmail(user?.email || null);
    });
    return () => unsubscribe();
  }, []);

  const verifyOwnerAuth = (input: string): boolean => false;

  const lockOwnerSession = async () => {
    await logoutOwner();
    setOwnerAuthenticated(false);
    setOwnerEmail(null);
    showNotification('Owner session locked.');
  };

  const changeOwnerCredentials = (newPin: string, newPassword?: string) => {
    updateSiteConfig({
      ownerSecurityPin: newPin,
      ...(newPassword ? { ownerPassword: newPassword } : {}),
    });
    showNotification('Credentials updated!');
  };

  const allTools: ToolDefinition[] = [...TOOLS_REGISTRY, ...customTools];

  const addCustomTool = (toolData: Omit<ToolDefinition, 'id' | 'isCustom'>) => {
    const id = 'custom_tool_' + Date.now().toString(36);
    const newTool: ToolDefinition = { ...toolData, id, isCustom: true, active: true };
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

  const updateVleWallet = (vleId: string, amount: number, type: 'credit' | 'debit', reason: string): boolean => {
    const targetVle = vles.find((v) => v.id === vleId);
    if (!targetVle) return false;
    if (type === 'debit' && targetVle.walletBalance < amount) {
      showNotification('Insufficient balance!');
      return false;
    }
    const newBalance = type === 'credit' ? targetVle.walletBalance + amount : targetVle.walletBalance - amount;
    setVles((prev) => prev.map((v) => (v.id === vleId ? { ...v, walletBalance: newBalance } : v)));

    const newTx: WalletTransaction = {
      id: 'tx_' + Date.now().toString(36),
      vleId: targetVle.vleId, vleName: targetVle.centerName,
      type, amount, reason,
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      balanceAfter: newBalance, status: 'completed',
    };
    setTransactions((prev) => [newTx, ...prev]);
    showNotification(`₹${amount} ${type === 'credit' ? 'credited' : 'debited'}`);
    return true;
  };

  const toggleVleStatus = (vleId: string) => {
    setVles((prev) => prev.map((v) => {
      if (v.id === vleId) return { ...v, status: v.status === 'active' ? 'suspended' : 'active' };
      return v;
    }));
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
      setVles((prev) => prev.map((v) =>
        v.vleId === newOrder.vleId ? { ...v, totalOrdersCompleted: v.totalOrdersCompleted + 1 } : v
      ));
    }
    showNotification(`Token: ${randomToken}`);
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: CustomerOrder['status'], notes?: string, rejectionReason?: string) => {
    setOrders((prev) => prev.map((o) => {
      if (o.id === orderId) {
        return { ...o, status, ...(notes ? { notes } : {}), ...(rejectionReason ? { rejectionReason } : {}) };
      }
      return o;
    }));
    showNotification(`Status: ${status.toUpperCase()}`);
  };

  const [activeTool, setActiveTool] = useState<string | null>(null);

  const resetToDefaultData = () => {
    if (confirm('Reset all data? This will clear localStorage, Firebase, and reload.')) {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(FORCE_RESET_FLAG, 'true');
      location.reload();
    }
  };

  const createOrUpdateUserAccount = async (userData: Partial<UserAccount> & { id: string; email: string; name: string }): Promise<boolean> => {
    setUserAccountLoading(true);
    try {
      const existing = currentUser?.id === userData.id ? currentUser : null;
      const newUser: UserAccount = {
        id: userData.id,
        email: userData.email.toLowerCase(),
        name: userData.name,
        mobile: userData.mobile || existing?.mobile,
        plan: userData.plan || existing?.plan || 'free',
        subscriptionStart: userData.subscriptionStart || existing?.subscriptionStart,
        subscriptionEnd: userData.subscriptionEnd || existing?.subscriptionEnd,
        subscriptionStatus: userData.subscriptionStatus || existing?.subscriptionStatus || 'active',
        createdAt: existing?.createdAt || new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        vleData: userData.vleData || existing?.vleData,
      };
      const { saveUserAccount } = await import('../services/subscriptionService');
      await saveUserAccount(newUser);
      setCurrentUser(newUser);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUser.id);
      return true;
    } catch (error) {
      console.error('Error creating user account:', error);
      return false;
    } finally {
      setUserAccountLoading(false);
    }
  };

  const checkToolAccess = async (toolId: string) => {
    const { canUserUseTool } = await import('../services/toolUsageService');
    return canUserUseTool(currentUser, toolId, DEFAULT_PREMIUM_TOOL_IDS);
  };

  const recordUsage = async (toolId: string) => {
    const { recordToolUsage } = await import('../services/toolUsageService');
    await recordToolUsage(currentUser?.id || null, toolId);
  };

  const isUserPremium = (): boolean => {
    if (!currentUser) return false;
    if (currentUser.plan === 'free') return false;
    if (currentUser.subscriptionStatus !== 'active') return false;
    if (!currentUser.subscriptionEnd) return false;
    return new Date(currentUser.subscriptionEnd) > new Date();
  };

  const showAdsForCurrentUser = (): boolean => {
    if (ownerAuthenticated) return false;
    if (!currentUser) return true;
    if (currentUser.plan === 'free') return true;
    if ((currentUser.plan === 'premium' || currentUser.plan === 'vle') && isUserPremium()) {
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (!currentUser?.id) return;
    let unsubscribe: (() => void) | undefined;
    const setupListener = async () => {
      const { subscribeToUserAccount } = await import('../services/subscriptionService');
      unsubscribe = subscribeToUserAccount(currentUser.id, (updatedUser) => {
        if (updatedUser) {
          if (
            updatedUser.plan !== currentUser.plan ||
            updatedUser.subscriptionStatus !== currentUser.subscriptionStatus ||
            updatedUser.subscriptionEnd !== currentUser.subscriptionEnd ||
            !!updatedUser.vleData !== !!currentUser.vleData
          ) {
            console.log('🔄 User account updated in real-time:', updatedUser.plan);
            setCurrentUser(updatedUser);
          }
        }
      });
    };
    setupListener();
    return () => { if (unsubscribe) unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const submitPaymentRequest = async (data: Omit<PaymentRequest, 'id' | 'status' | 'requestedAt'>): Promise<PaymentRequest | null> => {
    const { createPaymentRequest } = await import('../services/paymentService');
    const result = await createPaymentRequest(data);
    if (result) showNotification('✅ Payment request submitted! Verification pending.');
    else showNotification('❌ Failed to submit payment request');
    return result;
  };

  const approvePaymentRequest = async (paymentId: string, validUntil: Date): Promise<boolean> => {
    const { approvePayment } = await import('../services/paymentService');
    const { activateSubscription } = await import('../services/subscriptionService');
    const payment = paymentRequests.find(p => p.id === paymentId);
    if (!payment) return false;
    const success = await approvePayment(paymentId, ownerEmail || 'pdas966846@gmail.com', validUntil);
    if (success) {
      await activateSubscription(payment.userId, payment.plan, payment.billingCycle);
      showNotification(`✅ Payment approved for ${payment.userName}`);
      return true;
    }
    return false;
  };

  const rejectPaymentRequest = async (paymentId: string, reason: string): Promise<boolean> => {
    const { rejectPayment } = await import('../services/paymentService');
    const success = await rejectPayment(paymentId, reason);
    if (success) showNotification('Payment rejected');
    return success;
  };

  const addLedgerEntry = async (entryData: Omit<LedgerEntry, 'id' | 'createdAt' | 'timestamp' | 'date'>) => {
    const { createLedgerEntry } = await import('../services/khatabookService');
    const result = await createLedgerEntry(entryData);
    if (result) {
      setLedgerEntries(prev => [result, ...prev]);
      showNotification('✅ Entry added to khatabook');
    }
    return result;
  };

  const updateLedgerEntryById = async (id: string, updates: Partial<LedgerEntry>) => {
    const { updateLedgerEntry } = await import('../services/khatabookService');
    const success = await updateLedgerEntry(id, updates);
    if (success) {
      setLedgerEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e));
      showNotification('Entry updated');
    }
    return success;
  };

  const removeLedgerEntry = async (id: string) => {
    const { deleteLedgerEntry } = await import('../services/khatabookService');
    const success = await deleteLedgerEntry(id);
    if (success) {
      setLedgerEntries(prev => prev.filter(e => e.id !== id));
      showNotification('Entry deleted');
    }
    return success;
  };

  const getKhatabookStats = (): KhatabookStats => {
    const totalCustomers = new Set(ledgerEntries.map(e => e.customerMobile)).size;
    let totalReceivable = 0, totalPayable = 0;
    const customerBalance: Record<string, any> = {};
    ledgerEntries.forEach(e => {
      if (!customerBalance[e.customerMobile]) {
        customerBalance[e.customerMobile] = {
          name: e.customerName, mobile: e.customerMobile,
          debit: 0, credit: 0, lastDate: e.date, lastType: e.type,
          lastAmount: e.amount, count: 0, firstDate: e.date, lastTimestamp: e.timestamp,
        };
      }
      const cb = customerBalance[e.customerMobile];
      cb.count++;
      if (e.type === 'debit') cb.debit += e.amount;
      else if (e.type === 'credit' || e.type === 'payment_in') cb.credit += e.amount;
      else if (e.type === 'sale') { cb.debit += e.amount; cb.credit += e.amount; }
      else if (e.type === 'payment_out') cb.debit += e.amount;
      if (new Date(e.timestamp).getTime() > new Date(cb.lastTimestamp).getTime()) {
        cb.lastDate = e.date; cb.lastType = e.type; cb.lastAmount = e.amount;
        cb.lastTimestamp = e.timestamp; cb.name = e.customerName;
      }
    });
    const summaries: CustomerLedgerSummary[] = Object.values(customerBalance).map((cb: any) => {
      const balance = cb.debit - cb.credit;
      return {
        customerMobile: cb.mobile, customerName: cb.name,
        totalDebit: cb.debit, totalCredit: cb.credit, balance: Math.abs(balance),
        balanceType: balance > 0 ? 'receivable' : balance < 0 ? 'payable' : 'settled',
        totalTransactions: cb.count, lastTransactionDate: cb.lastDate,
        lastTransactionAmount: cb.lastAmount, lastTransactionType: cb.lastType,
        firstTransactionDate: cb.firstDate,
      };
    });
    summaries.forEach(s => {
      if (s.balanceType === 'receivable') totalReceivable += s.balance;
      if (s.balanceType === 'payable') totalPayable += s.balance;
    });
    const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];
    const month = today.substring(0, 7);
    const todayEntries = ledgerEntries.filter(e => e.date === today);
    const monthEntries = ledgerEntries.filter(e => e.date.startsWith(month));
    return {
      vleId: activeVle?.vleId || '',
      totalCustomers, totalReceivable, totalPayable,
      netBalance: totalReceivable - totalPayable,
      todayTransactions: todayEntries.length,
      todaySales: todayEntries.filter(e => e.type === 'sale' || e.type === 'debit').reduce((s, e) => s + e.amount, 0),
      todayReceived: todayEntries.filter(e => e.type === 'credit' || e.type === 'payment_in').reduce((s, e) => s + e.amount, 0),
      monthTransactions: monthEntries.length,
      monthSales: monthEntries.filter(e => e.type === 'sale' || e.type === 'debit').reduce((s, e) => s + e.amount, 0),
      monthReceived: monthEntries.filter(e => e.type === 'credit' || e.type === 'payment_in').reduce((s, e) => s + e.amount, 0),
      topCustomers: summaries.filter(s => s.balanceType === 'receivable').slice(0, 5),
    };
  };

  const getCustomerSummaries = (): CustomerLedgerSummary[] => {
    const customerBalance: Record<string, any> = {};
    ledgerEntries.forEach(e => {
      if (!customerBalance[e.customerMobile]) {
        customerBalance[e.customerMobile] = {
          name: e.customerName, mobile: e.customerMobile, address: e.customerAddress,
          debit: 0, credit: 0, lastDate: e.date, lastType: e.type,
          lastAmount: e.amount, count: 0, firstDate: e.date, lastTimestamp: e.timestamp,
        };
      }
      const cb = customerBalance[e.customerMobile];
      cb.count++;
      if (e.type === 'debit') cb.debit += e.amount;
      else if (e.type === 'credit' || e.type === 'payment_in') cb.credit += e.amount;
      else if (e.type === 'sale') { cb.debit += e.amount; cb.credit += e.amount; }
      else if (e.type === 'payment_out') cb.debit += e.amount;
      if (new Date(e.timestamp).getTime() > new Date(cb.lastTimestamp).getTime()) {
        cb.lastDate = e.date; cb.lastType = e.type; cb.lastAmount = e.amount;
        cb.lastTimestamp = e.timestamp; cb.name = e.customerName; cb.address = e.customerAddress;
      }
    });
    const summaries: CustomerLedgerSummary[] = Object.values(customerBalance).map((cb: any) => {
      const balance = cb.debit - cb.credit;
      return {
        customerMobile: cb.mobile, customerName: cb.name, customerAddress: cb.address,
        totalDebit: cb.debit, totalCredit: cb.credit, balance: Math.abs(balance),
        balanceType: balance > 0 ? 'receivable' : balance < 0 ? 'payable' : 'settled',
        totalTransactions: cb.count, lastTransactionDate: cb.lastDate,
        lastTransactionAmount: cb.lastAmount, lastTransactionType: cb.lastType,
        firstTransactionDate: cb.firstDate,
      };
    });
    return summaries.sort((a, b) => {
      if (a.balanceType === 'receivable' && b.balanceType !== 'receivable') return -1;
      if (a.balanceType !== 'receivable' && b.balanceType === 'receivable') return 1;
      return b.balance - a.balance;
    });
  };

  useEffect(() => {
    if (!ownerAuthenticated) return;
    const loadPayments = async () => {
      const { subscribeToAllPayments } = await import('../services/paymentService');
      const unsub = subscribeToAllPayments((payments) => setPaymentRequests(payments));
      return unsub;
    };
    const unsubPromise = loadPayments();
    return () => { unsubPromise.then(unsub => unsub && unsub()); };
  }, [ownerAuthenticated]);

  useEffect(() => {
    if (!activeVle) return;
    const loadLedger = async () => {
      setLedgerLoading(true);
      const { subscribeToVleLedger } = await import('../services/khatabookService');
      const unsub = subscribeToVleLedger(activeVle.vleId, (entries) => {
        setLedgerEntries(entries);
        setLedgerLoading(false);
      });
      return unsub;
    };
    const unsubPromise = loadLedger();
    return () => { unsubPromise.then(unsub => unsub && unsub()); };
  }, [activeVle]);

  // CUSTOMERS SUBSCRIPTION
  useEffect(() => {
    if (!activeVle?.vleId) {
      setCustomers([]);
      return;
    }
    setCustomersLoading(true);
    const unsub = subscribeToVleCustomers(activeVle.vleId, (list) => {
      setCustomers(list);
      setCustomersLoading(false);
    });
    return () => unsub();
  }, [activeVle?.vleId]);

  const addCustomer = async (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalOrders' | 'totalSpent' | 'firstVisitDate'>) => {
    const existing = customers.find(c => c.mobile === data.mobile);
    if (existing) {
      showNotification(`⚠️ Customer already exists: ${existing.name}`);
      return null;
    }
    return await createCustomer(data);
  };

  const updateCustomerById = async (id: string, updates: Partial<Customer>) => {
    return await updateCustomer(id, updates);
  };

  const deleteCustomerById = async (id: string) => {
    return await deleteCustomer(id);
  };

  // 🆕 RECHARGE ORDERS SUBSCRIPTION
  // - Owner: subscribe to ALL orders
  // - VLE: subscribe to their own orders
  useEffect(() => {
    // Owner case
    if (ownerAuthenticated) {
      setRechargeOrdersLoading(true);
      const unsub = subscribeToAllRechargeOrders((list) => {
        setRechargeOrders(list);
        setRechargeOrdersLoading(false);
      });
      return () => unsub();
    }
    // VLE case
    if (activeVle?.vleId) {
      setRechargeOrdersLoading(true);
      const unsub = subscribeToVleRechargeOrders(activeVle.vleId, (list) => {
        setRechargeOrders(list);
        setRechargeOrdersLoading(false);
      });
      return () => unsub();
    }
    // No context
    setRechargeOrders([]);
  }, [ownerAuthenticated, activeVle?.vleId]);

  const addRechargeOrder = async (data: Omit<RechargeOrder, 'id' | 'tokenNumber' | 'createdAt' | 'updatedAt' | 'status'>) => {
    return await createRechargeOrder(data);
  };

  const updateRechargeOrderById = async (id: string, updates: Partial<RechargeOrder>) => {
    return await updateRechargeOrder(id, updates);
  };

  const completeRechargeOrderById = async (id: string, refNumber: string) => {
    return await completeRechargeOrder(id, refNumber);
  };

  const deleteRechargeOrderById = async (id: string) => {
    return await deleteRechargeOrder(id);
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
        ownerAuthenticated, ownerEmail, ownerLockedUntil, verifyOwnerAuth, lockOwnerSession, changeOwnerCredentials,
        importantLinks, addImportantLink, updateImportantLink, deleteImportantLink, resetImportantLinks,
        allTools, customTools, addCustomTool, updateTool, deleteCustomTool,
        orders, addCustomerOrder, updateOrderStatus, transactions,
        activeTool, setActiveTool, resetToDefaultData,
        notificationMessage, notification: notificationMessage, showNotification,
        firebaseReady,
        currentUser, setCurrentUser, userAccountLoading,
        createOrUpdateUserAccount, checkToolAccess, recordUsage, isUserPremium, showAdsForCurrentUser,
        paymentRequests, submitPaymentRequest, approvePaymentRequest, rejectPaymentRequest,
        premiumToolIds, togglePremiumTool,
        ledgerEntries, ledgerLoading,
        addLedgerEntry, updateLedgerEntryById, removeLedgerEntry,
        getKhatabookStats, getCustomerSummaries,
        customers, customersLoading,
        addCustomer, updateCustomerById, deleteCustomerById,
        // 🆕 Recharge
        rechargeOrders, rechargeOrdersLoading,
        addRechargeOrder, updateRechargeOrderById, completeRechargeOrderById, deleteRechargeOrderById,
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
