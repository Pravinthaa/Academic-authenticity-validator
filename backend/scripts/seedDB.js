/**
 * seedDB.js
 * ---------
 * Populates the MongoDB database with realistic sample data for development
 * and testing purposes.
 *
 * Usage:
 *   node scripts/seedDB.js          → seed the database
 *   node scripts/seedDB.js --clear  → wipe all collections only
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load env vars from parent directory
dotenv.config({ path: require('path').join(__dirname, '../.env') });

const User = require('../models/User');
const Certificate = require('../models/Certificate');
const VerificationLog = require('../models/VerificationLog');

// ─── Sample Data ────────────────────────────────────────────────────────────

const sampleUsers = [
  {
    name: 'Super Admin',
    email: 'admin@verichain.io',
    password: 'Admin@1234',
    role: 'admin',
  },
  {
    name: 'Anna University',
    email: 'admin@annauniv.edu',
    password: 'Instit@1234',
    role: 'institution',
    institutionDetails: {
      organizationName: 'Anna University',
      registrationNumber: 'AU-TN-1978-001',
    },
  },
  {
    name: 'IIT Madras',
    email: 'admin@iitm.ac.in',
    password: 'Instit@5678',
    role: 'institution',
    institutionDetails: {
      organizationName: 'IIT Madras',
      registrationNumber: 'IIT-MDR-1959-002',
    },
  },
  {
    name: 'Priya Verifier',
    email: 'priya@hrfirm.com',
    password: 'Verify@1234',
    role: 'verifier',
  },
  {
    name: 'Rajan Recruiter',
    email: 'rajan@techcorp.com',
    password: 'Verify@5678',
    role: 'verifier',
  },
];

// Will be populated after users are inserted
let institutionIds = {};

const buildCertificates = () => [
  // Anna University certificates
  {
    institution: institutionIds['admin@annauniv.edu'],
    studentName: 'Arun Kumar',
    rollNumber: 'AU2020CS001',
    course: 'B.E. Computer Science and Engineering',
    graduationYear: 2024,
    grade: '8.9 CGPA',
    certificateId: 'CERT-AU-2024-CS-0001',
    issueDate: new Date('2024-06-15'),
    status: 'active',
  },
  {
    institution: institutionIds['admin@annauniv.edu'],
    studentName: 'Meena Suresh',
    rollNumber: 'AU2020EC002',
    course: 'B.E. Electronics and Communication',
    graduationYear: 2024,
    grade: '9.1 CGPA',
    certificateId: 'CERT-AU-2024-EC-0002',
    issueDate: new Date('2024-06-15'),
    status: 'active',
  },
  {
    institution: institutionIds['admin@annauniv.edu'],
    studentName: 'Vijay Anand',
    rollNumber: 'AU2019ME003',
    course: 'B.E. Mechanical Engineering',
    graduationYear: 2023,
    grade: '7.5 CGPA',
    certificateId: 'CERT-AU-2023-ME-0003',
    issueDate: new Date('2023-07-01'),
    status: 'active',
  },
  {
    institution: institutionIds['admin@annauniv.edu'],
    studentName: 'Kavitha Rajan',
    rollNumber: 'AU2019IT004',
    course: 'B.Tech Information Technology',
    graduationYear: 2023,
    grade: '8.2 CGPA',
    certificateId: 'CERT-AU-2023-IT-0004',
    issueDate: new Date('2023-07-01'),
    status: 'revoked', // Example of a revoked certificate
  },
  // IIT Madras certificates
  {
    institution: institutionIds['admin@iitm.ac.in'],
    studentName: 'Siddharth Nair',
    rollNumber: 'IITM2021CS001',
    course: 'B.Tech Computer Science',
    graduationYear: 2025,
    grade: '9.6 CGPA',
    certificateId: 'CERT-IITM-2025-CS-0001',
    issueDate: new Date('2025-05-30'),
    status: 'active',
  },
  {
    institution: institutionIds['admin@iitm.ac.in'],
    studentName: 'Lakshmi Priya',
    rollNumber: 'IITM2020AI002',
    course: 'M.Tech Artificial Intelligence',
    graduationYear: 2024,
    grade: '9.3 CGPA',
    certificateId: 'CERT-IITM-2024-AI-0002',
    issueDate: new Date('2024-05-28'),
    status: 'active',
  },
  {
    institution: institutionIds['admin@iitm.ac.in'],
    studentName: 'Rahul Sharma',
    rollNumber: 'IITM2019EE003',
    course: 'B.Tech Electrical Engineering',
    graduationYear: 2023,
    grade: '8.7 CGPA',
    certificateId: 'CERT-IITM-2023-EE-0003',
    issueDate: new Date('2023-06-01'),
    status: 'active',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const clearCollections = async () => {
  console.log('\n🗑️  Clearing existing collections...');
  await VerificationLog.deleteMany({});
  await Certificate.deleteMany({});
  await User.deleteMany({});
  console.log('   ✅ All collections cleared.');
};

// ─── Main Seed Function ───────────────────────────────────────────────────────

const seed = async () => {
  try {
    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`   ✅ Connected to: ${mongoose.connection.host}`);

    await clearCollections();

    // ── Insert Users ──────────────────────────────────────────────────────────
    console.log('\n👤 Seeding users...');
    const insertedUsers = [];

    for (const userData of sampleUsers) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const user = await User.create({
        ...userData,
        password: hashedPassword,
      });

      // Store institution IDs for linking certificates
      if (user.role === 'institution') {
        institutionIds[userData.email] = user._id;
      }

      insertedUsers.push(user);
      console.log(`   ✅ ${user.role.padEnd(11)} → ${user.name} (${userData.email})`);
    }

    // ── Insert Certificates ───────────────────────────────────────────────────
    console.log('\n📜 Seeding certificates...');
    const certificates = buildCertificates();
    const insertedCerts = await Certificate.insertMany(certificates);

    for (const cert of insertedCerts) {
      const institution = insertedUsers.find(
        (u) => u._id.toString() === cert.institution.toString()
      );
      console.log(
        `   ✅ ${cert.certificateId}  →  ${cert.studentName}  (${institution?.institutionDetails?.organizationName ?? 'N/A'}) [${cert.status}]`
      );
    }

    // ── Insert Verification Logs ──────────────────────────────────────────────
    console.log('\n🔍 Seeding verification logs...');
    const verifierUser = insertedUsers.find((u) => u.email === 'priya@hrfirm.com');

    const verificationLogs = [
      {
        certificate: insertedCerts[0]._id,
        queryValue: 'CERT-AU-2024-CS-0001',
        queryType: 'certificateId',
        result: 'found',
        verifiedBy: verifierUser._id,
        ipAddress: '192.168.1.10',
        verifierOrganisation: 'HR Firm Pvt. Ltd.',
      },
      {
        certificate: insertedCerts[4]._id,
        queryValue: 'IITM2021CS001',
        queryType: 'rollNumber',
        result: 'found',
        verifiedBy: null,
        ipAddress: '203.0.113.42',
        verifierOrganisation: 'Tech Corp',
      },
      {
        certificate: null,
        queryValue: 'FAKE-CERT-9999',
        queryType: 'certificateId',
        result: 'not_found',
        verifiedBy: null,
        ipAddress: '198.51.100.7',
      },
      {
        certificate: insertedCerts[3]._id,
        queryValue: 'CERT-AU-2023-IT-0004',
        queryType: 'certificateId',
        result: 'revoked',
        verifiedBy: verifierUser._id,
        ipAddress: '192.168.2.55',
        verifierOrganisation: 'HR Firm Pvt. Ltd.',
      },
    ];

    const insertedLogs = await VerificationLog.insertMany(verificationLogs);
    console.log(`   ✅ ${insertedLogs.length} verification log entries created.`);

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ✅ DATABASE SEEDED SUCCESSFULLY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Users         : ${insertedUsers.length}`);
    console.log(`  Certificates  : ${insertedCerts.length}`);
    console.log(`  Verify Logs   : ${insertedLogs.length}`);
    console.log('\n  Test Credentials:');
    console.log('  ┌─ Admin       admin@verichain.io    /  Admin@1234');
    console.log('  ├─ Institution admin@annauniv.edu    /  Instit@1234');
    console.log('  ├─ Institution admin@iitm.ac.in      /  Instit@5678');
    console.log('  └─ Verifier   priya@hrfirm.com      /  Verify@1234');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// ── Entry Point ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

if (args.includes('--clear')) {
  mongoose.connect(process.env.MONGO_URI).then(async () => {
    await clearCollections();
    console.log('\n✅ Done. Database wiped.\n');
    await mongoose.connection.close();
    process.exit(0);
  });
} else {
  seed();
}
