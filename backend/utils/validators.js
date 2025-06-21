const limits = require('../config/limits');

const validateFileType = (mimetype) => {
  return mimetype === 'application/pdf';
};

const validateFileSize = (size) => {
  return size <= limits.upload.maxFileSize;
};

module.exports = {
  validateFileType,
  validateFileSize
};
