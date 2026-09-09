import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

import type { QuotePdfData } from "@/lib/quotes/pdf-data";
import { formatDate, unitLabel } from "@/lib/utils/format";

export type PdfMode = "internal" | "fortnox";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 9, fontFamily: "Helvetica", color: "#1e293b" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  companyName: { fontSize: 15, fontWeight: 700, marginBottom: 2, color: "#0f172a" },
  docTitle: { fontSize: 12, fontWeight: 700, color: "#475569" },
  titleBox: { alignItems: "flex-end" },
  smallText: { fontSize: 8.5, color: "#475569", lineHeight: 1.4 },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#0f172a",
    backgroundColor: "#f1f5f9",
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginBottom: 6,
  },
  subCategoryTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: "#2563eb",
    textTransform: "uppercase",
    marginTop: 8,
    marginBottom: 3,
  },
  jobSubTitle: {
    fontSize: 8.5,
    fontWeight: 700,
    color: "#334155",
    marginTop: 6,
    marginBottom: 2,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: "#e2e8f0", marginVertical: 10 },
  table: { width: "100%" },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  th: {
    fontSize: 7,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    paddingHorizontal: 3,
  },
  td: { fontSize: 8, paddingHorizontal: 3 },
  roomNote: { fontSize: 7.5, color: "#94a3b8" },
  colFlex3: { flex: 3 },
  colFlex2: { flex: 2 },
  colFlex1: { flex: 1, textAlign: "right" },
  colFlex1L: { flex: 1 },
  subtotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  subtotalLabel: { fontSize: 8, fontWeight: 700, color: "#475569", marginRight: 6 },
  subtotalValue: { fontSize: 8, fontWeight: 700, color: "#0f172a" },
  summaryBox: { alignSelf: "flex-end", width: 280, marginTop: 6 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2.5 },
  summaryLabel: { color: "#64748b", fontSize: 8.5 },
  summaryValue: { fontWeight: 700, fontSize: 8.5 },
  summaryMuted: { color: "#94a3b8", fontSize: 8 },
  summaryTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
  },
  summaryTotalLabel: { fontSize: 11, fontWeight: 700, color: "#0f172a" },
  summaryTotalValue: { fontSize: 11, fontWeight: 700, color: "#0f172a" },
  internalBox: {
    marginTop: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#fcd34d",
    backgroundColor: "#fffbeb",
  },
  internalTitle: {
    fontSize: 8.5,
    fontWeight: 700,
    color: "#92400e",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    fontSize: 7,
    color: "#94a3b8",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 5,
  },
});

function money(value: number, currency: string) {
  const rounded = Math.round(value);
  return `${rounded.toLocaleString("sv-SE")} ${currency}`;
}

function qty(value: number | null) {
  if (value == null) return "—";
  return value.toLocaleString("sv-SE", { maximumFractionDigits: 2 });
}

export interface QuotePdfProps {
  companyName: string;
  mode: PdfMode;
  data: QuotePdfData;
}

