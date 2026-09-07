import { round3 } from "./round";

export type OpeningType = "DOOR" | "WINDOW" | "OTHER";

export interface RoomDimensionsInput {
  length: number;
  width: number;
  height: number;
}

export interface RoomOpeningInput {
  type: OpeningType;
  width: number;
  height: number;
  quantity: number;
}

export interface RoomMeasurements {
  floorArea: number;
  ceilingArea: number;
  perimeter: number;
  grossWallArea: number;
  openingsArea: number;
  netWallArea: number;
  doorWidthTotal: number;
}

/**
 * Calcula suelo, techo, perímetro y paredes brutas/netas de una habitación
 * a partir de sus dimensiones y de las aberturas (puertas/ventanas) a descontar.
 *
 * Ejemplo (sección "Calculador de habitaciones"):
 *   6 × 5 m, altura 2,5 m
 *   suelo = 30 m², techo = 30 m², perímetro = 22 m, paredes brutas = 55 m²
 *   - puerta 0,9×2,1 (1,89 m²) - ventana 1,5×1,4 (2,10 m²) => paredes netas = 51,01 m²
 */
export function computeRoomMeasurements(
  room: RoomDimensionsInput,
  openings: RoomOpeningInput[] = []
): RoomMeasurements {
  const length = room.length || 0;
  const width = room.width || 0;
  const height = room.height || 0;

  const floorArea = round3(length * width);
  const ceilingArea = floorArea;
  const perimeter = round3(2 * length + 2 * width);
  const grossWallArea = round3(perimeter * height);

  const openingsArea = round3(
    openings.reduce((sum, o) => sum + (o.width || 0) * (o.height || 0) * (o.quantity || 0), 0)
  );
  const netWallArea = round3(Math.max(0, grossWallArea - openingsArea));

  const doorWidthTotal = round3(
    openings
      .filter((o) => o.type === "DOOR")
      .reduce((sum, o) => sum + (o.width || 0) * (o.quantity || 0), 0)
  );

  return { floorArea, ceilingArea, perimeter, grossWallArea, openingsArea, netWallArea, doorWidthTotal };
}

/** Suma las mediciones de varias habitaciones (selección múltiple en un trabajo). */
export function aggregateRoomMeasurements(rooms: RoomMeasurements[]): RoomMeasurements {
  return rooms.reduce<RoomMeasurements>(
    (acc, r) => ({
      floorArea: round3(acc.floorArea + r.floorArea),
      ceilingArea: round3(acc.ceilingArea + r.ceilingArea),
      perimeter: round3(acc.perimeter + r.perimeter),
      grossWallArea: round3(acc.grossWallArea + r.grossWallArea),
      openingsArea: round3(acc.openingsArea + r.openingsArea),
      netWallArea: round3(acc.netWallArea + r.netWallArea),
      doorWidthTotal: round3(acc.doorWidthTotal + r.doorWidthTotal),
    }),
    {
      floorArea: 0,
      ceilingArea: 0,
      perimeter: 0,
      grossWallArea: 0,
      openingsArea: 0,
      netWallArea: 0,
      doorWidthTotal: 0,
    }
  );
}

export type MeasurementSource =
  | "NONE"
  | "NET_WALL"
  | "GROSS_WALL"
  | "CEILING"
  | "FLOOR"
  | "PERIMETER";

/**
 * Obtiene el valor a usar como cantidad de una línea de trabajo a partir de la
 * medición agregada de las habitaciones seleccionadas.
 *
 * Para PERIMETER con `subtractOpeningWidths` (rodapiés), se resta el ancho total
 * de las puertas del perímetro (sección "Rodapiés").
 */
export function getMeasurementValue(
  source: MeasurementSource,
  aggregated: RoomMeasurements,
  subtractOpeningWidths = false
): number {
  switch (source) {
    case "NET_WALL":
      return aggregated.netWallArea;
    case "GROSS_WALL":
      return aggregated.grossWallArea;
    case "CEILING":
      return aggregated.ceilingArea;
    case "FLOOR":
      return aggregated.floorArea;
    case "PERIMETER":
      return subtractOpeningWidths
        ? round3(Math.max(0, aggregated.perimeter - aggregated.doorWidthTotal))
        : aggregated.perimeter;
    case "NONE":
    default:
      return 0;
  }
}
