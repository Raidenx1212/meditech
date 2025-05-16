const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  const dbName = isConnected ? mongoose.connection.db.databaseName : 'not connected';
  
  res.json({
    status: 'ok',
    mongodb: { 
      connected: isConnected,
      database: dbName,
      readyState: mongoose.connection.readyState,
      host: isConnected ? mongoose.connection.host : 'unknown'
    }
  });
});

// Add backward compatibility for the test-connection endpoint
router.get('/db/test-connection', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  const dbName = isConnected ? mongoose.connection.db.databaseName : 'not connected';
  
  res.json({
    success: isConnected,
    message: isConnected ? 
      `Connected to MongoDB (${dbName} database)` : 
      'Database connection failed',
    details: {
      database: dbName,
      readyState: mongoose.connection.readyState
    }
  });
});

// Add database collections endpoint for diagnostics
router.get('/db/collections', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ 
        error: 'Database not connected',
        readyState: mongoose.connection.readyState
      });
    }
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionStats = await Promise.all(
      collections.map(async (coll) => {
        const count = await mongoose.connection.db.collection(coll.name).countDocuments();
        return { name: coll.name, documents: count };
      })
    );
    
    res.json({
      database: mongoose.connection.db.databaseName,
      collections: collectionStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 