"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
exports.initFirebaseAdmin = initFirebaseAdmin;
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin SDK
// In production, this would read from a service account JSON file path or env variables
// For local MVP, we are setting up a skeleton that uses placeholder config unless properly set
function initFirebaseAdmin() {
    if (admin.apps.length === 0) {
        try {
            // For local development with Firebase Emulators, we can just initialize without credentials
            // The admin SDK will automatically use the FIREBASE_AUTH_EMULATOR_HOST environment variable
            admin.initializeApp({
                projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project',
            });
            console.log('Firebase Admin SDK initialized (using project: ' + (process.env.FIREBASE_PROJECT_ID || 'demo-project') + ')');
        }
        catch (error) {
            console.error('Failed to initialize Firebase Admin SDK:', error);
        }
    }
}
exports.auth = admin.auth;
