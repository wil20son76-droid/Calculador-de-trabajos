import { describe, it, expect } from "vitest";

import { calcQuote, calcItem } from "../engine";
import { computeRoomMeasurements, aggregateRoomMeasurements, getMeasurementValue } from "../measurements";
import { computeMaterialAutoCalc } from "../materials-auto";

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
});
