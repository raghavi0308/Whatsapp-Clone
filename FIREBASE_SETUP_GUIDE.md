# Firebase Setup Guide for WhatsApp Clone

This guide will help you set up Firebase Authentication for your WhatsApp clone application.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter a project name (e.g., "whatsapp-clone-mern")
4. Click **"Continue"**
5. (Optional) Enable Google Analytics if you want
6. Click **"Create project"**
7. Wait for the project to be created, then click **"Continue"**

## Step 2: Register Your Web App

1. In your Firebase project dashboard, click the **Web icon** (`</>`) or **"Add app"** → **Web**
2. Register your app:
   - **App nickname**: "WhatsApp Clone Web" (or any name)
   - **Firebase Hosting**: You can skip this for now (uncheck if checked)
3. Click **"Register app"**
4. You'll see your Firebase configuration object - **COPY THIS!** It looks like:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123..."
   };
   ```

## Step 3: Enable Google Authentication

1. In Firebase Console, go to **Authentication** (left sidebar)
2. Click **"Get started"** if you haven't set it up
3. Click on the **"Sign-in method"** tab
4. Click on **"Google"** provider
5. Toggle **"Enable"** to ON
6. Enter a **Project support email** (your email)
7. Click **"Save"**

## Step 4: Configure Authorized Domains

1. Still in **Authentication** → **Settings** tab
2. Scroll down to **"Authorized domains"**
3. Make sure these domains are listed:
   - `localhost` (for local development)
   - Your custom domain (if you have one)
   - `your-project.firebaseapp.com` (usually added automatically)

## Step 5: Update Your Firebase Config

1. Open `client/src/firebase.js` in your project
2. Replace the `firebaseConfig` object with your new credentials from Step 2
3. Save the file

## Step 6: Test Your Setup

1. Start your React app: `npm start` (in the client folder)
2. Try to sign in with Google
3. You should be redirected to Google sign-in page
4. After signing in, you should be redirected back to your app

## Troubleshooting

### Error: "auth/unauthorized-domain"
- Go to Firebase Console → Authentication → Settings
- Add your domain to "Authorized domains"
- For local development, make sure `localhost` is listed

### Error: "auth/operation-not-allowed"
- Go to Firebase Console → Authentication → Sign-in method
- Make sure Google provider is enabled

### Error: "Firebase init.json 404"
- This is normal for local development
- The app will still work, this error is suppressed in the code

## Your Current Configuration

Your current Firebase config is in `client/src/firebase.js`. If you need to update it with new credentials, just replace the values in the `firebaseConfig` object.

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Google Sign-In Setup](https://firebase.google.com/docs/auth/web/google-signin)

