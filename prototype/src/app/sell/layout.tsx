import TabBar from "@/components/seller/TabBar";
import { requireUser } from "@/lib/session";

export default async function SellLayout({ children }: { children: React.ReactNode }) {
  await requireUser("seller");
  return (
    <div className="phone">
      {children}
      <TabBar />
    </div>
  );
}
