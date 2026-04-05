# Sosal App — Setup Guide

## Kisi bhi machine pe run karne ke liye:

### Backend
```bash
cd Backend
npm install
npx prisma generate
npm run dev
```

### Frontend
```bash
cd Frontend
npm install
npm run dev
```

---

## Environment Variables

### Backend/.env
```
PORT=3000
APP_URL=http://localhost:3000          # Deploy pe apna domain daalo
DATABASE_URL=postgresql://...          # Supabase URL
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Frontend/.env
```
VITE_API_URL=http://localhost:3000/api  # Deploy pe backend URL daalo
VITE_GOOGLE_CLIENT_ID=...
```

---

## Deploy karne ke liye sirf ye 2 lines change karo:

**Backend/.env:**
```
APP_URL=https://your-backend.railway.app
```

**Frontend/.env:**
```
VITE_API_URL=https://your-backend.railway.app/api
```

Baaki sab automatically update ho jaayega.
