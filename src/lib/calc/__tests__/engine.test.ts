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

describe("calcQuote — resumen (sección 9 de la spec)", () => {
  it("mano de obra 45000 + materiales 22000 + otros 3000 => subtotal 70000, moms 17500, ROT -22500, a pagar 65000", () => {
    const result = calcQuote({
      items: [
        {
          id: "1",
          useDetailedLabor: false,
          quantity: 1,
          unitPrice: 45000,
          discountType: "NONE",
          discountValue: 0,
          rotEligible: true,
          materials: [{ id: "m1", quantity: 1, purchasePrice: 22000, marginPercent: 0 }],
        },
      ],
      otherCosts: [{ id: "o1", quantity: 1, unitPrice: 3000 }],
      discountType: "NONE",
      discountValue: 0,
      vatRatePercent: 25,
      rotEnabled: true,
      rotPercent: 50,
    });

    expect(result.subtotalAfterDiscount).toBe(70000);
    expect(result.vatAmount).toBe(17500);
    expect(result.totalInclVat).toBe(87500);
    expect(result.rotDeduction).toBe(22500);
    expect(result.totalDue).toBe(65000);
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
      rotEligible: true,
      materials: [],
    });

    expect(item.laborTotalHours).toBe(48);
    expect(item.laborGross).toBe(24000); // venta: 48h × 500 SEK/h
    expect(item.laborCostInternal).toBe(16800); // coste: 48h × 350 SEK/h
  });

  it("separa el coste interno de mano de obra y de materiales en el resumen del presupuesto", () => {
    const result = calcQuote({
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
          rotEligible: true,
          materials: [{ id: "m1", quantity: 10, purchasePrice: 100, marginPercent: 20 }],
        },
      ],
      otherCosts: [],
      discountType: "NONE",
      discountValue: 0,
      vatRatePercent: 25,
      rotEnabled: false,
      rotPercent: 50,
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
      items: [
        {
          id: "paredes",
          useDetailedLabor: false,
          quantity: wallArea,
          unitPrice: 150,
          discountType: "NONE",
          discountValue: 0,
          rotEligible: true,
          materials: [],
        },
      ],
      otherCosts: [],
      discountType: "NONE",
      discountValue: 0,
      vatRatePercent: 25,
      rotEnabled: false,
      rotPercent: 50,
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

describe("ROT-avdrag por trabajo (sección ROT de la spec)", () => {
  const baseItem = {
    useDetailedLabor: false as const,
    discountType: "NONE" as const,
    discountValue: 0,
    materials: [],
  };

  it("ROT desactivado: no hay deducción aunque haya items elegibles", () => {
    const result = calcQuote({
      items: [{ ...baseItem, id: "1", quantity: 1, unitPrice: 10000, rotEligible: true }],
      otherCosts: [],
      discountType: "NONE",
      discountValue: 0,
      vatRatePercent: 25,
      rotEnabled: false,
      rotPercent: 50,
    });
    expect(result.rotDeduction).toBe(0);
    expect(result.totalDue).toBe(result.totalInclVat);
  });

  it("solo la mano de obra de los items marcados como ROT-berättigad entra en la base del ROT", () => {
    const result = calcQuote({
      items: [
        { ...baseItem, id: "elegible", quantity: 1, unitPrice: 10000, rotEligible: true },
        { ...baseItem, id: "no-elegible", quantity: 1, unitPrice: 5000, rotEligible: false },
      ],
      otherCosts: [],
      discountType: "NONE",
      discountValue: 0,
      vatRatePercent: 25,
      rotEnabled: true,
      rotPercent: 50,
    });
    // Solo 10000 (el item elegible) entra en la base del ROT, no los 15000 totales.
    expect(result.rotEligibleLaborBase).toBe(10000);
    expect(result.rotDeduction).toBe(5000);
  });

  it("los materiales nunca entran en la base del ROT, aunque el item sea elegible", () => {
    const result = calcQuote({
      items: [
        {
          ...baseItem,
          id: "1",
          quantity: 1,
          unitPrice: 10000,
          rotEligible: true,
          materials: [{ id: "m1", quantity: 1, purchasePrice: 5000, marginPercent: 0 }],
        },
      ],
      otherCosts: [],
      discountType: "NONE",
      discountValue: 0,
      vatRatePercent: 25,
      rotEnabled: true,
      rotPercent: 50,
    });
    // La base ROT es solo la mano de obra (10000), no 10000+5000 de materiales.
    expect(result.rotEligibleLaborBase).toBe(10000);
    expect(result.rotDeduction).toBe(5000);
  });

  it("otros costes nunca entran en la base del ROT", () => {
    const result = calcQuote({
      items: [{ ...baseItem, id: "1", quantity: 1, unitPrice: 10000, rotEligible: true }],
      otherCosts: [{ id: "o1", quantity: 1, unitPrice: 3000 }],
      discountType: "NONE",
      discountValue: 0,
      vatRatePercent: 25,
      rotEnabled: true,
      rotPercent: 50,
    });
    expect(result.rotEligibleLaborBase).toBe(10000);
    expect(result.rotDeduction).toBe(5000);
  });

  it("snapshot del % de ROT: cada cálculo usa el porcentaje que se le pasa, no un valor global fijo", () => {
    const input = {
      items: [{ ...baseItem, id: "1", quantity: 1, unitPrice: 10000, rotEligible: true }],
      otherCosts: [],
      discountType: "NONE" as const,
      discountValue: 0,
      vatRatePercent: 25,
      rotEnabled: true,
    };

    // Un cálculo antiguo, guardado con el 30% vigente en ese momento...
    const oldCalculation = calcQuote({ ...input, rotPercent: 30 });
    // ...no cambia aunque la configuración global de la empresa suba después al 50%.
    const newCalculation = calcQuote({ ...input, rotPercent: 50 });

    expect(oldCalculation.rotDeduction).toBe(3000);
    expect(newCalculation.rotDeduction).toBe(5000);
    expect(oldCalculation.rotDeduction).not.toBe(newCalculation.rotDeduction);
  });
});
