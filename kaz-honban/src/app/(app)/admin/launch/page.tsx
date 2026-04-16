import { LaunchChecklistClient } from "./launch-checklist-client";

export default function AdminLaunchPage() {
  return (
    <div className="md:ml-56 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-display)]">
          Launch Checklist
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Live pre-flight check for configuration, data, and storage. Fix anything in red before a pilot.
        </p>
      </div>
      <LaunchChecklistClient />
    </div>
  );
}
