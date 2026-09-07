import { describe, it, expect } from "vitest";

import {
  applyWaste,
  computeCoatsCoverageQuantity,
  computeConsumptionQuantity,
  computePackageArea,
  suggestContainers,
  suggestSinglePackage,
  computeMaterialAutoCalc,
} from "../materials-auto";

describe("applyWaste", () => {
  it("aplica un porcentaje de desperdicio", () => {
    expect(applyWaste(70, 10)).toBe(77);
    expect(applyWaste(70, 0)).toBe(70);
  });
});

describe("computeCoatsCoverageQuantity (litros de pintura)", () => {
  it("reproduce el ejemplo de la spec: 160 m², 2 manos, 8 m²/L, 10% desperdicio => 44 L", () => {
    const liters = computeCoatsCoverageQuantity({
      area: 160,
      coats: 2,
      coveragePerUnit: 8,
      wastePercent: 10,
    });
    expect(liters).toBe(44);
  });

  it("barniz de suelo por manos: 70 m², 3 manos, 10 m²/L, sin desperdicio => 21 L", () => {
    const liters = computeCoatsCoverageQuantity({
      area: 70,
      coats: 3,
      coveragePerUnit: 10,
      wastePercent: 0,
    });
    expect(liters).toBe(21);
  });

  it("devuelve 0 si no hay rendimiento configurado", () => {
    expect(computeCoatsCoverageQuantity({ area: 100, coats: 2, coveragePerUnit: 0, wastePercent: 0 })).toBe(0);
  });
});

describe("computeConsumptionQuantity (pegamento por kg/m²)", () => {
  it("reproduce el ejemplo de la spec: 1,2 kg/m² × 70 m² = 84 kg", () => {
    const kg = computeConsumptionQuantity({ area: 70, consumptionPerM2: 1.2 });
    expect(kg).toBe(84);
  });

  it("aplica desperdicio cuando se indica", () => {
    const kg = computeConsumptionQuantity({ area: 70, consumptionPerM2: 1.2, wastePercent: 10 });
    expect(kg).toBeCloseTo(92.4, 3);
  });
});

describe("computePackageArea (paquetes de suelo, Math.ceil)", () => {
  it("reproduce el ejemplo de la spec: 70 m², 10% desperdicio, 2,2 m²/paquete => 35 paquetes exactos", () => {
    const result = computePackageArea({ area: 70, wastePercent: 10, areaPerPackage: 2.2 });
    expect(result.necessaryArea).toBe(77);
    expect(result.packagesNeeded).toBe(35);
    expect(result.purchasedArea).toBeCloseTo(77, 3);
  });

  it("redondea siempre hacia arriba cuando el resultado no es exacto (35,1 => 36)", () => {
    // area tal que necessaryArea / areaPerPackage = 35.1...
    const areaPerPackage = 2.2;
    const necessaryArea = 35.1 * areaPerPackage; // 77.22
    const result = computePackageArea({ area: necessaryArea, wastePercent: 0, areaPerPackage });
    expect(result.packagesNeeded).toBe(36);
    expect(result.purchasedArea).toBeGreaterThanOrEqual(result.necessaryArea);
  });

  it("nunca compra menos superficie de la necesaria", () => {
    for (const area of [10, 33.3, 50.01, 100]) {
      const result = computePackageArea({ area, wastePercent: 7, areaPerPackage: 3.7 });
      expect(result.purchasedArea).toBeGreaterThanOrEqual(result.necessaryArea - 1e-9);
    }
  });
});

describe("suggestContainers (combinación de envases de pintura)", () => {
  it("nunca sugiere menos cantidad de la necesaria", () => {
    const suggestion = suggestContainers(44, [1, 2.7, 5, 9, 10]);
    expect(suggestion.totalPurchased).toBeGreaterThanOrEqual(44);
    expect(suggestion.leftover).toBeGreaterThanOrEqual(0);
    expect(suggestion.combination.length).toBeGreaterThan(0);
  });

  it("usa una combinación práctica (pocos envases) en vez de muchas unidades pequeñas", () => {
    const suggestion = suggestContainers(44, [1, 2.7, 5, 9, 10]);
    const totalContainers = suggestion.combination.reduce((s, c) => s + c.count, 0);
    // Con envases de hasta 10L disponibles, cubrir 44L nunca debería necesitar más de 6-7 envases.
    expect(totalContainers).toBeLessThanOrEqual(7);
  });

  it("con un solo tamaño de envase, funciona como redondeo simple hacia arriba", () => {
    const suggestion = suggestContainers(23, [5]);
    expect(suggestion.combination).toEqual([{ size: 5, count: 5 }]);
    expect(suggestion.totalPurchased).toBe(25);
  });

  it("sin envases disponibles, no sugiere nada (cantidad exacta manual)", () => {
    const suggestion = suggestContainers(10, []);
    expect(suggestion.combination).toEqual([]);
  });
});

describe("suggestSinglePackage", () => {
  it("redondea hacia arriba al múltiplo del envase (pegamento en cubos de 15kg)", () => {
    // 84 kg necesarios, cubos de 15 kg => 6 cubos = 90 kg (ejemplo de la spec)
    const suggestion = suggestSinglePackage(84, 15);
    expect(suggestion.combination).toEqual([{ size: 15, count: 6 }]);
    expect(suggestion.totalPurchased).toBe(90);
    expect(suggestion.leftover).toBe(6);
  });
});

describe("computeMaterialAutoCalc (integración)", () => {
  it("PAINT: calcula litros y sugiere envases sin bajar de lo necesario", () => {
    const result = computeMaterialAutoCalc(
      { calcType: "PAINT", coveragePerUnit: 8, coats: 2, wastePercent: 10, containerSizes: [1, 2.7, 5, 9, 10] },
      160
    );
    expect(result.calculatedQuantity).toBe(44);
    expect(result.suggestedQuantity).toBeGreaterThanOrEqual(44);
  });

  it("COVERAGE: pegamento 1,2 kg/m² con cubos de 15kg", () => {
    const result = computeMaterialAutoCalc(
      { calcType: "COVERAGE", coveragePerUnit: 1.2, wastePercent: 0, packageSize: 15 },
      70
    );
    expect(result.calculatedQuantity).toBe(84);
    expect(result.suggestedQuantity).toBe(90);
  });

  it("PACKAGE: parquet con paquetes de 2,2 m²", () => {
    const result = computeMaterialAutoCalc(
      { calcType: "PACKAGE", wastePercent: 10, packageSize: 2.2 },
      70
    );
    expect(result.calculatedQuantity).toBe(77);
    expect(result.packageResult?.packagesNeeded).toBe(35);
  });

  it("NONE: no calcula nada automáticamente", () => {
    const result = computeMaterialAutoCalc({ calcType: "NONE", wastePercent: 0 }, 100);
    expect(result.calculatedQuantity).toBe(0);
    expect(result.suggestedQuantity).toBe(0);
  });
});
