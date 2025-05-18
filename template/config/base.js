import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
const configs = require("./index.json");

// Make sure all required Firebase config options are set
const config = {
  apiKey: configs.firebase.apiKey,
  authDomain: configs.firebase.authDomain,
  projectId: configs.firebase.projectId,
  storageBucket: configs.firebase.storageBucket,
  messagingSenderId: configs.firebase.messagingSenderId,
  appId: configs.firebase.appId,
  measurementId: configs.firebase.measurementId
};

// Initialize Firebase if it hasn't been initialized already
if (!firebase.apps.length) {
  firebase.initializeApp(config);
}

// Set Google auth custom parameters if needed
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { googleProvider };
export const facebookProvider = new firebase.auth.FacebookAuthProvider();

export default firebase.auth();
