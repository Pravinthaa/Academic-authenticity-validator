const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // fail fast if MongoDB is not running
    });

    const { host, name } = conn.connection;
    console.log(`✅ MongoDB Connected → host: ${host}  |  db: ${name}`);
      await mongoose.model('StudentRegistry').syncIndexes();
    await mongoose.model('Certificate').syncIndexes();
await mongoose.model('VerificationLog').syncIndexes();
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    console.error('   Make sure MongoDB is running and MONGO_URI in .env is correct.');
    process.exit(1);
  }
};

module.exports = connectDB;
