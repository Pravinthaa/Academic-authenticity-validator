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
const dotenv = require('dotenv');

// Load env vars from parent directory
dotenv.config({ path: require('path').join(__dirname, '../.env') });

const User = require('../models/User');
const Certificate = require('../models/Certificate');
const VerificationLog = require('../models/VerificationLog');
const tamperedMocks = require('../mocks/tamperedMocks');
const untamperedMocks = require('../mocks/untamperedMocks');

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
      const user = await User.create({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        institutionDetails: userData.institutionDetails
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
    console.log('\n🔍 Seeding verification logs with mock data...');
    const verifierUser = insertedUsers.find((u) => u.email === 'priya@hrfirm.com');
    const adminUser = insertedUsers.find((u) => u.role === 'admin');

    // Generate logs with various results spanning 30 days
    const verificationLogs = [];
    const baseDate = new Date();

    // Valid certificates (60% of queries)
    for (let i = 0; i < 24; i++) {
      verificationLogs.push({
        certificate: insertedCerts[i % insertedCerts.length]._id,
        queryValue: insertedCerts[i % insertedCerts.length].certificateId,
        queryType: 'certificateId',
        result: 'found',
        verifiedBy: verifierUser?._id || null,
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        verifierOrganisation: ['HR Tech Solutions', 'TCS Recruitment', 'Infosys HR', 'Accenture Talent'][Math.floor(Math.random() * 4)],
        createdAt: new Date(baseDate.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      });
    }

    // Suspicious certificates (15% of queries)
    for (let i = 0; i < 6; i++) {
      verificationLogs.push({
        certificate: insertedCerts[i % insertedCerts.length]._id,
        queryValue: '999-FAKE-' + Math.random().toString(36).substring(7),
        queryType: 'rollNumber',
        result: 'suspicious',
        verifiedBy: adminUser?._id || null,
        ipAddress: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        verifierOrganisation: 'Verification Department',
        metadata: { suspicionReason: 'Document quality degradation detected' },
        createdAt: new Date(baseDate.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      });
    }

    // Fraudulent certificates (10% of queries)
    for (let i = 0; i < 4; i++) {
      verificationLogs.push({
        certificate: insertedCerts[i % insertedCerts.length]._id,
        queryValue: 'FORGED-' + (i + 1),
        queryType: 'upload',
        result: 'fraud',
        verifiedBy: adminUser?._id || null,
        ipAddress: `172.16.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        verifierOrganisation: 'Anti-Fraud Unit',
        metadata: { fraudType: 'Seal tampering', confidence: 0.95 },
        createdAt: new Date(baseDate.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      });
    }

    // Not found / Invalid certificates (10% of queries)
    for (let i = 0; i < 4; i++) {
      verificationLogs.push({
        certificate: null,
        queryValue: 'INVALID-CERT-' + (i + 1),
        queryType: 'certificateId',
        result: 'not_found',
        verifiedBy: verifierUser?._id || null,
        ipAddress: `203.0.113.${Math.floor(Math.random() * 255)}`,
        verifierOrganisation: 'External Verifier',
        createdAt: new Date(baseDate.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      });
    }

    // Revoked certificates (5% of queries)
    for (let i = 0; i < 2; i++) {
      verificationLogs.push({
        certificate: insertedCerts[i % insertedCerts.length]._id,
        queryValue: 'REVOKED-' + (i + 1),
        queryType: 'certificateId',
        result: 'revoked',
        verifiedBy: adminUser?._id || null,
        ipAddress: `198.51.100.${Math.floor(Math.random() * 255)}`,
        verifierOrganisation: 'Certificate Authority',
        metadata: { revocationReason: 'Duplicate issuance detected' },
        createdAt: new Date(baseDate.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      });
    }

    const insertedLogs = await VerificationLog.insertMany(verificationLogs);
    console.log(`   ✅ ${insertedLogs.length} verification log entries created.`);

    // ── Insert Mock Samples (tampered & untampered) ─────────────────────────
    console.log('\n🧪 Seeding mock tampered/untampered samples...');
    const mockCertMap = {};

    // First, create certificates for untampered mocks
    const fallbackInstitution = insertedUsers.find((u) => u.role === 'institution')?._id || null;
    for (const key of Object.keys(untamperedMocks)) {
      const m = untamperedMocks[key];
      const certData = {
        institution: fallbackInstitution,
        studentName: m.steps.ocr.extracted_fields.student_name,
        rollNumber: m.steps.ocr.extracted_fields.register_number,
        registerNumber: m.steps.ocr.extracted_fields.register_number,
        emisId: m.steps.ocr.extracted_fields.emis_id,
        certificateSerialNo: m.steps.ocr.extracted_fields.certificate_serial_no,
        sessionAndYear: m.steps.ocr.extracted_fields.sessionAndYear || 'MAR 2024',
        dateOfBirth: new Date(m.steps.ocr.extracted_fields.date_of_birth),
        course: m.course || 'Higher Secondary Course (Class 12)',
        schoolName: m.steps.ocr.extracted_fields.school_name,
        graduationYear: 2024,
        totalMarks: m.steps.ocr.extracted_fields.total_marks,
        certificateId: m.steps.ocr.extracted_fields.certificate_serial_no || key,
        issueDate: new Date(),
        status: 'active',
        hasPhoto: !!m.steps.seal_detection?.has_photo,
        hasCandidateSignature: !!m.steps.seal_detection?.has_candidate_signature,
        hasSecretarySignature: !!m.steps.seal_detection?.has_secretary_signature,
        aiConfidence: typeof m.confidence === 'number' ? m.confidence : 0,
        ocrData: {
          extractedText: JSON.stringify(m.steps.ocr.extracted_fields),
          confidence: typeof m.confidence === 'number' ? m.confidence : 0,
          extractedAt: new Date()
        }
      };

      try {
        const cert = await Certificate.create(certData);
        mockCertMap[key] = cert._id;
        // create a matching verification log (authentic)
        await VerificationLog.create({
          certificate: cert._id,
          queryValue: key,
          queryType: 'certificateId',
          result: 'found',
          verifiedBy: null,
          ipAddress: '127.0.0.1',
          verifierOrganisation: m.institution?.name || 'Mock Institution',
          metadata: {
            steps: JSON.stringify(m.steps),
            confidence: String(m.confidence ?? '')
          },
          aiExtractions: {
            studentName: m.steps.ocr.extracted_fields.student_name,
            registerNumber: m.steps.ocr.extracted_fields.register_number,
            emisId: m.steps.ocr.extracted_fields.emis_id,
            totalMarks: m.steps.ocr.extracted_fields.total_marks,
            dateOfBirth: m.steps.ocr.extracted_fields.date_of_birth,
            schoolName: m.steps.ocr.extracted_fields.school_name
          },
          visualVerification: {
            photoMatch: true,
            candidateSignatureMatch: true,
            secretarySignatureMatch: true,
            isTampered: false
          },
          confidence: typeof m.confidence === 'number' ? m.confidence : 0,
          createdAt: new Date()
        });
      } catch (err) {
        // Handle duplicate certificate (already inserted earlier) by linking to existing
        if (err && err.code === 11000) {
          try {
            const existing = await Certificate.findOne({ certificateId: certData.certificateId });
            if (existing) {
              mockCertMap[key] = existing._id;
              await VerificationLog.create({
                certificate: existing._id,
                queryValue: key,
                queryType: 'certificateId',
                result: 'found',
                verifiedBy: null,
                ipAddress: '127.0.0.1',
                verifierOrganisation: m.institution?.name || 'Mock Institution',
                metadata: {
                  steps: JSON.stringify(m.steps),
                  confidence: String(m.confidence ?? '')
                },
                aiExtractions: {
                  studentName: m.steps.ocr.extracted_fields.student_name,
                  registerNumber: m.steps.ocr.extracted_fields.register_number,
                  emisId: m.steps.ocr.extracted_fields.emis_id,
                  totalMarks: m.steps.ocr.extracted_fields.total_marks,
                  dateOfBirth: m.steps.ocr.extracted_fields.date_of_birth,
                  schoolName: m.steps.ocr.extracted_fields.school_name
                },
                visualVerification: {
                  photoMatch: true,
                  candidateSignatureMatch: true,
                  secretarySignatureMatch: true,
                  isTampered: false
                },
                confidence: typeof m.confidence === 'number' ? m.confidence : 0,
                createdAt: new Date()
              });
            }
          } catch (e) {
            console.warn('Failed to link to existing certificate for mock', key, e.message);
          }
        } else {
          console.warn('Failed to insert mock untampered cert', key, err.message);
        }
      }
    }

    // Next, create logs for tampered mocks (link to existing cert if possible)
    for (const key of Object.keys(tamperedMocks)) {
      const m = tamperedMocks[key];
      const linkedCertId = mockCertMap[key] || null;
      const result = m.steps.tamper_detection?.is_tampered ? 'suspicious' : 'found';

      try {
        await VerificationLog.create({
          certificate: linkedCertId,
          queryValue: key,
          queryType: 'upload',
          result,
          verifiedBy: null,
          ipAddress: '127.0.0.' + Math.floor(Math.random() * 255),
          verifierOrganisation: m.institution?.name || 'Mock Institution',
          metadata: {
            tamper_details: m.steps.tamper_detection?.details || '',
            steps: JSON.stringify(m.steps),
            confidence: String(m.confidence ?? '')
          },
          aiExtractions: {
            studentName: m.steps.ocr.extracted_fields.student_name,
            registerNumber: m.steps.ocr.extracted_fields.register_number,
            emisId: m.steps.ocr.extracted_fields.emis_id,
            totalMarks: m.steps.ocr.extracted_fields.total_marks,
            dateOfBirth: m.steps.ocr.extracted_fields.date_of_birth,
            schoolName: m.steps.ocr.extracted_fields.school_name
          },
          visualVerification: {
            photoMatch: !!m.steps.seal_detection?.has_photo,
            candidateSignatureMatch: !!m.steps.seal_detection?.has_candidate_signature,
            secretarySignatureMatch: !!m.steps.seal_detection?.has_secretary_signature,
            isTampered: !!m.steps.tamper_detection?.is_tampered
          },
          confidence: typeof m.confidence === 'number' ? m.confidence : 0,
          createdAt: new Date()
        });
      } catch (err) {
        console.warn('Failed to insert mock tampered log', key, err.message);
      }
    }

    console.log('   ✅ Mock samples seeded (tampered & untampered).');

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
