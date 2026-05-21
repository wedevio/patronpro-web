import PanelHeader from "./_components/PanelHeader";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <PanelHeader />
      {children}
    </div>
  );
}
