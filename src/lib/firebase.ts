// ============================================================
// SocialMind — Firebase Client Config
// ============================================================
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with Google popup via Firebase.
 * Returns the Firebase ID token to send to our backend.
 */
export async function signInWithGoogle(): Promise<{
  idToken: string;
  email: string;
  name: string;
  picture: string;
}> {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  return {
    idToken,
    email: result.user.email || "",
    name: result.user.displayName || "",
    picture: result.user.photoURL || "",
  };
}
