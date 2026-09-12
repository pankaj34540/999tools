import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserAccount, UserPlan, SubscriptionStatus, BillingCycle, SubscriptionStats } from '../types';

export const saveUserAccount = async (user: UserAccount): Promise<boolean> => {
  try {
    await setDoc(doc(db, 'userAccounts', user.id), user, { merge: true });
    return true;
  } catch (error) {
    console.error('❌ Error saving user:', error);
    return false;
  }
};

export const getUserAccount = async (userId: string): Promise<UserAccount | null> => {
  try {
    const snap = await getDoc(doc(db, 'userAccounts', userId));
    return snap.exists() ? (snap.data() as UserAccount) : null;
  } catch (error) {
    return null;
  }
};

export const getUserByEmail = async (email: string): Promise<UserAccount | null> => {
  try {
    const q = query(collection(db, 'userAccounts'), where('email', '==', email.toLowerCase()));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as UserAccount;
  } catch (error) {
    return null;
  }
};

export const subscribeToUserAccount = (
  userId: string, 
  callback: (user: UserAccount | null) => void
) => {
  return onSnapshot(doc(db, 'userAccounts', userId), (snap) => {
    callback(snap.exists() ? (snap.data() as UserAccount) : null);
  });
};

export const activateSubscription = async (
  userId: string,
  plan: UserPlan,
  billingCycle: BillingCycle
): Promise<boolean> => {
  try {
    const now = new Date();
    const endDate = new Date(
      now.getTime() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000
    );

    await updateDoc(doc(db, 'userAccounts', userId), {
      plan,
      subscriptionStart: now.toISOString(),
      subscriptionEnd: endDate.toISOString(),
      subscriptionStatus: 'active' as SubscriptionStatus,
    });
    return true;
  } catch (error) {
    return false;
  }
};

export const expireSubscription = async (userId: string): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'userAccounts', userId), {
      plan: 'free',
      subscriptionStatus: 'expired' as SubscriptionStatus,
    });
    return true;
  } catch (error) {
    return false;
  }
};

export const isSubscriptionValid = (user: UserAccount | null): boolean => {
  if (!user) return false;
  if (user.plan === 'free') return true;
  if (user.subscriptionStatus !== 'active') return false;
  if (!user.subscriptionEnd) return false;
  return new Date(user.subscriptionEnd) > new Date();
};

export const getAllUserAccounts = async (): Promise<UserAccount[]> => {
  try {
    const snap = await getDocs(collection(db, 'userAccounts'));
    return snap.docs.map((d) => d.data() as UserAccount);
  } catch (error) {
    return [];
  }
};

export const subscribeToAllUsers = (callback: (users: UserAccount[]) => void) => {
  return onSnapshot(collection(db, 'userAccounts'), (snap) => {
    callback(snap.docs.map((d) => d.data() as UserAccount));
  });
};

export const updateUserPlanManually = async (
  userId: string,
  plan: UserPlan,
  monthsToAdd?: number
): Promise<boolean> => {
  try {
    const now = new Date();
    const endDate = monthsToAdd 
      ? new Date(now.getTime() + monthsToAdd * 30 * 24 * 60 * 60 * 1000)
      : null;

    await updateDoc(doc(db, 'userAccounts', userId), {
      plan,
      subscriptionStart: now.toISOString(),
      ...(endDate ? { subscriptionEnd: endDate.toISOString() } : {}),
      subscriptionStatus: 'active' as SubscriptionStatus,
    });
    return true;
  } catch (error) {
    return false;
  }
};

export const calculateSubscriptionStats = (users: UserAccount[]): SubscriptionStats => {
  return {
    totalFreeUsers: users.filter((u) => u.plan === 'free').length,
    totalPremiumUsers: users.filter((u) => u.plan === 'premium').length,
    totalVleUsers: users.filter((u) => u.plan === 'vle').length,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    pendingPayments: 0,
  };
};
