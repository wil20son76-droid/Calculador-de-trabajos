-- CreateEnum
CREATE TYPE "OpeningType" AS ENUM ('DOOR', 'WINDOW', 'OTHER');

-- CreateEnum
CREATE TYPE "MaterialCalcType" AS ENUM ('NONE', 'PAINT', 'COVERAGE', 'PACKAGE');

-- CreateEnum
CREATE TYPE "MeasurementSource" AS ENUM ('NONE', 'NET_WALL', 'GROSS_WALL', 'CEILING', 'FLOOR', 'PERIMETER');

-- AlterTable
ALTER TABLE "MaterialLibraryItem" ADD COLUMN     "calcType" "MaterialCalcType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "coatsDefault" INTEGER,
ADD COLUMN     "containerSizes" JSONB,
ADD COLUMN     "coveragePerUnit" DECIMAL(10,3),
ADD COLUMN     "packageSize" DECIMAL(10,3),
ADD COLUMN     "wastePercentDefault" DECIMAL(6,3) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "cachedLaborCostInternal" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "cachedMaterialCostInternal" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "QuoteItem" ADD COLUMN     "internalHourlyRate" DECIMAL(12,2),
ADD COLUMN     "measurementSource" "MeasurementSource" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "subtractOpeningWidths" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "QuoteMaterial" ADD COLUMN     "calcType" "MaterialCalcType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "calculatedQuantity" DECIMAL(12,3),
ADD COLUMN     "coats" INTEGER,
ADD COLUMN     "containerSizes" JSONB,
ADD COLUMN     "coveragePerUnit" DECIMAL(10,3),
ADD COLUMN     "packageSize" DECIMAL(10,3),
ADD COLUMN     "wastePercent" DECIMAL(6,3) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "length" DECIMAL(8,3) NOT NULL,
    "width" DECIMAL(8,3) NOT NULL,
    "height" DECIMAL(8,3) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomOpening" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "type" "OpeningType" NOT NULL DEFAULT 'DOOR',
    "width" DECIMAL(8,3) NOT NULL,
    "height" DECIMAL(8,3) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RoomOpening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteItemRoom" (
    "id" TEXT NOT NULL,
    "quoteItemId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,

    CONSTRAINT "QuoteItemRoom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Room_quoteId_idx" ON "Room"("quoteId");

-- CreateIndex
CREATE INDEX "RoomOpening_roomId_idx" ON "RoomOpening"("roomId");

-- CreateIndex
CREATE INDEX "QuoteItemRoom_quoteItemId_idx" ON "QuoteItemRoom"("quoteItemId");

-- CreateIndex
CREATE INDEX "QuoteItemRoom_roomId_idx" ON "QuoteItemRoom"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteItemRoom_quoteItemId_roomId_key" ON "QuoteItemRoom"("quoteItemId", "roomId");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomOpening" ADD CONSTRAINT "RoomOpening_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItemRoom" ADD CONSTRAINT "QuoteItemRoom_quoteItemId_fkey" FOREIGN KEY ("quoteItemId") REFERENCES "QuoteItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItemRoom" ADD CONSTRAINT "QuoteItemRoom_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
