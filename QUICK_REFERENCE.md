# GitHub Repo Browser - Quick Reference Guide

## 🚀 Get Started in 5 Minutes

### 1️⃣ Create GitHub OAuth App (2 mins)
```
GitHub Settings → Developer Settings → OAuth Apps → New OAuth App

Application name: GitHub Repo Browser
Homepage URL: http://localhost:3000
Authorization callback URL: http://localhost:3000/api/auth/github/callback

→ Copy Client ID and Client Secret
```

### 2️⃣ Add Env Variables (1 min)
Create `.env.local` in project root:
```env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/github/callback
```

### 3️⃣ Start Development (1 min)
```bash
npm run dev:ui
```

### 4️⃣ Test (1 min)
```
http://localhost:3000
→ Click "Login with GitHub"
→ Authorize
→ Browse repos!
```

---

## 📍 Feature Location in Code

### Home Page (Voice UI + GitHub Banner)
```
src/app/page.tsx
├── Voice Agent UI (original, untouched)
└── GitHub Feature Banner (new)
    └── LoginButton / "Open Dashboard" link
```

### Dashboard (GitHub Repo Browser)
```
src/app/dashboard/page.tsx
├── Navigation with user profile
├── Welcome message
└── RepoSearch component
    └── RepoContentViewer (file browser)
```

### API Routes
```
src/app/api/
├── auth/
│   ├── github/route.ts              [GET] OAuth redirect
│   ├── github/callback/route.ts     [GET] OAuth callback
│   ├── session/route.ts             [GET] Check auth
│   └── logout/route.ts              [POST] Logout
├── repos/route.ts                   [GET] List repos + search
└── repo-contents/route.ts           [GET] File tree
```

### Components
```
src/components/
├── LoginButton.tsx                  Links to /api/auth/github
├── LogoutButton.tsx                 Calls /api/auth/logout
├── RepoSearch.tsx                   Calls /api/repos
└── RepoContentViewer.tsx            Calls /api/repo-contents
```

### Utilities
```
src/lib/
└── github.ts                        GitHub API wrapper

src/types/
└── index.ts                         TypeScript interfaces
```

---

## 🔄 Authentication Flow

```
┌─────────────┐
│  Home Page  │ ← User visits http://localhost:3000
└──────┬──────┘
       │
       ├─ Not authenticated
       │  └─ Shows "Login with GitHub" button
       │
       └─ Authenticated
          └─ Shows "Open Dashboard" link

           ↓ User clicks "Login with GitHub"

┌──────────────────────────────┐
│ /api/auth/github             │ ← Redirects to GitHub OAuth
└──────────────────────────────┘

           ↓ User authorizes

┌──────────────────────────────┐
│ GitHub OAuth                 │ ← GitHub redirects back with code
└──────────┬───────────────────┘
           │
           ↓

┌──────────────────────────────┐
│ /api/auth/github/callback    │ ← Exchange code for token
└──────────────────────────────┘
   - Gets access token from GitHub
   - Fetches user info
   - Sets secure HTTP-only cookie
   - Redirects to /dashboard

           ↓

┌──────────────────────────────┐
│ /dashboard                   │ ← User browses repos
└──────────────────────────────┘
   - Verifies session
   - Displays user profile
   - Shows repo search
```

---

## 📡 API Examples

### Check Authentication
```bash
curl http://localhost:3000/api/auth/session
```
Response (authenticated):
```json
{
  "authenticated": true,
  "user": {
    "id": 12345,
    "login": "username",
    "name": "Full Name",
    "avatar_url": "https://..."
  }
}
```

### Search Repositories
```bash
curl "http://localhost:3000/api/repos?search=react"
```
Returns array of Repository objects matching "react"

### Get Repository Contents
```bash
curl "http://localhost:3000/api/repo-contents?owner=username&repo=myrepo&path=src"
```
Returns array of RepositoryContent items in `src` folder

---

## 🎨 Component Usage

### Using LoginButton
```tsx
import { LoginButton } from '@/components/LoginButton';

export function MyComponent() {
  return <LoginButton />;
}
```

### Using LogoutButton
```tsx
import LogoutButton from '@/components/LogoutButton';

export function MyComponent() {
  return <LogoutButton />;
}
```

### Using RepoSearch
```tsx
import RepoSearch from '@/components/RepoSearch';

export function MyComponent() {
  return <RepoSearch />;
}
```

---

## 🔒 Security Checklist

