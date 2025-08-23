require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
const net = require('net');

async function diagnoseMongoDB() {
  console.log('🔍 MongoDB Atlas Connection Diagnostics\n');
  
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    console.error('❌ MONGODB_URI environment variable not set');
    return;
  }
  
  console.log('1. 📋 Environment Variables:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`   PORT: ${process.env.PORT || 'not set'}`);
  console.log(`   MONGODB_URI: ${mongoUri ? '✅ Set' : '❌ Not set'}`);
  console.log(`   URI Pattern: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}\n`);
  
  // Parse MongoDB URI
  let hostname, port, database;
  try {
    const url = new URL(mongoUri);
    hostname = url.hostname;
    port = url.port || 27017;
    database = url.pathname.split('/')[1] || 'test';
    
    console.log('2. 🔗 Connection Details:');
    console.log(`   Hostname: ${hostname}`);
    console.log(`   Port: ${port}`);
    console.log(`   Database: ${database}\n`);
  } catch (error) {
    console.error('❌ Invalid MongoDB URI format:', error.message);
    return;
  }
  
  // DNS Resolution Test
  console.log('3. 🌐 DNS Resolution Test:');
  try {
    const addresses = await new Promise((resolve, reject) => {
      dns.resolve4(hostname, (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
      });
    });
    console.log(`   ✅ DNS resolved: ${addresses.join(', ')}\n`);
  } catch (error) {
    console.error(`   ❌ DNS resolution failed: ${error.message}\n`);
  }
  
  // TCP Connection Test
  console.log('4. 🔌 TCP Connection Test:');
  try {
    const isReachable = await testTCPConnection(hostname, port);
    if (isReachable) {
      console.log(`   ✅ TCP connection to ${hostname}:${port} successful\n`);
    } else {
      console.log(`   ❌ TCP connection to ${hostname}:${port} failed\n`);
    }
  } catch (error) {
    console.error(`   ❌ TCP connection error: ${error.message}\n`);
  }
  
  // MongoDB Connection Test with Various Timeouts
  const timeouts = [10000, 30000, 60000]; // 10s, 30s, 60s
  
  for (const timeout of timeouts) {
    console.log(`5. 📊 MongoDB Connection Test (${timeout/1000}s timeout):`);
    try {
      const startTime = Date.now();
      
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: timeout,
        connectTimeoutMS: timeout,
        socketTimeoutMS: timeout,
        maxPoolSize: 1,
        bufferCommands: false
      });
      
      const connectTime = Date.now() - startTime;
      console.log(`   ✅ MongoDB connection successful (${connectTime}ms)`);
      
      // Test database ping
      const pingStart = Date.now();
      await mongoose.connection.db.admin().ping();
      const pingTime = Date.now() - pingStart;
      console.log(`   🏓 Database ping successful (${pingTime}ms)`);
      
      // List collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`   📚 Collections found: ${collections.length}`);
      if (collections.length > 0) {
        console.log(`   📝 Collection names: ${collections.map(c => c.name).join(', ')}`);
      }
      
      await mongoose.connection.close();
      console.log('   🔄 Connection closed successfully\n');
      
      console.log('🎉 MongoDB connection is working correctly!');
      console.log('💡 If your app is still having timeout issues on Render:');
      console.log('   1. Check MongoDB Atlas Network Access whitelist');
      console.log('   2. Verify Render region matches your MongoDB cluster region');
      console.log('   3. Ensure MongoDB cluster is not paused\n');
      return;
      
    } catch (error) {
      console.error(`   ❌ Connection failed: ${error.name} - ${error.message}`);
      
      if (error.name === 'MongoServerSelectionError') {
        console.log('   💡 This is typically a network/firewall issue:');
        console.log('      - Check MongoDB Atlas Network Access settings');
        console.log('      - Ensure 0.0.0.0/0 is whitelisted for Render deployments');
        console.log('      - Verify cluster is running (not paused)');
      } else if (error.name === 'MongooseServerSelectionError') {
        console.log('   💡 Server selection timeout - possible causes:');
        console.log('      - Network connectivity issues');
        console.log('      - Incorrect connection string');
        console.log('      - MongoDB Atlas cluster is paused or down');
      } else if (error.message.includes('Authentication failed')) {
        console.log('   💡 Authentication error - check credentials');
      }
      
      console.log(`   ⏱️  Timeout after ${timeout/1000}s\n`);
      
      // Close any existing connection
      try {
        await mongoose.connection.close();
      } catch (closeError) {
        // Ignore close errors
      }
    }
  }
  
  console.log('❌ All MongoDB connection attempts failed');
  console.log('\n🚨 URGENT: Check MongoDB Atlas Configuration:');
  console.log('   1. Go to MongoDB Atlas → Network Access');
  console.log('   2. Add IP Address: 0.0.0.0/0 (Allow access from anywhere)');
  console.log('   3. Ensure your cluster is running (not paused)');
  console.log('   4. Verify database user credentials');
}

function testTCPConnection(hostname, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 10000; // 10 seconds
    
    socket.setTimeout(timeout);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.connect(port, hostname);
  });
}

// Run diagnostics
diagnoseMongoDB().catch(console.error);
