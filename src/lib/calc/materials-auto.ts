import { round2, round3 } from "./round";

/** Aplica un porcentaje de desperdicio a una cantidad base. */
export function applyWaste(value: number, wastePercent: number): number {
  return round3(value * (1 + Math.max(0, wastePercent || 0) / 100));
}

/**
 * Litros/kg necesarios de un material que se aplica por rendimiento (m² cubiertos
 * por unidad) y número de manos — pintura de paredes/techo, barniz, aceite...
 *
 * litros = (m² × manos / rendimiento) × (1 + desperdicio)
 *
 * Ejemplo: 160 m², 2 manos, 8 m²/L, 10% desperdicio => 160×2/8=40L; 40×1,10=44L
 */
export function computeCoatsCoverageQuantity(params: {
  area: number;
  coats: number;
  coveragePerUnit: number;
  wastePercent: number;
}): number {
  const { area, coats, coveragePerUnit, wastePercent } = params;
  if (!coveragePerUnit || coveragePerUnit <= 0) return 0;
  const base = (area * Math.max(1, coats || 1)) / coveragePerUnit;
  return round3(applyWaste(base, wastePercent));
}

/**
 * Cantidad necesaria de un material que se consume a razón de X por m² —
 * pegamento, imprimación, fuktspärr... (sección "Materiales auxiliares").
 *
 * necesario = área × consumo por m² × manos × (1 + desperdicio)
 *
 * Ejemplo: pegamento 1,2 kg/m², suelo 70 m² => 84 kg
 */
export function computeConsumptionQuantity(params: {
  area: number;
  consumptionPerM2: number;
  coats?: number;
  wastePercent?: number;
}): number {
  const { area, consumptionPerM2, coats, wastePercent } = params;
  if (!consumptionPerM2 || consumptionPerM2 <= 0) return 0;
  const base = area * consumptionPerM2 * Math.max(1, coats || 1);
  return round3(applyWaste(base, wastePercent || 0));
}

export interface PackageAreaResult {
  realArea: number;
  wastePercent: number;
  necessaryArea: number;
  areaPerPackage: number;
  packagesNeeded: number;
  purchasedArea: number;
  leftoverArea: number;
}

/**
 * Superficie vendida en paquetes (parquet, laminado...): siempre redondea hacia
 * arriba (Math.ceil) porque los paquetes son unidades indivisibles.
 *
 * Ejemplo: 70 m², 10% desperdicio => necesario 77 m²; paquete 2,2 m² => 35 paquetes
 * exactos. Si diera 35,1 => comprar 36 paquetes.
 */
export function computePackageArea(params: {
  area: number;
  wastePercent: number;
  areaPerPackage: number;
}): PackageAreaResult {
  const { area, wastePercent, areaPerPackage } = params;
  const necessaryArea = applyWaste(area, wastePercent);
  if (!areaPerPackage || areaPerPackage <= 0) {
    return {
      realArea: round3(area),
      wastePercent: wastePercent || 0,
      necessaryArea,
      areaPerPackage: 0,
      packagesNeeded: 0,
      purchasedArea: 0,
      leftoverArea: 0,
    };
  }
  const packagesNeeded = Math.ceil(round3(necessaryArea / areaPerPackage) - 1e-9);
  const purchasedArea = round3(packagesNeeded * areaPerPackage);
  return {
    realArea: round3(area),
    wastePercent: wastePercent || 0,
    necessaryArea,
    areaPerPackage,
    packagesNeeded,
    purchasedArea,
    leftoverArea: round3(Math.max(0, purchasedArea - necessaryArea)),
  };
}

export interface ContainerCombinationEntry {
  size: number;
  count: number;
}

export interface ContainerSuggestion {
  needed: number;
  combination: ContainerCombinationEntry[];
  totalPurchased: number;
  leftover: number;
}

/**
 * Sugiere una combinación práctica de envases de distintos tamaños para cubrir
 * al menos `needed` unidades, minimizando primero el número de envases y, en
 * caso de empate, el sobrante. Nunca sugiere menos de lo necesario.
 *
 * Ejemplo: necesario 44 L, envases [1, 2.7, 5, 9, 10] => 5 × 9 L = 45 L (sobran 1 L)
 */
