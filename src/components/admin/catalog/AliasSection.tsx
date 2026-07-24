import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAddAlias } from '../../../hooks/useAdminCatalog';
import { Button, Input } from '../../ui';
import styles from './AliasSection.module.css';

interface AliasSectionProps {
  gameId: number;
  aliases: string[];
}

export function AliasSection({ gameId, aliases }: AliasSectionProps) {
  const { t } = useTranslation('admin');
  const [value, setValue] = useState('');
  const addAlias = useAddAlias(gameId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    addAlias.mutate(trimmed, { onSuccess: () => setValue('') });
  };

  return (
    <div>
      {aliases.length > 0 ? (
        <div className={styles.chips}>
          {aliases.map((alias) => (
            <span key={alias} className={styles.chip}>
              {alias}
            </span>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>{t('catalog.aliases.empty')}</p>
      )}

      <form className={styles.form} onSubmit={submit}>
        <Input
          className={styles.input}
          aria-label={t('catalog.aliases.newAria')}
          placeholder={t('catalog.aliases.placeholder')}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button type="submit" loading={addAlias.isPending}>
          {t('catalog.aliases.add')}
        </Button>
      </form>
    </div>
  );
}
