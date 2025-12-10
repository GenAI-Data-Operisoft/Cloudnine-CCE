// pages/api/patients.js
import pool from '../../lib/db';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { search } = req.query;

      let query = `
        SELECT 
          patient_id,
          mpid,
          name,
          phone_number,
          email,
          customer_edd,
          lead_status,
          booking_status,
          first_pregnancy,
          customer_location,
          insurance_status,
          package_interest,
          follow_up_date,
          notes,
          created_date,
          last_updated
        FROM patients
      `;

      const params = [];
      if (search) {
        query += ` WHERE name ILIKE $1 OR phone_number ILIKE $2 OR mpid ILIKE $3`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      query += ' ORDER BY last_updated DESC';
      
      const result = await pool.query(query, params);
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { patient_id } = req.body;
      
      if (!patient_id) {
        return res.status(400).json({ error: 'Patient ID is required' });
      }

      const result = await pool.query(
        `SELECT * FROM patients WHERE patient_id = $1`,
        [patient_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      return res.status(200).json(result.rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error in patients API:', error);
    return res.status(500).json({ 
      error: 'Failed to process request', 
      details: error.message 
    });
  }
}