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

export const getTodayIST = (): string => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString().split('T')[0];
};

export const canUserUseTool = async (
  user: UserAccount | null,
  toolId: string,
  premiumToolIds: string[]
): Promise<{ allowed: boolean; remaining: number; isPremium: boolean; limit: number }> => {
  
  const isPremium = isPremiumTool(toolId, premiumToolIds);
  
  if (!isPremium) {
    return { allowed: true, remaining: -1, isPremium: false, limit: -1 };
  }

  if (!user) {
    return { allowed: true, remaining: FREE_USER_DAILY_LIMIT, isPremium: true, limit: FREE_USER_DAILY_LIMIT };
  }

  if ((user.plan === 'premium' || user.plan === 'vle') && isSubscriptionValid(user)) {
    return { allowed: true, remaining: -1, isPremium: true, limit: -1 };
  }

  const today = getTodayIST();
  const usageId = `${user.id}_${toolId}_${today}`;
  const usageSnap = await getDoc(doc(db, 'toolUsage', usageId));

  const currentCount = usageSnap.exists() ? (usageSnap.data() as ToolUsage).count : 0;
  const remaining = FREE_USER_DAILY_LIMIT - currentCount;

  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
    isPremium: true,
    limit: FREE_USER_DAILY_LIMIT,
  };
};

export const recordToolUsage = async (
  userId: string,
  toolId: string
): Promise<boolean> => {
  try {
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
    return true;
  } catch (error) {
    return false;
  }
};

export const getToolUsageToday = async (
  userId: string,
  toolId: string
): Promise<number> => {
  try {
    const today = getTodayIST();
    const usageId = `${userId}_${toolId}_${today}`;
    const snap = await getDoc(doc(db, 'toolUsage', usageId));
    return snap.exists() ? (snap.data() as ToolUsage).count : 0;
  } catch (error) {
    return 0;
  }
};

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
    return [];
  }
};
