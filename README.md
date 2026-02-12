# CloudChat

A modern, aesthetically pleasing chat application built with React, TypeScript, and Tailwind CSS. Designed to be deployed on **Google Cloud**.

## Features

- **Role-Based Access:** 
  - **Admin:** Managed via `constants.ts` (Username: `admin`, Password: `adminpassword123`). Can create, edit, and delete users via the Admin Panel.
  - **User:** Created by Admin. Can chat and add friends.
- **Secure Storage:** Messages are encrypted (AES simulated) before being stored.
- **Friend System:** Send requests by username, accept/deny logic.
- **Chat Interface:** Real-time feel (polling), Emoji picker support, clean UI.
- **Auth Persistence:** Cookie-based session management (7 days).

## Architecture & Simulation

This application is a **Single Page Application (SPA)**. 
To function immediately without a complex backend setup for this demo, it uses **LocalStorage** as a mock database.
- `services/storage.ts` acts as the database layer.
- `services/auth.ts` manages sessions.

## Deployment on Google Cloud (GCP)

To deploy this as a real production app on Google Cloud, follow these steps:

### 1. Build the App
```bash
npm run build
```
This produces a `build/` (or `dist/`) directory with static files.

### 2. Option A: Google Cloud Storage (Static Website)
Easiest for SPAs.
1. Create a Bucket: `gsutil mb gs://your-chat-app-bucket`
2. Make it public: `gsutil iam ch allUsers:objectViewer gs://your-chat-app-bucket`
3. Configure website: `gsutil web set -m index.html -e index.html gs://your-chat-app-bucket`
4. Upload files: `gsutil -m cp -r build/* gs://your-chat-app-bucket`

### 3. Option B: Cloud Run (Containerized)
Best for serving via Nginx or Node.
1. Create a `Dockerfile`:
   ```dockerfile
   FROM node:18-alpine as build
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=build /app/build /usr/share/nginx/html
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```
2. Build & Deploy:
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/cloudchat
   gcloud run deploy cloudchat --image gcr.io/PROJECT_ID/cloudchat --platform managed
   ```

## Development

1. **Install dependencies:** `npm install react react-dom react-scripts typescript @types/react @types/node @types/react-dom`
2. **Run locally:** `npm start`
3. **Login:**
   - **Admin:** `admin` / `adminpassword123`
   - **User:** Create a user in the Admin Panel first, then logout and sign in as that user.

## Security Notes
- The "Encryption" in `storage.ts` is a simulation for the client-side demo. In a real GCP deployment, use HTTPS (TLS) for transmission encryption and Cloud SQL / Firestore encryption at rest.
- Store secrets (Admin passwords) in Google Secret Manager, not in code.
