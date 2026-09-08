import { PrismaClient, type Company } from "@prisma/client";
import bcrypt from "bcryptjs";

import { SEED_CATEGORIES } from "./seed-data/categories";
import { SEED_MATERIALS } from "./seed-data/materials";
import { SEED_TEMPLATES } from "./seed-data/templates";
import {
  aggregateRoomMeasurements,
  computeRoomMeasurements,
  getMeasurementValue,
} from "../src/lib/calc/measurements";
import { computeMaterialAutoCalc } from "../src/lib/calc/materials-auto";

const prisma = new PrismaClient();

// Por defecto se siembran también clientes y presupuestos de ejemplo (útil en
// desarrollo local). Para inicializar una base nueva en producción (p.ej.
// Railway) sin datos de demostración, ejecuta con SEED_DEMO_DATA=false:
//   SEED_DEMO_DATA=false npx prisma db seed
const INCLUDE_DEMO_DATA = process.env.SEED_DEMO_DATA !== "false";

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
      defaultInternalHourlyRate: 350,
      defaultMaterialMarginPercent: 15,
      defaultWastePercent: 10,
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
    const categoryFields = {
      companyId: company.id,
      key: category.key,
      name: category.name,
      nameSv: category.nameSv,
      sortOrder: index,
    };
    const created = await prisma.jobCategory.upsert({
      where: { id: `${company.id}-${category.key}` },
      update: categoryFields,
      create: { id: `${company.id}-${category.key}`, ...categoryFields },
    });

    for (const job of category.jobs) {
      const jobId = `${created.id}-${job.name}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-");

      const jobFields = {
        companyId: company.id,
        categoryId: created.id,
        name: job.name,
        nameSv: job.nameSv,
        pricingMethod: job.pricingMethod,
        unit: job.unit,
        defaultUnitPrice: job.defaultUnitPrice,
        defaultHourlyRate: job.defaultHourlyRate,
        isSystem: true,
      };
      await prisma.priceListItem.upsert({
        where: { id: jobId },
        update: jobFields,
        create: { id: jobId, ...jobFields },
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

    const materialFields = {
      companyId: company.id,
      name: material.name,
      description: material.description,
      unit: material.unit,
      purchasePrice: material.purchasePrice,
      marginPercent: material.marginPercent,
      supplier: material.supplier,
      calcType: material.calcType ?? "NONE",
      coveragePerUnit: material.coveragePerUnit,
      coatsDefault: material.coatsDefault,
      wastePercentDefault: material.wastePercentDefault ?? 0,
      packageSize: material.packageSize,
      containerSizes: material.containerSizes,
    };
    await prisma.materialLibraryItem.upsert({
      where: { id: materialId },
      update: materialFields,
      create: { id: materialId, ...materialFields },
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

    const templateItems = template.items.map((item, index) => ({
      name: item.name,
      descriptionClient: item.descriptionClient,
      pricingMethod: item.pricingMethod,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      sortOrder: index,
    }));

    await prisma.templateItem.deleteMany({ where: { templateId } });
    await prisma.template.upsert({
      where: { id: templateId },
      update: {
        name: template.name,
        description: template.description,
        items: { create: templateItems },
      },
      create: {
        id: templateId,
        companyId: company.id,
        name: template.name,
        description: template.description,
        items: { create: templateItems },
      },
    });
  }

  // ---------------------------------------------------------------------
  // Clientes y presupuestos de ejemplo (opcional, ver INCLUDE_DEMO_DATA arriba)
  // ---------------------------------------------------------------------
  if (INCLUDE_DEMO_DATA) {
    await seedDemoData(company);
  } else {
    console.log("SEED_DEMO_DATA=false: se omiten clientes y presupuestos de ejemplo.");
  }

  console.log("Seed completado.");
  console.log("Login demo: admin@reformas.se / demo1234");
}

/**
 * Clientes y presupuestos de ejemplo, solo para desarrollo/demo local. No se
 * ejecuta cuando SEED_DEMO_DATA=false (p.ej. al inicializar Railway).
 */
async function seedDemoData(company: Company) {
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
  // Presupuesto demo 1: Pintura apartamento (sección 35, ejemplo 1) —
  // usa el calculador de habitaciones (sección 2-6) con dos habitaciones reales.
  // ---------------------------------------------------------------------
  const takfarg = await prisma.materialLibraryItem.findFirstOrThrow({
    where: { companyId: company.id, name: "Takfärg" },
  });
  const vaggfarg = await prisma.materialLibraryItem.findFirstOrThrow({
    where: { companyId: company.id, name: "Väggfärg" },
  });

  await prisma.quote.deleteMany({
    where: { companyId: company.id, quoteNumber: "OFF-2026-001" },
  });

  const quote1 = await prisma.quote.create({
    data: {
      companyId: company.id,
      quoteNumber: "OFF-2026-001",
      status: "SENT",
      customerId: customer1.id,
      projectName: "Pintura apartamento",
      projectDescription:
        "Pintura completa de paredes y techos del salón y el dormitorio, incluyendo spackling previo. Las cantidades de trabajo y pintura se calculan automáticamente a partir de las medidas de cada habitación.",
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
      rooms: {
        create: [
          {
            name: "Salón",
            length: 6,
            width: 5,
            height: 2.5,
            sortOrder: 0,
            openings: {
              create: [
                { type: "DOOR", width: 0.9, height: 2.1, quantity: 1, sortOrder: 0 },
                { type: "WINDOW", width: 1.5, height: 1.4, quantity: 1, sortOrder: 1 },
              ],
            },
          },
          {
            name: "Dormitorio",
            length: 4,
            width: 3.5,
            height: 2.5,
            sortOrder: 1,
            openings: {
              create: [
                { type: "DOOR", width: 0.9, height: 2.1, quantity: 1, sortOrder: 0 },
                { type: "WINDOW", width: 1.2, height: 1.2, quantity: 1, sortOrder: 1 },
              ],
            },
          },
        ],
      },
      otherCosts: {
        create: [{ name: "Transporte y protección de suelos", quantity: 1, unitPrice: 1200, sortOrder: 0 }],
      },
    },
    include: { rooms: { include: { openings: true } } },
  });

  const roomMeasurements = quote1.rooms.map((r) =>
    computeRoomMeasurements(
      { length: Number(r.length), width: Number(r.width), height: Number(r.height) },
      r.openings.map((o) => ({ type: o.type, width: Number(o.width), height: Number(o.height), quantity: o.quantity }))
    )
  );
  const aggregated = aggregateRoomMeasurements(roomMeasurements);
  const wallArea = getMeasurementValue("NET_WALL", aggregated);
  const ceilingArea = getMeasurementValue("CEILING", aggregated);

  const vaggfargCalc = computeMaterialAutoCalc(
    {
      calcType: "PAINT",
      coveragePerUnit: Number(vaggfarg.coveragePerUnit),
      coats: vaggfarg.coatsDefault,
      wastePercent: Number(vaggfarg.wastePercentDefault),
      containerSizes: vaggfarg.containerSizes as number[],
    },
    wallArea
  );
  const takfargCalc = computeMaterialAutoCalc(
    {
      calcType: "PAINT",
      coveragePerUnit: Number(takfarg.coveragePerUnit),
      coats: takfarg.coatsDefault,
      wastePercent: Number(takfarg.wastePercentDefault),
      containerSizes: takfarg.containerSizes as number[],
    },
    ceilingArea
  );

  await prisma.quoteItem.createMany({
    data: [
      {
        quoteId: quote1.id,
        name: "Pintura de paredes",
        categoryName: "Pintura interior",
        descriptionClient: "Pintura de paredes con 2 capas, color a elegir por el cliente.",
        pricingMethod: "PER_M2",
        unit: "M2",
        quantity: wallArea,
        unitPrice: 150,
        measurementSource: "NET_WALL",
        sortOrder: 0,
      },
      {
        quoteId: quote1.id,
        name: "Pintura de techo",
        categoryName: "Pintura interior",
        descriptionClient: "Pintura de techo blanco mate, 2 capas.",
        pricingMethod: "PER_M2",
        unit: "M2",
        quantity: ceilingArea,
        unitPrice: 180,
        measurementSource: "CEILING",
        sortOrder: 1,
      },
      {
        quoteId: quote1.id,
        name: "Spackling / masillado",
        categoryName: "Pintura interior",
        descriptionClient: "Masillado y lijado previo de imperfecciones en paredes.",
        pricingMethod: "HOURLY",
        unit: "HOUR",
        useDetailedLabor: true,
        workerCount: 2,
        hoursPerWorker: 6,
        hourlyRate: 600,
        internalHourlyRate: 400,
        quantity: 12,
        unitPrice: 600,
        sortOrder: 2,
      },
    ],
  });

  const [paredesItem, techoItem] = await prisma.quoteItem.findMany({
    where: { quoteId: quote1.id },
    orderBy: { sortOrder: "asc" },
  });

  await prisma.quoteItemRoom.createMany({
    data: quote1.rooms.flatMap((r) => [
      { quoteItemId: paredesItem.id, roomId: r.id },
      { quoteItemId: techoItem.id, roomId: r.id },
    ]),
  });

  await prisma.quoteMaterial.create({
    data: {
      quoteItemId: paredesItem.id,
      materialLibraryItemId: vaggfarg.id,
      name: vaggfarg.name,
      unit: vaggfarg.unit,
      purchasePrice: vaggfarg.purchasePrice,
      marginPercent: vaggfarg.marginPercent,
      calcType: "PAINT",
      coveragePerUnit: vaggfarg.coveragePerUnit,
      coats: vaggfarg.coatsDefault,
      wastePercent: vaggfarg.wastePercentDefault,
      containerSizes: vaggfarg.containerSizes ?? undefined,
      quantity: vaggfargCalc.suggestedQuantity,
      calculatedQuantity: vaggfargCalc.calculatedQuantity,
      sortOrder: 0,
    },
  });

  await prisma.quoteMaterial.create({
    data: {
      quoteItemId: techoItem.id,
      materialLibraryItemId: takfarg.id,
      name: takfarg.name,
      unit: takfarg.unit,
      purchasePrice: takfarg.purchasePrice,
      marginPercent: takfarg.marginPercent,
      calcType: "PAINT",
      coveragePerUnit: takfarg.coveragePerUnit,
      coats: takfarg.coatsDefault,
      wastePercent: takfarg.wastePercentDefault,
      containerSizes: takfarg.containerSizes ?? undefined,
      quantity: takfargCalc.suggestedQuantity,
      calculatedQuantity: takfargCalc.calculatedQuantity,
      sortOrder: 0,
    },
  });

  // ---------------------------------------------------------------------
  // Presupuesto demo 2: Colocación fiskbensparkett (sección 35, ejemplo 2) —
  // también usa el calculador de habitaciones: suelo y rodapiés (perímetro
  // menos puerta) se derivan de la habitación en vez de introducirse a mano.
  // ---------------------------------------------------------------------
  const fiskben = await prisma.materialLibraryItem.findFirstOrThrow({
    where: { companyId: company.id, name: "Fiskbensparkett Ek" },
  });
  const lim = await prisma.materialLibraryItem.findFirstOrThrow({
    where: { companyId: company.id, name: "Parkettlim" },
  });
  const lack = await prisma.materialLibraryItem.findFirstOrThrow({
    where: { companyId: company.id, name: "Parkettlack" },
  });
  const sockel = await prisma.materialLibraryItem.findFirstOrThrow({
    where: { companyId: company.id, name: "Golvsockel MDF" },
  });

  await prisma.quote.deleteMany({
    where: { companyId: company.id, quoteNumber: "OFF-2026-002" },
  });

  const quote2 = await prisma.quote.create({
    data: {
      companyId: company.id,
      quoteNumber: "OFF-2026-002",
      status: "ACCEPTED",
      customerId: customer2.id,
      projectName: "Colocación fiskbensparkett",
      projectDescription:
        "Preparación del suelo, colocación de parquet en espiga (fiskbensparkett) con fris, corte a 45°, lijado y barnizado. Suelo y rodapiés calculados automáticamente a partir de la habitación.",
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
      rooms: {
        create: [
          {
            name: "Vardagsrum",
            length: 10,
            width: 7,
            height: 2.4,
            sortOrder: 0,
            openings: {
              create: [{ type: "DOOR", width: 0.9, height: 2.1, quantity: 1, sortOrder: 0 }],
            },
          },
        ],
      },
      otherCosts: {
        create: [{ name: "Contenedor de residuos", quantity: 1, unitPrice: 1800, sortOrder: 0 }],
      },
    },
    include: { rooms: { include: { openings: true } } },
  });

  const room2Measurements = quote2.rooms.map((r) =>
    computeRoomMeasurements(
      { length: Number(r.length), width: Number(r.width), height: Number(r.height) },
      r.openings.map((o) => ({ type: o.type, width: Number(o.width), height: Number(o.height), quantity: o.quantity }))
    )
  );
  const aggregated2 = aggregateRoomMeasurements(room2Measurements);
  const floorArea = getMeasurementValue("FLOOR", aggregated2);
  const baseboardLength = getMeasurementValue("PERIMETER", aggregated2, true);

  await prisma.quoteItem.createMany({
    data: [
      {
        quoteId: quote2.id,
        name: "Preparación del suelo",
        categoryName: "Suelos",
        descriptionClient: "Comprobación y preparación de la base antes de la instalación.",
        pricingMethod: "PER_M2",
        unit: "M2",
        quantity: floorArea,
        unitPrice: 60,
        measurementSource: "FLOOR",
        sortOrder: 0,
      },
      {
        quoteId: quote2.id,
        name: "Colocación de fiskbensparkett",
        categoryName: "Suelos",
        descriptionClient: "Instalación de parquet en espiga (fiskbensparkett) de roble.",
        pricingMethod: "PER_M2",
        unit: "M2",
        quantity: floorArea,
        unitPrice: 650,
        measurementSource: "FLOOR",
        sortOrder: 1,
      },
      {
        quoteId: quote2.id,
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
        quoteId: quote2.id,
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
        quoteId: quote2.id,
        name: "Lijado",
        categoryName: "Suelos",
        descriptionClient: "Lijado completo del suelo en tres etapas.",
        pricingMethod: "PER_M2",
        unit: "M2",
        quantity: floorArea,
        unitPrice: 100,
        measurementSource: "FLOOR",
        sortOrder: 4,
      },
      {
        quoteId: quote2.id,
        name: "Barnizado",
        categoryName: "Suelos",
        descriptionClient: "Aplicación de tres capas de barniz protector.",
        pricingMethod: "PER_M2",
        unit: "M2",
        quantity: floorArea,
        unitPrice: 150,
        measurementSource: "FLOOR",
        sortOrder: 5,
      },
      {
        quoteId: quote2.id,
        name: "Instalación de rodapiés",
        categoryName: "Suelos",
        descriptionClient: "Colocación de rodapiés a juego con el parquet (perímetro menos puerta).",
        pricingMethod: "PER_METER",
        unit: "METER",
        quantity: baseboardLength,
        unitPrice: 75,
        measurementSource: "PERIMETER",
        subtractOpeningWidths: true,
        sortOrder: 6,
      },
    ],
  });

  const quote2Items = await prisma.quoteItem.findMany({
    where: { quoteId: quote2.id },
    orderBy: { sortOrder: "asc" },
  });
  const [prepItem, fiskbenItem, , , lijadoItem, barnizadoItem, rodapieItem] = quote2Items;
  const room2 = quote2.rooms[0];

  await prisma.quoteItemRoom.createMany({
    data: [prepItem, fiskbenItem, lijadoItem, barnizadoItem, rodapieItem].map((item) => ({
      quoteItemId: item.id,
      roomId: room2.id,
    })),
  });

  const fiskbenCalc = computeMaterialAutoCalc(
    { calcType: "PACKAGE", wastePercent: Number(fiskben.wastePercentDefault), packageSize: Number(fiskben.packageSize) },
    floorArea
  );
  const limCalc = computeMaterialAutoCalc(
    { calcType: "COVERAGE", coveragePerUnit: Number(lim.coveragePerUnit), wastePercent: Number(lim.wastePercentDefault), packageSize: Number(lim.packageSize) },
    floorArea
  );
  const lackCalc = computeMaterialAutoCalc(
    {
      calcType: "PAINT",
      coveragePerUnit: Number(lack.coveragePerUnit),
      coats: lack.coatsDefault,
      wastePercent: Number(lack.wastePercentDefault),
      containerSizes: lack.containerSizes as number[],
    },
    floorArea
  );
  const sockelCalc = computeMaterialAutoCalc(
    { calcType: "COVERAGE", coveragePerUnit: Number(sockel.coveragePerUnit), wastePercent: Number(sockel.wastePercentDefault) },
    baseboardLength
  );

  await prisma.quoteMaterial.createMany({
    data: [
      {
        quoteItemId: fiskbenItem.id,
        materialLibraryItemId: fiskben.id,
        name: fiskben.name,
        unit: fiskben.unit,
        purchasePrice: fiskben.purchasePrice,
        marginPercent: fiskben.marginPercent,
        calcType: "PACKAGE",
        wastePercent: fiskben.wastePercentDefault,
        packageSize: fiskben.packageSize,
        quantity: fiskbenCalc.suggestedQuantity,
        calculatedQuantity: fiskbenCalc.calculatedQuantity,
        sortOrder: 0,
      },
      {
        quoteItemId: fiskbenItem.id,
        materialLibraryItemId: lim.id,
        name: lim.name,
        unit: lim.unit,
        purchasePrice: lim.purchasePrice,
        marginPercent: lim.marginPercent,
        calcType: "COVERAGE",
        coveragePerUnit: lim.coveragePerUnit,
        wastePercent: lim.wastePercentDefault,
        packageSize: lim.packageSize,
        quantity: limCalc.suggestedQuantity,
        calculatedQuantity: limCalc.calculatedQuantity,
        sortOrder: 1,
      },
    ],
  });

  await prisma.quoteMaterial.create({
    data: {
      quoteItemId: barnizadoItem.id,
      materialLibraryItemId: lack.id,
      name: lack.name,
      unit: lack.unit,
      purchasePrice: lack.purchasePrice,
      marginPercent: lack.marginPercent,
      calcType: "PAINT",
      coveragePerUnit: lack.coveragePerUnit,
      coats: lack.coatsDefault,
      wastePercent: lack.wastePercentDefault,
      containerSizes: lack.containerSizes ?? undefined,
      quantity: lackCalc.suggestedQuantity,
      calculatedQuantity: lackCalc.calculatedQuantity,
      sortOrder: 0,
    },
  });

  await prisma.quoteMaterial.create({
    data: {
      quoteItemId: rodapieItem.id,
      materialLibraryItemId: sockel.id,
      name: sockel.name,
      unit: sockel.unit,
      purchasePrice: sockel.purchasePrice,
      marginPercent: sockel.marginPercent,
      calcType: "COVERAGE",
      coveragePerUnit: sockel.coveragePerUnit,
      wastePercent: sockel.wastePercentDefault,
      quantity: sockelCalc.suggestedQuantity,
      calculatedQuantity: sockelCalc.calculatedQuantity,
      sortOrder: 0,
    },
  });

  await prisma.company.update({ where: { id: company.id }, data: { nextQuoteSequence: 3 } });

  // Recalcula y cachea los totales de los presupuestos demo usando el motor de cálculo.
  const { recomputeAndCacheQuote } = await import("../src/lib/quotes/service");
  await recomputeAndCacheQuote(quote1.id);
  await recomputeAndCacheQuote(quote2.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
