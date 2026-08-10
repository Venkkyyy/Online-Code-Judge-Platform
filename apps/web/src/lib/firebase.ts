import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// In a real app, these would come from import.meta.env
// For MVP, we provide placeholder logic so the app doesn't crash before the user plugs in their own keys
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-auth-domain',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-bucket',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'demo-sender',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'demo-app-id'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)
