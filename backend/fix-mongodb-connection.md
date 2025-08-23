# 🔧 MongoDB Atlas Connection Fix Guide

## 🚨 Current Issues Identified:

1. **DNS Resolution Failed**: `reaper.b6fszir.mongodb.net` is not resolving
2. **Authentication Failed**: Credential issues detected

## 📋 Step-by-Step Fix:

### 1. Check MongoDB Atlas Cluster Status
- Go to [MongoDB Atlas](https://cloud.mongodb.com/)
- Log into your account
- Check if your cluster `reaper` is:
  - ✅ **Running** (not paused)
  - ✅ **Active** (not terminated)

### 2. Verify Network Access Settings
- In MongoDB Atlas → Go to **Network Access**
- Ensure you have these IP addresses whitelisted:
  ```
  0.0.0.0/0    (Allow access from anywhere)
  ```
- If not present, click **+ ADD IP ADDRESS** and add `0.0.0.0/0`

### 3. Check Database User Credentials
- Go to **Database Access** in MongoDB Atlas
- Ensure your database user exists and has the right permissions:
  - **Database User Privileges**: `Atlas admin` or `Read and write to any database`
  - Note down the **username** and **password**

### 4. Get the Correct Connection String
- Go to your cluster → Click **Connect**
- Choose **Connect your application**
- Copy the connection string, it should look like:
  ```
  mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
  ```

### 5. Update Environment Variables

#### For Local Development (.env file):
Create a `.env` file in the `backend` directory with:
```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/meditech?retryWrites=true&w=majority

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Blockchain Configuration (optional)
ADMIN_PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_project_id
```

#### For Render Deployment:
- Go to your Render dashboard
- Select your backend service
- Go to **Environment** tab
- Update the `MONGODB_URI` variable with the new connection string

### 6. Test the Connection
Run the diagnostic script:
```bash
cd backend
node diagnose-mongodb.js
```

## 🔍 Troubleshooting Common Issues:

### Issue: "DNS resolution failed"
**Solution**: The cluster hostname is incorrect or the cluster is deleted
- Verify cluster exists in MongoDB Atlas
- Get a fresh connection string from Atlas

### Issue: "Authentication failed"
**Solution**: Wrong username/password in connection string
- Check Database Access in MongoDB Atlas
- Reset password if needed
- Ensure special characters in password are URL-encoded

### Issue: "Connection timeout"
**Solution**: Network access not configured
- Add 0.0.0.0/0 to Network Access whitelist
- Ensure cluster is running (not paused)

### Issue: "Bad auth"
**Solution**: Database user doesn't exist or lacks permissions
- Create new database user in Atlas
- Assign proper permissions (ReadWrite or Atlas admin)

## 🚀 After Fixing:

1. **Test locally**: Run `node diagnose-mongodb.js`
2. **Deploy to Render**: Push changes to trigger redeploy
3. **Check health**: Visit `https://your-app.onrender.com/api/health`

## 💡 Pro Tips:

1. **Use environment-specific databases**:
   - Production: `/meditech` 
   - Development: `/meditech-dev`

2. **Monitor connections**: Check the health endpoint regularly
3. **Keep credentials secure**: Never commit .env files to git
4. **Use IP whitelisting**: For production, consider specific IP ranges instead of 0.0.0.0/0
