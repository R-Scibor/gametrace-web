import { useSyncExternalStore } from 'react';

function subscribeTick(onStoreChange: () => void) {
  const id = setInterval(onStoreChange, 1000);
  return () => clearInterval(id);
}

function getTickSnapshot() {
  return Math.floor(Date.now() / 1000);
}

export function LiveTimer({ startIso, className }: { startIso: string, className?: string }) {
  const tick = useSyncExternalStore(subscribeTick, getTickSnapshot, getTickSnapshot);

  const startMs = new Date(startIso).getTime();
  const startTick = Math.floor(startMs / 1000);
  void tick;
  const totalSeconds = Math.max(0, tick - startTick);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const fmt = (n: number) => n.toString().padStart(2, '0');
  
  const text = `${fmt(hours)}:${fmt(minutes)}:${fmt(seconds)}`;

  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {text}
    </span>
  );
}