import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

// Path to the service account file
const serviceAccountPath = path.join(__dirname, '../../bigdeal-258f6-firebase-adminsdk-fbsvc-df90dfef44.json');

// Initialize Firebase Admin SDK
try {
  if (fs.existsSync(serviceAccountPath)) {
    // Use service account file if it exists
    const serviceAccount = require(serviceAccountPath);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log('Firebase Admin SDK initialized successfully with service account file.');
  } else if (process.env.FIREBASE_PROJECT_ID && 
             process.env.FIREBASE_PRIVATE_KEY && 
             process.env.FIREBASE_CLIENT_EMAIL) {
    // Use environment variables as fallback
    // Fix for PEM key formatting - properly handle escaped newlines
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      // Remove the quotes and parse escape sequences
      privateKey = JSON.parse(privateKey);
    }
    // Replace literal '\n' with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    
    console.log('Firebase Admin SDK initialized successfully with environment variables.');
  } else {
    console.error('Firebase credentials not provided. Firebase authentication will not be available.');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
}

export default admin; 