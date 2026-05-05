/**
 * MongoDB Database Initialization & Seeding Script
 * Sets up collections, indexes, and initial data
 * 
 * Usage: 
 *   From backend directory: node scripts/initDatabase.js
 *   From project root: node ./server/scripts/initDatabase.js
 */

const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');

// Import models
const { User, Certificate, VerificationLog, CertificateTemplate } = require('../models/schemas');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/academic-validator';

// ============================================================================
// INITIALIZATION FUNCTION
// ============================================================================

async function initializeDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✓ MongoDB connected successfully');
    
    // ========================================================================
    // DROP EXISTING COLLECTIONS (Optional - for fresh setup)
    // ========================================================================
    
    // Uncomment below to reset database on each run
    // await mongoose.connection.collections.users.drop().catch(() => {});
    // await mongoose.connection.collections.certificates.drop().catch(() => {});
    // await mongoose.connection.collections.verificationlogs.drop().catch(() => {});
    
    console.log('\n📋 Creating indexes...');
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ createdAt: -1 });
    
    await Certificate.collection.createIndex({ rollNumber: 1 });
    await Certificate.collection.createIndex({ certificateId: 1 }, { unique: true });
    await Certificate.collection.createIndex({ institution: 1 });
    await Certificate.collection.createIndex({ status: 1 });
    await Certificate.collection.createIndex({ verificationStatus: 1 });
    await Certificate.collection.createIndex({ createdAt: -1 });
    
    await VerificationLog.collection.createIndex({ queryValue: 1 });
    await VerificationLog.collection.createIndex({ certificate: 1 });
    await VerificationLog.collection.createIndex({ result: 1 });
    await VerificationLog.collection.createIndex({ createdAt: -1 });
    
    console.log('✓ Indexes created successfully');
    
    // ========================================================================
    // SEED INITIAL DATA
    // ========================================================================
    
    console.log('\n🌱 Seeding initial data...');
    
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@validator.com' });
    
    if (!adminExists) {
      // Create admin user
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@validator.com',
        password: 'Admin@123456', // Change this in production
        role: 'admin',
        phoneNumber: '+91-9999999999',
        isActive: true
      });
      
      await adminUser.save();
      console.log('✓ Admin user created: admin@validator.com');
    } else {
      console.log('⚠ Admin user already exists');
    }
    
    // Create sample institution users
    const institutionExists = await User.findOne({ 
      role: 'institution',
      'institutionDetails.organizationName': 'Tamil Nadu State Board'
    });
    
    if (!institutionExists) {
      const institution1 = new User({
        name: 'Tamil Nadu State Board',
        email: 'institution@tnboard.gov.in',
        password: 'Institution@123456',
        role: 'institution',
        institutionDetails: {
          organizationName: 'Tamil Nadu State Board of Secondary Education',
          registrationNumber: 'TNBSE-2024',
          address: '144/1 Anna Salai',
          city: 'Chennai',
          state: 'Tamil Nadu',
          country: 'India',
          pincode: '600002',
          contactPerson: 'Board Director',
          phoneNumber: '+91-44-28195555',
          verificationStatus: 'verified'
        },
        isActive: true
      });
      
      await institution1.save();
      console.log('✓ Institution user created: institution@tnboard.gov.in');
      
      // Create another institution
      const institution2 = new User({
        name: 'Indian Institute of Technology',
        email: 'admissions@iit.ac.in',
        password: 'IIT@123456',
        role: 'institution',
        institutionDetails: {
          organizationName: 'Indian Institute of Technology',
          registrationNumber: 'IIT-REG-001',
          address: 'IIT Campus',
          city: 'Delhi',
          state: 'Delhi',
          country: 'India',
          pincode: '110016',
          contactPerson: 'Registrar',
          phoneNumber: '+91-11-26591234',
          verificationStatus: 'verified'
        },
        isActive: true
      });
      
      await institution2.save();
      console.log('✓ Institution user created: admissions@iit.ac.in');
    } else {
      console.log('⚠ Institution users already exist');
    }
    
    // Create sample verifier users
    const verifierExists = await User.findOne({ role: 'verifier' });
    
    if (!verifierExists) {
      const verifier1 = new User({
        name: 'Certificate Verifier 1',
        email: 'verifier1@validator.com',
        password: 'Verifier@123456',
        role: 'verifier',
        phoneNumber: '+91-9876543210',
        isActive: true
      });
      
      await verifier1.save();
      console.log('✓ Verifier user created: verifier1@validator.com');
    } else {
      console.log('⚠ Verifier users already exist');
    }
    
    // ========================================================================
    // VERIFY COLLECTIONS & STATISTICS
    // ========================================================================
    
    console.log('\n📊 Database Statistics:');
    
    const userCount = await User.countDocuments();
    const certificateCount = await Certificate.countDocuments();
    const verificationLogCount = await VerificationLog.countDocuments();
    
    console.log(`  - Users: ${userCount}`);
    console.log(`  - Certificates: ${certificateCount}`);
    console.log(`  - Verification Logs: ${verificationLogCount}`);
    
    // ========================================================================
    // DISPLAY CONNECTION INFO
    // ========================================================================
    
    console.log('\n✅ Database initialization complete!');
    console.log('\nConnection Details:');
    console.log(`  - Database URI: ${MONGODB_URI}`);
    console.log(`  - Database: ${mongoose.connection.db.name}`);
    console.log(`  - Host: ${mongoose.connection.host}`);
    
    console.log('\n🔑 Default Credentials:');
    console.log('  - Admin: admin@validator.com / Admin@123456');
    console.log('  - Institution: institution@tnboard.gov.in / Institution@123456');
    console.log('  - Verifier: verifier1@validator.com / Verifier@123456');
    
    console.log('\n⚠️  IMPORTANT: Change these passwords in production!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// ============================================================================
// RUN INITIALIZATION
// ============================================================================

if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
