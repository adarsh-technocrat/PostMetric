import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

let app: App;

if (getApps().length === 0) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required. Please set it in your .env.local or .env.production file."
    );
  }

  let serviceAccount: any;

  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } catch (error) {
    throw new Error(
      "Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Please ensure it is valid JSON."
    );
  }

  app = initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
} else {
  app = getApps()[0];
}

export const adminAuth: Auth = getAuth(app);

export default app;
