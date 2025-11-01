import { Router } from 'express';
import {
  initiateCategories,
  addNewCategories,
  updateCategories,
  updateSingleCategory,
  getAllCategories,
  payLoanAmount,
  cronController,
  bankEmiDebitCron,
  deleteCategory,
  revertLatestTransaction,
  createOrUpdateNote,
  getNote,
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
 * @route   PATCH   /categories
 * @desc    Update a single category (permanent or temporary)
 * @body    { name, amount, type: 'add' | 'subtract' }
 */
router.patch('/', updateSingleCategory);

/**
 * @route   GET    /categories
 * @desc    Fetch all categories
 */
router.get('/', getAllCategories);

/**
 * @route   DELETE  /categories
 * @desc    Delete a category
 * @body    { name }
 */
router.post('/delete-categories', deleteCategory);

/**
 * @route   POST   /categories/pay-loan
 * @desc    Pay down loan from a specific category
 * @body    { name, amount }
 */
router.post('/pay-loan', payLoanAmount);

router.post('/revert-latest-transaction', revertLatestTransaction);

router.post('/note', createOrUpdateNote);

router.get('/note', getNote);

router.get('/run-cron', cronController);

router.get("/run-emi-debit-cron", bankEmiDebitCron);

export default router;
