// pages/api/patients.js
import pool from '@/lib/db';

export default async function handler(req, res) {
  let connection;

  try {
    // GET - Fetch all patients (with optional search)
    if (req.method === 'GET') {
      const { search } = req.query;

      connection = await pool.getConnection();

      let query = `
        SELECT 
          patient_id,
          patient_name,
          age,
          gender,
          phone_number,
          email,
          weight,
          height,
          bmi,
          blood_group,
          allergies,
          medical_history,
          current_medication,
          customer_edd,
          booking_status,
          lead_status,
          created_at,
          updated_at
        FROM patients
      `;

      const params = [];

      // Add search filter if search term provided
      if (search) {
        query += `
          WHERE 
            patient_name LIKE ? OR 
            phone_number LIKE ? OR 
            patient_id LIKE ?
        `;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      // Order by most recent first
      query += ' ORDER BY updated_at DESC, created_at DESC';

      const [rows] = await connection.execute(query, params);

      // Parse JSON fields if they're stored as strings
      const patients = rows.map(patient => ({
        ...patient,
        allergies: typeof patient.allergies === 'string'
          ? JSON.parse(patient.allergies || '[]')
          : patient.allergies || [],
        medical_history: typeof patient.medical_history === 'string'
          ? JSON.parse(patient.medical_history || '[]')
          : patient.medical_history || [],
        current_medication: typeof patient.current_medication === 'string'
          ? JSON.parse(patient.current_medication || '[]')
          : patient.current_medication || []
      }));

      return res.status(200).json(patients);
    }

    // POST - Get single patient by ID
    if (req.method === 'POST') {
      const { patient_id } = req.body;

      if (!patient_id) {
        return res.status(400).json({ error: 'Patient ID is required' });
      }

      connection = await pool.getConnection();

      const [rows] = await connection.execute(
        `SELECT 
          patient_id,
          patient_name,
          age,
          gender,
          phone_number,
          email,
          weight,
          height,
          bmi,
          blood_group,
          allergies,
          medical_history,
          current_medication,
          customer_edd,
          booking_status,
          lead_status,
          created_at,
          updated_at
        FROM patients 
        WHERE patient_id = ?`,
        [patient_id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      const patient = rows[0];

      // Parse JSON fields
      patient.allergies = typeof patient.allergies === 'string'
        ? JSON.parse(patient.allergies || '[]')
        : patient.allergies || [];
      patient.medical_history = typeof patient.medical_history === 'string'
        ? JSON.parse(patient.medical_history || '[]')
        : patient.medical_history || [];
      patient.current_medication = typeof patient.current_medication === 'string'
        ? JSON.parse(patient.current_medication || '[]')
        : patient.current_medication || [];

      return res.status(200).json(patient);
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error in patients API:', error);
    return res.status(500).json({
      error: 'Failed to process request',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
}