import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

import type { CalcQuoteResult } from "@/lib/calc/types";
import { unitLabel, pricingMethodLabel } from "@/lib/utils/format";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 9.5, fontFamily: "Helvetica", color: "#1e293b" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  companyName: { fontSize: 16, fontWeight: 700, marginBottom: 3, color: "#0f172a" },
  smallText: { fontSize: 8.5, color: "#475569", lineHeight: 1.5 },
  quoteTitleBox: { alignItems: "flex-end" },
  quoteTitle: { fontSize: 18, fontWeight: 700, color: "#2563eb", marginBottom: 3 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#94a3b8",
    marginBottom: 6,
  },
  twoCol: { flexDirection: "row", justifyContent: "space-between", gap: 20 },
  col: { flex: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#e2e8f0", marginVertical: 12 },
  table: { width: "100%" },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  th: { fontSize: 8, fontWeight: 700, color: "#64748b", textTransform: "uppercase" },
  colName: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colUnit: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1.2, textAlign: "right" },
  colTotal: { flex: 1.2, textAlign: "right", fontWeight: 700 },
  itemDescription: { fontSize: 8, color: "#64748b", marginTop: 2 },
  materialRow: {
    flexDirection: "row",
    paddingVertical: 2,
    paddingHorizontal: 6,
    paddingLeft: 14,
  },
  materialText: { fontSize: 8, color: "#64748b", flex: 3 },
  summaryBox: { alignSelf: "flex-end", width: 260, marginTop: 8 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  summaryLabel: { color: "#64748b" },
  summaryValue: { fontWeight: 700 },
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
  includedBoxes: { flexDirection: "row", gap: 16, marginTop: 4 },
  includedCol: { flex: 1 },
  includedTitle: { fontSize: 8.5, fontWeight: 700, marginBottom: 3 },
  bodyText: { fontSize: 8.5, color: "#475569", lineHeight: 1.5 },
  signatureRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 36 },
  signatureBox: { width: "45%", borderTopWidth: 1, borderTopColor: "#94a3b8", paddingTop: 4 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    fontSize: 7.5,
    color: "#94a3b8",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 6,
  },
});

function money(value: number, currency: string) {
  const rounded = Math.round(value);
  return `${rounded.toLocaleString("sv-SE")} ${currency}`;
}

export interface PdfCompany {
  name: string;
  orgNumber: string | null;
  vatNumber: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  bankgiro: string | null;
  plusgiro: string | null;
  swish: string | null;
}

export interface PdfCustomer {
  firstName: string;
  lastName: string | null;
  companyName: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  personalOrgNumber: string | null;
}

export interface PdfMaterial {
  name: string;
  quantity: number;
  unit: string;
  total: number;
}

export interface PdfItem {
  name: string;
  descriptionClient: string | null;
  pricingMethod: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  laborTotalHours: number | null;
  hourlyRate: number | null;
  materials: PdfMaterial[];
}

export interface QuotePdfProps {
  company: PdfCompany;
  customer: PdfCustomer;
  quoteNumber: string;
  quoteDate: string;
  validUntil: string | null;
  projectName: string | null;
  projectDescription: string | null;
  siteAddress: string | null;
  currency: string;
  items: PdfItem[];
  result: CalcQuoteResult;
  rotEnabled: boolean;
  includedText: string | null;
  excludedText: string | null;
  termsText: string | null;
  notesClient: string | null;
  showHours: boolean;
  showHourlyRate: boolean;
  showMaterialsIndividually: boolean;
  showMaterialPrices: boolean;
  showUnitPrice: boolean;
  showOnlyTotalPerJob: boolean;
  showMaterialsOnPdf: boolean;
}

