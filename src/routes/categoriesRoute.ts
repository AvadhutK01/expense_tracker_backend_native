import { Router } from 'express';
import {
  initiateCategories,
  addNewCategories,
  updateCategories,
  updateSingleCategory,
  getAllCategories,
  payLoanAmount,
} from '../controllers/categoryController.js';

const router = Router();

/**
 * @route   POST   /categories/initiate
 * @desc    Initialize all categories (clears existing and inserts new)
 */
router.post('/initiate', initiateCategories);

/**
 * @route   POST   /categories
 * @desc    Add new categories (both permanent & recurring)
 */
router.post('/', addNewCategories);

/**
 * @route   PUT    /categories
 * @desc    Bulk-update categories (permanent or temporary)
 * @body    { mode: 'permanent' | 'temporary', categories: [{ name, amount }] }
 */
router.put('/', updateCategories);

/**
 * @route   PATCH  /categories
 * @desc    Update a single category amount (add/subtract)
 * @body    { name, amount, type: 'add' | 'subtract' }
 */
router.patch('/', updateSingleCategory);

/**
 * @route   GET    /categories
 * @desc    Fetch all categories
 */
router.get('/', getAllCategories);

/**
 * @route   POST   /categories/pay-loan
 * @desc    Pay down loan from a specific category
 * @body    { name, amount }
 */
router.post('/pay-loan', payLoanAmount);

export default router;
