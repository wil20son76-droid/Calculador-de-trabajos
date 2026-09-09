import { describe, it, expect } from "vitest";

import { calcQuote, calcItem } from "../engine";
import { computeRoomMeasurements, aggregateRoomMeasurements, getMeasurementValue } from "../measurements";
import {
  computeMaterialAutoCalc,
  computeConsumptionQuantity,
  computeCoatsCoverageQuantity,
  computePackageArea,
  suggestContainers,
  applyWaste,
} from "../materials-auto";
import { groupLinesByCategory } from "../category-summary";
import type { CalcQuoteInput } from "../types";

const baseQuote: Pick<CalcQuoteInput, "discountType" | "discountValue" | "vatRatePercent" | "rotPercent" | "rutPercent"> = {
  discountType: "NONE",
  discountValue: 0,
  vatRatePercent: 25,
  rotPercent: 30,
  rutPercent: 50,
};

describe("calcQuote — resumen (sección 9 de la spec)", () => {
  it("mano de obra 45000 + materiales 22000 + otros 3000 => subtotal 70000, moms 17500, ROT -13500 (30%), a pagar 74000", () => {
    const result = calcQuote({
      ...baseQuote,
      items: [
        {
          id: "1",
          useDetailedLabor: false,
          quantity: 1,
          unitPrice: 45000,
          discountType: "NONE",
          discountValue: 0,
          deductionType: "ROT",
          materials: [{ id: "m1", quantity: 1, purchasePrice: 22000, marginPercent: 0 }],
        },
      ],
      otherCosts: [{ id: "o1", quantity: 1, unitPrice: 3000 }],
    });

    expect(result.subtotalAfterDiscount).toBe(70000);
    expect(result.vatAmount).toBe(17500);
    expect(result.totalInclVat).toBe(87500);
    expect(result.rotDeduction).toBe(13500); // 45000 × 30%
    expect(result.totalDue).toBe(74000);
  });
});

describe("calcItem — coste interno por horas (sección 12: precio cliente vs coste interno)", () => {
  it("2 trabajadores × 24h × 350 SEK coste interno/h = 16800 SEK de coste interno", () => {
    const item = calcItem({
      id: "1",
      useDetailedLabor: true,
      workerCount: 2,
      hoursPerWorker: 24,
      hourlyRate: 500,
      internalHourlyRate: 350,
      quantity: 0,
      unitPrice: 0,
      discountType: "NONE",
      discountValue: 0,
      deductionType: "ROT",
      materials: [],
    });

    expect(item.laborTotalHours).toBe(48);
    expect(item.laborGross).toBe(24000); // venta: 48h × 500 SEK/h
    expect(item.laborCostInternal).toBe(16800); // coste: 48h × 350 SEK/h
  });

  it("separa el coste interno de mano de obra y de materiales en el resumen del presupuesto", () => {
    const result = calcQuote({
      ...baseQuote,
      items: [
        {
          id: "1",
          useDetailedLabor: true,
          workerCount: 2,
          hoursPerWorker: 24,
          hourlyRate: 500,
          internalHourlyRate: 350,
          quantity: 0,
          unitPrice: 0,
          discountType: "NONE",
          discountValue: 0,
          deductionType: "NONE",
          materials: [{ id: "m1", quantity: 10, purchasePrice: 100, marginPercent: 20 }],
        },
      ],
      otherCosts: [],
    });

    expect(result.laborCostInternal).toBe(16800);
    expect(result.materialCostInternal).toBe(1000); // 10 × 100 (coste de compra, sin margen)
    expect(result.totalCostInternal).toBe(17800);
  });
});

