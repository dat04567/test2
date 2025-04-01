const { v4: uuidv4 } = require('uuid');
const Article = require('../models/article');
const { s3, cloudfrontDomain } = require('../config/aws');

// Hàm chuyển đổi URL S3 thành URL CloudFront
const getCloudFrontUrl = (s3Url) => {
  if (!cloudfrontDomain || !s3Url) return s3Url;
  try {
    // Nếu URL là placeholder hoặc không phải URL S3, trả về nguyên bản
    if (s3Url.startsWith('/')) return s3Url;
    // Trích xuất key từ S3 URL
    const url = new URL(s3Url);
    const key = url.pathname.substring(1); // Bỏ dấu / đầu tiên
    // Tạo CloudFront URL
    return `https://${cloudfrontDomain}/${key}`;
  } catch (error) {
    console.error('Error converting to CloudFront URL:', error);
    return s3Url;
  }
};

// Hiển thị tất cả bài báo
exports.getAllArticles = async (req, res, next) => {
  try {
    const articles = await Article.scan().exec();
    // Chuyển đổi URL S3 thành URL CloudFront
    const articlesWithCloudfront = articles.map(article => {
      const articleObj = article.toJSON ? article.toJSON() : article;
      return {
        ...articleObj,
        image: getCloudFrontUrl(articleObj.image)
      };
    });
    res.render('index', { articles: articlesWithCloudfront });
  } catch (error) {
    next(error);
  }
};

// Thêm bài báo mới
exports.addArticle = async (req, res, next) => {
  try {
    const { title, author, isbn, pages, year } = req.body;
    const id = uuidv4();
    // Lấy đường dẫn hình ảnh từ file đã upload
    let imagePath = '/placeholder.jpg';
    // Nếu có file upload (đã được xử lý bởi multer-s3)
    if (req.file) {
      // Lưu URL S3 vào database để dễ xử lý sau này
      imagePath = req.file.location;
    }
    // Tạo bài báo mới - ensure id is properly set
    const articleData = {
      id: id, // Make sure id is explicitly assigned
      title,
      author,
      isbn,
      pages: parseInt(pages) || 0, // Add fallback to prevent NaN
      year: parseInt(year) || 0,  // Add fallback to prevent NaN
      image: imagePath
    };
    const newArticle = new Article(articleData);
    // Lưu vào DynamoDB
    await newArticle.save();
    // Chuyển hướng về trang chủ
    res.redirect('/');
  } catch (error) {
    console.error('Error saving article:', error);
    next(error);
  }
};

// Xóa bài báo
exports.deleteArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Tìm bài báo cần xóa
    const article = await Article.get(id);
    // Nếu bài báo có hình ảnh không phải mặc định và đã lưu trên S3
    if (article && article.image && article.image.includes('amazonaws.com')) {
      // Lấy key của file từ URL
      const url = new URL(article.image);
      const key = url.pathname.substring(1); // Bỏ dấu / đầu tiên
      const params = {
        Bucket: process.env.S3_BUCKET_NAME || 'your-bucket-name',
        Key: key
      };
      // Xóa hình ảnh từ S3
      await s3.deleteObject(params).promise();
    }
    // Xóa bài báo từ DynamoDB
    await Article.delete(id);
    // Chuyển hướng về trang chủ
    res.redirect('/');
  } catch (error) {
    console.error('Lỗi khi xóa bài báo:', error);
    next(error);
  }
};

// Hiển thị form chỉnh sửa bài báo
exports.getEditArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Tìm bài báo cần chỉnh sửa
    const article = await Article.get(id);

    if (!article) {
      return res.status(404).send('Không tìm thấy bài báo');
    }

    // Chuyển đổi URL hình ảnh S3 sang CloudFront nếu có
    const articleWithCloudfront = {
      ...article,
      image: getCloudFrontUrl(article.image)
    };

    // Hiển thị form chỉnh sửa với dữ liệu bài báo hiện tại
    res.render('edit', { article: articleWithCloudfront });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin bài báo:', error);
    next(error);
  }
};

// Cập nhật bài báo
exports.updateArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, author, isbn, pages, year, currentImage } = req.body;

    // Tìm bài báo cần cập nhật
    const article = await Article.get(id);

    if (!article) {
      return res.status(404).send('Không tìm thấy bài báo');
    }

    // Xác định đường dẫn hình ảnh
    let imagePath = currentImage;

    // Nếu người dùng tải lên hình ảnh mới
    if (req.file) {
      // Lưu URL S3 mới
      imagePath = req.file.location;

      // Xóa hình ảnh cũ từ S3 (nếu không phải ảnh mặc định)
      if (article.image && article.image.includes('amazonaws.com')) {
        try {
          const url = new URL(article.image);
          const key = url.pathname.substring(1);
          const params = {
            Bucket: process.env.S3_BUCKET_NAME || 'your-bucket-name',
            Key: key
          };
          await s3.deleteObject(params).promise();
        } catch (error) {
          console.error('Lỗi khi xóa hình ảnh cũ:', error);
          // Không dừng luồng xử lý nếu không xóa được ảnh cũ
        }
      }
    }

    // Cập nhật thông tin bài báo
    const updatedArticleData = {
      id,
      title,
      author,
      isbn,
      pages: parseInt(pages) || 0,
      year: parseInt(year) || 0,
      image: imagePath
    };

    // Lưu thông tin cập nhật vào DynamoDB
    await Article.update(updatedArticleData);

    // Chuyển hướng về trang chủ
    res.redirect('/');
  } catch (error) {
    console.error('Lỗi khi cập nhật bài báo:', error);
    next(error);
  }
};

