import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { CompanyForm } from "@/components/settings/company-form";

export default async function SettingsPage() {
  const session = await requireSession();
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: session.user.companyId },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Configuración</h1>
        <p className="text-sm text-slate-500">Datos de tu empresa y valores por defecto</p>
      </div>
      <CompanyForm
        company={{
          name: company.name,
          orgNumber: company.orgNumber,
          vatNumber: company.vatNumber,
          address: company.address,
          postalCode: company.postalCode,
          city: company.city,
          phone: company.phone,
          email: company.email,
          website: company.website,
          bankgiro: company.bankgiro,
          plusgiro: company.plusgiro,
          swish: company.swish,
          currency: company.currency,
          vatRatePercent: Number(company.vatRatePercent),
          rotEnabledDefault: company.rotEnabledDefault,
          rotPercent: Number(company.rotPercent),
          rotMaxDeductionPerQuote:
            company.rotMaxDeductionPerQuote != null ? Number(company.rotMaxDeductionPerQuote) : null,
          defaultHourlyRate: Number(company.defaultHourlyRate),
          defaultMaterialMarginPercent: Number(company.defaultMaterialMarginPercent),
          quoteValidityDays: company.quoteValidityDays,
          defaultTermsText: company.defaultTermsText,
        }}
      />
    </div>
  );
}
