import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/pool.js';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const router = Router();
router.use(authenticate);

// Encryption configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32); // 32 bytes for AES-256
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

// Derive key from password using PBKDF2
function getKey(salt) {
  return crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha256');
}

// Encrypt buffer
function encrypt(buffer) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey(salt);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  return Buffer.concat([salt, iv, tag, encrypted]);
}

// Decrypt buffer
function decrypt(buffer) {
  const salt = buffer.slice(0, SALT_LENGTH);
  const iv = buffer.slice(SALT_LENGTH, TAG_POSITION);
  const tag = buffer.slice(TAG_POSITION, ENCRYPTED_POSITION);
  const encrypted = buffer.slice(ENCRYPTED_POSITION);
  
  const key = getKey(salt);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images and PDFs are allowed'));
  },
});

// GET /wallet - Get all user documents
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT id, document_type, document_name, expiry_date, file_url, created_at
       FROM driver_documents
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /wallet/upload - Upload a document
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { documentType, documentName, expiryDate } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    if (!documentType || !documentName) {
      return res.status(400).json({ error: 'Document type and name are required' });
    }
    
    // Encrypt file data before storage
    const encryptedData = encrypt(file.buffer);
    
    // TODO: Upload file to cloud storage (S3, Cloudflare R2, etc.)
    // For now, we'll store a placeholder URL
    const fileUrl = `https://storage.smartdrivenaija.com/documents/${userId}/${Date.now()}-${file.originalname}`;
    
    const result = await pool.query(
      `INSERT INTO driver_documents (user_id, document_type, document_name, expiry_date, file_url, file_data)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, document_type, document_name, expiry_date, file_url, created_at`,
      [userId, documentType, documentName, expiryDate || null, fileUrl, encryptedData]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /wallet/:id - Update document (expiry date, etc.)
router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const documentId = parseInt(req.params.id);
    const { expiryDate, documentName } = req.body;
    
    const result = await pool.query(
      `UPDATE driver_documents
       SET expiry_date = COALESCE($1, expiry_date),
           document_name = COALESCE($2, document_name),
           updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING id, document_type, document_name, expiry_date, file_url, created_at`,
      [expiryDate || null, documentName, documentId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /wallet/:id - Delete a document
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const documentId = parseInt(req.params.id);
    
    const result = await pool.query(
      `DELETE FROM driver_documents
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [documentId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// GET /wallet/:id/download - Download and decrypt a document
router.get('/:id/download', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const documentId = parseInt(req.params.id);
    
    const result = await pool.query(
      `SELECT id, document_type, document_name, file_data, file_url
       FROM driver_documents
       WHERE id = $1 AND user_id = $2`,
      [documentId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const document = result.rows[0];
    
    if (!document.file_data) {
      return res.status(404).json({ error: 'No file data available' });
    }
    
    // Decrypt file data
    const decryptedData = decrypt(document.file_data);
    
    // Determine content type based on document type or file URL
    const contentType = document.file_url?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.document_name}"`);
    res.send(decryptedData);
  } catch (err) {
    next(err);
  }
});

// GET /wallet/compliance - Get compliance status
router.get('/compliance', async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_documents,
        COUNT(CASE WHEN expiry_date > NOW() OR expiry_date IS NULL THEN 1 END) as valid_documents,
        COUNT(CASE WHEN expiry_date <= NOW() THEN 1 END) as expired_documents,
        COUNT(CASE WHEN expiry_date BETWEEN NOW() AND NOW() + INTERVAL '30 days' THEN 1 END) as expiring_soon
       FROM driver_documents
       WHERE user_id = $1`,
      [userId]
    );
    
    const stats = result.rows[0];
    const compliancePercentage = stats.total_documents > 0 
      ? (stats.valid_documents / stats.total_documents) * 100 
      : 0;
    
    res.json({
      totalDocuments: parseInt(stats.total_documents),
      validDocuments: parseInt(stats.valid_documents),
      expiredDocuments: parseInt(stats.expired_documents),
      expiringSoon: parseInt(stats.expiring_soon),
      compliancePercentage: Math.round(compliancePercentage),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
