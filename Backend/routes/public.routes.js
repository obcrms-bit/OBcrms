const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/public.controller');

const router = express.Router();

const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many public submissions from this IP. Please try again later.',
  },
});

router.get('/branding', controller.getBranding);
router.get('/forms/:slug', controller.getPublicForm);
router.post('/forms/:slug/submit', publicFormLimiter, controller.submitPublicForm);
router.get('/qr/:id', controller.getQRCodeLanding);

module.exports = router;
