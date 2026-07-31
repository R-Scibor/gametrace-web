import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getReportStatusOptions } from '../../../lib/reportStatus';
import type { AdminReportFacetsResponse, ReportStatus } from '../../../types/api';
import { Input, Select } from '../../ui';
import styles from './ReportFilters.module.css';

export type ReportFilterChange = {
  status?: ReportStatus;
  q?: string;
  screen?: string;
  platform?: string;
};

interface ReportFiltersProps {
  status: ReportStatus;
  q: string;
  screen: string;
  platform: string;
  facets: AdminReportFacetsResponse | undefined;
  facetsLoading: boolean;
  onChange: (change: ReportFilterChange) => void;
}

const SEARCH_DEBOUNCE_MS = 300;

export function ReportFilters({
  status,
  q,
  screen,
  platform,
  facets,
  facetsLoading,
  onChange,
}: ReportFiltersProps) {
  const { t } = useTranslation('admin');
  const [searchInput, setSearchInput] = useState(q);
  const [syncedQ, setSyncedQ] = useState(q);

  // Keep local input in sync when q changes from outside (e.g. cleared elsewhere).
  // This runs during render (the React-recommended pattern for adjusting state
  // to a prop change), not in an effect, so it doesn't trigger an extra render pass.
  if (q !== syncedQ) {
    setSyncedQ(q);
    setSearchInput(q);
  }

  useEffect(() => {
    if (searchInput === q) return;
    const timer = setTimeout(() => onChange({ q: searchInput }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const screens = facets?.screens ?? [];
  const platforms = facets?.platforms ?? [];

  return (
    <div className={styles.filters}>
      <Select
        label={t('common.status')}
        value={status}
        onChange={(e) => onChange({ status: e.target.value as ReportStatus })}
      >
        {getReportStatusOptions().map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>

      <Input
        className={styles.search}
        type="search"
        aria-label={t('reports.searchAria')}
        placeholder={t('reports.searchPlaceholder')}
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />

      <Select
        label={t('reports.screenFilter')}
        value={screen}
        disabled={facetsLoading}
        onChange={(e) => onChange({ screen: e.target.value })}
      >
        <option value="">{t('reports.allScreens')}</option>
        {screens.map((f) => (
          <option key={f.value} value={f.value}>
            {f.value} ({f.count})
          </option>
        ))}
      </Select>

      <Select
        label={t('reports.platformFilter')}
        value={platform}
        disabled={facetsLoading}
        onChange={(e) => onChange({ platform: e.target.value })}
      >
        <option value="">{t('reports.allPlatforms')}</option>
        {platforms.map((f) => (
          <option key={f.value} value={f.value}>
            {f.value} ({f.count})
          </option>
        ))}
      </Select>
    </div>
  );
}
