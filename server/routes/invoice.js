import express from 'express'
import auth from '../middleware/auth.js'
import { getInvoice, getInvoices, addInvoice, addPayment, deleteInvoice, sendEmail } from '../controllers/invoice.js'
const router=express.Router()

router.get('/',getInvoices)
router.get('/:id',getInvoice)
router.post('/',addInvoice)
router.patch('/:id',addPayment)
router.delete('/:id',deleteInvoice)
router.post('/sendmail',sendEmail)

export default router