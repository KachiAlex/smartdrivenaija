import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

// Search offences by keyword, code, or category
router.get('/search', async (req, res) => {
  try {
    const { q, category, severity } = req.query;
    
    let query = 'SELECT * FROM offences WHERE is_active = TRUE';
    const params = [];
    let paramCount = 0;
    
    if (q) {
      paramCount++;
      query += ` AND (code ILIKE $${paramCount} OR title ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${q}%`);
    }
    
    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }
    
    if (severity) {
      paramCount++;
      query += ` AND severity = $${paramCount}`;
      params.push(severity);
    }
    
    query += ' ORDER BY code ASC LIMIT 50';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching offences:', error);
    res.status(500).json({ error: 'Failed to search offences' });
  }
});

// Get offence by code
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM offences WHERE code = $1 AND is_active = TRUE',
      [code]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Offence not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching offence:', error);
    res.status(500).json({ error: 'Failed to fetch offence' });
  }
});

// Get all offence categories
router.get('/meta/categories', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT category FROM offences WHERE is_active = TRUE ORDER BY category'
    );
    
    res.json(result.rows.map(row => row.category));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get penalty information for an offence
router.get('/:code/penalty', async (req, res) => {
  try {
    const { code } = req.params;
    
    const result = await pool.query(
      'SELECT code, title, penalty_amount, penalty_points, severity, section FROM offences WHERE code = $1 AND is_active = TRUE',
      [code]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Offence not found' });
    }
    
    const offence = result.rows[0];
    
    res.json({
      offence_code: offence.code,
      offence_title: offence.title,
      penalty_amount: offence.penalty_amount,
      penalty_points: offence.penalty_points,
      severity: offence.severity,
      regulation_section: offence.section,
      payment_deadline: '30 days from offence date',
      payment_methods: ['Bank Transfer', 'POS at FRSC Office', 'Online Payment'],
      consequences: {
        points_accumulation: 'Accumulating 12+ points may lead to license suspension',
        non_payment: 'Additional fines and potential court action',
        license_suspension: 'For critical offences or repeated violations'
      }
    });
  } catch (error) {
    console.error('Error fetching penalty info:', error);
    res.status(500).json({ error: 'Failed to fetch penalty info' });
  }
});

// Get legal guidance for an offence
router.get('/:code/guidance', async (req, res) => {
  try {
    const { code } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM offences WHERE code = $1 AND is_active = TRUE',
      [code]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Offence not found' });
    }
    
    const offence = result.rows[0];
    
    // Generate legal guidance based on offence type
    let guidance = {
      offence_summary: offence.description,
      legal_basis: `FRSC Regulation Section ${offence.section}`,
      severity_level: offence.severity,
      immediate_actions: [],
      legal_rights: [
        'You have the right to request identification from the officer',
        'You have the right to understand the charge against you',
        'You have the right to a fair hearing if you dispute the charge'
      ],
      next_steps: [],
      resources: []
    };
    
    // Customize guidance based on category
    switch (offence.category) {
      case 'documentation':
        guidance.immediate_actions = [
          'Present valid documents if available',
          'Request time to produce missing documents (usually 24-48 hours)',
          'Get the officer\'s name and badge number'
        ];
        guidance.next_steps = [
          'Renew expired documents immediately',
          'Visit FRSC office for replacement of lost documents',
          'Keep copies of all documents in your vehicle'
        ];
        guidance.resources = [
          'FRSC Licensing Office',
          'Vehicle Inspection Center',
          'Insurance Provider'
        ];
        break;
        
      case 'speeding':
        guidance.immediate_actions = [
          'Accept the ticket if the evidence is clear',
          'Note the location and alleged speed',
          'Request calibration records of speed detection device'
        ];
        guidance.next_steps = [
          'Pay the fine within 30 days to avoid additional penalties',
          'Attend defensive driving course if offered',
          'Appeal if you believe the speed reading was incorrect'
        ];
        guidance.resources = [
          'FRSC Traffic Court',
          'Defensive Driving Programs',
          'Legal Aid Services'
        ];
        break;
        
      case 'equipment':
        guidance.immediate_actions = [
          'Acknowledge the equipment defect',
          'Arrange for immediate repair if safety-critical',
          'Do not drive if vehicle is unsafe'
        ];
        guidance.next_steps = [
          'Repair or replace defective equipment',
          'Get vehicle inspected at approved center',
          'Keep maintenance records'
        ];
        guidance.resources = [
          'FRSC Vehicle Inspection',
          'Licensed Mechanics',
          'Auto Parts Suppliers'
        ];
        break;
        
      case 'behavior':
        guidance.immediate_actions = [
          'Remain calm and cooperative',
          'Do not argue with the officer',
          'Document the incident if possible'
        ];
        guidance.next_steps = [
          'Reflect on driving behavior',
          'Consider counseling if alcohol/drug-related',
          'Attend traffic safety programs'
        ];
        guidance.resources = [
          'Traffic Safety Programs',
          'Counseling Services',
          'Legal Representation'
        ];
        break;
        
      default:
        guidance.immediate_actions = [
          'Cooperate with the officer',
          'Understand the charge',
          'Request clarification if needed'
        ];
        guidance.next_steps = [
          'Pay the fine or contest the charge',
          'Address the root cause',
          'Improve driving habits'
        ];
        guidance.resources = [
          'FRSC Office',
          'Legal Aid',
          'Traffic Safety Resources'
        ];
    }
    
    res.json(guidance);
  } catch (error) {
    console.error('Error fetching legal guidance:', error);
    res.status(500).json({ error: 'Failed to fetch legal guidance' });
  }
});

// Get all offences (paginated)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, severity } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM offences WHERE is_active = TRUE';
    const params = [];
    let paramCount = 0;
    
    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }
    
    if (severity) {
      paramCount++;
      query += ` AND severity = $${paramCount}`;
      params.push(severity);
    }
    
    query += ` ORDER BY code ASC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM offences WHERE is_active = TRUE';
    const countParams = [];
    let countParamCount = 0;
    
    if (category) {
      countParamCount++;
      countQuery += ` AND category = $${countParamCount}`;
      countParams.push(category);
    }
    
    if (severity) {
      countParamCount++;
      countQuery += ` AND severity = $${countParamCount}`;
      countParams.push(severity);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      offences: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching offences:', error);
    res.status(500).json({ error: 'Failed to fetch offences' });
  }
});

export default router;
