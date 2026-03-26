# Password Reset - Student Redressal System

A web-based password reset page for the Student Redressal mobile app. This page is designed to be hosted on Vercel and handles password reset requests via Supabase authentication.

## Features

- **Email-based reset**: Users enter their email to receive a password reset link
- **Secure password reset**: Uses Supabase's built-in authentication recovery flow
- **Password validation**: Enforces strong password requirements
- **Responsive design**: Works on mobile and desktop
- **Professional UI**: Clean, modern interface matching the app's design

## Setup

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will run on `http://localhost:5174`

### Build for Production

```bash
npm run build
```

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Navigate to the password-reset directory:
   ```bash
   cd password-reset
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Follow the prompts:
   - Login to your Vercel account
   - Accept default settings
   - Deploy!

### Option 2: Deploy via GitHub

1. Push the code to GitHub

2. Go to [Vercel](https://vercel.com)

3. Click "New Project"

4. Import your GitHub repository

5. Configure:
   - **Root Directory**: `password-reset`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

6. Deploy!

## Update the Mobile App URL

After deploying, update the URL in the mobile app:

**File**: `src/screens/auth/LoginScreen.tsx`

```typescript
const siteUrl = 'https://your-deployment-url.vercel.app'
```

## How It Works

1. **User requests reset** (Mobile App):
   - User taps "Forgot Password?"
   - Enters their email
   - App calls Supabase `resetPasswordForEmail()`
   - Supabase sends email with reset link

2. **User clicks email link**:
   - Link redirects to: `https://your-url.vercel.app/reset-password#access_token=...`
   - User is authenticated for password recovery
   - Can set new password

3. **User sets new password**:
   - Enters new password (must meet requirements)
   - Confirms password
   - Calls Supabase `updateUser()` to update password
   - Success!

## Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (@, $, !, %, *, ?, &, #, etc.)

## Supabase Configuration

### Email Templates

Configure the password reset email template in Supabase:

1. Go to Supabase Dashboard
2. Authentication → Email Templates
3. Select "Password Reset"
4. Update the template:

```html
<h2>Reset Your Password</h2>
<p>Hi,</p>
<p>Someone requested a password reset for your Student Redressal System account.</p>
<p><a href="{{ .ConfirmationURL }}">Click here to reset your password</a></p>
<p>Or copy this link: {{ .ConfirmationURL }}</p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>Thanks,<br>Student Redressal Team</p>
```

### Site URL Settings

In Supabase Dashboard:
1. Authentication → URL Configuration
2. Add your Vercel URL to "Site URL"
3. Add your Vercel URL to "Redirect URLs"

## Troubleshooting

### Reset link not working
- Check that the Vercel URL is correctly configured in Supabase
- Verify the redirect URL matches exactly (including https://)

### Email not sending
- Check Supabase email logs
- Ensure email confirmation is enabled in Supabase

### Password update fails
- Check browser console for errors
- Verify the URL hash contains the access token
- Ensure the link hasn't expired (default: 1 hour)

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Supabase** - Authentication
- **CSS3** - Styling with animations

## License

Private - Student Redressal System