export function QuotePdfDocument(props: QuotePdfProps) {
  const {
    company,
    customer,
    quoteNumber,
    quoteDate,
    validUntil,
    projectName,
    projectDescription,
    siteAddress,
    currency,
    items,
    result,
    rotEnabled,
    includedText,
    excludedText,
    termsText,
    notesClient,
    showHours,
    showHourlyRate,
    showMaterialsIndividually,
    showMaterialPrices,
    showUnitPrice,
    showOnlyTotalPerJob,
    showMaterialsOnPdf,
  } = props;

  return (
    <Document
      title={`Offert ${quoteNumber}`}
      author={company.name}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.companyName}>{company.name}</Text>
            <Text style={styles.smallText}>
              {company.address ? `${company.address}\n` : ""}
              {company.postalCode || company.city
                ? `${company.postalCode ?? ""} ${company.city ?? ""}\n`
                : ""}
              {company.orgNumber ? `Org.nr: ${company.orgNumber}\n` : ""}
              {company.vatNumber ? `VAT: ${company.vatNumber}\n` : ""}
              {company.phone ? `Tel: ${company.phone}\n` : ""}
              {company.email ? `${company.email}\n` : ""}
              {company.website ?? ""}
            </Text>
          </View>
          <View style={styles.quoteTitleBox}>
            <Text style={styles.quoteTitle}>OFFERT</Text>
            <Text style={styles.smallText}>Nr: {quoteNumber}</Text>
            <Text style={styles.smallText}>Datum: {quoteDate}</Text>
            {validUntil && <Text style={styles.smallText}>Giltig till: {validUntil}</Text>}
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Kund</Text>
            <Text style={styles.bodyText}>
              {customer.firstName} {customer.lastName ?? ""}
              {customer.companyName ? `\n${customer.companyName}` : ""}
              {customer.address ? `\n${customer.address}` : ""}
              {customer.postalCode || customer.city
                ? `\n${customer.postalCode ?? ""} ${customer.city ?? ""}`
                : ""}
              {customer.phone ? `\n${customer.phone}` : ""}
              {customer.email ? `\n${customer.email}` : ""}
              {customer.personalOrgNumber ? `\n${customer.personalOrgNumber}` : ""}
            </Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Projekt</Text>
            <Text style={styles.bodyText}>
              {projectName ?? "—"}
              {siteAddress ? `\nAdress: ${siteAddress}` : ""}
            </Text>
            {projectDescription && (
              <Text style={[styles.bodyText, { marginTop: 4 }]}>{projectDescription}</Text>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Arbete / Trabajos</Text>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, styles.colName]}>Beskrivning</Text>
              <Text style={[styles.th, styles.colQty]}>Antal</Text>
              <Text style={[styles.th, styles.colUnit]}>Enhet</Text>
              {showUnitPrice && !showOnlyTotalPerJob && (
                <Text style={[styles.th, styles.colPrice]}>Pris</Text>
              )}
              <Text style={[styles.th, styles.colTotal]}>Summa</Text>
            </View>

            {items.map((item, index) => (
              <View key={index}>
                <View style={styles.tableRow}>
                  <View style={styles.colName}>
                    <Text>{item.name}</Text>
                    {item.descriptionClient && (
                      <Text style={styles.itemDescription}>{item.descriptionClient}</Text>
                    )}
                    {showHours && item.laborTotalHours != null && (
                      <Text style={styles.itemDescription}>
                        {item.laborTotalHours} h
                        {showHourlyRate && item.hourlyRate
                          ? ` × ${money(item.hourlyRate, currency)}/h`
                          : ""}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.colQty}>{item.quantity}</Text>
                  <Text style={styles.colUnit}>{unitLabel(item.unit)}</Text>
                  {showUnitPrice && !showOnlyTotalPerJob && (
                    <Text style={styles.colPrice}>{money(item.unitPrice, currency)}</Text>
                  )}
                  <Text style={styles.colTotal}>{money(item.lineTotal, currency)}</Text>
                </View>
                {showMaterialsOnPdf &&
                  showMaterialsIndividually &&
                  item.materials.map((m, mIndex) => (
                    <View key={mIndex} style={styles.materialRow}>
                      <Text style={styles.materialText}>
                        · {m.name} ({m.quantity} {unitLabel(m.unit)})
                      </Text>
                      {showMaterialPrices && (
                        <Text style={[styles.materialText, { textAlign: "right", flex: 1 }]}>
                          {money(m.total, currency)}
                        </Text>
                      )}
                    </View>
                  ))}
              </View>
            ))}
          </View>
        </View>

        {(includedText || excludedText) && (
          <View style={styles.section}>
            <View style={styles.includedBoxes}>
              {includedText && (
                <View style={styles.includedCol}>
                  <Text style={styles.includedTitle}>Ingår / Incluye</Text>
                  <Text style={styles.bodyText}>{includedText}</Text>
                </View>
              )}
              {excludedText && (
                <View style={styles.includedCol}>
                  <Text style={styles.includedTitle}>Ingår ej / No incluye</Text>
                  <Text style={styles.bodyText}>{excludedText}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Arbetskostnad</Text>
            <Text style={styles.summaryValue}>{money(result.laborAfterDiscount, currency)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Material</Text>
            <Text style={styles.summaryValue}>{money(result.materialAfterDiscount, currency)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Övriga kostnader</Text>
            <Text style={styles.summaryValue}>{money(result.otherAfterDiscount, currency)}</Text>
          </View>
          {result.globalDiscountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rabatt</Text>
              <Text style={styles.summaryValue}>-{money(result.globalDiscountAmount, currency)}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delsumma</Text>
            <Text style={styles.summaryValue}>{money(result.subtotalAfterDiscount, currency)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Moms</Text>
            <Text style={styles.summaryValue}>{money(result.vatAmount, currency)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Totalt (inkl. moms)</Text>
            <Text style={styles.summaryValue}>{money(result.totalInclVat, currency)}</Text>
          </View>
          {rotEnabled && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>ROT-avdrag</Text>
              <Text style={styles.summaryValue}>-{money(result.rotDeduction, currency)}</Text>
            </View>
          )}
          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>Att betala / Total</Text>
            <Text style={styles.summaryTotalValue}>{money(result.totalDue, currency)}</Text>
          </View>
        </View>

        {notesClient && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Anteckningar</Text>
            <Text style={styles.bodyText}>{notesClient}</Text>
          </View>
        )}

        {termsText && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Villkor / Condiciones</Text>
            <Text style={styles.bodyText}>{termsText}</Text>
          </View>
        )}

        <View style={styles.signatureRow} wrap={false}>
          <View style={styles.signatureBox}>
            <Text style={styles.smallText}>Företag / Empresa</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.smallText}>Kund / Cliente</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          {company.name}
          {company.orgNumber ? ` · Org.nr ${company.orgNumber}` : ""}
          {company.bankgiro ? ` · Bankgiro ${company.bankgiro}` : ""}
          {company.plusgiro ? ` · Plusgiro ${company.plusgiro}` : ""}
          {company.swish ? ` · Swish ${company.swish}` : ""}
        </Text>
      </Page>
    </Document>
  );
}

export { unitLabel, pricingMethodLabel };
