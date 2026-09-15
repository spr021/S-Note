import { useId } from "react";
import type { SNoteSettings } from "@src/shared/settings";

interface SettingsPanelProps {
  settings: SNoteSettings;
  onChange: (patch: Partial<SNoteSettings>) => void;
}

interface SwitchRowProps {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}

function SwitchRow({ label, description, checked, onToggle }: SwitchRowProps) {
  const descriptionId = useId();

  return (
    <div className="setting-row">
      <div className="setting-copy">
        <strong>{label}</strong>
        <span id={descriptionId}>{description}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        aria-describedby={descriptionId}
        className={checked ? "switch on" : "switch"}
        onClick={onToggle}
      >
        <span className="switch-thumb" aria-hidden="true" />
      </button>
    </div>
  );
}

const SettingsPanel = ({ settings, onChange }: SettingsPanelProps) => (
  <section className="settings" aria-label="Settings">
    <SwitchRow
      label="Toggle-layer button"
      description="Show the floating button on web pages that opens your annotations."
      checked={settings.showLauncher}
      onToggle={() => onChange({ showLauncher: !settings.showLauncher })}
    />
    <SwitchRow
      label="Dark theme"
      description="Use the dark appearance for the S Note popup."
      checked={settings.theme === "dark"}
      onToggle={() =>
        onChange({ theme: settings.theme === "dark" ? "light" : "dark" })
      }
    />
  </section>
);

export default SettingsPanel;
