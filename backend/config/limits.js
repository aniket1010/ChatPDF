module.exports = {
  chat: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 100           // 100 requests per window
  },
  upload: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 10,           // 10 uploads per hour
    maxFileSize: 100 * 1024 * 1024  // 100MB in bytes (increased for large PDFs)
  }
};
