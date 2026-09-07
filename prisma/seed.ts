import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { SEED_CATEGORIES } from "./seed-data/categories";
import { SEED_MATERIALS } from "./seed-data/materials";
import { SEED_TEMPLATES } from "./seed-data/templates";

const prisma = new PrismaClient();

async function main() {
  console.log("Sembrando base de datos...");

  // ---------------------------------------------------------------------
  // Empresa + usuario admin
  // ---------------------------------------------------------------------
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const company = await prisma.company.upsert({
    where: { id: "demo-company" },
    update: {},
    create: {
      id: "demo-company",
      name: "Nordisk Renovering AB",
      orgNumber: "556677-8899",
      vatNumber: "SE556677889901",
      address: "Byggargatan 12",
      postalCode: "112 34",
      city: "Stockholm",
      country: "Sverige",
      phone: "+46 8 123 456 78",
      email: "info@nordiskrenovering.se",
      website: "www.nordiskrenovering.se",
      bankgiro: "123-4567",
      plusgiro: "98 76 54-3",
      swish: "123 456 78 90",
      currency: "SEK",
      locale: "sv",
      vatRatePercent: 25,
      rotEnabledDefault: true,
      rotPercent: 50,
      defaultHourlyRate: 650,
      defaultMaterialMarginPercent: 15,
      quoteValidityDays: 30,
      defaultTermsText:
        "Oferta válida durante 30 días desde la fecha de emisión. Trabajos adicionales no incluidos en esta oferta se facturarán por separado según acuerdo previo. El material adicional se factura según el consumo real. El calendario de trabajo puede modificarse debido a retrasos de proveedores ajenos a nuestra empresa. El ROT-avdrag está condicionado a la aprobación final de Skatteverket.",
      nextQuoteSequence: 1,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@reformas.se" },
    update: {},
    create: {
      companyId: company.id,
      name: "Admin",
      email: "admin@reformas.se",
      passwordHash,
      role: "ADMIN",
    },
  });

  // ---------------------------------------------------------------------
  // Categorías + biblioteca de precios (trabajos)
  // ---------------------------------------------------------------------
  for (const [index, category] of SEED_CATEGORIES.entries()) {
    const created = await prisma.jobCategory.upsert({
      where: { id: `${company.id}-${category.key}` },
      update: {},
      create: {
        id: `${company.id}-${category.key}`,
        companyId: company.id,
        key: category.key,
        name: category.name,
        nameSv: category.nameSv,
        sortOrder: index,
      },
    });

    for (const job of category.jobs) {
      const jobId = `${created.id}-${job.name}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-");

      await prisma.priceListItem.upsert({
        where: { id: jobId },
        update: {},
        create: {
          id: jobId,
          companyId: company.id,
          categoryId: created.id,
          name: job.name,
          nameSv: job.nameSv,
          pricingMethod: job.pricingMethod,
          unit: job.unit,
          defaultUnitPrice: job.defaultUnitPrice,
          defaultHourlyRate: job.defaultHourlyRate,
          isSystem: true,
        },
      });
    }
  }

  // ---------------------------------------------------------------------
  // Biblioteca de materiales
  // ---------------------------------------------------------------------
  for (const material of SEED_MATERIALS) {
    const materialId = `${company.id}-${material.name}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-");

    await prisma.materialLibraryItem.upsert({
      where: { id: materialId },
      update: {},
      create: {
        id: materialId,
        companyId: company.id,
        name: material.name,
        description: material.description,
        unit: material.unit,
        purchasePrice: material.purchasePrice,
        marginPercent: material.marginPercent,
        supplier: material.supplier,
      },
    });
  }

  // ---------------------------------------------------------------------
  // Plantillas de proyecto
  // ---------------------------------------------------------------------
  for (const template of SEED_TEMPLATES) {
    const templateId = `${company.id}-tpl-${template.name}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-");

    await prisma.template.upsert({
      where: { id: templateId },
      update: {},
      create: {
        id: templateId,
        companyId: company.id,
        name: template.name,
        description: template.description,
        items: {
          create: template.items.map((item, index) => ({
            name: item.name,
            descriptionClient: item.descriptionClient,
            pricingMethod: item.pricingMethod,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            sortOrder: index,
          })),
        },
      },
    });
  }

  // ---------------------------------------------------------------------
  // Clientes de ejemplo
  // ---------------------------------------------------------------------
  const customer1 = await prisma.customer.upsert({
    where: { id: "demo-customer-1" },
    update: {},
    create: {
      id: "demo-customer-1",
      companyId: company.id,
      firstName: "Erik",
      lastName: "Johansson",
      address: "Sveavägen 45",
      postalCode: "113 59",
      city: "Stockholm",
      phone: "+46 70 123 45 67",
      email: "erik.johansson@example.se",
      personalOrgNumber: "800101-1234",
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { id: "demo-customer-2" },
    update: {},
    create: {
      id: "demo-customer-2",
      companyId: company.id,
      firstName: "Anna",
      lastName: "Lindqvist",
      companyName: "Lindqvist Fastigheter AB",
      address: "Kungsgatan 8",
      postalCode: "411 19",
      city: "Göteborg",
      phone: "+46 70 987 65 43",
      email: "anna@lindqvistfastigheter.se",
      personalOrgNumber: "556123-4567",
    },
  });

  await prisma.customer.upsert({
    where: { id: "demo-customer-3" },
    update: {},
    create: {
      id: "demo-customer-3",
      companyId: company.id,
      firstName: "Mikael",
      lastName: "Berg",
      address: "Storgatan 22",
      postalCode: "252 20",
      city: "Helsingborg",
      phone: "+46 70 555 22 11",
      email: "mikael.berg@example.se",
    },
  });

  // ---------------------------------------------------------------------
  // Presupuesto demo 1: Pintura apartamento 75 m² (sección 35, ejemplo 1)
  // ---------------------------------------------------------------------
  const takfarg = await prisma.materialLibraryItem.findFirstOrThrow({
    where: { companyId: company.id, name: "Takfärg 10L" },
  });
  const vaggfarg = await prisma.materialLibraryItem.findFirstOrThrow({
    where: { companyId: company.id, name: "Väggfärg 10L" },
  });

  const quote1 = await prisma.quote.upsert({
    where: { companyId_quoteNumber: { companyId: company.id, quoteNumber: "OFF-2026-001" } },
    update: {},
    create: {
      companyId: company.id,
      quoteNumber: "OFF-2026-001",
      status: "SENT",
      customerId: customer1.id,
      projectName: "Pintura apartamento 75 m²",
      projectDescription:
        "Pintura completa de paredes y techos de apartamento de 75 m², incluyendo spackling previo.",
      quoteDate: new Date("2026-01-15"),
      validUntil: new Date("2026-02-14"),
      currency: "SEK",
      vatRatePercent: company.vatRatePercent,
      rotEnabled: true,
      rotPercent: company.rotPercent,
      materialMarginDefaultPercent: 15,
      includedText: "Mano de obra, materiales de pintura, protección de suelos y muebles, limpieza final.",
      excludedText: "Reparaciones estructurales, electricidad, traslado de muebles pesados.",
      termsText: company.defaultTermsText,
      items: {
        create: [
          {
            name: "Pintura de paredes",
            categoryName: "Pintura interior",
            descriptionClient: "Pintura de paredes con 2 capas, color a elegir por el cliente.",
            pricingMethod: "PER_M2",
            unit: "M2",
            quantity: 130,
            unitPrice: 150,
            sortOrder: 0,
            materials: {
              create: [
                {
                  name: vaggfarg.name,
                  materialLibraryItemId: vaggfarg.id,
                  quantity: 5,
                  unit: "UNIT",
                  purchasePrice: Number(vaggfarg.purchasePrice),
                  marginPercent: Number(vaggfarg.marginPercent),
                  sortOrder: 0,
                },
              ],
            },
          },
          {
            name: "Pintura de techo",
            categoryName: "Pintura interior",
            descriptionClient: "Pintura de techo blanco mate, 2 capas.",
            pricingMethod: "PER_M2",
            unit: "M2",
            quantity: 75,
            unitPrice: 180,
            sortOrder: 1,
            materials: {
              create: [
                {
                  name: takfarg.name,
                  materialLibraryItemId: takfarg.id,
                  quantity: 3,
                  unit: "UNIT",
                  purchasePrice: Number(takfarg.purchasePrice),
                  marginPercent: Number(takfarg.marginPercent),
                  sortOrder: 0,
                },
              ],
            },
          },
          {
            name: "Spackling / masillado",
            categoryName: "Pintura interior",
            descriptionClient: "Masillado y lijado previo de imperfecciones en paredes.",
            pricingMethod: "HOURLY",
            unit: "HOUR",
            useDetailedLabor: true,
            workerCount: 2,
            hoursPerWorker: 6,
            hourlyRate: 600,
            quantity: 12,
            unitPrice: 600,
            sortOrder: 2,
          },
        ],
      },
      otherCosts: {
        create: [{ name: "Transporte y protección de suelos", quantity: 1, unitPrice: 1200, sortOrder: 0 }],
      },
    },
  });

  // ---------------------------------------------------------------------
  // Presupuesto demo 2: Colocación fiskbensparkett 70 m² (sección 35, ejemplo 2)
  // ---------------------------------------------------------------------
  const fiskben = await prisma.materialLibraryItem.findFirstOrThrow({
    where: { companyId: company.id, name: "Fiskbensparkett Ek" },
  });
  const lim = await prisma.materialLibraryItem.findFirstOrThrow({
    where: { companyId: company.id, name: "Parkettlim" },
  });
  const lack = await prisma.materialLibraryItem.findFirstOrThrow({
    where: { companyId: company.id, name: "Parkettlack 5L" },
  });
  const sockel = await prisma.materialLibraryItem.findFirstOrThrow({
    where: { companyId: company.id, name: "Golvsockel MDF" },
  });

  const quote2 = await prisma.quote.upsert({
    where: { companyId_quoteNumber: { companyId: company.id, quoteNumber: "OFF-2026-002" } },
    update: {},
    create: {
      companyId: company.id,
      quoteNumber: "OFF-2026-002",
      status: "ACCEPTED",
      customerId: customer2.id,
      projectName: "Colocación fiskbensparkett 70 m²",
      projectDescription:
        "Preparación del suelo, colocación de parquet en espiga (fiskbensparkett) con fris, corte a 45°, lijado y barnizado.",
      quoteDate: new Date("2026-02-03"),
      validUntil: new Date("2026-03-05"),
      currency: "SEK",
      vatRatePercent: company.vatRatePercent,
      rotEnabled: true,
      rotPercent: company.rotPercent,
      materialMarginDefaultPercent: 20,
      includedText: "Mano de obra, materiales de instalación, lijado y barnizado, limpieza final.",
      excludedText: "Retirada de suelo antiguo, nivelación de base, rodapiés en otro color.",
      termsText: company.defaultTermsText,
      items: {
        create: [
          {
            name: "Preparación del suelo",
            categoryName: "Suelos",
            descriptionClient: "Comprobación y preparación de la base antes de la instalación.",
            pricingMethod: "PER_M2",
            unit: "M2",
            quantity: 70,
            unitPrice: 60,
            sortOrder: 0,
          },
          {
            name: "Colocación de fiskbensparkett",
            categoryName: "Suelos",
            descriptionClient: "Instalación de parquet en espiga (fiskbensparkett) de roble.",
            pricingMethod: "PER_M2",
            unit: "M2",
            quantity: 70,
            unitPrice: 650,
            sortOrder: 1,
            materials: {
              create: [
                {
                  name: fiskben.name,
                  materialLibraryItemId: fiskben.id,
                  quantity: 70,
                  unit: "M2",
                  purchasePrice: Number(fiskben.purchasePrice),
                  marginPercent: Number(fiskben.marginPercent),
                  sortOrder: 0,
                },
                {
                  name: lim.name,
                  materialLibraryItemId: lim.id,
                  quantity: 7,
                  unit: "UNIT",
                  purchasePrice: Number(lim.purchasePrice),
                  marginPercent: Number(lim.marginPercent),
                  sortOrder: 1,
                },
              ],
            },
          },
          {
            name: "Fris",
            categoryName: "Suelos",
            descriptionClient: "Marco perimetral (fris) en madera de roble.",
            pricingMethod: "PER_METER",
            unit: "METER",
            quantity: 30,
            unitPrice: 180,
            sortOrder: 2,
          },
          {
            name: "Corte 45°",
            categoryName: "Suelos",
            descriptionClient: "Cortes en inglete a 45° en las esquinas del marco.",
            pricingMethod: "HOURLY",
            unit: "HOUR",
            quantity: 6,
            unitPrice: 650,
            sortOrder: 3,
          },
          {
            name: "Lijado",
            categoryName: "Suelos",
            descriptionClient: "Lijado completo del suelo en tres etapas.",
            pricingMethod: "PER_M2",
            unit: "M2",
            quantity: 70,
            unitPrice: 100,
            sortOrder: 4,
          },
          {
            name: "Barnizado",
            categoryName: "Suelos",
            descriptionClient: "Aplicación de tres capas de barniz protector.",
            pricingMethod: "PER_M2",
            unit: "M2",
            quantity: 70,
            unitPrice: 150,
            sortOrder: 5,
            materials: {
              create: [
                {
                  name: lack.name,
                  materialLibraryItemId: lack.id,
                  quantity: 3,
                  unit: "UNIT",
                  purchasePrice: Number(lack.purchasePrice),
                  marginPercent: Number(lack.marginPercent),
                  sortOrder: 0,
                },
              ],
            },
          },
          {
            name: "Instalación de rodapiés",
            categoryName: "Suelos",
            descriptionClient: "Colocación de rodapiés a juego con el parquet.",
            pricingMethod: "PER_METER",
            unit: "METER",
            quantity: 80,
            unitPrice: 75,
            sortOrder: 6,
            materials: {
              create: [
                {
                  name: sockel.name,
                  materialLibraryItemId: sockel.id,
                  quantity: 80,
                  unit: "METER",
                  purchasePrice: Number(sockel.purchasePrice),
                  marginPercent: Number(sockel.marginPercent),
                  sortOrder: 0,
                },
              ],
            },
          },
        ],
      },
      otherCosts: {
        create: [{ name: "Contenedor de residuos", quantity: 1, unitPrice: 1800, sortOrder: 0 }],
      },
    },
  });

  await prisma.company.update({ where: { id: company.id }, data: { nextQuoteSequence: 3 } });

  // Recalcula y cachea los totales de los presupuestos demo usando el motor de cálculo.
  const { recomputeAndCacheQuote } = await import("../src/lib/quotes/service");
  await recomputeAndCacheQuote(quote1.id);
  await recomputeAndCacheQuote(quote2.id);

  console.log("Seed completado.");
  console.log("Login demo: admin@reformas.se / demo1234");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
