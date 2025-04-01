const multer = require('multer');
const multerS3 = require('multer-s3');
const { s3, } = require('../config/aws');
const { v4: uuidv4 } = require('uuid');

// Cấu hình S3 bucket name
const bucketName = process.env.S3_BUCKET_NAME || 'your-bucket-name';

// Cấu hình storage cho multer sử dụng S3
const s3Storage = multerS3({
  s3: s3,
  bucket: bucketName,
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    const fileName = `articles/${uuidv4()}-${file.originalname}`;
    cb(null, fileName);
  },
  contentType: multerS3.AUTO_CONTENT_TYPE, // Tự động xác định content-type
  cacheControl: 'max-age=31536000' // Cache trong 1 năm
});

// Filter: chỉ chấp nhận các file hình ảnh
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Không hỗ trợ định dạng file này'), false);
  }
};

// Cấu hình upload
const upload = multer({
  storage: s3Storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // giới hạn 5MB
  }
});

module.exports = upload;
