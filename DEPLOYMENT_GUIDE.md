# 🚀 MediTech Deployment Guide

## 🔧 **Backend Deployment (Render.com)**

### 1. **Environment Variables Setup**
Set these environment variables in your Render.com dashboard:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/meditech?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend-url.vercel.app

# Optional (for blockchain features)
ADMIN_PRIVATE_KEY=your-ethereum-private-key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your-project-id
```

### 2. **MongoDB Atlas Configuration**
- **Network Access**: Add `0.0.0.0/0` to allow all IPs (or your Render.com IP)
- **Database**: Create database named `meditech`
- **User**: Create a user with read/write permissions

### 3. **Build Command**
```
npm install
```

### 4. **Start Command**
```
npm start
```

## 🌐 **Frontend Deployment (Vercel)**

### 1. **Environment Variables**
Set these in your Vercel dashboard:

```
REACT_APP_API_URL=https://your-backend-url.onrender.com/api
REACT_APP_BACKEND_URL=https://your-backend-url.onrender.com
```

### 2. **Build Settings**
- **Framework Preset**: Create React App
- **Build Command**: `npm run build`
- **Output Directory**: `build`

## 🔍 **Troubleshooting MongoDB Connection**

### **Issue: "Could not connect to MongoDB"**

#### **Step 1: Check Environment Variables**
```bash
# In your backend directory
node test-db.js
```

#### **Step 2: Verify MongoDB Atlas Settings**
1. **Network Access**: Ensure `0.0.0.0/0` is added
2. **Database User**: Check username/password
3. **Database Name**: Should be `meditech`

#### **Step 3: Test Connection Locally**
```bash
# Test with your production MongoDB URI
MONGODB_URI="your-production-uri" node test-db.js
```

#### **Step 4: Check Render.com Logs**
- Go to your Render.com dashboard
- Check the logs for connection errors
- Look for the detailed error messages we added

### **Common Issues & Solutions**

#### **Issue 1: Authentication Failed**
```
Error: Authentication failed
```
**Solution**: Check MongoDB username/password in Atlas

#### **Issue 2: Network Access Denied**
```
Error: getaddrinfo ENOTFOUND
```
**Solution**: Add `0.0.0.0/0` to MongoDB Atlas Network Access

#### **Issue 3: Database Not Found**
```
Error: Database 'meditech' not found
```
**Solution**: Create the `meditech` database in MongoDB Atlas

#### **Issue 4: Connection Timeout**
```
Error: Server selection timed out
```
**Solution**: Check if MongoDB URI is correct and network access is configured

## 🧪 **Testing Your Deployment**

### **Backend Health Check**
```bash
curl https://your-backend-url.onrender.com/api/health
```

### **Database Connection Test**
```bash
curl https://your-backend-url.onrender.com/api/db/test-connection
```

### **Frontend Connection Test**
Visit your frontend and check the browser console for connection status.

## 📝 **Quick Fix Checklist**

- [ ] MongoDB Atlas Network Access: `0.0.0.0/0`
- [ ] MongoDB Database: `meditech` exists
- [ ] MongoDB User: Has read/write permissions
- [ ] Environment Variables: All set in Render.com
- [ ] Frontend Environment Variables: Set in Vercel
- [ ] Backend deployed and running
- [ ] Frontend deployed and connected to backend

## 🆘 **Still Having Issues?**

1. **Check Render.com logs** for detailed error messages
2. **Run the database test**: `node test-db.js`
3. **Verify MongoDB Atlas** settings
4. **Test connection locally** with production URI
5. **Check environment variables** are correctly set

The improved error handling will now provide detailed information about what's going wrong with the database connection.
