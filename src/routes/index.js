```javascript
import express from 'express';
import authRoutes from './auth.routes.js';
import boardRoutes from './board.routes.js';
import listRoutes from './list.routes.js';
import cardRoutes from './card.routes.js';
import teamRoutes from './team.routes.js';
import templateRoutes from './template.routes.js';
import searchRoutes from './search.routes.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

// Public routes
router.use('/auth', apiLimiter, authRoutes);

// Protected routes - require JWT authentication
router.use('/boards', authenticateJWT, boardRoutes);
router.use('/lists', authenticateJWT, listRoutes);
router.use('/cards', authenticateJWT, cardRoutes);
router.use('/teams', authenticateJWT, teamRoutes);
router.use('/templates', authenticateJWT, templateRoutes);
router.use('/search', authenticateJWT, searchRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found'
  });
});

// Global error handler
router.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: err.errors
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  });
});

export default router;
```