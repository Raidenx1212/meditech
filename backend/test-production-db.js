require('dotenv').config();
const mongoose = require('mongoose');

const testProductionDatabase = async () => {
  console.log('🔍 Testing Production MongoDB Connection...');
  console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
  
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set!');
    console.log('💡 Please set MONGODB_URI in your environment variables');
    process.exit(1);
  }
  
  console.log('🔗 MongoDB URI (sanitized):', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
  
  // Check if URI contains database name
  if (!MONGODB_URI.includes('/meditech') && !MONGODB_URI.includes('/test')) {
    console.log('⚠️  No database name specified in URI');
    console.log('💡 Add /meditech to your MongoDB URI');
  }
  
  try {
    console.log('🔄 Attempting connection...');
    
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log('📊 Database:', conn.connection.db.databaseName);
    console.log('🔌 Host:', conn.connection.host);
    console.log('🔌 Port:', conn.connection.port);
    console.log('🔌 Ready State:', conn.connection.readyState);
    
    // Test database operations
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('📚 Collections found:', collections.map(c => c.name));
    
    // Test User model
    const User = require('./models/user.model');
    const userCount = await User.countDocuments();
    console.log('👥 Users in database:', userCount);
    
    // Test creating a test user (will be deleted)
    const testUser = new User({
      email: 'test@example.com',
      password: 'testpassword123',
      walletAddress: '0x1234567890123456789012345678901234567890',
      firstName: 'Test',
      lastName: 'User',
      role: 'patient'
    });
    
    await testUser.save();
    console.log('✅ Test user created successfully');
    
    // Delete the test user
    await User.deleteOne({ email: 'test@example.com' });
    console.log('✅ Test user deleted successfully');
    
    await mongoose.connection.close();
    console.log('✅ Production database test completed successfully!');
    console.log('🎉 Your MongoDB connection is working perfectly!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔍 Error details:', {
      name: error.name,
      code: error.code,
      stack: error.stack
    });
    
    // Provide specific guidance based on error type
    if (error.name === 'MongoServerSelectionError') {
      console.log('\n🚨 SOLUTION: Check MongoDB Atlas Network Access');
      console.log('1. Go to MongoDB Atlas Dashboard');
      console.log('2. Click "Network Access"');
      console.log('3. Add IP Address: 0.0.0.0/0 (allow all)');
    } else if (error.name === 'MongoParseError') {
      console.log('\n🚨 SOLUTION: Check MONGODB_URI format');
      console.log('Format: mongodb+srv://username:password@cluster.mongodb.net/meditech');
    } else if (error.message.includes('Authentication failed')) {
      console.log('\n🚨 SOLUTION: Check MongoDB credentials');
      console.log('1. Go to MongoDB Atlas Dashboard');
      console.log('2. Click "Database Access"');
      console.log('3. Verify username and password');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🚨 SOLUTION: Check if MongoDB service is running');
    }
    
    process.exit(1);
  }
};

testProductionDatabase();
