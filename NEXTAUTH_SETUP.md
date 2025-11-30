# NextAuth.js Setup Guide

## ✅ Implementation Complete

NextAuth.js has been successfully implemented with:

- **Google OAuth** authentication
- **Magic Link (Email)** authentication using Resend
- Session management with JWT
- Protected API routes
- Protected dashboard routes

---

## Environment Variables Required

Add these to your `.env.local` file:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Resend (for Magic Links)
RESEND_API_KEY=re_your-resend-api-key
EMAIL_FROM=onboarding@yourdomain.com
```

---

## Setup Instructions

### 1. Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Copy the output and add it to `.env.local` as `NEXTAUTH_SECRET`.

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set application type to "Web application"
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Client Secret to `.env.local`

### 3. Resend Setup

1. Sign up at [Resend](https://resend.com)
2. Get your API key from the dashboard
3. Verify your domain (or use their test domain for development)
4. Add API key to `.env.local` as `RESEND_API_KEY`
5. Set `EMAIL_FROM` to your verified email address

---

## Features Implemented

### Authentication Providers

1. **Google OAuth**

   - One-click sign in with Google
   - Automatically creates user account
   - Syncs profile picture and name

2. **Magic Link (Email)**
   - Passwordless authentication
   - Email sent via Resend
   - Beautiful HTML email template
   - Link expires in 24 hours

### User Management

- Automatic user creation on first sign-in
- 14-day free trial assigned to new users
- User data stored in MongoDB
- Session management with JWT

### Protected Routes

- Dashboard routes protected by middleware
- API routes check authentication
- Unauthorized requests return 401/403

### UI Components

- Updated login page with both auth methods
- User menu in dashboard header
- Sign out functionality
- Session state management

---

## Files Created/Modified

### New Files

- `lib/auth.ts` - NextAuth configuration
- `lib/get-session.ts` - Session helper functions
- `app/api/auth/[...nextauth]/route.ts` - NextAuth API route
- `app/providers.tsx` - SessionProvider wrapper
- `components/dashboard/UserMenu.tsx` - User menu component
- `middleware.ts` - Route protection middleware
- `types/next-auth.d.ts` - TypeScript definitions

### Modified Files

- `app/layout.tsx` - Added SessionProvider
- `app/login/page.tsx` - Integrated NextAuth signIn
- `app/dashboard/layout.tsx` - Added UserMenu component
- All API routes - Updated to use `getUserId()` from session

---

## Usage

### Sign In

Users can sign in via:

1. **Google**: Click "Sign in with Google" button
2. **Magic Link**: Enter email, click "Sign in with magic link", check email

### Sign Out

Click user menu in dashboard header → "Sign out"

### Accessing User ID in API Routes

```typescript
import { getUserId } from "@/lib/get-session";

export async function GET(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Use userId...
}
```

### Accessing Session in Client Components

```typescript
"use client";
import { useSession } from "next-auth/react";

export function MyComponent() {
  const { data: session } = useSession();

  if (session?.user) {
    return <div>Hello {session.user.name}</div>;
  }

  return <div>Not signed in</div>;
}
```

---

## Testing

1. Start the development server:

   ```bash
   pnpm dev
   ```

2. Navigate to `/login`
3. Test Google sign-in
4. Test magic link:
   - Enter your email
   - Check your inbox
   - Click the magic link
   - Should redirect to dashboard

---

## Troubleshooting

### "Configuration" Error

- Check that all environment variables are set
- Verify `NEXTAUTH_SECRET` is set
- Check Google OAuth credentials

### Magic Link Not Sending

- Verify `RESEND_API_KEY` is correct
- Check Resend dashboard for email logs
- Verify `EMAIL_FROM` domain is verified in Resend

### Session Not Persisting

- Check `NEXTAUTH_SECRET` is set
- Verify cookies are enabled in browser
- Check browser console for errors

---

## Next Steps

- [ ] Add email verification
- [ ] Add password reset flow
- [ ] Add account deletion
- [ ] Add profile editing
- [ ] Add social account linking
- [ ] Add 2FA support

---

## Security Notes

- Never commit `.env.local` to git
- Use strong `NEXTAUTH_SECRET` in production
- Verify email domains in Resend
- Use HTTPS in production
- Set secure cookie flags in production
