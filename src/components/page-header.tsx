import { InfoTip } from "@/components/info-tip";

export function PageHeader({ title, info, action }: { title: string; info?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
        {title}
        {info && <InfoTip align="start">{info}</InfoTip>}
      </h1>
      {action}
    </div>
  );
}
