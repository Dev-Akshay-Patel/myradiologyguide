import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  Firestore
} from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  Auth,
  User
} from "firebase/auth";

// User's exact Firebase Project Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDMGlKGFOWHlJ1_zoBfMOkxwK25qLwHFLQ",
  authDomain: "myradiologyguide.firebaseapp.com",
  projectId: "myradiologyguide",
  storageBucket: "myradiologyguide.firebasestorage.app",
  messagingSenderId: "152646920702",
  appId: "1:152646920702:web:c5138e518daf9f02e178af",
  measurementId: "G-SLMT1B2LL5"
};

let appInstance: any = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

export function getFirebaseApp() {
  if (appInstance) return appInstance;
  try {
    appInstance = getApps().length ? getApp() : initializeApp(firebaseConfig);
    if (typeof window !== "undefined") {
      isAnalyticsSupported()
        .then((supported) => {
          if (supported) {
            try {
              getAnalytics(appInstance);
            } catch (_) {}
          }
        })
        .catch(() => {});
    }
  } catch (err) {
    console.warn("[MRGFirebase] App init notice:", err);
  }
  return appInstance;
}

export function getDb(): Firestore | null {
  if (firestoreInstance) return firestoreInstance;
  try {
    const app = getFirebaseApp();
    if (app) {
      firestoreInstance = getFirestore(app);
    }
  } catch (err) {
    console.warn("[MRGFirebase] Firestore init notice:", err);
  }
  return firestoreInstance;
}

export function getFirebaseAuth(): Auth | null {
  if (authInstance) return authInstance;
  try {
    const app = getFirebaseApp();
    if (app) {
      authInstance = getAuth(app);
    }
  } catch (err) {
    console.warn("[MRGFirebase] Auth init notice:", err);
  }
  return authInstance;
}

/* ==========================================================================
   FIREBASE GOOGLE AUTHENTICATION
   ========================================================================== */

export interface GoogleSignInResult {
  success: boolean;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    uid?: string;
  };
  error?: any;
  wasFallback?: boolean;
}

/**
 * Sign in using Firebase Google Auth with popup.
 * Automatically synchronizes with RadiologyAuth and local session.
 * Handles unauthorized domains gracefully (e.g. while adding to Firebase Console).
 */
export function getCurrentUser() {
  const auth = getFirebaseAuth();
  if (auth && auth.currentUser) {
    const fbUser = auth.currentUser;
    return {
      name: fbUser.displayName || (fbUser.email ? fbUser.email.split("@")[0] : "Clinician"),
      email: fbUser.email || "",
      avatar: fbUser.photoURL || undefined,
      uid: fbUser.uid
    };
  }
  return null;
}

/**
 * Sign in using Firebase Google Auth with popup.
 * Automatically synchronizes with RadiologyAuth and local session.
 * If user is already authenticated in Firebase, returns current user directly without opening popup!
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  const auth = getFirebaseAuth();
  if (!auth) {
    return { success: false, error: "Auth not initialized" };
  }

  // If already authenticated in Firebase Auth, DO NOT open popup again!
  if (auth.currentUser) {
    const fbUser = auth.currentUser;
    const accountData = {
      name: fbUser.displayName || (fbUser.email ? fbUser.email.split("@")[0] : "Clinician"),
      email: fbUser.email || "",
      avatar: fbUser.photoURL || undefined,
      uid: fbUser.uid
    };

    if (typeof window !== "undefined" && (window as any).RadiologyAuth?.setGoogleAccount) {
      (window as any).RadiologyAuth.setGoogleAccount(accountData);
    }

    return {
      success: true,
      user: accountData
    };
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;

    const accountData = {
      name: fbUser.displayName || (fbUser.email ? fbUser.email.split("@")[0] : "Clinician"),
      email: fbUser.email || "",
      avatar: fbUser.photoURL || undefined,
      uid: fbUser.uid
    };

    if (typeof window !== "undefined" && (window as any).RadiologyAuth?.setGoogleAccount) {
      (window as any).RadiologyAuth.setGoogleAccount(accountData);
    }

    if (typeof window !== "undefined" && (window as any).RadiologyAuth?.showToast) {
      (window as any).RadiologyAuth.showToast(`Signed in as ${accountData.name}`, "success");
    }

    return {
      success: true,
      user: accountData
    };
  } catch (err: any) {
    console.warn("[MRGFirebaseAuth] Popup error:", err);

    if (err.code === "auth/unauthorized-domain") {
      const hostname = typeof window !== "undefined" ? window.location.hostname : "current host";
      const noticeMsg = `Domain "${hostname}" needs to be added to Authorized Domains in Firebase Console (Authentication > Settings > Authorized domains).`;
      if (typeof window !== "undefined" && (window as any).RadiologyAuth?.showToast) {
        (window as any).RadiologyAuth.showToast(noticeMsg, "warning");
      }
    } else if (err.code === "auth/popup-blocked") {
      if (typeof window !== "undefined" && (window as any).RadiologyAuth?.showToast) {
        (window as any).RadiologyAuth.showToast("Google popup was blocked by browser. Please allow popups.", "info");
      }
    }

    return { success: false, error: err };
  }
}

/**
 * Sign out current user from Firebase Auth and clear session
 */
