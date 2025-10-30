# GitHub OAuth Setup Guide

This guide will help you set up GitHub OAuth authentication for the GitHub Repo Browser application.

## Prerequisites

- A GitHub account
- Your application running locally or deployed

## Step 1: Create a GitHub OAuth Application

1. Go to https://github.com/settings/developers
2. Click on **New OAuth App** (or **New GitHub App** if you prefer)
3. Fill in the following fields:

   - **Application Name**: `GitHub Repo Browser` (or your preferred name)
   - **Homepage URL**: `http://localhost:3000` (for local development)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/github/callback`

4. Click **Create OAuth application**

## Step 2: Get Your Credentials

After creating the OAuth app, you'll be redirected to the app settings page:

1. Copy the **Client ID**
2. Click **Generate a new client secret** and copy the generated **Client Secret**
   - **Important**: You can only see the client secret once. Copy it immediately!

## Step 3: Configure Environment Variables

Create a `.env.local` file in the root of your project with the following contents:

```env
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_copied_client_id_here
GITHUB_CLIENT_SECRET=your_copied_client_secret_here
GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/github/callback
```

Replace the placeholder values with your actual credentials from Step 2.

## Step 4: Start Your Application

Run the development server:

```bash
npm run dev:ui
```

Or if you need both the UI and agent server:

```bash
npm run dev
```

## Step 5: Test the Authentication

1. Open http://localhost:3000 in your browser
2. Click the **Login with GitHub** button
3. You'll be redirected to GitHub to authorize the app
4. After authorization, you'll be redirected back and logged in
5. You should now see your repositories in the dashboard

## Troubleshooting

### "Invalid OAuth code" or "Authorization failed"

- Verify that your `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are correct
- Ensure the `GITHUB_REDIRECT_URI` matches exactly what you set in the GitHub OAuth app settings
- Restart your development server after updating environment variables

### Still seeing the login page after clicking the button

- Clear your browser cache
- Check that cookies are enabled
- Verify the OAuth app is still configured correctly in GitHub settings

### "Environment variables not configured"

- Create `.env.local` in your project root
- Ensure the variables are named exactly as shown above
- Restart your development server

## Production Deployment

For production deployments:

1. Create a new OAuth app with:
   - **Homepage URL**: Your production domain
   - **Authorization callback URL**: `https://yourdomain.com/api/auth/github/callback`

2. Update your production environment variables with the new credentials

3. Set `GITHUB_REDIRECT_URI` to your production callback URL

4. Ensure your application is served over HTTPS (required by GitHub OAuth)

## Security Notes

- ⚠️ **Never commit `.env.local` to version control**
- ⚠️ **Never share your `GITHUB_CLIENT_SECRET` publicly**
- The app uses secure HTTP-only cookies to store the access token
- User data is not stored on your servers; it's fetched on-demand from GitHub

## Scopes

The application requests the following GitHub scopes:

- `repo` - Full control of private and public repositories
- `user` - Read-only access to user profile information

This allows the app to:
- List your repositories
- Browse repository contents
- View repository metadata
