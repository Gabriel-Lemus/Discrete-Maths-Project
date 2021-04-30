// Firebase setup
firebase.initializeApp({
  projectId: 'discrete-maths-crypto-system',
  appId: '1:1001088959477:web:6c5ed4b0dfadc25f6a56bc',
  apiKey: 'AIzaSyAAdlSgpSVWphoe3RDKYXoLOpVrE1duy_M',
  authDomain: 'discrete-maths-crypto-system.firebaseapp.com',
});

// Auth and Firestore references.
const auth = firebase.auth();
const db = firebase.firestore();
const functions = firebase.functions();

// Update Firestore settings.
db.settings({ timestampsInSnapshots: true });

// End of Firebase setup.

// Products cart object
let cart = [];
