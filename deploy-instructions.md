# Deployment Guide

## Step 1: GitHub Setup
1. Create new repository: `kachin-visions-empire`
2. Clone locally: `git clone https://github.com/yourusername/kachin-visions-empire.git`
3. Copy all files into the repository folder

## Step 2: Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project: "Kachin Visions Empire"
3. Enable Firestore Database
4. Enable Realtime Database
5. Enable Storage
6. Go to Project Settings → General → Your apps
7. Add Web app
8. Copy firebaseConfig and update in index.html

## Step 3: Generate Icons
1. Create a 512x512 PNG logo
2. Save as `source-icon.png` in project root
3. Run: `npm run generate-icons`

## Step 4: Configure Collections
In Firestore, create these collections:
- `videos` (for video metadata)
- `passwords` (for access control)
- `contactLinks` (for social links)
- `monthlyPasswords` (for monthly subscriptions)
- `timePasswords` (for time-based access)
- `installations` (for device tracking)
- `videoDownloads` (for download analytics)

## Step 5: Deploy to GitHub Pages
1. Commit all files: `git add . && git commit -m "Initial commit"`
2. Push to GitHub: `git push origin main`
3. Deploy: `npm run deploy`
4. Go to GitHub → Settings → Pages
5. Set source to "gh-pages branch"

## Step 6: Test PWA Installation
1. Visit your GitHub Pages URL
2. Look for "Install App" button
3. Test offline functionality
4. Verify video playback

## Step 7: Update Content
Use Firebase Console or create an admin panel to:
- Add new videos
- Create passwords
- Update contact links
- Manage user access

## Troubleshooting

### PWA not installing
- Check manifest.json validity
- Ensure service worker is registered
- Test with HTTPS (GitHub Pages provides this)

### Videos not loading
- Check Firebase rules
- Verify video URLs are correct
- Test CORS settings for external videos

### Offline download failing
- Check browser File System Access API support
- Verify storage permissions
- Test encryption/decryption functions