import { SensorsTable } from "./SensorsTable";

export function SensorsTableSkeleton() {
  return <SensorsTable sensores={[]} updatingIds={[]} onToggleStatus={() => {}} loading />;
}