export async function signOutUser(): Promise<void> {
  try {
    const auth = getFirebaseAuth();
    if (auth) {
      await firebaseSignOut(auth);
    }
  } catch (err) {
    console.warn("[MRGFirebaseAuth] Sign out error:", err);
  }

  if (typeof window !== "undefined" && (window as any).RadiologyAuth?.clearSession) {
    (window as any).RadiologyAuth.clearSession();
  }
}

/**
 * Initializes Firebase Auth state observer to restore existing Google sessions
 */
export function initAuthObserver(callback?: (user: User | null) => void) {
  try {
    const auth = getFirebaseAuth();
    if (!auth) return;

    onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const accountData = {
          name: fbUser.displayName || "Google Clinician",
          email: fbUser.email || "",
          avatar: fbUser.photoURL || undefined,
          uid: fbUser.uid
        };
        if (typeof window !== "undefined" && (window as any).RadiologyAuth?.setGoogleAccount) {
          (window as any).RadiologyAuth.setGoogleAccount(accountData);
        }
      }
      if (typeof callback === "function") {
        callback(fbUser);
      }
    });
  } catch (err) {
    console.warn("[MRGFirebaseAuth] Observer notice:", err);
  }
}

// Auto-initialize observer in browser
if (typeof window !== "undefined") {
  setTimeout(() => {
    initAuthObserver();
  }, 100);
}

/* ==========================================================================
   FIREBASE FIRESTORE COMMENTS (MINIMAL QUOTA ENGINE)
   ========================================================================== */

export interface ClinicalReply {
  id: string;
  author: string;
  avatarText?: string;
  avatarBg?: string;
  avatarUrl?: string | null;
  timestamp: number;
  text: string;
  mention?: string | null;
}

export interface ClinicalComment {
  id: string;
  pageKey: string;
  pageTitle: string;
  pageUrl: string;
  author: string;
  avatarText?: string;
  avatarBg?: string;
  avatarUrl?: string | null;
  timestamp: number;
  text: string;
  replies: ClinicalReply[];
}

/**
 * Resolves page meta dynamically so any article, protocol, or book page
 * automatically isolates and scopes comments without cross-contamination.
 */
export function getPageMeta() {
  if (typeof document === "undefined") {
    return {
      pageKey: "stroke-cta-protocol",
      pageTitle: "Acute Ischemic Stroke Protocol",
      pageUrl: "/post/index.html"
    };
  }

  // 1. Explicit meta tags
  const metaPostTitle =
    document.querySelector('meta[name="post-title"]')?.getAttribute("content") ||
    document.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
    document.querySelector('meta[name="twitter:title"]')?.getAttribute("content");

  // 2. Main heading
  const h1El = document.querySelector(".post-hero-title, .post-title, article h1");
  const h1Text = h1El ? h1El.textContent?.trim() : null;

  // 3. Document title (stripped of site branding)
  const docTitle = document.title ? document.title.split("|")[0].trim() : null;

  const rawTitle = metaPostTitle || h1Text || docTitle || "Clinical Protocol";
  const cleanTitle = rawTitle.replace(/\s*\|\s*My Radiology Guide.*$/i, "").trim();

  // URL-safe alphanumeric page key for Firestore query index
  const pageKey =
    cleanTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "general-protocol";

  const pageUrl =
    typeof window !== "undefined"
      ? window.location.pathname + (window.location.search || "")
      : "/post/index.html";

  return {
    pageKey,
    pageTitle: cleanTitle,
    pageUrl
  };
}

/**
 * In-memory cache with 5-minute TTL to enforce least minimum Firestore usage
 * Opening & closing the drawer will NOT trigger repetitive billing reads!
 */
interface CacheEntry {
  timestamp: number;
  comments: ClinicalComment[];
}

const memoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function getCachedComments(pageKey: string): ClinicalComment[] | null {
  const entry = memoryCache.get(pageKey);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.comments;
  }
  return null;
}

