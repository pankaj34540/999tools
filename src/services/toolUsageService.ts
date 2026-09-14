import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ToolUsage, UserAccount } from '../types';
import { isPremiumTool, FREE_USER_DAILY_LIMIT } from '../data/premiumTools';
import { isSubscriptionValid } from './subscriptionService';

// ============================================
// DATE HELPER — Today in IST (YYYY-MM-DD)
// ============================================
export const getTodayIST = (): string => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString().split('T')[0];
};

// ============================================
// GUEST TRACKING (localStorage)
// Key format: "999tools_guest_usage_<toolId>_<date>"
// ============================================
const GUEST_KEY_PREFIX = '999tools_guest_usage_';

const getGuestUsageKey = (toolId: string): string => {
  return `${GUEST_KEY_PREFIX}${toolId}_${getTodayIST()}`;
};

const getGuestUsageCount = (toolId: string): number => {
  try {
    const key = getGuestUsageKey(toolId);
    const val = localStorage.getItem(key);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
};

const setGuestUsageCount = (toolId: string, count: number): void => {
  try {
    const key = getGuestUsageKey(toolId);
    localStorage.setItem(key, count.toString());
  } catch (error) {
    console.error('Error saving guest usage:', error);
  }
};

// Cleanup old guest usage keys (older than 7 days)
const cleanupOldGuestData = (): void => {
  try {
    const today = getTodayIST();
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(GUEST_KEY_PREFIX)) {
        const parts = key.replace(GUEST_KEY_PREFIX, '').split('_');
        const date = parts[parts.length - 1];
        if (date < today) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (error) {
    console.error('Error cleaning guest data:', error);
  }
};

// ============================================
// CHECK IF USER CAN USE A TOOL
// ============================================
export const canUserUseTool = async (
  user: UserAccount | null,
  toolId: string,
  premiumToolIds: string[]
): Promise<{ allowed: boolean; remaining: number; isPremium: boolean; limit: number }> => {
  
  const isPremium = isPremiumTool(toolId, premiumToolIds);
  
  // Not a premium tool — always allowed
  if (!isPremium) {
    return { allowed: true, remaining: -1, isPremium: false, limit: -1 };
  }

  // ✅ Logged-in Premium/VLE user — unlimited
  if (user && (user.plan === 'premium' || user.plan === 'vle') && isSubscriptionValid(user)) {
    return { allowed: true, remaining: -1, isPremium: true, limit: -1 };
  }

  // ✅ Guest user (not logged in) — localStorage tracking
  if (!user) {
    cleanupOldGuestData();
    const count = getGuestUsageCount(toolId);
    const remaining = FREE_USER_DAILY_LIMIT - count;
    return {
      allowed: remaining > 0,
      remaining: Math.max(0, remaining),
      isPremium: true,
      limit: FREE_USER_DAILY_LIMIT,
    };
  }

  // ✅ Free logged-in user — Firebase tracking
  const today = getTodayIST();
  const usageId = `${user.id}_${toolId}_${today}`;
  const usageRef = doc(db, 'toolUsage', usageId);
  const usageSnap = await getDoc(usageRef);

  const currentCount = usageSnap.exists() ? (usageSnap.data() as ToolUsage).count : 0;
  const remaining = FREE_USER_DAILY_LIMIT - currentCount;

  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
    isPremium: true,
    limit: FREE_USER_DAILY_LIMIT,
  };
};

// ============================================
// RECORD TOOL USAGE
// ============================================
export const recordToolUsage = async (
  userId: string | null,
  toolId: string
): Promise<boolean> => {
  try {
    // ✅ Guest user — localStorage
    if (!userId) {
      const currentCount = getGuestUsageCount(toolId);
      setGuestUsageCount(toolId, currentCount + 1);
      console.log('📊 Guest usage recorded:', toolId, '→', currentCount + 1);
      return true;
    }

    // ✅ Logged-in user — Firebase
    const today = getTodayIST();
    const usageId = `${userId}_${toolId}_${today}`;
    const usageRef = doc(db, 'toolUsage', usageId);
    const usageSnap = await getDoc(usageRef);

    if (usageSnap.exists()) {
      const current = usageSnap.data() as ToolUsage;
      await updateDoc(usageRef, {
        count: current.count + 1,
        lastUsedAt: new Date().toISOString(),
      });
    } else {
      const newUsage: ToolUsage = {
        id: usageId,
        userId,
        toolId,
        date: today,
        count: 1,
        lastUsedAt: new Date().toISOString(),
      };
      await setDoc(usageRef, newUsage);
    }

    console.log('📊 Tool usage recorded in Firebase:', toolId);
    return true;
  } catch (error) {
    console.error('❌ Error recording tool usage:', error);
    return false;
  }
};

// ============================================
// GET USER'S TODAY USAGE FOR A TOOL
// ============================================
export const getToolUsageToday = async (
  userId: string | null,
  toolId: string
): Promise<number> => {
  try {
    if (!userId) {
      return getGuestUsageCount(toolId);
    }
    const today = getTodayIST();
    const usageId = `${userId}_${toolId}_${today}`;
    const snap = await getDoc(doc(db, 'toolUsage', usageId));
    return snap.exists() ? (snap.data() as ToolUsage).count : 0;
  } catch (error) {
    console.error('❌ Error getting tool usage:', error);
    return 0;
  }
};

// ============================================
// SUBSCRIBE TO USER'S TODAY USAGE FOR A TOOL
// ============================================
export const subscribeToToolUsageToday = (
  userId: string,
  toolId: string,
  callback: (count: number) => void
) => {
  const today = getTodayIST();
  const usageId = `${userId}_${toolId}_${today}`;
  return onSnapshot(doc(db, 'toolUsage', usageId), (snap) => {
    callback(snap.exists() ? (snap.data() as ToolUsage).count : 0);
  });
};

// ============================================
// GET ALL USAGE FOR USER TODAY
// ============================================
export const getAllUserUsageToday = async (userId: string): Promise<ToolUsage[]> => {
  try {
    const today = getTodayIST();
    const q = query(
      collection(db, 'toolUsage'),
      where('userId', '==', userId),
      where('date', '==', today)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as ToolUsage);
  } catch (error) {
    console.error('❌ Error getting all usage:', error);
    return [];
  }
};
