# Google Contacts API Setup Guide

To see your actual Google Contacts in the Contacts page, you need to enable the People API in Google Cloud Console.

## Step 1: Enable People API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project: `whatsapp-clone-1ff34`
3. Go to **APIs & Services** → **Library**
4. Search for **"People API"**
5. Click on **"People API"**
6. Click **"Enable"**

## Step 2: Configure OAuth Consent Screen

1. In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**
2. Make sure your app is configured:
   - User Type: External (or Internal if using Google Workspace)
   - App name: WhatsApp Clone
   - User support email: Your email
   - Developer contact: Your email
3. Click **"Save and Continue"**
4. In **Scopes**, make sure these are added:
   - `https://www.googleapis.com/auth/contacts.readonly`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/userinfo.email`
5. Click **"Save and Continue"**
6. Add test users if needed (for development)
7. Click **"Save and Continue"**

## Step 3: Sign In Again

After enabling People API:

1. **Sign out** of the app
2. **Sign in again** with Google
3. You should see a consent screen asking for permission to access your contacts
4. Click **"Allow"**
5. Your Google Contacts should now appear in the Contacts page

## Troubleshooting

### No contacts showing?
- Make sure People API is enabled in Google Cloud Console
- Check browser console for errors
- Make sure you signed in again after enabling People API
- Verify OAuth scopes are configured correctly

### "403 Forbidden" error?
- People API is not enabled
- OAuth scopes are not configured
- App is not verified (for production use)

### Access token not found?
- Sign out and sign in again
- Check browser console for warnings
- Make sure OAuth scopes are added in Login.js

## Current Status

The app is configured to:
- Request Google Contacts scope during sign-in
- Fetch contacts from Google People API
- Fall back to chat rooms if Google Contacts are not available

Once People API is enabled and you sign in again, your actual Google Contacts will appear!

