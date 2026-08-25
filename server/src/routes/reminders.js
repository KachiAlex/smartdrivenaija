import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

// Get all reminders for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT r.*, d.document_type, d.document_name, d.expiry_date 
       FROM reminders r 
       LEFT JOIN driver_documents d ON r.document_id = d.id 
       WHERE r.user_id = $1 
       ORDER BY r.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// Mark reminder as read
router.put('/:id/read', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE reminders 
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error marking reminder as read:', error);
    res.status(500).json({ error: 'Failed to mark reminder as read' });
  }
});

// Delete a reminder
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const result = await pool.query(
      `DELETE FROM reminders 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    res.json({ message: 'Reminder deleted' });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

// Create reminder (internal use)
router.post('/create', async (req, res) => {
  try {
    const { user_id, document_id, reminder_type, days_before_expiry, message } = req.body;
    
    const result = await pool.query(
      `INSERT INTO reminders (user_id, document_id, reminder_type, days_before_expiry, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, document_id, reminder_type, days_before_expiry, message]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

// Check and create expiry reminders (scheduled job endpoint)
router.post('/check-expiry', async (req, res) => {
  try {
    // Get all documents expiring soon
    const result = await pool.query(
      `SELECT d.id, d.user_id, d.document_type, d.document_name, d.expiry_date,
              EXISTS(SELECT 1 FROM reminders r WHERE r.document_id = d.id AND r.days_before_expiry = $1) as reminder_exists
       FROM driver_documents d
       WHERE d.expiry_date IS NOT NULL
       AND d.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'`,
      [90]
    );
    
    const reminderThresholds = [90, 60, 30, 7, 1];
    const createdReminders = [];
    
    for (const doc of result.rows) {
      const expiryDate = new Date(doc.expiry_date);
      const today = new Date();
      const diffTime = Math.abs(expiryDate - today);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      for (const threshold of reminderThresholds) {
        if (diffDays === threshold && !doc.reminder_exists) {
          const message = `Your ${doc.document_name} (${doc.document_type}) expires in ${threshold} day(s). Please renew it before ${expiryDate.toLocaleDateString()}.`;
          
          const reminderResult = await pool.query(
            `INSERT INTO reminders (user_id, document_id, reminder_type, days_before_expiry, message)
             VALUES ($1, $2, 'expiry', $3, $4)
             RETURNING *`,
            [doc.user_id, doc.id, threshold, message]
          );
          
          createdReminders.push(reminderResult.rows[0]);
        }
      }
    }
    
    res.json({ 
      message: 'Expiry check completed',
      remindersCreated: createdReminders.length,
      reminders: createdReminders
    });
  } catch (error) {
    console.error('Error checking expiry reminders:', error);
    res.status(500).json({ error: 'Failed to check expiry reminders' });
  }
});

export default router;
