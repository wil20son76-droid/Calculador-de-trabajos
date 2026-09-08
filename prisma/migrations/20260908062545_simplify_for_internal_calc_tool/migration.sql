-- DropForeignKey
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_customerId_fkey";

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "defaultInternalHourlyRate" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "defaultWastePercent" DECIMAL(6,3) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Quote" ALTER COLUMN "customerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "QuoteItem" ADD COLUMN     "rotEligible" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
