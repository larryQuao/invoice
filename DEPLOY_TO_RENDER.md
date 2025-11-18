# Deploying to Render

This guide will walk you through deploying both the Backend API and Frontend to Render.

## Prerequisites

- A [Render](https://render.com) account (free tier available)
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- Email SMTP credentials for sending invoices

## Deployment Methods

### Method 1: Using render.yaml (Recommended - Deploys Both Services)

The easiest way to deploy is using the included `render.yaml` configuration file, which will deploy **both** the backend API and frontend in one go.

1. **Sign in to Render**
   - Go to [https://render.com](https://render.com)
   - Sign up or sign in with your GitHub/GitLab account

2. **Create New Blueprint**
   - Click "New +" in the top right
   - Select "Blueprint"
   - Connect your repository
   - Render will automatically detect the `render.yaml` file
   - This will create TWO services:
     - `invoice-backend` (API server)
     - `invoice-frontend` (Static site)

3. **Configure Environment Variables**

   After the blueprint is created, you need to set these environment variables for the **backend service**:

   **Required (Backend):**
   - `EMAIL_HOST` - Your SMTP server (e.g., `smtp.gmail.com`)
   - `EMAIL_USER` - Your email address
   - `EMAIL_PASSWORD` - Your email password or app-specific password

   **Optional (Backend - with defaults in render.yaml):**
   - `COMPANY_NAME` - Your company name
   - `COMPANY_EMAIL` - Your company email
   - `COMPANY_ADDRESS` - Your company address
   - `COMPANY_PHONE` - Your company phone
   - `COMPANY_WEBSITE` - Your company website

   **Frontend Configuration:**
   The frontend's `VITE_API_URL` is automatically set in `render.yaml` to point to the backend service.

4. **Deploy**
   - Click "Apply" to deploy both services
   - Wait for the build to complete (5-7 minutes for both services)
   - Your services will be live at:
     - Backend API: `https://invoice-backend.onrender.com/api`
     - Frontend: `https://invoice-frontend.onrender.com`

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

### Method 2b: Manual Frontend Deployment

After deploying the backend, deploy the frontend as a static site:

1. **Create New Static Site**
   - Go to your Render dashboard
   - Click "New +" → "Static Site"
   - Connect the same repository

2. **Configure the Static Site**

   **Basic Settings:**
   - Name: `invoice-frontend`
   - Region: Choose closest to you
   - Branch: `main` (or your branch name)
   - Root Directory: Leave blank
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`

3. **Environment Variables**

   Add this environment variable:
   ```
   VITE_API_URL=https://invoice-backend.onrender.com/api
   ```

   **Important:** Replace `invoice-backend.onrender.com` with your actual backend service URL.

4. **Configure Redirects/Rewrites**

   Click "Redirects/Rewrites" and add:
   - Source: `/*`
   - Destination: `/index.html`
   - Type: `Rewrite`

   This ensures React Router works correctly.

5. **Create Static Site**
   - Click "Create Static Site"
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

## How Frontend Connects to Backend

The frontend automatically connects to the backend using environment variables:

**For Blueprint Deployment (Method 1):**
- The `render.yaml` automatically sets `VITE_API_URL` to point to the backend
- No manual configuration needed!

**For Manual Deployment (Method 2b):**
- Set `VITE_API_URL` environment variable in the frontend service
- Use your actual backend URL: `https://your-backend.onrender.com/api`

**For Local Development:**
- The frontend uses Vite's proxy (`/api` → `http://localhost:3001/api`)
- No environment variable needed locally

The code in `frontend/src/services/api.js` automatically handles this:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
```

## Testing Your Deployment

### Backend Testing

1. **Check Backend Health Endpoint**
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

3. **View Backend Logs**
   - Go to your backend service in Render dashboard
   - Click "Logs" tab to see real-time logs

### Frontend Testing

1. **Access the Frontend**
   - Open `https://invoice-frontend.onrender.com` in your browser
   - You should see the invoice management interface

2. **Test Full Flow**
   - Create a customer
   - Create an invoice for that customer
   - Download the PDF
   - Send the invoice via email (if email is configured)

3. **Check Browser Console**
   - Open browser DevTools (F12)
   - Check Console for any errors
   - Check Network tab to verify API calls are working

4. **View Frontend Logs**
   - Go to your frontend service in Render dashboard
   - Click "Logs" tab to see build and deployment logs

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

### Frontend Not Loading / Blank Page
- Check browser console for errors
- Verify `VITE_API_URL` is set correctly in frontend service
- Ensure the backend URL includes `/api` at the end
- Check that redirects/rewrites are configured (`/*` → `/index.html`)

### Frontend Can't Connect to Backend (CORS Errors)
- Verify backend is running (check health endpoint)
- Check that `VITE_API_URL` points to the correct backend URL
- Ensure backend has CORS enabled (already configured in the code)
- Check browser Network tab for failed API requests

### Frontend Routes Don't Work (404 on Refresh)
- Ensure redirects/rewrites are configured in Render
- For blueprint deployment, this is automatic
- For manual deployment, add rewrite rule: `/*` → `/index.html`

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

**Free Tier (Both Services):**
- Backend (Web Service): 750 hours/month
- Frontend (Static Site): FREE (no hour limits!)
- Total: $0/month
- Services sleep after 15 minutes of inactivity (backend only)
- 100 GB bandwidth/month per service
- No persistent disk (backend)

**Starter Plan ($7/month per service):**
- Backend upgrade: No sleep mode, persistent disk, better performance
- Frontend upgrade: Usually not needed (static sites are always on)
- Recommended: Upgrade backend only = $7/month total

**Notes:**
- Static sites on Render are always active (no sleep)
- You can run both services on free tier indefinitely
- Consider upgrading backend to paid plan for production use

## Support

- [Render Documentation](https://render.com/docs)
- [Render Community Forum](https://community.render.com)
- [Render Status](https://status.render.com)

## Next Steps

After deployment:
1. ✅ Both services are deployed automatically (if using Blueprint)
2. Configure email credentials in backend service
3. Test the frontend URL in your browser
4. Create a test customer
5. Create and send a test invoice
6. Verify email delivery
7. (Optional) Set up custom domain for frontend
