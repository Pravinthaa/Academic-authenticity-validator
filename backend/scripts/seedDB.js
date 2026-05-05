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
    name: 'Govt Admin',
    email: 'admin@verichain.io',
    password: 'Admin@1234',
    role: 'admin',
  },
  {
    name: 'TN School Board',
    email: 'admin@tnboard.edu.in',
    password: 'Board@1234',
    role: 'institution',
    institutionDetails: {
      organizationName: 'State Board of School Examinations, Tamilnadu',
      registrationNumber: 'TNSB-2024-001',
    },
  },
  {
    name: 'Kerala School Board',
    email: 'admin@keralaboard.edu.in',
    password: 'Board@5678',
    role: 'institution',
    institutionDetails: {
      organizationName: 'Kerala Board of Higher Secondary Education',
      registrationNumber: 'KSEB-2024-002',
    },
  },
  {
    name: 'Priya Verifier',
    email: 'priya@hrfirm.com',
    password: 'Verify@1234',
    role: 'verifier',
  },
];

// Will be populated after users are inserted
let institutionIds = {};

const buildCertificates = () => [
  {
    institution: institutionIds['admin@tnboard.edu.in'],
    studentName: 'THIRUVARASAN R K',
    rollNumber: '6150916',
    registerNumber: '2313150825',
    emisId: '2010843333',
    certificateSerialNo: '35141174',
    sessionAndYear: 'MAR 2024',
    dateOfBirth: new Date('2005-10-15'),
    course: 'Higher Secondary Course (Class 12)',
    schoolName: 'C E O A MATRIC. HR. SEC. SCHOOL, A. KOSAKULAM',
    graduationYear: 2024,
    totalMarks: '0589',
    tmrCode: 'M1145983 / 06.05.2024',
    certificateId: '35141174',
    issueDate: new Date('2024-05-06'),
    status: 'active',
    hasPhoto: true,
    hasCandidateSignature: true,
    hasSecretarySignature: true
  },
  {
    institution: institutionIds['admin@tnboard.edu.in'],
    studentName: 'ARUN KUMAR S',
    rollNumber: '6150917',
    registerNumber: '2313150826',
    emisId: '2010843334',
    certificateSerialNo: '35141175',
    sessionAndYear: 'MAR 2024',
    dateOfBirth: new Date('2006-05-20'),
    course: 'Higher Secondary Course (Class 12)',
    schoolName: 'C E O A MATRIC. HR. SEC. SCHOOL, A. KOSAKULAM',
    graduationYear: 2024,
    totalMarks: '0545',
    tmrCode: 'M1145984 / 06.05.2024',
    certificateId: '35141175',
    issueDate: new Date('2024-05-06'),
    status: 'active',
    hasPhoto: true,
    hasCandidateSignature: true,
    hasSecretarySignature: true
  },
  {
    institution: institutionIds['admin@keralaboard.edu.in'],
    studentName: 'RAHUL MENON',
    rollNumber: '882910',
    registerNumber: 'KR-2024-9910',
    emisId: 'KL-2010843',
    certificateSerialNo: 'KSEB-2024-A1',
    sessionAndYear: 'MAR 2024',
    dateOfBirth: new Date('2006-01-12'),
    course: 'Higher Secondary Course (Class 12)',
    schoolName: 'Govt Model Boys HSS, Trivandrum',
    graduationYear: 2024,
    totalMarks: '1180',
    tmrCode: 'KSEB-TMR-001',
    certificateId: 'KSEB-2024-A1',
    issueDate: new Date('2024-06-10'),
    status: 'active',
    hasPhoto: true,
    hasCandidateSignature: true,
    hasSecretarySignature: true
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
        queryValue: '35141174',
        queryType: 'certificateId',
        result: 'found',
        verifiedBy: null,
        ipAddress: '192.168.1.10',
        verifierOrganisation: 'State Recruitment Cell',
      },
      {
        certificate: insertedCerts[1]._id,
        queryValue: '6150917',
        queryType: 'rollNumber',
        result: 'found',
        verifiedBy: null,
        ipAddress: '203.0.113.42',
        verifierOrganisation: 'Employer Alpha',
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
    console.log('  ├─ Board TN    admin@tnboard.edu.in  /  Board@1234');
    console.log('  └─ Board KL    admin@keralaboard.edu.in / Board@5678');
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
