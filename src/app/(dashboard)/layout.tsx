import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import Image from "next/image";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="bg-[#F7F8FA] h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex h-[90%]">{children}</div>
    </div>
  );
}
