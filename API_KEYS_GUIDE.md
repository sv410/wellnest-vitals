# WellNest: API Keys & Production Services Guide

## 📋 Overview
This document describes what API keys and third-party services would be required to deploy WellNest as a full-featured production application.

---

## 🤖 Shen.AI Face Scanner Integration

WellNest's Camera tab uses **Shen.AI** (`@shenai/sdk`) for contactless vitals measurement via facial rPPG scanning.

### How It Works
1. The browser fetches a short-lived token from the WellNest backend (`POST /api/shenai/token`)
2. The backend uses your permanent `SHENAI_ADMIN_KEY` to call `https://api.shen.ai/v1/token`
3. The browser initializes `@shenai/sdk` with the short-lived token — your admin key is never exposed
4. The SDK renders the face scanner into the `#mxcanvas` element

### Setup Steps
1. Get your Admin SDK Key from https://developer.shen.ai
2. Add to your `.env` file:
   ```env
   SHENAI_ADMIN_KEY=ska_your_key_here...
   SHENAI_LICENSE_ID=12345
   ```
3. Restart the backend server

> **Fallback**: If `SHENAI_ADMIN_KEY` is not set, the Camera tab automatically switches to the built-in **Interactive Simulator** — a premium face-scan experience that still lets you save mock vitals. No API key required to demo the UI.

### Cross-Origin Headers (Required for SDK)
The Shen.AI SDK uses WebAssembly multi-threading, which requires:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

These are already set in `vite.config.ts` (dev) and `server/index.ts` (production).

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

# Shen.AI Face Scanner (get from developer.shen.ai)
SHENAI_ADMIN_KEY=ska_abcdef1234...
SHENAI_LICENSE_ID=12345

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
- Shen.AI Developer Portal: https://developer.shen.ai
- Google Health Connect: https://developer.android.com/health-connect
- Apple HealthKit: https://developer.apple.com/documentation/healthkit
- Clerk Docs: https://clerk.com/docs
- Supabase: https://supabase.com