/**
 * One-time fetch of comments for a specific page.
 * Uses getDocs() with hard limit(30) - NEVER uses expensive onSnapshot listeners!
 */
export async function fetchComments(pageKey?: string): Promise<ClinicalComment[]> {
  const meta = getPageMeta();
  const targetKey = pageKey || meta.pageKey;

  // 1. Check in-memory cache first (0 reads!)
  const cached = getCachedComments(targetKey);
  if (cached) {
    return cached;
  }

  // 2. Read local persisted comments as baseline fallback
  let localComments: ClinicalComment[] = [];
  try {
    const raw = localStorage.getItem(`mrg_comments_${targetKey}`);
    if (raw) {
      localComments = JSON.parse(raw);
    }
  } catch (_) {}

  // 3. Perform single one-time Firestore getDocs()
  try {
    const db = getDb();
    if (db) {
      const q = query(
        collection(db, "comments"),
        where("pageKey", "==", targetKey),
        orderBy("timestamp", "desc"),
        limit(30)
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const remoteList: ClinicalComment[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          remoteList.push({
            id: docSnap.id,
            pageKey: d.pageKey || targetKey,
            pageTitle: d.pageTitle || meta.pageTitle,
            pageUrl: d.pageUrl || meta.pageUrl,
            author: d.author || "Anonymous",
            avatarText: d.avatarText || (d.author ? d.author.substring(0, 2).toUpperCase() : "MD"),
            avatarBg: d.avatarBg || "#0284c7",
            avatarUrl: d.avatarUrl || null,
            timestamp: typeof d.timestamp === "number" ? d.timestamp : Date.now(),
            text: d.text || "",
            replies: Array.isArray(d.replies) ? d.replies : []
          });
        });

        // Store in cache & local storage
        memoryCache.set(targetKey, { timestamp: Date.now(), comments: remoteList });
        try {
          localStorage.setItem(`mrg_comments_${targetKey}`, JSON.stringify(remoteList));
        } catch (_) {}

        return remoteList;
      }
    }
  } catch (err) {
    console.warn("[MRGFirebaseComments] Firestore read skipped/error, using local fallback:", err);
  }

  // If remote is empty or errored, cache local list
  memoryCache.set(targetKey, { timestamp: Date.now(), comments: localComments });
  return localComments;
}

/**
 * Add a new comment.
 * Optimistically updates local cache and executes a single addDoc() write.
 * NO re-fetching the collection after a write (saves read quota).
 */
export async function addComment(commentData: {
  author: string;
  avatarUrl?: string | null;
  avatarText?: string;
  avatarBg?: string;
  text: string;
  pageKey?: string;
}): Promise<ClinicalComment> {
  const meta = getPageMeta();
  const targetKey = commentData.pageKey || meta.pageKey;
  const currentTs = Date.now();

  const newComment: ClinicalComment = {
    id: "cmt-" + currentTs + "-" + Math.random().toString(36).substring(2, 6),
    pageKey: targetKey,
    pageTitle: meta.pageTitle,
    pageUrl: meta.pageUrl,
    author: commentData.author,
    avatarUrl: commentData.avatarUrl || null,
    avatarText: commentData.avatarText || (commentData.author === "You" ? "You" : commentData.author.substring(0, 2).toUpperCase()),
    avatarBg: commentData.avatarBg || "#0284c7",
    timestamp: currentTs,
    text: commentData.text,
    replies: []
  };

  // 1. Optimistically update local cache
  const existing = memoryCache.get(targetKey)?.comments || [];
  const updatedList = [newComment, ...existing];
  memoryCache.set(targetKey, { timestamp: Date.now(), comments: updatedList });

  try {
    localStorage.setItem(`mrg_comments_${targetKey}`, JSON.stringify(updatedList));
  } catch (_) {}

  // 2. Sync to Account Page activity list
  try {
    const userCommentsRaw = localStorage.getItem("radiology_post_comments_v1");
    const userComments = userCommentsRaw ? JSON.parse(userCommentsRaw) : [];
    userComments.unshift({
      id: newComment.id,
      text: newComment.text,
      timestamp: newComment.timestamp,
      postTitle: meta.pageTitle,
      postUrl: meta.pageUrl,
      postKey: targetKey
    });
    localStorage.setItem("radiology_post_comments_v1", JSON.stringify(userComments.slice(0, 50)));
  } catch (_) {}

  // 3. Single background write to Firestore
  try {
    const db = getDb();
    if (db) {
      const docRef = await addDoc(collection(db, "comments"), {
        pageKey: newComment.pageKey,
        pageTitle: newComment.pageTitle,
        pageUrl: newComment.pageUrl,
        author: newComment.author,
        avatarUrl: newComment.avatarUrl,
        avatarText: newComment.avatarText,
        avatarBg: newComment.avatarBg,
        timestamp: newComment.timestamp,
        text: newComment.text,
        replies: []
      });
      newComment.id = docRef.id;
    }
  } catch (err) {
    console.warn("[MRGFirebaseComments] Firestore write notice:", err);
  }

  return newComment;
}

