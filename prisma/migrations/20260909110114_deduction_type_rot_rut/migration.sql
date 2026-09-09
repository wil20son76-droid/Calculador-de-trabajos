-- Sustituye el booleano QuoteItem.rotEligible por un enum DeductionType
-- (NONE/ROT/RUT) que permite elegir Skattereduktion por línea de trabajo,
-- y añade el % de RUT (junto al de ROT ya existente) como valor configurable
-- en Company y como snapshot por presupuesto en Quote.
--
-- Migración de datos segura: no se pierde ningún cálculo existente.
--   rotEligible = true  -> deductionType = 'ROT'
--   rotEligible = false -> deductionType = 'NONE'

-- CreateEnum
CREATE TYPE "DeductionType" AS ENUM ('NONE', 'ROT', 'RUT');

-- AlterTable: añadir columna nueva (nullable de momento, para poder rellenarla
-- a partir de los datos existentes antes de imponer NOT NULL).
ALTER TABLE "QuoteItem" ADD COLUMN "deductionType" "DeductionType";

-- Backfill desde el booleano existente.
UPDATE "QuoteItem"
SET "deductionType" = CASE WHEN "rotEligible" THEN 'ROT' ELSE 'NONE' END::"DeductionType";

-- Ahora que todas las filas tienen valor, se puede imponer NOT NULL + default.
ALTER TABLE "QuoteItem" ALTER COLUMN "deductionType" SET NOT NULL;
ALTER TABLE "QuoteItem" ALTER COLUMN "deductionType" SET DEFAULT 'ROT';

-- La información de rotEligible ya vive en deductionType: se elimina la columna.
ALTER TABLE "QuoteItem" DROP COLUMN "rotEligible";

-- AlterTable: % de RUT configurable en Company, igual que el de ROT.
ALTER TABLE "Company" ADD COLUMN "rutPercent" DECIMAL(6,3) NOT NULL DEFAULT 50;

-- AlterTable: snapshot del % de RUT en cada presupuesto (igual que rotPercent),
-- para que un cálculo antiguo no cambie si luego se edita la configuración global.
ALTER TABLE "Quote" ADD COLUMN "rutPercent" DECIMAL(6,3) NOT NULL DEFAULT 50;

-- AlterTable: total de RUT-avdrag cacheado, igual que cachedRotDeduction.
ALTER TABLE "Quote" ADD COLUMN "cachedRutDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0;
