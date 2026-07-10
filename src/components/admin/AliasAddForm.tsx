import { useState } from 'react';
import { useAddAlias } from '../../hooks/useAdmin';
import { Button } from '../ui';
import styles from './AliasAddForm.module.css';

interface AliasAddFormProps {
  gameId: number;
}

export function AliasAddForm({ gameId }: AliasAddFormProps) {
  const [value, setValue] = useState('');
  const addAlias = useAddAlias(gameId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    addAlias.mutate(trimmed, {
      onSuccess: () => setValue(''),
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.label} htmlFor={`alias-${gameId}`}>
        Nazwa procesu Discord
      </label>
      <div className={styles.row}>
        <input
          id={`alias-${gameId}`}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={styles.input}
          placeholder="np. game.exe"
          disabled={addAlias.isPending}
        />
        <Button type="submit" variant="secondary" disabled={addAlias.isPending || !value.trim()}>
          DODAJ ALIAS
        </Button>
      </div>
    </form>
  );
}