/**
 * Add a reply to a parent comment.
 * Nested replies inside the parent document save read quota:
 * Reading 1 comment with 5 replies = 1 document read instead of 6!
 */
export async function addReply(
  parentCommentId: string,
  replyData: {
    author: string;
    avatarUrl?: string | null;
    avatarText?: string;
    avatarBg?: string;
    text: string;
    mention?: string | null;
    pageKey?: string;
  }
): Promise<ClinicalReply | null> {
  const meta = getPageMeta();
  const targetKey = replyData.pageKey || meta.pageKey;
  const currentTs = Date.now();

  const newReply: ClinicalReply = {
    id: "rep-" + currentTs + "-" + Math.random().toString(36).substring(2, 6),
    author: replyData.author,
    avatarUrl: replyData.avatarUrl || null,
    avatarText: replyData.avatarText || (replyData.author === "You" ? "You" : replyData.author.substring(0, 2).toUpperCase()),
    avatarBg: replyData.avatarBg || "#0891b2",
    timestamp: currentTs,
    text: replyData.text,
    mention: replyData.mention || null
  };

  const cached = memoryCache.get(targetKey)?.comments;
  if (cached) {
    const parent = cached.find((c) => c.id === parentCommentId);
    if (parent) {
      if (!Array.isArray(parent.replies)) parent.replies = [];
      parent.replies.push(newReply);
      memoryCache.set(targetKey, { timestamp: Date.now(), comments: cached });
      try {
        localStorage.setItem(`mrg_comments_${targetKey}`, JSON.stringify(cached));
      } catch (_) {}

      // Single updateDoc write on the parent document
      try {
        const db = getDb();
        if (db) {
          const docRef = doc(db, "comments", parentCommentId);
          await updateDoc(docRef, { replies: parent.replies });
        }
      } catch (err) {
        console.warn("[MRGFirebaseComments] Firestore reply update notice:", err);
      }
    }
  }

  return newReply;
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string, pageKey?: string): Promise<boolean> {
  const meta = getPageMeta();
  const targetKey = pageKey || meta.pageKey;

  const cached = memoryCache.get(targetKey)?.comments;
  if (cached) {
    const filtered = cached.filter((c) => c.id !== commentId);
    memoryCache.set(targetKey, { timestamp: Date.now(), comments: filtered });
    try {
      localStorage.setItem(`mrg_comments_${targetKey}`, JSON.stringify(filtered));
    } catch (_) {}
  }

  try {
    const db = getDb();
    if (db) {
      await deleteDoc(doc(db, "comments", commentId));
    }
  } catch (err) {
    console.warn("[MRGFirebaseComments] Firestore delete notice:", err);
  }

  return true;
}

/**
 * Delete a reply
 */
export async function deleteReply(parentCommentId: string, replyId: string, pageKey?: string): Promise<boolean> {
  const meta = getPageMeta();
  const targetKey = pageKey || meta.pageKey;

  const cached = memoryCache.get(targetKey)?.comments;
  if (cached) {
    const parent = cached.find((c) => c.id === parentCommentId);
    if (parent && Array.isArray(parent.replies)) {
      parent.replies = parent.replies.filter((r) => r.id !== replyId);
      memoryCache.set(targetKey, { timestamp: Date.now(), comments: cached });
      try {
        localStorage.setItem(`mrg_comments_${targetKey}`, JSON.stringify(cached));
      } catch (_) {}

      try {
        const db = getDb();
        if (db) {
          await updateDoc(doc(db, "comments", parentCommentId), { replies: parent.replies });
        }
      } catch (err) {
        console.warn("[MRGFirebaseComments] Firestore reply delete notice:", err);
      }
    }
  }

  return true;
}

const api = {
  getFirebaseApp,
  getDb,
  getFirebaseAuth,
  getCurrentUser,
  signInWithGoogle,
  signOutUser,
  initAuthObserver,
  getPageMeta,
  fetchComments,
  addComment,
  addReply,
  deleteComment,
  deleteReply,
  getCachedComments
};

const root: any = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {};
root.MRGFirebaseComments = api;

export default api;
