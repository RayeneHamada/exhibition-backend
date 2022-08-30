const multer = require('multer');
const path = require('path');
const { S3Client } = require('@aws-sdk/client-s3')
const multerS3 = require('multer-s3')


const s3 = new S3Client({
  accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
});



exports.fileCloudUpload = multer({
  storage: multerS3({
    s3: s3,
    acl: 'public-read',
    bucket: process.env.AWS_S3_TEXTURE_BUCKET,
    metadata: function (req, file, cb) {
      cb(null, {
        fieldName: file.fieldname + '_' + Date.now()
          + path.extname(file.originalname)
      });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString())
    }
  })
})

const imageStorage = multer.diskStorage({
  // Destination to store image     
  destination: 'public',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '_' + Date.now()
      + path.extname(file.originalname))
    // file.fieldname is name of the field (image)
    // path.extname get the uploaded file extension
  }
});

exports.imageUpload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 10000000 // 1000000 Bytes = 1 MB
  }
})

const pdfStorage = multer.diskStorage({
  // Destination to store image     
  destination: 'public',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '_' + Date.now()
      + path.extname(file.originalname))
    // file.fieldname is name of the field (image)
    // path.extname get the uploaded file extension
  }
});

exports.pdfUpload = multer({
  storage: pdfStorage,
  limits: {
    fileSize: 100000000 // 1000000 Bytes = 1 MB
  }
})