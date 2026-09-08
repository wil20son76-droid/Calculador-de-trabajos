import { getCompanyId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { CompanyForm } from "@/components/settings/company-form";

export default async function SettingsPage() {
  const companyId = await getCompanyId();
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Configuración</h1>
        <p className="text-sm text-slate-500">Valores por defecto de la calculadora</p>
      </div>
      <CompanyForm
        settings={{
          currency: company.currency,
          locale: company.locale,
          vatRatePercent: Number(company.vatRatePercent),
          rotEnabledDefault: company.rotEnabledDefault,
          rotPercent: Number(company.rotPercent),
          rotMaxDeductionPerQuote:
            company.rotMaxDeductionPerQuote != null ? Number(company.rotMaxDeductionPerQuote) : null,
          defaultHourlyRate: Number(company.defaultHourlyRate),
          defaultInternalHourlyRate: Number(company.defaultInternalHourlyRate),
          defaultMaterialMarginPercent: Number(company.defaultMaterialMarginPercent),
          defaultWastePercent: Number(company.defaultWastePercent),
        }}
      />
    </div>
  );
}