- ✅ Tokens stored in HTTP-only cookies
- ✅ CSRF protection enabled (SameSite)
- ✅ Session validation on protected routes
- ✅ No sensitive data in localStorage
- ✅ OAuth 2.0 standard implementation
- ✅ HTTPS ready (secure flag in production)

---

## 🧪 Testing Scenarios

### Test 1: Login Flow
1. Open http://localhost:3000
2. Click "Login with GitHub"
3. Authorize app
4. Verify redirected to /dashboard
5. ✅ Should see user profile

### Test 2: Repository Search
1. On dashboard, type in search box
2. Verify repos appear as you type
3. Click a repo
4. ✅ Should show repo contents

### Test 3: File Navigation
1. Open a repo
2. Click a folder
3. Navigate using breadcrumbs
4. ✅ Should update file list

### Test 4: Logout
1. On dashboard, click "Logout"
2. Verify redirected to home page
3. ✅ Should see "Login with GitHub" button again

### Test 5: Session Persistence
1. Logout, then manually navigate to /dashboard
2. ✅ Should redirect to home (session required)

---

## 🐛 Debugging Tips

### Check Session in Console
```javascript
fetch('/api/auth/session')
  .then(r => r.json())
  .then(console.log);
```

### Check Cookies in DevTools
```
DevTools → Application → Cookies
Look for: github_token (should be HTTP-only)
          github_user (visible)
```

### Check Network Requests
```
DevTools → Network
Filter by: XHR/Fetch
Look for: /api/repos, /api/repo-contents calls
```

### Enable Debug Logging
Look for `console.error()` statements in:
- `src/components/RepoSearch.tsx`
- `src/app/dashboard/page.tsx`
- `src/lib/github.ts`

---

## 📚 File Organization

```
src/
├── app/
│   ├── api/               ← Backend routes
│   ├── dashboard/         ← Protected dashboard page
│   └── page.tsx           ← Home page (modified)
├── components/            ← React components
├── lib/                   ← Utilities
└── types/                 ← TypeScript interfaces

docs/
├── GITHUB_AUTH_SETUP.md           ← Setup instructions
├── GITHUB_FEATURE_README.md       ← Complete docs
├── IMPLEMENTATION_SUMMARY.md      ← What was built
└── QUICK_REFERENCE.md             ← This file
```

---

## ✨ Key Features Summary

| Feature | Location | Status |
|---------|----------|--------|
| GitHub Login | Home page | ✅ |
| Repository Search | Dashboard | ✅ |
| File Browser | Dashboard | ✅ |
| User Profile | Dashboard | ✅ |
| Logout | Dashboard | ✅ |
| Session Management | API routes | ✅ |
| Protected Routes | Dashboard | ✅ |
| Error Handling | All components | ✅ |
| Loading States | All components | ✅ |
| Voice Agent (Original) | Home page | ✅ |

---

## 🚀 Production Deployment

Before deploying:

1. Create new GitHub OAuth app with production domain
2. Update environment variables:
   ```env
   GITHUB_CLIENT_ID=prod_client_id
   GITHUB_CLIENT_SECRET=prod_client_secret
   GITHUB_REDIRECT_URI=https://yourdomain.com/api/auth/github/callback
   ```
3. Ensure site is served over HTTPS
4. Test OAuth flow on production
5. Monitor session and cookie handling

---

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| "OAuth environment variables not configured" | Create `.env.local` with variables |
| Login button doesn't work | Check GITHUB_CLIENT_ID is set correctly |
| "Invalid OAuth code" | Verify Client Secret is correct |
| Repos don't load | Check GitHub token has `repo` scope |
| Session lost | Ensure cookies are enabled |
| Can't access /dashboard | Must be logged in (check session) |

---

## 🎯 Common Tasks

### Add a New API Route
1. Create file: `src/app/api/new-route/route.ts`
2. Check session: `const token = req.cookies.get('github_token')?.value`
3. Return JSON response

### Modify UI Styling
Edit component files:
- `src/components/*.tsx` - Use Tailwind CSS classes
- All components already have responsive design

### Change OAuth Scopes
Edit: `src/app/api/auth/github/route.ts`
Line: `githubUrl.searchParams.append('scope', 'repo user');`

### Add Protected Route
1. Create page component
2. Add session check in useEffect
3. Redirect to `/` if not authenticated

---

**Last Updated**: 2024  
**Status**: ✅ Ready for Production  
**Questions?** See GITHUB_AUTH_SETUP.md or GITHUB_FEATURE_README.md