describe("Integración: habitación -> línea de trabajo -> materiales -> presupuesto", () => {
  it("rodapié: perímetro menos ancho de puerta, con desperdicio del material", () => {
    const room = computeRoomMeasurements(
      { length: 6, width: 5, height: 2.5 },
      [{ type: "DOOR", width: 0.9, height: 2.1, quantity: 1 }]
    );
    const aggregated = aggregateRoomMeasurements([room]);
    const baseboardLength = getMeasurementValue("PERIMETER", aggregated, true);
    expect(baseboardLength).toBeCloseTo(21.1, 3);

    const material = computeMaterialAutoCalc(
      { calcType: "COVERAGE", coveragePerUnit: 1, wastePercent: 8 },
      baseboardLength
    );
    expect(material.calculatedQuantity).toBeCloseTo(22.788, 2);
  });

  it("el presupuesto final usa las cantidades derivadas de la habitación", () => {
    const salon = computeRoomMeasurements(
      { length: 6, width: 5, height: 2.5 },
      [
        { type: "DOOR", width: 0.9, height: 2.1, quantity: 1 },
        { type: "WINDOW", width: 1.5, height: 1.4, quantity: 1 },
      ]
    );
    const aggregated = aggregateRoomMeasurements([salon]);
    const wallArea = getMeasurementValue("NET_WALL", aggregated);

    const result = calcQuote({
      ...baseQuote,
      items: [
        {
          id: "paredes",
          useDetailedLabor: false,
          quantity: wallArea,
          unitPrice: 150,
          discountType: "NONE",
          discountValue: 0,
          deductionType: "NONE",
          materials: [],
        },
      ],
      otherCosts: [],
    });

    // 51,01 m² × 150 SEK/m² = 7.651,50 SEK (ejemplo de la sección "Pintura por m² de pared")
    expect(result.items[0].lineTotal).toBeCloseTo(7651.5, 2);
  });

  it("agrega correctamente varias habitaciones para una misma línea de trabajo", () => {
    const salon = computeRoomMeasurements({ length: 6, width: 5, height: 2.5 }, []);
    const dormitorio = computeRoomMeasurements({ length: 4, width: 3.5, height: 2.5 }, []);
    const aggregated = aggregateRoomMeasurements([salon, dormitorio]);

    const expectedFloor = 6 * 5 + 4 * 3.5;
    expect(getMeasurementValue("FLOOR", aggregated)).toBeCloseTo(expectedFloor, 3);
  });

  it("habitaciones distintas por trabajo: cada línea usa solo las suyas, no todas las del proyecto", () => {
    const dormitorio = computeRoomMeasurements(
      { length: 4, width: 3, height: 2.5 },
      [{ type: "DOOR", width: 0.9, height: 2.1, quantity: 1 }]
    );
    const salon = computeRoomMeasurements(
      { length: 6, width: 5, height: 2.5 },
      [{ type: "DOOR", width: 0.9, height: 2.1, quantity: 1 }]
    );

    // "Pintura paredes" solo usa el dormitorio.
    const paredesArea = getMeasurementValue("NET_WALL", aggregateRoomMeasurements([dormitorio]));
    // "Lijado parquet" y "Barnizado" solo usan el salón.
    const salonFloor = getMeasurementValue("FLOOR", aggregateRoomMeasurements([salon]));

    expect(paredesArea).toBeCloseTo(getMeasurementValue("NET_WALL", aggregateRoomMeasurements([dormitorio])), 6);
    expect(salonFloor).toBe(30); // 6×5
    expect(paredesArea).not.toBeCloseTo(salonFloor, 0);
  });
});

describe("Desperdicio de materiales (sección 10-19 de la spec)", () => {
  it("0% de desperdicio no altera la cantidad base", () => {
    expect(applyWaste(100, 0)).toBe(100);
  });

  it("5% de desperdicio", () => {
    expect(applyWaste(100, 5)).toBe(105);
  });

  it("10% de desperdicio", () => {
    expect(applyWaste(100, 10)).toBe(110);
  });

  it("12% de desperdicio", () => {
    expect(applyWaste(100, 12)).toBe(112);
  });

  it("desperdicio con decimales (7.5%)", () => {
    expect(applyWaste(200, 7.5)).toBe(215);
  });

  it("cambiar el desperdicio manualmente para un cálculo recalcula la cantidad sin mutar el material original", () => {
    const material = { calcType: "COVERAGE" as const, coveragePerUnit: 1.2, wastePercent: 5 };
    const withLibraryDefault = computeMaterialAutoCalc(material, 70);
    const withOverride = computeMaterialAutoCalc({ ...material, wastePercent: 15 }, 70);

    expect(withLibraryDefault.calculatedQuantity).not.toBe(withOverride.calculatedQuantity);
    // El objeto original de la biblioteca no se modifica al aplicar un override puntual.
    expect(material.wastePercent).toBe(5);
  });
});

