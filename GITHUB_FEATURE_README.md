# GitHub Repo Browser Feature - Implementation Guide

## Overview

A complete GitHub OAuth authentication and repository browsing feature has been added to your Next.js application. This feature **does NOT replace** the existing voice agent UI - it works **alongside it** as an additional feature.

## What's New

### ✨ Features Added

1. **GitHub OAuth Login** - Secure login using GitHub credentials
2. **Repository Search** - Real-time search across all user repositories
3. **Repository Browser** - Navigate repository contents and file structure
4. **Dashboard** - Protected dashboard page with user profile
5. **Logout** - Secure session termination

### 📁 File Structure Created

```
src/
├── types/
│   └── index.ts                          # TypeScript interfaces
├── lib/
│   └── github.ts                         # GitHub API utilities
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── github/
│   │   │   │   ├── route.ts             # OAuth redirect
│   │   │   │   └── callback/
│   │   │   │       └── route.ts         # OAuth callback handler
│   │   │   ├── session/
│   │   │   │   └── route.ts             # Session check
│   │   │   └── logout/
│   │   │       └── route.ts             # Logout
│   │   ├── repos/
│   │   │   └── route.ts                 # List user repos
│   │   └── repo-contents/
│   │       └── route.ts                 # Get repo contents
│   ├── dashboard/
│   │   └── page.tsx                     # Protected dashboard
│   └── page.tsx                         # Updated home (with GitHub feature alert)
└── components/
    ├── LoginButton.tsx                  # GitHub login button
    ├── LogoutButton.tsx                 # Logout button
    ├── RepoSearch.tsx                   # Repository search
    └── RepoContentViewer.tsx            # File browser
```

## User Flow

### Home Page (`/`)

- Shows **both** the existing voice agent UI AND a new "GitHub Repo Browser" feature banner
- If not authenticated: Shows "Login with GitHub" button
- If authenticated: Shows "Open Dashboard →" link
- All voice agent functionality remains intact

### Dashboard (`/dashboard`)

- Protected route (redirects to `/` if not authenticated)
- Displays user profile (avatar, username)
- Repository search with real-time filtering
- Click on repo to browse its contents
- File tree navigation with breadcrumbs
- Logout button in navigation

## Setup Instructions

### Step 1: Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click **New OAuth App**
3. Fill in:
   - **Application Name**: `GitHub Repo Browser`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/github/callback`
4. Click **Create OAuth application**

### Step 2: Get Your Credentials

- Copy **Client ID**
- Generate and copy **Client Secret** (appears only once!)

### Step 3: Configure Environment Variables

Create `.env.local` in your project root:

```env
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/github/callback
```

### Step 4: Run Your Application

```bash
# Start UI development server
npm run dev:ui

# Or start both UI + agent server
npm run dev
```

### Step 5: Test

1. Open http://localhost:3000
2. Scroll down to see the new "GitHub Repo Browser" feature banner
3. Click "Login with GitHub"
4. Authorize the app on GitHub
5. You'll be redirected to `/dashboard`

## API Routes

### `GET /api/auth/github`
Initiates GitHub OAuth flow

### `GET /api/auth/github/callback`
Handles OAuth callback, exchanges code for token

### `GET /api/auth/session`
Returns current user session or 401 if not authenticated

Response:
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

### `POST /api/auth/logout`
Clears authentication cookies

### `GET /api/repos?search=query`
Fetches user repositories, optionally filtered by search term

### `GET /api/repo-contents?owner=username&repo=reponame&path=path/to/folder`
Fetches repository contents at specified path

## Components

### `LoginButton`
Displays a styled GitHub login button with icon. Links to `/api/auth/github`

### `LogoutButton`
Logout button that clears session and redirects to home

### `RepoSearch`
- Search input with debouncing
- Displays matching repositories
- Click to select repo and view contents
- Loading and error states

### `RepoContentViewer`
- Displays file/folder listing
- Breadcrumb navigation
- Click folders to navigate
- Shows file sizes and language info

## Security Features

✅ **Secure HTTP-only Cookies** - Access token stored safely  
✅ **OAuth 2.0** - Industry-standard authentication  
✅ **No Data Storage** - Data fetched on-demand from GitHub  
✅ **Session Validation** - Protected routes check session  
✅ **SameSite Cookies** - CSRF protection  

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GITHUB_CLIENT_ID` | OAuth app client ID from GitHub settings |
| `GITHUB_CLIENT_SECRET` | OAuth app client secret (keep secret!) |
| `GITHUB_REDIRECT_URI` | Must match GitHub OAuth app callback URL |

## Troubleshooting

### "GitHub OAuth environment variables not configured"
- Ensure `.env.local` exists in project root
- Verify variable names are exactly as shown above
- Restart development server

### "Invalid OAuth code"
- Check Client ID and Secret are correct
- Verify redirect URI matches GitHub app settings exactly
- Clear browser cache and try again

### Still on login page after clicking GitHub button
- Ensure cookies are enabled
- Check browser console for errors
- Verify GitHub app is active

### Repository search returns empty
- Ensure you're logged in correctly
- Check GitHub OAuth app permissions include `repo` scope
- Verify GitHub token is valid

## Production Deployment

For production:

1. Create new GitHub OAuth app with production domain
2. Update `GITHUB_REDIRECT_URI` environment variable
3. Ensure application is served over HTTPS
4. Store secrets securely (use environment secrets, not `.env.local`)

## GitHub Scopes

The app requests:
- `repo` - Full control of private and public repositories
- `user` - Read access to user profile

This allows:
- Listing repositories
- Reading repository contents
- Accessing repository metadata

## Existing Features Preserved

✅ Voice Agent UI completely intact  
✅ Audio recording functionality  
✅ Real-time conversation  
✅ Transcription service  
✅ Summary generation  
✅ All existing components and state management  

## File Modifications

Modified files:
- `src/app/page.tsx` - Updated home page with GitHub feature banner

Created files:
- All files listed in "File Structure Created" section above

## Testing Checklist

- [ ] Login with GitHub works
- [ ] Redirected to dashboard after login
- [ ] Dashboard shows user profile
- [ ] Repository search works
- [ ] Can browse repo contents
- [ ] Breadcrumb navigation works
- [ ] Logout clears session
- [ ] Voice agent UI still works
- [ ] All buttons are functional
- [ ] Responsive design looks good

## Next Steps

1. Follow Setup Instructions above
2. Test all features
3. Customize styling as needed
4. Deploy to production

## Support

For detailed setup instructions, see: `GITHUB_AUTH_SETUP.md`

---

**Feature Status**: ✅ Complete and Ready for Use
