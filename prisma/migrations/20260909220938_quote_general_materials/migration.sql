-- AlterTable
ALTER TABLE "QuoteMaterial" ADD COLUMN     "baseQuantity" DECIMAL(12,3),
ADD COLUMN     "categoryName" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "quoteId" TEXT,
ADD COLUMN     "supplier" TEXT,
ALTER COLUMN "quoteItemId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "QuoteMaterial_quoteId_idx" ON "QuoteMaterial"("quoteId");

-- AddForeignKey
ALTER TABLE "QuoteMaterial" ADD CONSTRAINT "QuoteMaterial_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
