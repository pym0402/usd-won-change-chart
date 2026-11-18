-- CreateIndex
CREATE INDEX "ledger_entries_referenceId_idx" ON "ledger_entries"("referenceId");

-- CreateIndex
CREATE INDEX "ledger_entries_referenceType_idx" ON "ledger_entries"("referenceType");

-- CreateIndex
CREATE INDEX "ledger_entries_accountType_idx" ON "ledger_entries"("accountType");

-- CreateIndex
CREATE INDEX "ledger_entries_createdAt_idx" ON "ledger_entries"("createdAt");

-- CreateIndex
CREATE INDEX "merchant_settlements_merchantId_idx" ON "merchant_settlements"("merchantId");

-- CreateIndex
CREATE INDEX "merchant_settlements_status_idx" ON "merchant_settlements"("status");

-- CreateIndex
CREATE INDEX "merchant_settlements_createdAt_idx" ON "merchant_settlements"("createdAt");

-- CreateIndex
CREATE INDEX "payments_merchantId_idx" ON "payments"("merchantId");

-- CreateIndex
CREATE INDEX "payments_customerId_idx" ON "payments"("customerId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_createdAt_idx" ON "payments"("createdAt");

-- CreateIndex
CREATE INDEX "point_transactions_walletId_idx" ON "point_transactions"("walletId");

-- CreateIndex
CREATE INDEX "point_transactions_type_idx" ON "point_transactions"("type");

-- CreateIndex
CREATE INDEX "point_transactions_createdAt_idx" ON "point_transactions"("createdAt");
