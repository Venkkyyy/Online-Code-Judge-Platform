import * as admin from 'firebase-admin'

// Initialize Firebase Admin SDK
// In production, this would read from a service account JSON file path or env variables
// For local MVP, we are setting up a skeleton that uses placeholder config unless properly set

export function initFirebaseAdmin() {
  if (admin.apps.length === 0) {
    try {
      // For local development with Firebase Emulators, we can just initialize without credentials
      // The admin SDK will automatically use the FIREBASE_AUTH_EMULATOR_HOST environment variable
      
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project',
      });
      console.log('Firebase Admin SDK initialized (using project: ' + (process.env.FIREBASE_PROJECT_ID || 'demo-project') + ')');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
    }
  }
}

export const auth = admin.auth;
