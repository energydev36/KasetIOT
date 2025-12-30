const express = require('express');
const {
  getAllTemplates,
  getTemplateDetail,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} = require('../controllers/templateController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllTemplates);
router.get('/:id', getTemplateDetail);
router.post('/', authMiddleware, createTemplate);
router.put('/:id', authMiddleware, updateTemplate);
router.delete('/:id', authMiddleware, deleteTemplate);

module.exports = router;