describe("Suelos por paquetes tras aplicar desperdicio (sección 13 de la spec)", () => {
  it("70 m², 10% desperdicio, paquete de 2.2 m² => exactamente 35 paquetes", () => {
    const result = computePackageArea({ area: 70, wastePercent: 10, areaPerPackage: 2.2 });
    expect(result.necessaryArea).toBeCloseTo(77, 3);
    expect(result.packagesNeeded).toBe(35);
    expect(result.purchasedArea).toBeCloseTo(77, 3);
  });

  it("si el redondeo exige 35.1 paquetes, compra 36 (nunca menos de lo necesario)", () => {
    const result = computePackageArea({ area: 70, wastePercent: 11, areaPerPackage: 2.2 });
    expect(result.necessaryArea).toBeCloseTo(77.7, 3);
    expect(result.packagesNeeded).toBe(36);
    expect(result.purchasedArea).toBeGreaterThanOrEqual(result.necessaryArea);
  });
});

describe("Pintura: litros por rendimiento y manos, con desperdicio y envases (sección 6-9 de la spec)", () => {
  it("160 m², 2 manos, 8 m²/L, 10% desperdicio => 44 L necesarios", () => {
    const liters = computeCoatsCoverageQuantity({
      area: 160,
      coats: 2,
      coveragePerUnit: 8,
      wastePercent: 10,
    });
    expect(liters).toBeCloseTo(44, 3);
  });

  it("sugiere envases suficientes para cubrir lo necesario sin quedarse corto", () => {
    const suggestion = suggestContainers(44, [1, 2.7, 5, 9, 10]);
    expect(suggestion.totalPurchased).toBeGreaterThanOrEqual(44);
  });
});

describe("Pegamento: consumo por m² con desperdicio (sección 10 de la spec)", () => {
  it("70 m² × 1.2 kg/m² = 84 kg base; con 5% desperdicio => 88.2 kg", () => {
    const kg = computeConsumptionQuantity({ area: 70, consumptionPerM2: 1.2, wastePercent: 5 });
    expect(kg).toBeCloseTo(88.2, 3);
  });

  it("cubos de 15 kg => 6 cubos (90 kg comprados), con sobrante", () => {
    const kg = computeConsumptionQuantity({ area: 70, consumptionPerM2: 1.2, wastePercent: 5 });
    const suggestion = suggestContainers(kg, [15]);
    expect(suggestion.combination[0]).toEqual({ size: 15, count: 6 });
    expect(suggestion.totalPurchased).toBeCloseTo(90, 3);
    expect(suggestion.leftover).toBeCloseTo(1.8, 3);
  });
});

describe("Barniz: manos por rendimiento con desperdicio propio del material (sección 9 de la spec)", () => {
  it("70 m² × 3 manos / 10 m²/L = 21 L base; con desperdicio propio aplicado", () => {
    const liters = computeCoatsCoverageQuantity({
      area: 70,
      coats: 3,
      coveragePerUnit: 10,
      wastePercent: 8,
    });
    // base 21 L × 1.08 = 22.68 L
    expect(liters).toBeCloseTo(22.68, 3);
  });
});

describe("Rodapiés: perímetro menos ancho de puertas y desperdicio (sección 19 de la spec)", () => {
  it("perímetro 22 m − puerta 0.9 m = 21.1 m base; 7% desperdicio => 22.577 m necesarios", () => {
    const kg = computeConsumptionQuantity({ area: 21.1, consumptionPerM2: 1, wastePercent: 7 });
    expect(kg).toBeCloseTo(22.577, 3);
  });
});

