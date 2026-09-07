import { CustomerForm } from "@/components/customers/customer-form";

export default function NewCustomerPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Nuevo cliente</h1>
        <p className="text-sm text-slate-500">Añade los datos del cliente</p>
      </div>
      <CustomerForm />
    </div>
  );
}
