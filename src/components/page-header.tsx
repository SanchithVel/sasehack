import { InfoTip } from "@/components/info-tip";

export function PageHeader({ title, info, action }: { title: string; info?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight md:text-4xl">
        {title}
        {info && <InfoTip align="start">{info}</InfoTip>}
      </h1>
      {action}
    </div>
  );
}