export function QuotePdfDocument({ companyName, mode, data }: QuotePdfProps) {
  const { currency, result } = data;
  const showInternal = mode === "internal";
  const hasDeduction = result.rotDeduction > 0 || result.rutDeduction > 0;

  return (
    <Document title={`Arbetskalkyl ${data.quoteNumber}`} author={companyName}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.companyName}>{companyName.toUpperCase()}</Text>
            <Text style={styles.smallText}>Ref. {data.quoteNumber}</Text>
          </View>
          <View style={styles.titleBox}>
            <Text style={styles.docTitle}>Arbetskalkyl / Projekt</Text>
            <Text style={styles.smallText}>Datum: {formatDate(data.quoteDate)}</Text>
            {mode === "fortnox" && <Text style={styles.smallText}>För Fortnox / offert</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.smallText, { fontWeight: 700, color: "#0f172a" }]}>
            {data.projectName || "(sin nombre)"}
          </Text>
          {data.siteAddress && <Text style={styles.smallText}>{data.siteAddress}</Text>}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Arbeten</Text>
          {data.jobGroups.map((group) => (
            <View key={group.categoryName} wrap={false}>
              <Text style={styles.subCategoryTitle}>{group.categoryName}</Text>
              <View style={styles.table}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.th, styles.colFlex3]}>Arbete</Text>
                  <Text style={[styles.th, styles.colFlex1]}>Antal</Text>
                  <Text style={[styles.th, styles.colFlex1]}>Pris</Text>
                  <Text style={[styles.th, styles.colFlex1]}>Summa</Text>
                </View>
                {group.lines.map((line) => (
                  <View key={line.id} style={styles.tableRow}>
                    <View style={styles.colFlex3}>
                      <Text style={styles.td}>{line.name}</Text>
                      {line.roomNames && <Text style={styles.roomNote}>{line.roomNames}</Text>}
                      {showInternal && line.laborTotalHours != null && (
                        <Text style={styles.roomNote}>{qty(line.laborTotalHours)} h</Text>
                      )}
                    </View>
                    <Text style={[styles.td, styles.colFlex1]}>
                      {qty(line.quantity)} {unitLabel(line.unit)}
                    </Text>
                    <Text style={[styles.td, styles.colFlex1]}>{money(line.unitPrice, currency)}</Text>
                    <Text style={[styles.td, styles.colFlex1]}>{money(line.lineTotal, currency)}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.subtotalRow}>
                <Text style={styles.subtotalLabel}>Delsumma {group.categoryName}</Text>
                <Text style={styles.subtotalValue}>{money(group.subtotal, currency)}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Material</Text>

          {data.materialJobGroups.map((group) => (
            <View key={group.jobId} wrap={false}>
              <Text style={styles.jobSubTitle}>{group.jobName}</Text>
              <MaterialTable group={group.lines} currency={currency} showInternal={showInternal} />
              <View style={styles.subtotalRow}>
                <Text style={styles.subtotalLabel}>Delsumma material</Text>
                <Text style={styles.subtotalValue}>{money(group.subtotal, currency)}</Text>
              </View>
            </View>
          ))}

          {data.generalMaterialLines.length > 0 && (
            <View wrap={false}>
              <Text style={styles.jobSubTitle}>Material general del proyecto</Text>
              <MaterialTable
                group={data.generalMaterialLines}
                currency={currency}
                showInternal={showInternal}
              />
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Arbete</Text>
            <Text style={styles.summaryValue}>{money(result.laborAfterDiscount, currency)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Material</Text>
            <Text style={styles.summaryValue}>{money(result.materialAfterDiscount, currency)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Övrigt</Text>
            <Text style={styles.summaryValue}>{money(result.otherAfterDiscount, currency)}</Text>
          </View>
          {result.globalDiscountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rabatt</Text>
              <Text style={styles.summaryValue}>-{money(result.globalDiscountAmount, currency)}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Moms</Text>
            <Text style={styles.summaryValue}>{money(result.vatAmount, currency)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Totalt före avdrag</Text>
            <Text style={styles.summaryValue}>{money(result.totalInclVat, currency)}</Text>
          </View>
          {result.rotDeduction > 0 && (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryMuted}>ROT-underlag</Text>
                <Text style={styles.summaryMuted}>{money(result.rotEligibleLaborBase, currency)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Beräknat ROT-avdrag</Text>
                <Text style={styles.summaryValue}>-{money(result.rotDeduction, currency)}</Text>
              </View>
            </>
          )}
          {result.rutDeduction > 0 && (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryMuted}>RUT-underlag</Text>
                <Text style={styles.summaryMuted}>{money(result.rutEligibleLaborBase, currency)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Beräknat RUT-avdrag</Text>
                <Text style={styles.summaryValue}>-{money(result.rutDeduction, currency)}</Text>
              </View>
            </>
          )}
          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>
              {hasDeduction ? "Att betala efter avdrag" : "Att betala"}
            </Text>
            <Text style={styles.summaryTotalValue}>{money(result.totalDue, currency)}</Text>
          </View>
        </View>

        {showInternal && (
          <View style={styles.internalBox} wrap={false}>
            <Text style={styles.internalTitle}>Resumen interno — nunca visible al cliente</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Coste mano de obra</Text>
              <Text style={styles.summaryValue}>{money(result.laborCostInternal, currency)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Coste materiales</Text>
              <Text style={styles.summaryValue}>{money(result.materialCostInternal, currency)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Coste total</Text>
              <Text style={styles.summaryValue}>{money(result.totalCostInternal, currency)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Beneficio bruto</Text>
              <Text style={styles.summaryValue}>{money(result.grossProfit, currency)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Margen</Text>
              <Text style={styles.summaryValue}>{result.marginPercent.toFixed(1)}%</Text>
            </View>
          </View>
        )}

        <Text style={styles.footer}>
          {companyName} · Creado: {formatDate(data.createdAt)} · Última modificación:{" "}
          {formatDate(data.updatedAt)}
        </Text>
      </Page>
    </Document>
  );
}

function MaterialTable({
  group,
  currency,
  showInternal,
}: {
  group: QuotePdfData["generalMaterialLines"];
  currency: string;
  showInternal: boolean;
}) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.th, styles.colFlex2]}>Material</Text>
        {showInternal && <Text style={[styles.th, styles.colFlex1]}>Cant. base</Text>}
        {showInternal && <Text style={[styles.th, styles.colFlex1]}>Desp. %</Text>}
        {showInternal && <Text style={[styles.th, styles.colFlex1]}>Cant. necesaria</Text>}
        <Text style={[styles.th, styles.colFlex1]}>Cant. a comprar</Text>
        <Text style={[styles.th, styles.colFlex1L]}>Ud</Text>
        <Text style={[styles.th, styles.colFlex1]}>{showInternal ? "P. compra" : "Precio unitario"}</Text>
        <Text style={[styles.th, styles.colFlex1]}>Total</Text>
      </View>
      {group.map((m) => (
        <View key={m.id} style={styles.tableRow}>
          <View style={styles.colFlex2}>
            <Text style={styles.td}>{m.name}</Text>
            {m.supplier && <Text style={styles.roomNote}>{m.supplier}</Text>}
          </View>
          {showInternal && (
            <Text style={[styles.td, styles.colFlex1]}>{qty(m.baseQuantity)}</Text>
          )}
          {showInternal && (
            <Text style={[styles.td, styles.colFlex1]}>
              {m.wastePercent > 0 ? `${qty(m.wastePercent)}%` : "—"}
            </Text>
          )}
          {showInternal && (
            <Text style={[styles.td, styles.colFlex1]}>{qty(m.necessaryQuantity)}</Text>
          )}
          <Text style={[styles.td, styles.colFlex1]}>{qty(m.quantity)}</Text>
          <Text style={[styles.td, styles.colFlex1L]}>{unitLabel(m.unit)}</Text>
          <Text style={[styles.td, styles.colFlex1]}>
            {money(
              showInternal ? m.purchasePrice : m.purchasePrice * (1 + m.marginPercent / 100),
              currency
            )}
          </Text>
          <Text style={[styles.td, styles.colFlex1]}>{money(m.total, currency)}</Text>
        </View>
      ))}
    </View>
  );
}
