const AWS = require('aws-sdk');
const dynamoose = require('dynamoose');
require('dotenv').config();

// Cấu hình AWS SDK
const configAWS = () => {
  dynamoose.aws.sdk = AWS;
  console.log('AWS configuration loaded');
};

// Khởi tạo S3 client
const s3 = new AWS.S3();

const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN || '';



module.exports = { configAWS, s3, cloudfrontDomain };
