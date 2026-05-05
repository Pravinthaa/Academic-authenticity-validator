module.exports = {
  '1101001': {
    fileName: 'THIRUVARASAN_R_K.jpeg',

    steps: {
      ocr: {
        status: 'success',
        extracted_fields: {
          register_number: '2313150825',
          student_name: 'THIRUVARASAN R K',
          total_marks: '589',
          school_name: 'C E O A MATRIC HR SEC SCHOOL, A. KOSAKULAM',
          date_of_birth: '2006-10-15',
          emis_id: '2010843333',
          certificate_serial_no: '35141174'
        }
      },

      tamper_detection: {
        is_tampered: false,
        details: 'Authentic certificate'
      },

      seal_detection: {
        has_photo: true,
        has_candidate_signature: true,
        has_secretary_signature: true
      }
    },

    confidence: 0.97,

    institution: {
      name: 'C E O A MATRIC HR SEC SCHOOL, A. KOSAKULAM',
      id: 'inst-auth-1'
    }
  },

  '1101002': {
    fileName: 'KAVIN_V.jpeg',

    steps: {
      ocr: {
        status: 'success',
        extracted_fields: {
          register_number: '2313253348',
          student_name: 'KAVIN V',
          total_marks: '546',
          school_name: 'R.J MATRICULATION HR SEC SCHOOL, VILANKURICHI',
          date_of_birth: '2006-10-04',
          emis_id: '2011054590',
          certificate_serial_no: '35235707'
        }
      },

      tamper_detection: {
        is_tampered: false,
        details: 'Authentic certificate'
      },

      seal_detection: {
        has_photo: true,
        has_candidate_signature: true,
        has_secretary_signature: true
      }
    },

    confidence: 0.96,

    institution: {
      name: 'R.J MATRICULATION HR SEC SCHOOL, VILANKURICHI',
      id: 'inst-auth-2'
    }
  },
  '1101003': {
  fileName: 'NITHISH_S.jpeg',

  steps: {
    ocr: {
      status: 'success',
      extracted_fields: {
        register_number: '2313191764',
        student_name: 'NITHISH S',
        total_marks: '590',
        school_name: 'SMB MNP MATRIC HR SEC SCHOOL, DINDIGUL',
        date_of_birth: '2007-05-04',
        emis_id: '2006566426',
        certificate_serial_no: '35178612'
      }
    },

    tamper_detection: {
      is_tampered: false,
      details: 'Authentic certificate'
    },

    seal_detection: {
      has_photo: true,
      has_candidate_signature: true,
      has_secretary_signature: true
    }
  },

  confidence: 0.98,

  institution: {
    name: 'SMB MNP MATRIC HR SEC SCHOOL, DINDIGUL',
    id: 'inst-auth-3'
  }
}
};