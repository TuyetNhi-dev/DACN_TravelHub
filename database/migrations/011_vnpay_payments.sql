-- 011_vnpay_payments.sql
-- Extends the payments table to support VNPAY sandbox in addition to the simulated gateway.
-- Run AFTER 010 on the operator-selected database.
--
-- Changes:
--   1. gateway_meta JSON column — stores raw callback params (IPN or ReturnUrl) for audit and
--      diagnosis. NULL for simulated payments. Never contains the HashSecret.
--   2. payments.status gains 'refund_needed' — set when VNPAY confirms money was collected but the
--      tour hold had already expired and seats were released. Requires manual refund via the VNPAY
--      merchant dashboard; this system cannot auto-refund.
--
-- Existing status values preserved from 001_initial_schema.sql:
--   'pending', 'succeeded', 'failed', 'cancelled'

ALTER TABLE payments
  ADD COLUMN gateway_meta JSON NULL
      COMMENT 'Raw VNPAY callback params (IPN or ReturnUrl). NULL for simulated payments.'
      AFTER currency,
  MODIFY COLUMN status
      ENUM('pending','succeeded','failed','cancelled','refund_needed') NOT NULL DEFAULT 'pending';
