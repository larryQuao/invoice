import express from 'express';
import {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  generatePDF,
  emailInvoice,
} from '../controllers/invoiceController.js';

const router = express.Router();

router.post('/', createInvoice);
router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);
router.get('/:id/pdf', generatePDF);
router.post('/:id/email', emailInvoice);

export default router;
