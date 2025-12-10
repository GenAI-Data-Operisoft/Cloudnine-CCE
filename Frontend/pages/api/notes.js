// pages/api/notes.js
import pool from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patient_id } = req.query;

  if (!patient_id) {
    return res.status(400).json({ error: 'Patient ID is required' });
  }

  try {
    // Query to fetch notes for the given patient_id
    const query = `
      SELECT 
        note_id,
        patient_id,
        session_id,
        note_text,
        created_by,
        created_date
      FROM cce_notes
      WHERE patient_id = $1
      ORDER BY created_date DESC
    `;

    const result = await pool.query(query, [patient_id]);

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch notes',
      details: error.message 
    });
  }
}