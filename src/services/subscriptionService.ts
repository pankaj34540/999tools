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

// ============================================
// HELPER — Remove undefined/null/empty values
// Firestore does NOT accept undefined values
// ============================================
const cleanFirestoreData = (data: Record<string, any>): Record<string, any> => {
  const clean: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      clean[key] = value;
    }
  });
  return clean;
};

// ============================================
// CREATE OR UPDATE USER ACCOUNT
// ============================================
export const saveUserAccount = async (user: UserAccount): Promise<boolean> => {
  try {
    const cleanUser = cleanFirestoreData(user);
    await setDoc(doc(db, 'userAccounts', user.id), cleanUser, { merge: true });
    console.log('✅ User account saved:', user.email);
    return true;
  } catch (error) {
    console.error('❌ Error saving user account:', error);
    return false;
  }
};

// ============================================
// GET USER ACCOUNT BY ID
// ============================================
export const getUserAccount = async (userId: string): Promise<UserAccount | null> => {
  try {
    const snap = await getDoc(doc(db, 'userAccounts', userId));
    return snap.exists() ? (snap.data() as UserAccount) : null;
  } catch (error) {
    console.error('❌ Error getting user account:', error);
    return null;
  }
};

// ============================================
// GET USER BY EMAIL
// ============================================
export const getUserByEmail = async (email: string): Promise<UserAccount | null> => {
  try {
    const q = query(collection(db, 'userAccounts'), where('email', '==', email.toLowerCase()));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as UserAccount;
  } catch (error) {
    console.error('❌ Error getting user by email:', error);
    return null;
  }
};

// ============================================
// SUBSCRIBE — Real-time user account listener
// ============================================
export const subscribeToUserAccount = (
  userId: string, 
  callback: (user: UserAccount | null) => void
) => {
  return onSnapshot(doc(db, 'userAccounts', userId), (snap) => {
    if (snap.exists()) {
      callback(snap.data() as UserAccount);
    } else {
      callback(null);
    }
  });
};

// ============================================
// ACTIVATE SUBSCRIPTION
// ============================================
export const activateSubscription = async (
  userId: string,
  plan: UserPlan,
  billingCycle: BillingCycle,
  customEndDate?: Date
): Promise<boolean> => {
  try {
    const now = new Date();
    const endDate = customEndDate || new Date(
      now.getTime() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000
    );

    const updateData = cleanFirestoreData({
      plan,
      subscriptionStart: now.toISOString(),
      subscriptionEnd: endDate.toISOString(),
      subscriptionStatus: 'active' as SubscriptionStatus,
    });

    await updateDoc(doc(db, 'userAccounts', userId), updateData);

    console.log(`✅ Subscription activated: ${plan} (${billingCycle}) for user ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Error activating subscription:', error);
    return false;
  }
};

// ============================================
// EXPIRE SUBSCRIPTION
// ============================================
export const expireSubscription = async (userId: string): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'userAccounts', userId), {
      plan: 'free',
      subscriptionStatus: 'expired' as SubscriptionStatus,
    });
    console.log(`✅ Subscription expired for user ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Error expiring subscription:', error);
    return false;
  }
};

// ============================================
// CHECK IF SUBSCRIPTION IS STILL VALID
// ============================================
export const isSubscriptionValid = (user: UserAccount | null): boolean => {
  if (!user) return false;
  if (user.plan === 'free') return true;
  if (user.subscriptionStatus !== 'active') return false;
  if (!user.subscriptionEnd) return false;
  
  const endDate = new Date(user.subscriptionEnd);
  return endDate > new Date();
};

// ============================================
// GET ALL USERS
// ============================================
export const getAllUserAccounts = async (): Promise<UserAccount[]> => {
  try {
    const snap = await getDocs(collection(db, 'userAccounts'));
    return snap.docs.map((d) => d.data() as UserAccount);
  } catch (error) {
    console.error('❌ Error getting all users:', error);
    return [];
  }
};

// ============================================
// SUBSCRIBE ALL USERS (Owner Panel)
// ============================================
export const subscribeToAllUsers = (callback: (users: UserAccount[]) => void) => {
  return onSnapshot(collection(db, 'userAccounts'), (snap) => {
    const users = snap.docs.map((d) => d.data() as UserAccount);
    callback(users);
  });
};

// ============================================
// UPDATE USER PLAN MANUALLY (Owner)
// ============================================
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

    const updateData = cleanFirestoreData({
      plan,
      subscriptionStart: now.toISOString(),
      subscriptionEnd: endDate ? endDate.toISOString() : undefined,
      subscriptionStatus: 'active' as SubscriptionStatus,
    });

    await updateDoc(doc(db, 'userAccounts', userId), updateData);

    console.log(`✅ Manual plan update: ${plan} for user ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating plan:', error);
    return false;
  }
};

// ============================================
// SUBSCRIPTION STATS
// ============================================
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

// ============================================
// DELETE USER ACCOUNT (Owner)
// ============================================
export const deleteUserAccount = async (userId: string): Promise<boolean> => {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'userAccounts', userId));
    console.log('✅ User account deleted:', userId);
    return true;
  } catch (error) {
    console.error('❌ Error deleting user account:', error);
    return false;
  }
};
