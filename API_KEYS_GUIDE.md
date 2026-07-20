# WellNest: API Keys & Production Services Guide

## 📋 Overview
This document describes what API keys and third-party services would be required to deploy WellNest as a full-featured production application.

---

## 🔑 Required API Keys for Production

---

### 1. User Authentication (Required)
We need secure user login and account management.

| Service | Purpose | Where to Get Keys |
|---------|---------|-------------------|
| **Clerk** | Complete user authentication (email/password, Google, Apple sign-in) | https://clerk.com |
| **OR Auth0** | Enterprise-grade auth | https://auth0.com |
| **OR Firebase Auth** | Google-backed authentication | https://firebase.google.com |

---

### 2. Wearable Integrations (Optional but Recommended)
Enable real sync from wearables!

#### Google Fit / Google Health Connect
- **Google Cloud Project**: Create at https://console.cloud.google.com
- **Health Connect API Key/Client ID**: Enable Health Connect API in Google Cloud Console
- **Docs**: https://developer.android.com/health-connect

#### Apple HealthKit
- **Apple Developer Account**: $99/year, required for HealthKit integration
- **App Bundle ID**: Register your app in Apple Developer Portal
- **HealthKit Entitlements**: Enable in Xcode
- **Docs**: https://developer.apple.com/documentation/healthkit

---

### 3. Database & Backend (Required for Persistent Storage)
Store vitals data permanently instead of just using localStorage!

| Service | Purpose | Keys/Info Needed |
|---------|---------|-----------------|
| **PostgreSQL (Hosted: Supabase, Neon, Vercel Postgres)** | Primary database | Database URL/connection string |
| **MongoDB (Hosted: MongoDB Atlas)** | NoSQL alternative | MongoDB Atlas connection string |
| **Firebase Firestore** | NoSQL database with realtime sync | Firebase config object |

---

### 4. Storage (Optional)
If you need to store files like user-uploaded photos, etc.

| Service | Purpose | Keys Needed |
|---------|---------|-------------|
| **AWS S3** | File storage | AWS Access Key ID + Secret Access Key |
| **Cloudinary** | Image/video hosting | Cloudinary API Key + Secret + Cloud Name |
| **Firebase Storage** | File storage for Firebase apps | Firebase config |

---

### 5. Optional Additional Services

#### Google Maps (Location Tracking, Optional)
- API Key from Google Cloud Console
- https://console.cloud.google.com/google/maps-apis

#### Analytics (Optional)
- **PostHog**: Open-source analytics (no keys if self-hosted)
- **Google Analytics 4 (GA4)**: Measurement ID
- **Mixpanel**: Project Token

---

## 📂 Environment Variables (.env) Example
When you're ready to go to production, create a .env file like this:

```env
# Authentication
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Database
DATABASE_URL=postgresql://...

# Wearables
GOOGLE_HEALTH_CONNECT_CLIENT_ID=...
GOOGLE_CLOUD_PROJECT_ID=...

# Storage (Optional)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Misc
NODE_ENV=production
```

---

## ⚠️ Important Notes
1. **Never Commit Keys**: Always add `.env` to your `.gitignore`!
2. **Use Environment Variables**: Never hardcode keys in your code!
3. **Use Secret Managers**: For production, use platform-specific secret managers (Vercel Environment Variables, AWS Secrets Manager, etc.)
4. **HIPAA/GDPR Compliance**: If handling medical data, make sure your services are compliant!

---

## 📚 Resources
- Google Health Connect: https://developer.android.com/health-connect
- Apple HealthKit: https://developer.apple.com/documentation/healthkit
- Clerk Docs: https://clerk.com/docs
- Supabase: https://supabase.com
