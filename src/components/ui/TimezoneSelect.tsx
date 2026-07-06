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
  'aria-label'?: string;
}

export function TimezoneSelect({ value, onChange, disabled, 'aria-label': ariaLabel = 'Strefa czasowa' }: TimezoneSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={styles.select}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {TIMEZONES.map((tz) => (
        <option key={tz} value={tz}>
          {tz.replace(/_/g, ' ')}
        </option>
      ))}
    </select>
  );
}