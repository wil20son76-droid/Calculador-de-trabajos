-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PricingMethod" AS ENUM ('FIXED', 'HOURLY', 'PER_M2', 'PER_METER', 'PER_UNIT', 'PER_DAY');

-- CreateEnum
CREATE TYPE "WorkUnit" AS ENUM ('UNIT', 'HOUR', 'M2', 'M3', 'METER', 'DAY', 'KG', 'TON', 'LITER', 'BAG', 'PACKAGE', 'BOX', 'ROLL');

-- CreateEnum
CREATE TYPE "MaterialUnit" AS ENUM ('UNIT', 'METER', 'M2', 'M3', 'KG', 'TON', 'LITER', 'BAG', 'PACKAGE', 'BOX', 'ROLL');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'INVOICED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('NONE', 'PERCENT', 'FIXED');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "orgNumber" TEXT,
    "vatNumber" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Sverige',
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "bankgiro" TEXT,
    "plusgiro" TEXT,
    "swish" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'SEK',
    "locale" TEXT NOT NULL DEFAULT 'sv',
    "vatRatePercent" DECIMAL(6,3) NOT NULL DEFAULT 25,
    "rotEnabledDefault" BOOLEAN NOT NULL DEFAULT true,
    "rotPercent" DECIMAL(6,3) NOT NULL DEFAULT 50,
    "rotMaxDeductionPerQuote" DECIMAL(12,2),
    "defaultHourlyRate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "defaultMaterialMarginPercent" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "quoteValidityDays" INTEGER NOT NULL DEFAULT 30,
    "defaultTermsText" TEXT,
    "nextQuoteSequence" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "companyName" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "personalOrgNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobCategory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameSv" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "JobCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceListItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "nameSv" TEXT,
    "description" TEXT,
    "pricingMethod" "PricingMethod" NOT NULL DEFAULT 'FIXED',
    "unit" "WorkUnit" NOT NULL DEFAULT 'UNIT',
    "defaultUnitPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "defaultHourlyRate" DECIMAL(12,2),
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialLibraryItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" "MaterialUnit" NOT NULL DEFAULT 'UNIT',
    "purchasePrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "marginPercent" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "supplier" TEXT,
    "sku" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialLibraryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "descriptionClient" TEXT,
    "pricingMethod" "PricingMethod" NOT NULL DEFAULT 'FIXED',
    "unit" "WorkUnit" NOT NULL DEFAULT 'UNIT',
    "quantity" DECIMAL(12,3) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "customerId" TEXT NOT NULL,
    "projectId" TEXT,
    "projectName" TEXT,
    "projectDescription" TEXT,
    "siteAddressDifferent" BOOLEAN NOT NULL DEFAULT false,
    "siteAddress" TEXT,
    "sitePostalCode" TEXT,
    "siteCity" TEXT,
    "quoteDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'SEK',
    "vatRatePercent" DECIMAL(6,3) NOT NULL DEFAULT 25,
    "rotEnabled" BOOLEAN NOT NULL DEFAULT false,
    "rotPercent" DECIMAL(6,3) NOT NULL DEFAULT 50,
    "discountType" "DiscountType" NOT NULL DEFAULT 'NONE',
    "discountValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "materialMarginDefaultPercent" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "showHours" BOOLEAN NOT NULL DEFAULT true,
    "showHourlyRate" BOOLEAN NOT NULL DEFAULT true,
    "showMaterialsIndividually" BOOLEAN NOT NULL DEFAULT true,
    "showMaterialPrices" BOOLEAN NOT NULL DEFAULT true,
    "showUnitPrice" BOOLEAN NOT NULL DEFAULT true,
    "showOnlyTotalPerJob" BOOLEAN NOT NULL DEFAULT false,
    "showMaterialsOnPdf" BOOLEAN NOT NULL DEFAULT true,
    "includedText" TEXT,
    "excludedText" TEXT,
    "termsText" TEXT,
    "notesInternal" TEXT,
    "notesClient" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteItem" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "priceListItemId" TEXT,
    "categoryName" TEXT,
    "name" TEXT NOT NULL,
    "descriptionInternal" TEXT,
    "descriptionClient" TEXT,
    "includedText" TEXT,
    "excludedText" TEXT,
    "pricingMethod" "PricingMethod" NOT NULL DEFAULT 'FIXED',
    "unit" "WorkUnit" NOT NULL DEFAULT 'UNIT',
    "quantity" DECIMAL(12,3) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "useDetailedLabor" BOOLEAN NOT NULL DEFAULT false,
    "workerCount" DECIMAL(8,2),
    "hoursPerWorker" DECIMAL(8,2),
    "hourlyRate" DECIMAL(12,2),
    "discountType" "DiscountType" NOT NULL DEFAULT 'NONE',
    "discountValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteMaterial" (
    "id" TEXT NOT NULL,
    "quoteItemId" TEXT NOT NULL,
    "materialLibraryItemId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(12,3) NOT NULL DEFAULT 1,
    "unit" "MaterialUnit" NOT NULL DEFAULT 'UNIT',
    "purchasePrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "marginPercent" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteOtherCost" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteOtherCost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Customer_companyId_idx" ON "Customer"("companyId");

-- CreateIndex
CREATE INDEX "Project_companyId_idx" ON "Project"("companyId");

-- CreateIndex
CREATE INDEX "Project_customerId_idx" ON "Project"("customerId");

-- CreateIndex
CREATE INDEX "JobCategory_companyId_idx" ON "JobCategory"("companyId");

-- CreateIndex
CREATE INDEX "PriceListItem_companyId_idx" ON "PriceListItem"("companyId");

-- CreateIndex
CREATE INDEX "PriceListItem_categoryId_idx" ON "PriceListItem"("categoryId");

-- CreateIndex
CREATE INDEX "MaterialLibraryItem_companyId_idx" ON "MaterialLibraryItem"("companyId");

-- CreateIndex
CREATE INDEX "Template_companyId_idx" ON "Template"("companyId");

-- CreateIndex
CREATE INDEX "TemplateItem_templateId_idx" ON "TemplateItem"("templateId");

-- CreateIndex
CREATE INDEX "Quote_companyId_idx" ON "Quote"("companyId");

-- CreateIndex
CREATE INDEX "Quote_customerId_idx" ON "Quote"("customerId");

-- CreateIndex
CREATE INDEX "Quote_status_idx" ON "Quote"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_companyId_quoteNumber_key" ON "Quote"("companyId", "quoteNumber");

-- CreateIndex
CREATE INDEX "QuoteItem_quoteId_idx" ON "QuoteItem"("quoteId");

-- CreateIndex
CREATE INDEX "QuoteItem_priceListItemId_idx" ON "QuoteItem"("priceListItemId");

-- CreateIndex
CREATE INDEX "QuoteMaterial_quoteItemId_idx" ON "QuoteMaterial"("quoteItemId");

-- CreateIndex
CREATE INDEX "QuoteOtherCost_quoteId_idx" ON "QuoteOtherCost"("quoteId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCategory" ADD CONSTRAINT "JobCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListItem" ADD CONSTRAINT "PriceListItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListItem" ADD CONSTRAINT "PriceListItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "JobCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialLibraryItem" ADD CONSTRAINT "MaterialLibraryItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateItem" ADD CONSTRAINT "TemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_priceListItemId_fkey" FOREIGN KEY ("priceListItemId") REFERENCES "PriceListItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteMaterial" ADD CONSTRAINT "QuoteMaterial_quoteItemId_fkey" FOREIGN KEY ("quoteItemId") REFERENCES "QuoteItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteMaterial" ADD CONSTRAINT "QuoteMaterial_materialLibraryItemId_fkey" FOREIGN KEY ("materialLibraryItemId") REFERENCES "MaterialLibraryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteOtherCost" ADD CONSTRAINT "QuoteOtherCost_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
