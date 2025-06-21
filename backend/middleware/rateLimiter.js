const rateLimit = require('express-rate-limit');
const limits = require('../config/limits');

const chatLimiter = rateLimit({
  windowMs: limits.chat.windowMs,    // 15 minutes
  max: limits.chat.maxRequests,      // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,             // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,              // Disable the `X-RateLimit-*` headers
});

const uploadLimiter = rateLimit({
  windowMs: limits.upload.windowMs,   // 1 hour
  max: limits.upload.maxRequests,     // 10 uploads per window
  message: 'Upload limit reached, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  chatLimiter,
  uploadLimiter
};