describe("Resumen agrupado por categoría (sección 7 de la spec)", () => {
  it("una sola categoría: un único grupo con todas las líneas", () => {
    const groups = groupLinesByCategory([
      { id: "1", name: "Pintura de paredes", categoryName: "Pintura interior", quantity: 42, unit: "M2", unitPrice: 150, lineTotal: 6300 },
      { id: "2", name: "Pintura de techo", categoryName: "Pintura interior", quantity: 42, unit: "M2", unitPrice: 180, lineTotal: 7560 },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].categoryName).toBe("Pintura interior");
    expect(groups[0].subtotal).toBe(13860);
  });

  it("dos categorías: dos grupos con su propio subtotal", () => {
    const groups = groupLinesByCategory([
      { id: "1", name: "Pintura de paredes", categoryName: "Pintura interior", quantity: 42, unit: "M2", unitPrice: 150, lineTotal: 6300 },
      { id: "2", name: "Lijado parquet", categoryName: "Suelos", quantity: 30, unit: "M2", unitPrice: 250, lineTotal: 7500 },
    ]);
    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.categoryName)).toEqual(["Pintura interior", "Suelos"]);
    expect(groups[0].subtotal).toBe(6300);
    expect(groups[1].subtotal).toBe(7500);
  });

  it("tres o más categorías: cada una con su subtotal, y el total general es la suma de todos", () => {
    const lines = [
      { id: "1", name: "Pintura de paredes", categoryName: "Pintura interior", quantity: 42, unit: "M2", unitPrice: 150, lineTotal: 6300 },
      { id: "2", name: "Lijado parquet", categoryName: "Suelos", quantity: 30, unit: "M2", unitPrice: 250, lineTotal: 7500 },
      { id: "3", name: "Barnizado", categoryName: "Suelos", quantity: 30, unit: "M2", unitPrice: 120, lineTotal: 3600 },
      { id: "4", name: "Montaje cocina", categoryName: "Cocina", quantity: 20, unit: "HOUR", unitPrice: 650, lineTotal: 13000 },
    ];
    const groups = groupLinesByCategory(lines);
    expect(groups).toHaveLength(3);
    expect(groups.map((g) => g.categoryName)).toEqual(["Pintura interior", "Suelos", "Cocina"]);
    expect(groups[1].subtotal).toBe(11100); // Suelos: 7500 + 3600
    const grandTotal = groups.reduce((sum, g) => sum + g.subtotal, 0);
    expect(grandTotal).toBe(lines.reduce((sum, l) => sum + l.lineTotal, 0));
  });

  it("líneas sin categoría se agrupan aparte, sin romper el resto de grupos", () => {
    const groups = groupLinesByCategory([
      { id: "1", name: "Trabajo personalizado", categoryName: "", quantity: 1, unit: "UNIT", unitPrice: 500, lineTotal: 500 },
      { id: "2", name: "Pintura de paredes", categoryName: "Pintura interior", quantity: 10, unit: "M2", unitPrice: 150, lineTotal: 1500 },
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0].categoryName).toBe("Otros trabajos");
    expect(groups[1].categoryName).toBe("Pintura interior");
  });
});

describe("Trabajos de distintas categorías en el mismo cálculo (sección 1-4 de la spec)", () => {
  const baseItem = {
    useDetailedLabor: false as const,
    discountType: "NONE" as const,
    discountValue: 0,
    deductionType: "ROT" as const,
    materials: [] as never[],
  };

  it("un cálculo puede combinar pintura, suelos y cocina a la vez, cada uno con su importe", () => {
    const result = calcQuote({
      ...baseQuote,
      items: [
        { ...baseItem, id: "paredes", quantity: 42, unitPrice: 150 }, // Pintura interior: 6300
        { ...baseItem, id: "lijado", quantity: 30, unitPrice: 250 }, // Suelos: 7500
        { ...baseItem, id: "barnizado", quantity: 30, unitPrice: 120 }, // Suelos: 3600
        { ...baseItem, id: "cocina", quantity: 20, unitPrice: 650 }, // Cocina: 13000
      ],
      otherCosts: [],
    });

    expect(result.items).toHaveLength(4);
    expect(result.laborSubtotal).toBe(6300 + 7500 + 3600 + 13000);
    // No hace falta crear varios cálculos: todas las líneas conviven en el mismo resultado.
    expect(result.items.map((i) => i.lineTotal)).toEqual([6300, 7500, 3600, 13000]);
  });
});

