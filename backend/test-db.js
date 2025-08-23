require('dotenv').config();
const mongoose = require('mongoose');

const testDatabaseConnection = async () => {
  console.log('🔍 Testing MongoDB Connection...');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set!');
    process.exit(1);
  }
  
  console.log('🔗 MongoDB URI (sanitized):', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
  
  try {
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
    
    // Test a simple operation
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('📚 Collections found:', collections.map(c => c.name));
    
    // Test User model
    const User = require('./models/user.model');
    const userCount = await User.countDocuments();
    console.log('👥 Users in database:', userCount);
    
    await mongoose.connection.close();
    console.log('✅ Database test completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔍 Error details:', {
      name: error.name,
      code: error.code,
      stack: error.stack
    });
    process.exit(1);
  }
};

testDatabaseConnection();
