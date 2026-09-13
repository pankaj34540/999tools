import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserAccount, UserPlan, SubscriptionStatus, BillingCycle, SubscriptionStats, VleData } from '../types';

// ============================================
// DEEP CLEAN — Remove undefined/null/empty values
// ============================================
const deepClean = (value: any): any => {
  if (value === null || value === undefined) return undefined;
  
  if (Array.isArray(value)) {
    const cleanedArray = value
      .map(item => deepClean(item))
      .filter(item => item !== undefined);
    return cleanedArray;
  }
  
  if (typeof value === 'object') {
    const cleanedObj: Record<string, any> = {};
    Object.entries(value).forEach(([key, val]) => {
      const cleanedVal = deepClean(val);
      if (cleanedVal !== undefined && cleanedVal !== '') {
        cleanedObj[key] = cleanedVal;
      }
    });
    return cleanedObj;
  }
  
  if (value === '') return undefined;
  return value;
};

// ============================================
// CREATE OR UPDATE USER ACCOUNT
// ============================================
export const saveUserAccount = async (user: UserAccount): Promise<boolean> => {
  try {
    const cleanUser = deepClean(user);
    await setDoc(doc(db, 'userAccounts', user.id), cleanUser, { merge: true });
    console.log('✅ User account saved:', user.email);
    return true;
  } catch (error: any) {
    console.error('❌ Error saving user account:', error.code, error.message);
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
// 🆕 CONVERT VLE USER — Update existing user to VLE plan
// (Jab Owner VLE application approve kare)
// ============================================
export const convertUserToVle = async (
  userId: string,
  vleData: VleData,
  subscriptionMonths: number = 1
): Promise<boolean> => {
  try {
    const now = new Date();
    const endDate = new Date(now.getTime() + subscriptionMonths * 30 * 24 * 60 * 60 * 1000);

    const updateData = deepClean({
      plan: 'vle' as UserPlan,
      subscriptionStart: now.toISOString(),
      subscriptionEnd: endDate.toISOString(),
      subscriptionStatus: 'active' as SubscriptionStatus,
      vleData: vleData,
    });

    await updateDoc(doc(db, 'userAccounts', userId), updateData);

    console.log(`✅ User converted to VLE plan: ${userId}`);
    return true;
  } catch (error: any) {
    console.error('❌ Error converting user to VLE:', error.code, error.message);
    return false;
  }
};

// ============================================
// 🆕 CREATE OR UPDATE VLE USER BY EMAIL
// (Owner VLE approve kare, user pehle se exists kare ya na kare)
// ============================================
export const createOrUpdateVleUser = async (
  email: string,
  name: string,
  mobile: string,
  vleData: VleData,
  subscriptionMonths: number = 1,
  firebaseUid?: string
): Promise<{ success: boolean; userId?: string; error?: string }> => {
  try {
    // Pehle existing user dhundo
    const existingUser = await getUserByEmail(email);
    
    const now = new Date();
    const endDate = new Date(now.getTime() + subscriptionMonths * 30 * 24 * 60 * 60 * 1000);
    
    // Agar user pehle se exists hai
    if (existingUser) {
      const updateData = deepClean({
        plan: 'vle' as UserPlan,
        subscriptionStart: now.toISOString(),
        subscriptionEnd: endDate.toISOString(),
        subscriptionStatus: 'active' as SubscriptionStatus,
        vleData: vleData,
        mobile: mobile || existingUser.mobile,
      });
      
      await updateDoc(doc(db, 'userAccounts', existingUser.id), updateData);
      console.log('✅ Existing user converted to VLE:', email);
      return { success: true, userId: existingUser.id };
    }
    
    // Agar user nahi hai — naya banao
    // Note: Firebase Auth account Owner banayega (VLE approve karte waqt)
    const newUserId = firebaseUid || ('user_' + Date.now().toString(36));
    
    const newUser: UserAccount = {
      id: newUserId,
      email: email.toLowerCase(),
      name: name,
      mobile: mobile,
      plan: 'vle' as UserPlan,
      subscriptionStart: now.toISOString(),
      subscriptionEnd: endDate.toISOString(),
      subscriptionStatus: 'active' as SubscriptionStatus,
      createdAt: now.toISOString(),
      lastLoginAt: now.toISOString(),
      vleData: vleData,
    };
    
    const cleanUser = deepClean(newUser);
    await setDoc(doc(db, 'userAccounts', newUserId), cleanUser);
    
    console.log('✅ New VLE user created:', email);
    return { success: true, userId: newUserId };
  } catch (error: any) {
    console.error('❌ Error creating/updating VLE user:', error.code, error.message);
    return { success: false, error: error.message };
  }
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

    const updateData = deepClean({
      plan,
      subscriptionStart: now.toISOString(),
      subscriptionEnd: endDate.toISOString(),
      subscriptionStatus: 'active' as SubscriptionStatus,
    });

    await updateDoc(doc(db, 'userAccounts', userId), updateData);

    console.log(`✅ Subscription activated: ${plan} (${billingCycle}) for user ${userId}`);
    return true;
  } catch (error: any) {
    console.error('❌ Error activating subscription:', error.code, error.message);
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
  } catch (error: any) {
    console.error('❌ Error expiring subscription:', error.code, error.message);
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

    const updateData = deepClean({
      plan,
      subscriptionStart: now.toISOString(),
      subscriptionEnd: endDate ? endDate.toISOString() : undefined,
      subscriptionStatus: 'active' as SubscriptionStatus,
    });

    await updateDoc(doc(db, 'userAccounts', userId), updateData);

    console.log(`✅ Manual plan update: ${plan} for user ${userId}`);
    return true;
  } catch (error: any) {
    console.error('❌ Error updating plan:', error.code, error.message);
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
    await deleteDoc(doc(db, 'userAccounts', userId));
    console.log('✅ User account deleted:', userId);
    return true;
  } catch (error) {
    console.error('❌ Error deleting user account:', error);
    return false;
  }
};