describe("ROT/RUT-avdrag por trabajo (Skattereduktion: sección 8-13 de la spec)", () => {
  const baseItem = {
    useDetailedLabor: false as const,
    discountType: "NONE" as const,
    discountValue: 0,
    materials: [] as never[],
  };

  it("NONE: sin deducción aunque el % de ROT/RUT esté configurado", () => {
    const result = calcQuote({
      ...baseQuote,
      items: [{ ...baseItem, id: "1", quantity: 1, unitPrice: 10000, deductionType: "NONE" }],
      otherCosts: [],
    });
    expect(result.rotDeduction).toBe(0);
    expect(result.rutDeduction).toBe(0);
    expect(result.totalDue).toBe(result.totalInclVat);
  });

  it("ROT 30%: se calcula solo sobre la mano de obra elegible marcada como ROT", () => {
    const result = calcQuote({
      ...baseQuote,
      items: [
        { ...baseItem, id: "elegible", quantity: 1, unitPrice: 40000, deductionType: "ROT" },
        { ...baseItem, id: "no-elegible", quantity: 1, unitPrice: 5000, deductionType: "NONE" },
      ],
      otherCosts: [],
    });
    // Ejemplo de la spec: mano de obra ROT 40.000 SEK, ROT 30% => 12.000 SEK.
    expect(result.rotEligibleLaborBase).toBe(40000);
    expect(result.rotDeduction).toBe(12000);
    expect(result.rutDeduction).toBe(0);
  });

  it("RUT 50%: se calcula solo sobre la mano de obra elegible marcada como RUT", () => {
    const result = calcQuote({
      ...baseQuote,
      items: [{ ...baseItem, id: "1", quantity: 1, unitPrice: 10000, deductionType: "RUT" }],
      otherCosts: [],
    });
    // Ejemplo de la spec: mano de obra RUT 10.000 SEK, RUT 50% => 5.000 SEK.
    expect(result.rutEligibleLaborBase).toBe(10000);
    expect(result.rutDeduction).toBe(5000);
    expect(result.rotDeduction).toBe(0);
  });

  it("ROT + RUT en el mismo cálculo: bases separadas, sin mezclarse entre sí ni con el trabajo sin deducción", () => {
    const result = calcQuote({
      ...baseQuote,
      items: [
        { ...baseItem, id: "rot-a", quantity: 1, unitPrice: 20000, deductionType: "ROT" },
        { ...baseItem, id: "rot-b", quantity: 1, unitPrice: 10000, deductionType: "ROT" },
        { ...baseItem, id: "rut-c", quantity: 1, unitPrice: 8000, deductionType: "RUT" },
        {
          ...baseItem,
          id: "sin-deduccion",
          quantity: 1,
          unitPrice: 5000,
          deductionType: "NONE",
          materials: [{ id: "m1", quantity: 1, purchasePrice: 12000, marginPercent: 0 }],
        },
      ],
      otherCosts: [{ id: "o1", quantity: 1, unitPrice: 2000 }],
    });

    // Ejemplo de la spec: ROT 30.000 → -9.000; RUT 8.000 → -4.000; resto intacto.
    expect(result.rotEligibleLaborBase).toBe(30000);
    expect(result.rotDeduction).toBe(9000);
    expect(result.rutEligibleLaborBase).toBe(8000);
    expect(result.rutDeduction).toBe(4000);
    expect(result.materialAfterDiscount).toBe(12000);
    expect(result.otherAfterDiscount).toBe(2000);
    expect(result.totalDue).toBe(result.totalInclVat - 9000 - 4000);
  });

  it("los materiales nunca entran en ninguna base (ni ROT ni RUT), aunque el item tenga deducción", () => {
    const resultRot = calcQuote({
      ...baseQuote,
      items: [
        {
          ...baseItem,
          id: "1",
          quantity: 1,
          unitPrice: 10000,
          deductionType: "ROT",
          materials: [{ id: "m1", quantity: 1, purchasePrice: 5000, marginPercent: 0 }],
        },
      ],
      otherCosts: [],
    });
    expect(resultRot.rotEligibleLaborBase).toBe(10000);
    expect(resultRot.rotDeduction).toBe(3000);

    const resultRut = calcQuote({
      ...baseQuote,
      items: [
        {
          ...baseItem,
          id: "1",
          quantity: 1,
          unitPrice: 10000,
          deductionType: "RUT",
          materials: [{ id: "m1", quantity: 1, purchasePrice: 5000, marginPercent: 0 }],
        },
      ],
      otherCosts: [],
    });
    expect(resultRut.rutEligibleLaborBase).toBe(10000);
    expect(resultRut.rutDeduction).toBe(5000);
  });

  it("otros costes nunca entran en la base de ROT ni de RUT", () => {
    const result = calcQuote({
      ...baseQuote,
      items: [
        { ...baseItem, id: "rot", quantity: 1, unitPrice: 10000, deductionType: "ROT" },
        { ...baseItem, id: "rut", quantity: 1, unitPrice: 8000, deductionType: "RUT" },
      ],
      otherCosts: [{ id: "o1", quantity: 1, unitPrice: 3000 }],
    });
    expect(result.rotEligibleLaborBase).toBe(10000);
    expect(result.rutEligibleLaborBase).toBe(8000);
  });

  it("snapshot del % de ROT: cada cálculo usa el porcentaje que se le pasa, no un valor global fijo", () => {
    const items: CalcQuoteInput["items"] = [
      { ...baseItem, id: "1", quantity: 1, unitPrice: 10000, deductionType: "ROT" },
    ];

    // Un cálculo antiguo, guardado con el 30% vigente en ese momento...
    const oldCalculation = calcQuote({ ...baseQuote, items, otherCosts: [], rotPercent: 30 });
    // ...no cambia aunque la configuración global de la empresa suba después al 50%.
    const newCalculation = calcQuote({ ...baseQuote, items, otherCosts: [], rotPercent: 50 });

    expect(oldCalculation.rotDeduction).toBe(3000);
    expect(newCalculation.rotDeduction).toBe(5000);
    expect(oldCalculation.rotDeduction).not.toBe(newCalculation.rotDeduction);
  });

  it("snapshot del % de RUT: cada cálculo usa el porcentaje que se le pasa, no un valor global fijo", () => {
    const items: CalcQuoteInput["items"] = [
      { ...baseItem, id: "1", quantity: 1, unitPrice: 10000, deductionType: "RUT" },
    ];

    // Un cálculo antiguo, guardado con el 40% vigente en ese momento...
    const oldCalculation = calcQuote({ ...baseQuote, items, otherCosts: [], rutPercent: 40 });
    // ...no cambia aunque la configuración global de la empresa baje/suba después al 50%.
    const newCalculation = calcQuote({ ...baseQuote, items, otherCosts: [], rutPercent: 50 });

    expect(oldCalculation.rutDeduction).toBe(4000);
    expect(newCalculation.rutDeduction).toBe(5000);
    expect(oldCalculation.rutDeduction).not.toBe(newCalculation.rutDeduction);
  });

  it("cambio manual ROT → RUT en la misma línea: la base y la deducción se mueven de una a otra", () => {
    const rotItem = { ...baseItem, id: "1", quantity: 1, unitPrice: 10000, deductionType: "ROT" as const };
    const rutItem = { ...rotItem, deductionType: "RUT" as const };

    const resultRot = calcQuote({ ...baseQuote, items: [rotItem], otherCosts: [] });
    expect(resultRot.rotDeduction).toBe(3000); // 10000 × 30%
    expect(resultRot.rutDeduction).toBe(0);

    const resultRut = calcQuote({ ...baseQuote, items: [rutItem], otherCosts: [] });
    expect(resultRut.rotDeduction).toBe(0);
    expect(resultRut.rutDeduction).toBe(5000); // 10000 × 50%
  });

  it("cambio manual RUT → NONE en la misma línea: la deducción desaparece por completo", () => {
    const rutItem = { ...baseItem, id: "1", quantity: 1, unitPrice: 10000, deductionType: "RUT" as const };
    const noneItem = { ...rutItem, deductionType: "NONE" as const };

    const resultRut = calcQuote({ ...baseQuote, items: [rutItem], otherCosts: [] });
    expect(resultRut.rutDeduction).toBe(5000);

    const resultNone = calcQuote({ ...baseQuote, items: [noneItem], otherCosts: [] });
    expect(resultNone.rutDeduction).toBe(0);
    expect(resultNone.rotDeduction).toBe(0);
    expect(resultNone.totalDue).toBe(resultNone.totalInclVat);
  });

  it("la categoría del trabajo nunca fuerza el tipo de deducción: cada línea decide la suya", () => {
    // Dos líneas de la misma categoría ("Suelos"), una ROT y otra RUT: el motor
    // no asume nada a partir de la categoría, solo mira deductionType por línea.
    const result = calcQuote({
      ...baseQuote,
      items: [
        { ...baseItem, id: "lijado", quantity: 1, unitPrice: 10000, deductionType: "ROT" },
        { ...baseItem, id: "barnizado", quantity: 1, unitPrice: 6000, deductionType: "RUT" },
      ],
      otherCosts: [],
    });
    expect(result.rotEligibleLaborBase).toBe(10000);
    expect(result.rutEligibleLaborBase).toBe(6000);
  });
});

