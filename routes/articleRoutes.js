const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const upload = require('../utils/upload');

router.get('/', articleController.getAllArticles);
router.post('/add-article', upload.single('image'), articleController.addArticle);
router.post('/delete-article/:id', articleController.deleteArticle);


router.get('/edit-article/:id', articleController.getEditArticle);
router.post('/update-article/:id', upload.single('image'), articleController.updateArticle);

module.exports = router;
