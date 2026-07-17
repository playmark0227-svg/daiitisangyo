import AppBar from "@/components/seller/AppBar";
import NewListingWizard from "@/components/seller/NewListingWizard";
import { getSettings, listCategories } from "@/lib/domain";
import { requireUser } from "@/lib/session";

export default async function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser("seller");
  const { error } = await searchParams;
  const settings = getSettings();
  const categories = listCategories();

  return (
    <>
      <AppBar title="出品する" backHref="/sell" />
      <main className="phone-main">
        {error === "cost" && (
          <div className="error-box">お渡し金額（1円以上）を入れてください。</div>
        )}
        <NewListingWizard marginRate={settings.margin_rate} categories={categories} />
      </main>
    </>
  );
}
