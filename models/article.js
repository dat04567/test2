const dynamoose = require('dynamoose');

const Schema = dynamoose.Schema;

const ArticleSchema = new Schema({
  id: {
    type: String,
    hashKey: true
  },
  title: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  isbn: {
    type: String,
    required: true
  },
  pages: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    required: true
  }
});


module.exports = dynamoose.model('Article', ArticleSchema, {
  create: true,
  waitForActive: true,
});
