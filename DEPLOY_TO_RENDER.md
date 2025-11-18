# Deploying to Render

This guide will walk you through deploying the Invoice Backend API to Render.

## Prerequisites

- A [Render](https://render.com) account (free tier available)
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- Email SMTP credentials for sending invoices

## Deployment Methods

### Method 1: Using render.yaml (Recommended)

The easiest way to deploy is using the included `render.yaml` configuration file.

1. **Sign in to Render**
   - Go to [https://render.com](https://render.com)
   - Sign up or sign in with your GitHub/GitLab account

2. **Create New Blueprint**
   - Click "New +" in the top right
   - Select "Blueprint"
   - Connect your repository
   - Render will automatically detect the `render.yaml` file

3. **Configure Environment Variables**

   After the blueprint is created, you need to set these environment variables:

   **Required:**
   - `EMAIL_HOST` - Your SMTP server (e.g., `smtp.gmail.com`)
   - `EMAIL_USER` - Your email address
   - `EMAIL_PASSWORD` - Your email password or app-specific password

   **Optional (with defaults in render.yaml):**
   - `COMPANY_NAME` - Your company name
   - `COMPANY_EMAIL` - Your company email
   - `COMPANY_ADDRESS` - Your company address
   - `COMPANY_PHONE` - Your company phone
   - `COMPANY_WEBSITE` - Your company website

4. **Deploy**
   - Click "Apply" to deploy
   - Wait for the build to complete (3-5 minutes)
   - Your API will be live at: `https://invoice-backend.onrender.com`

### Method 2: Manual Deployment

1. **Create New Web Service**
   - Go to your Render dashboard
   - Click "New +" → "Web Service"
   - Connect your repository
   - Select the repository containing your invoice app

2. **Configure the Service**

   **Basic Settings:**
   - Name: `invoice-backend`
   - Region: Choose closest to you
   - Branch: `main` (or your branch name)
   - Root Directory: Leave blank
   - Runtime: `Node`
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`

3. **Environment Variables**

   Click "Advanced" and add these environment variables:

   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_PATH=/opt/render/project/src/backend/database.sqlite

   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password

   # Company Information
   COMPANY_NAME=Your Company Name
   COMPANY_EMAIL=info@yourcompany.com
   COMPANY_ADDRESS=123 Business Street, City, State 12345
   COMPANY_PHONE=+1 (555) 123-4567
   COMPANY_WEBSITE=www.yourcompany.com
   ```

4. **Select Plan**
   - Free tier is sufficient for testing
   - Paid plans offer more resources and no sleep mode

5. **Create Web Service**
   - Click "Create Web Service"
   - Wait for deployment to complete

## Email Configuration for Production

### Using Gmail

1. **Enable 2-Factor Authentication**
   - Go to your Google Account settings
   - Navigate to Security
   - Enable 2-Step Verification

2. **Generate App Password**
   - In Google Account → Security → 2-Step Verification
   - Scroll to "App passwords"
   - Generate a new app password for "Mail"
   - Use this password as `EMAIL_PASSWORD` in Render

3. **Set Environment Variables in Render**
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   ```

### Using SendGrid (Recommended for Production)

1. **Sign up for SendGrid**
   - Go to [https://sendgrid.com](https://sendgrid.com)
   - Free tier: 100 emails/day

2. **Create API Key**
   - Go to Settings → API Keys
   - Create a new API key with "Mail Send" permissions

3. **Set Environment Variables in Render**
   ```
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=apikey
   EMAIL_PASSWORD=your-sendgrid-api-key
   ```

### Using Mailgun

1. **Sign up for Mailgun**
   - Go to [https://www.mailgun.com](https://www.mailgun.com)
   - Free tier available

2. **Get SMTP Credentials**
   - Go to Sending → Domain Settings → SMTP credentials

3. **Set Environment Variables in Render**
   ```
   EMAIL_HOST=smtp.mailgun.org
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-mailgun-smtp-user
   EMAIL_PASSWORD=your-mailgun-smtp-password
   ```

## Database Persistence

**Important:** Render's free tier does NOT persist files between deploys. Your SQLite database will be reset on each deployment.

### For Production Use:

**Option 1: Upgrade to Paid Render Plan**
- Paid plans include persistent disks
- Add a persistent disk in your service settings
- Mount it to `/opt/render/project/src/backend`

**Option 2: Use PostgreSQL (Recommended)**
You would need to modify the backend to use PostgreSQL instead of SQLite:
1. Create a PostgreSQL database on Render
2. Update the backend to use `pg` or `sequelize` with PostgreSQL
3. Connect using the `DATABASE_URL` environment variable

**For Testing:**
The free tier works fine, but data will reset on each deploy.

## Updating Your Deployment

### Automatic Deployments
- Render automatically deploys when you push to your main branch
- Each commit triggers a new build

### Manual Deployments
- Go to your service in Render dashboard
- Click "Manual Deploy" → "Deploy latest commit"

## Connecting Frontend to Deployed Backend

Update your frontend's API base URL:

```javascript
// frontend/src/services/api.js
const API_BASE_URL = 'https://invoice-backend.onrender.com/api';
```

Or use environment variables:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
```

Then set `VITE_API_URL` in your frontend deployment.

## Testing Your Deployment

1. **Check Health Endpoint**
   ```bash
   curl https://your-service.onrender.com/api/health
   ```

   Should return:
   ```json
   {
     "status": "OK",
     "message": "Invoice API is running"
   }
   ```

2. **Test Customer Creation**
   ```bash
   curl -X POST https://your-service.onrender.com/api/customers \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Customer",
       "email": "test@example.com"
     }'
   ```

3. **View Logs**
   - Go to your service in Render dashboard
   - Click "Logs" tab to see real-time logs

## Troubleshooting

### Service Won't Start
- Check the logs in Render dashboard
- Verify all environment variables are set correctly
- Ensure `PORT` is set to `10000`

### Email Not Sending
- Verify email credentials are correct
- Check if your email provider allows SMTP access
- Review logs for specific error messages
- Test email configuration locally first

### Database Errors
- Ensure `DATABASE_PATH` points to a writable directory
- On free tier, database resets between deploys
- Consider upgrading to paid plan with persistent disk

### Cold Starts (Free Tier)
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds
- Upgrade to paid plan to avoid sleep mode

### Build Failures
- Check that `backend/package.json` exists
- Verify all dependencies are listed
- Review build logs for specific errors

## Monitoring

### View Logs
```bash
# In Render dashboard → Your Service → Logs
```

### Metrics (Paid Plans)
- CPU usage
- Memory usage
- Request count
- Response times

## Security Best Practices

1. **Never commit `.env` files**
   - Always use Render's environment variables

2. **Use App-Specific Passwords**
   - Never use your main email password

3. **Enable HTTPS**
   - Render provides free SSL certificates automatically

4. **Regularly Update Dependencies**
   ```bash
   npm audit
   npm update
   ```

5. **Set NODE_ENV to production**
   - Already configured in render.yaml

## Cost Estimate

**Free Tier:**
- 750 hours/month (sufficient for one service)
- Services sleep after 15 minutes of inactivity
- 100 GB bandwidth/month
- No persistent disk

**Starter Plan ($7/month):**
- No sleep mode
- 400 build minutes
- Persistent disk available
- Better performance

## Support

- [Render Documentation](https://render.com/docs)
- [Render Community Forum](https://community.render.com)
- [Render Status](https://status.render.com)

## Next Steps

After deployment:
1. Test all API endpoints
2. Configure email sending
3. Deploy the frontend
4. Update frontend to use production API URL
5. Test end-to-end invoice creation and sending
