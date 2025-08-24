require('dotenv').config();
const mongoose = require('mongoose');

const testConnections = async () => {
  console.log('🔄 Starting MongoDB Connection Tests...\n');
  
  // Check environment variables
  console.log('📝 Environment Check:');
  console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('- MONGODB_URI exists:', !!process.env.MONGODB_URI);
  console.log('- JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('- PORT:', process.env.PORT || 'not set');
  console.log();

  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in environment variables!');
    console.log('📝 Please check your .env file and ensure MONGODB_URI is uncommented and correct.');
    process.exit(1);
  }

  // Test multiple connection configurations
  const connectionOptions = [
    {
      name: 'Production Config (Current)',
      uri: MONGODB_URI,
      options: {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        maxPoolSize: 5,
        minPoolSize: 1,
        retryWrites: true,
        w: 'majority'
      }
    },
    {
      name: 'Extended Timeout Config',
      uri: MONGODB_URI,
      options: {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        maxPoolSize: 10,
        minPoolSize: 1,
        retryWrites: true,
        w: 'majority',
        bufferCommands: false,
        bufferMaxEntries: 0
      }
    },
    {
      name: 'Simple Config',
      uri: MONGODB_URI,
      options: {
        serverSelectionTimeoutMS: 15000
      }
    }
  ];

  for (let config of connectionOptions) {
    console.log(`🔄 Testing: ${config.name}`);
    try {
      // Clean URI
      let cleanURI = config.uri;
      
      // Ensure database name is specified
      if (!cleanURI.includes('/meditech') && !cleanURI.includes('/test') && !cleanURI.match(/\/[^/?]+\?/)) {
        // Add default database name if not present
        cleanURI = cleanURI.replace(/(\?|$)/, '/meditech$1');
        console.log('📝 Added default database name: meditech');
      }

      console.log('🔗 Sanitized URI:', cleanURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
      
      // Test connection
      const startTime = Date.now();
      const conn = await mongoose.connect(cleanURI, config.options);
      const connectTime = Date.now() - startTime;
      
      console.log(`✅ ${config.name} - Connected in ${connectTime}ms`);
      console.log('📊 Connection Details:');
      console.log('  - Host:', conn.connection.host);
      console.log('  - Database:', conn.connection.db.databaseName);
      console.log('  - Ready State:', conn.connection.readyState);
      
      // Test database operations
      try {
        await conn.connection.db.admin().ping();
        console.log('🏓 Database ping: SUCCESS');
        
        // List collections
        const collections = await conn.connection.db.listCollections().toArray();
        console.log('📚 Collections found:', collections.length);
        if (collections.length > 0) {
          console.log('📂 Available collections:', collections.map(c => c.name).join(', '));
        }
        
      } catch (pingError) {
        console.warn('⚠️ Database ping failed:', pingError.message);
      }
      
      // Clean up
      await mongoose.connection.close();
      console.log('✅ Connection closed successfully\n');
      
      // If we get here, the connection worked
      console.log('🎉 SUCCESS! MongoDB connection is working with:', config.name);
      console.log('📝 You can now start your server with: npm run dev');
      process.exit(0);
      
    } catch (error) {
      console.error(`❌ ${config.name} failed:`, error.message);
      console.error('🔍 Error details:', {
        name: error.name,
        code: error.code
      });
      
      if (error.name === 'MongoServerSelectionError') {
        console.error('🚨 Possible issues:');
        console.error('   - Network access not configured in MongoDB Atlas');
        console.error('   - Incorrect username/password');
        console.error('   - Firewall blocking connection');
        console.error('   - MongoDB cluster is paused or unavailable');
      }
      
      console.log();
    }
  }
  
  console.log('❌ All connection attempts failed!');
  console.log('\n🔧 Troubleshooting steps:');
  console.log('1. Check your MongoDB Atlas cluster is running');
  console.log('2. Verify network access settings (allow 0.0.0.0/0 for testing)');
  console.log('3. Confirm username/password in connection string');
  console.log('4. Try connecting with MongoDB Compass first');
  console.log('5. Check if your IP is whitelisted');
  
  process.exit(1);
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Promise Rejection:', err.message);
  process.exit(1);
});

// Run the test
testConnections().catch(console.error);
