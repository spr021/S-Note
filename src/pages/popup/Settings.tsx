import { useId } from "react";
import type { SNoteSettings, ThemeMode } from "@src/shared/settings";

interface SettingsPanelProps {
  settings: SNoteSettings;
  onChange: (patch: Partial<SNoteSettings>) => void;
  onSupport: () => void;
  onFeedback: () => void;
}

interface SwitchRowProps {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}

const THEME_OPTIONS: ReadonlyArray<{ value: ThemeMode; label: string }> = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

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

interface ThemeRowProps {
  value: ThemeMode;
  onChange: (theme: ThemeMode) => void;
}

function ThemeRow({ value, onChange }: ThemeRowProps) {
  const labelId = useId();

  return (
    <div className="setting-row theme-row">
      <div className="setting-copy">
        <strong id={labelId}>Appearance</strong>
        <span>Match your device theme, or pick light or dark.</span>
      </div>
      <div className="theme-picker" role="radiogroup" aria-labelledby={labelId}>
        {THEME_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`theme-option${
              value === option.value ? " selected" : ""
            }`}
          >
            <input
              type="radio"
              name="snote-theme"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

const SettingsPanel = ({
  settings,
  onChange,
  onSupport,
  onFeedback,
}: SettingsPanelProps) => (
  <section className="settings" aria-label="Settings">
    <SwitchRow
      label="Toggle-layer button"
      description="Show the floating button on web pages that opens your annotations."
      checked={settings.showLauncher}
      onToggle={() => onChange({ showLauncher: !settings.showLauncher })}
    />
    <ThemeRow
      value={settings.theme}
      onChange={(theme) => onChange({ theme })}
    />
    <div className="feedback-card">
      <div className="setting-copy">
        <strong>Send feedback</strong>
        <span>
          Found a bug or have an idea? Tell us what to improve — it opens your
          email app with the details ready to send.
        </span>
      </div>
      <button type="button" className="feedback-button" onClick={onFeedback}>
        <span aria-hidden="true">✉</span> Send feedback
      </button>
    </div>
    <div className="support-card">
      <div className="setting-copy">
        <strong>Support S Note</strong>
        <span>
          S Note is free and keeps your notes on your device. If it helps you,
          you can leave an optional tip — it goes to the developer, not Google.
        </span>
      </div>
      <button type="button" className="support-button" onClick={onSupport}>
        <span aria-hidden="true">☕</span> Buy me a coffee
      </button>
    </div>
  </section>
);

export default SettingsPanel;
