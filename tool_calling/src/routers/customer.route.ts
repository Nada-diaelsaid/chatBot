import express from "express";
import CustomerController from "../controllers/customer.controller.ts";

const router = express.Router();

router.get('/customers', CustomerController.getAllCustomers);
router.get('/customers/:id', CustomerController.getCustomerById);

export default router;