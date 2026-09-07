import { describe, it, expect } from "vitest";

import {
  computeRoomMeasurements,
  aggregateRoomMeasurements,
  getMeasurementValue,
} from "../measurements";

describe("computeRoomMeasurements", () => {
  it("calcula suelo, techo y perímetro de una habitación sin aberturas", () => {
    const m = computeRoomMeasurements({ length: 6, width: 5, height: 2.5 });
    expect(m.floorArea).toBe(30);
    expect(m.ceilingArea).toBe(30);
    expect(m.perimeter).toBe(22);
    expect(m.grossWallArea).toBe(55);
    expect(m.netWallArea).toBe(55);
  });

  it("descuenta puertas y ventanas de las paredes brutas (ejemplo de la spec)", () => {
    const m = computeRoomMeasurements(
      { length: 6, width: 5, height: 2.5 },
      [
        { type: "DOOR", width: 0.9, height: 2.1, quantity: 1 },
        { type: "WINDOW", width: 1.5, height: 1.4, quantity: 1 },
      ]
    );
    // puerta: 0,9 × 2,1 = 1,89 m²; ventana: 1,5 × 1,4 = 2,10 m²
    expect(m.openingsArea).toBeCloseTo(3.99, 3);
    // paredes netas = 55 - 1,89 - 2,10 = 51,01 m²
    expect(m.netWallArea).toBeCloseTo(51.01, 3);
  });

  it("admite varias puertas/ventanas del mismo tipo (quantity > 1)", () => {
    const m = computeRoomMeasurements(
      { length: 5, width: 4, height: 2.5 },
      [{ type: "DOOR", width: 0.8, height: 2.0, quantity: 2 }]
    );
    expect(m.openingsArea).toBeCloseTo(3.2, 3); // 0.8*2*2
    expect(m.doorWidthTotal).toBeCloseTo(1.6, 3); // 0.8*2
  });

  it("nunca da paredes netas negativas aunque las aberturas superen el bruto", () => {
    const m = computeRoomMeasurements(
      { length: 2, width: 2, height: 2 },
      [{ type: "WINDOW", width: 3, height: 3, quantity: 2 }]
    );
    expect(m.netWallArea).toBe(0);
  });
});

describe("aggregateRoomMeasurements", () => {
  it("suma correctamente las medidas de varias habitaciones (salón + dormitorio)", () => {
    const salon = computeRoomMeasurements(
      { length: 6, width: 5, height: 2.5 },
      [
        { type: "DOOR", width: 0.9, height: 2.1, quantity: 1 },
        { type: "WINDOW", width: 1.5, height: 1.4, quantity: 1 },
      ]
    );
    const dormitorio = computeRoomMeasurements(
      { length: 4, width: 3.5, height: 2.5 },
      [
        { type: "DOOR", width: 0.9, height: 2.1, quantity: 1 },
        { type: "WINDOW", width: 1.2, height: 1.2, quantity: 1 },
      ]
    );
    const total = aggregateRoomMeasurements([salon, dormitorio]);
    expect(total.floorArea).toBeCloseTo(30 + 14, 3);
    expect(total.netWallArea).toBeCloseTo(salon.netWallArea + dormitorio.netWallArea, 3);
    expect(total.perimeter).toBeCloseTo(22 + 15, 3);
  });

  it("con cero habitaciones devuelve todo a cero", () => {
    const total = aggregateRoomMeasurements([]);
    expect(total.floorArea).toBe(0);
    expect(total.netWallArea).toBe(0);
  });
});

describe("getMeasurementValue", () => {
  const room = computeRoomMeasurements(
    { length: 6, width: 5, height: 2.5 },
    [{ type: "DOOR", width: 0.9, height: 2.1, quantity: 1 }]
  );
  const aggregated = aggregateRoomMeasurements([room]);

  it("devuelve el valor correcto para cada fuente de medición", () => {
    expect(getMeasurementValue("FLOOR", aggregated)).toBe(30);
    expect(getMeasurementValue("CEILING", aggregated)).toBe(30);
    expect(getMeasurementValue("GROSS_WALL", aggregated)).toBe(55);
    expect(getMeasurementValue("PERIMETER", aggregated)).toBe(22);
    expect(getMeasurementValue("NONE", aggregated)).toBe(0);
  });

  it("perímetro para rodapiés resta el ancho de las puertas cuando se pide", () => {
    // perímetro 22, puerta 0.9 => 21.1 (ejemplo de la sección Rodapiés)
    expect(getMeasurementValue("PERIMETER", aggregated, true)).toBeCloseTo(21.1, 3);
    expect(getMeasurementValue("PERIMETER", aggregated, false)).toBe(22);
  });
});
