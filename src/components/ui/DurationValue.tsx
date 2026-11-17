import { durationParts, EMPTY_VALUE } from '../../lib/format';

interface DurationValueProps {
  seconds: number | null | undefined;
  /** Class for the h and m units, so they match the unit style of the surrounding figure. */
  unitClassName?: string;
}

/** A duration like 2h 15m with the numbers in the parent font and the units styled apart. */
export function DurationValue({ seconds, unitClassName }: DurationValueProps) {
  const parts = durationParts(seconds);
  if (!parts) return <span>{EMPTY_VALUE}</span>;
  return (
    <span>
      {parts.map((part, i) => (
        <span key={part.unit}>
          {i > 0 && ' '}
          {part.value}
          <span className={unitClassName}>{part.unit}</span>
        </span>
      ))}
    </span>
  );
}