export function suggestContainers(needed: number, sizes: number[]): ContainerSuggestion {
  const validSizes = Array.from(new Set(sizes.filter((s) => s > 0)));
  if (needed <= 0 || validSizes.length === 0) {
    return { needed: round3(needed), combination: [], totalPurchased: 0, leftover: 0 };
  }

  // Trabajamos en una rejilla entera (precisión de una décima) para evitar
  // problemas de coma flotante en la programación dinámica.
  const SCALE = 10;
  const target = Math.round(needed * SCALE);
  const scaledSizes = validSizes.map((s) => Math.round(s * SCALE));
  const maxSize = Math.max(...scaledSizes);
  const minSize = Math.min(...scaledSizes);

  let upperBound = target + maxSize;
  const ABSOLUTE_CAP = target + maxSize * 20; // salvaguarda ante combinaciones de tamaños "difíciles"

  let dp: number[] = [];
  let choice: number[] = [];

  function runDp(bound: number) {
    dp = new Array(bound + 1).fill(Infinity);
    choice = new Array(bound + 1).fill(-1);
    dp[0] = 0;
    for (let amt = 1; amt <= bound; amt++) {
      for (const s of scaledSizes) {
        if (s <= amt && dp[amt - s] + 1 < dp[amt]) {
          dp[amt] = dp[amt - s] + 1;
          choice[amt] = s;
        }
      }
    }
  }

  runDp(upperBound);

  // Amplía la búsqueda si no hay ningún importe alcanzable en el rango inicial
  // (posible con combinaciones de tamaños poco habituales).
  while (
    !Array.from({ length: upperBound - target + 1 }, (_, i) => target + i).some(
      (amt) => dp[amt] < Infinity
    ) &&
    upperBound < ABSOLUTE_CAP
  ) {
    upperBound += maxSize;
    runDp(upperBound);
  }

  let bestAmt = -1;
  let bestCount = Infinity;
  for (let amt = target; amt <= upperBound; amt++) {
    if (dp[amt] < Infinity && dp[amt] < bestCount) {
      bestCount = dp[amt];
      bestAmt = amt;
    }
  }

  if (bestAmt === -1) {
    // Fallback improbable: comprar el menor envase las veces que hagan falta.
    const count = Math.ceil(target / minSize);
    const totalPurchased = round2((count * minSize) / SCALE);
    return {
      needed: round3(needed),
      combination: [{ size: minSize / SCALE, count }],
      totalPurchased,
      leftover: round2(totalPurchased - needed),
    };
  }

  const counts = new Map<number, number>();
  let amt = bestAmt;
  while (amt > 0) {
    const s = choice[amt];
    counts.set(s, (counts.get(s) || 0) + 1);
    amt -= s;
  }

  const combination = Array.from(counts.entries())
    .map(([size, count]) => ({ size: size / SCALE, count }))
    .sort((a, b) => b.size - a.size);

  const totalPurchased = round2(bestAmt / SCALE);

  return {
    needed: round3(needed),
    combination,
    totalPurchased,
    leftover: round2(Math.max(0, totalPurchased - needed)),
  };
}

/** Redondeo simple a paquetes de un único tamaño (fallback cuando no hay varios tamaños). */
export function suggestSinglePackage(needed: number, packageSize: number): ContainerSuggestion {
  if (!packageSize || packageSize <= 0 || needed <= 0) {
    return { needed: round3(needed), combination: [], totalPurchased: 0, leftover: 0 };
  }
  const count = Math.ceil(round3(needed / packageSize) - 1e-9);
  const totalPurchased = round2(count * packageSize);
  return {
    needed: round3(needed),
    combination: [{ size: packageSize, count }],
    totalPurchased,
    leftover: round2(Math.max(0, totalPurchased - needed)),
  };
}

export type MaterialCalcType = "NONE" | "PAINT" | "COVERAGE" | "PACKAGE";

export interface MaterialAutoCalcInput {
  calcType: MaterialCalcType;
  coveragePerUnit?: number | null;
  coats?: number | null;
  wastePercent: number;
  packageSize?: number | null;
  containerSizes?: number[] | null;
}

export interface MaterialAutoCalcResult {
  /** Cantidad necesaria calculada automáticamente (unidad natural: L, kg, m²), sin redondeo de envase/paquete. */
  calculatedQuantity: number;
  /** Cantidad final sugerida para comprar/presupuestar, tras aplicar envases o paquetes. */
  suggestedQuantity: number;
  /** Desglose de envases (pintura/cobertura) si aplica. */
  containerSuggestion: ContainerSuggestion | null;
  /** Desglose de paquetes por superficie (suelos) si aplica. */
  packageResult: PackageAreaResult | null;
}

/**
 * Calcula automáticamente la cantidad de un material a partir de la medida base
 * de su línea de trabajo (m² de pared/suelo/techo, o metros de perímetro),
 * según el tipo de cálculo configurado en el material (sección 5-10).
 */
export function computeMaterialAutoCalc(
  material: MaterialAutoCalcInput,
  baseQuantity: number
): MaterialAutoCalcResult {
  const area = baseQuantity || 0;

  if (material.calcType === "PACKAGE") {
    const packageResult = computePackageArea({
      area,
      wastePercent: material.wastePercent || 0,
      areaPerPackage: material.packageSize || 0,
    });
    return {
      calculatedQuantity: packageResult.necessaryArea,
      suggestedQuantity: packageResult.purchasedArea || packageResult.necessaryArea,
      containerSuggestion: null,
      packageResult,
    };
  }

  let calculatedQuantity = 0;
  if (material.calcType === "PAINT") {
    calculatedQuantity = computeCoatsCoverageQuantity({
      area,
      coats: material.coats || 1,
      coveragePerUnit: material.coveragePerUnit || 0,
      wastePercent: material.wastePercent || 0,
    });
  } else if (material.calcType === "COVERAGE") {
    calculatedQuantity = computeConsumptionQuantity({
      area,
      consumptionPerM2: material.coveragePerUnit || 0,
      coats: material.coats || 1,
      wastePercent: material.wastePercent || 0,
    });
  } else {
    return {
      calculatedQuantity: 0,
      suggestedQuantity: 0,
      containerSuggestion: null,
      packageResult: null,
    };
  }

  const sizes = (material.containerSizes || []).filter((s) => s > 0);
  let containerSuggestion: ContainerSuggestion | null = null;
  let suggestedQuantity = calculatedQuantity;

  if (sizes.length > 1) {
    containerSuggestion = suggestContainers(calculatedQuantity, sizes);
    suggestedQuantity = containerSuggestion.totalPurchased;
  } else if (sizes.length === 1 || material.packageSize) {
    const size = sizes[0] || material.packageSize || 0;
    containerSuggestion = suggestSinglePackage(calculatedQuantity, size);
    suggestedQuantity = containerSuggestion.totalPurchased;
  }

  return { calculatedQuantity, suggestedQuantity, containerSuggestion, packageResult: null };
}
