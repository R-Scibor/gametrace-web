import styles from './TimezoneSelect.module.css';

function getTimezones(): string[] {
  try {
    return Intl.supportedValuesOf('timeZone').sort();
  } catch {
    return [
      'Europe/Warsaw',
      'Europe/London',
      'Europe/Berlin',
      'America/New_York',
      'America/Los_Angeles',
      'Asia/Tokyo',
      'UTC',
    ];
  }
}

const TIMEZONES = getTimezones();

interface TimezoneSelectProps {
  value: string;
  onChange: (tz: string) => void;
  disabled?: boolean;
}

export function TimezoneSelect({ value, onChange, disabled }: TimezoneSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={styles.select}
      disabled={disabled}
    >
      {TIMEZONES.map((tz) => (
        <option key={tz} value={tz}>
          {tz.replace(/_/g, ' ')}
        </option>
      ))}
    </select>
  );
}