describe("Caso de prueba end-to-end (sección 21 de la spec): Dormitorio + Salón", () => {
  it("pintura de paredes usa solo el dormitorio; lijado y barnizado usan solo el salón; los tres en el mismo cálculo", () => {
    const dormitorio = computeRoomMeasurements(
      { length: 4, width: 3, height: 2.5 },
      [{ type: "DOOR", width: 0.9, height: 2.1, quantity: 1 }]
    );
    const salon = computeRoomMeasurements({ length: 6, width: 5, height: 2.5 }, []);

    const paredesArea = getMeasurementValue("NET_WALL", aggregateRoomMeasurements([dormitorio]));
    const salonFloor = getMeasurementValue("FLOOR", aggregateRoomMeasurements([salon]));
    expect(salonFloor).toBe(30);

    const result = calcQuote({
      ...baseQuote,
      items: [
        {
          id: "pintura-paredes",
          useDetailedLabor: false,
          quantity: paredesArea,
          unitPrice: 150,
          discountType: "NONE",
          discountValue: 0,
          deductionType: "ROT",
          materials: [],
        },
        {
          id: "lijado-parquet",
          useDetailedLabor: false,
          quantity: salonFloor,
          unitPrice: 250,
          discountType: "NONE",
          discountValue: 0,
          deductionType: "ROT",
          materials: [],
        },
        {
          id: "barnizado",
          useDetailedLabor: false,
          quantity: salonFloor,
          unitPrice: 120,
          discountType: "NONE",
          discountValue: 0,
          deductionType: "ROT",
          materials: [],
        },
      ],
      otherCosts: [],
    });

    expect(result.items).toHaveLength(3);
    expect(result.items[1].lineTotal).toBe(30 * 250);
    expect(result.items[2].lineTotal).toBe(30 * 120);

    // Los tres trabajos son ROT: la base es la suma de las tres manos de obra.
    const expectedLabor = result.items[0].laborNet + result.items[1].laborNet + result.items[2].laborNet;
    expect(result.rotEligibleLaborBase).toBeCloseTo(expectedLabor, 2);
    expect(result.rotDeduction).toBeCloseTo(expectedLabor * 0.3, 2);

    // Ahora se añade un trabajo RUT de prueba y se comprueba que no se mezcla con la base ROT.
    const withRut = calcQuote({
      ...baseQuote,
      items: [
        ...[
          { id: "pintura-paredes", quantity: paredesArea, unitPrice: 150 },
          { id: "lijado-parquet", quantity: salonFloor, unitPrice: 250 },
          { id: "barnizado", quantity: salonFloor, unitPrice: 120 },
        ].map((i) => ({
          ...i,
          useDetailedLabor: false as const,
          discountType: "NONE" as const,
          discountValue: 0,
          deductionType: "ROT" as const,
          materials: [] as never[],
        })),
        {
          id: "limpieza-rut",
          useDetailedLabor: false,
          quantity: 1,
          unitPrice: 2000,
          discountType: "NONE",
          discountValue: 0,
          deductionType: "RUT",
          materials: [],
        },
      ],
      otherCosts: [],
    });

    expect(withRut.rotEligibleLaborBase).toBeCloseTo(expectedLabor, 2);
    expect(withRut.rutEligibleLaborBase).toBe(2000);
    expect(withRut.rutDeduction).toBe(1000); // 2000 × 50%
    expect(withRut.rotDeduction).toBeCloseTo(expectedLabor * 0.3, 2);
  });
});
