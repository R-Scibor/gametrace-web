import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useHealth } from '../hooks/useHealth';
import { Button } from '../components/ui';
import { formatLinkCode, isCompleteLinkCode, normalizeLinkCode } from '../lib/linkCode';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { isAuthenticated, handleLinkLogin, loading, error } = useAuth();
  const { data: health } = useHealth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const canSubmit = !loading && isCompleteLinkCode(code);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const ok = await handleLinkLogin(code);
    if (ok) {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.center}>
        <div className={styles.wordmark}>
          <h1 className={styles.title}>
            Game<span className={styles.titleAccent}>Trace</span>
          </h1>
          <p className={styles.tagline}>ZALOGUJ SIĘ</p>
          <div className={styles.rule} />
        </div>

        <div className={styles.errorSlot}>
          {error && <p className={styles.error}>{error}</p>}
        </div>

        <form className={styles.form} onSubmit={onSubmit}>
          <label htmlFor="link-code" className={styles.label}>
            KOD LOGOWANIA
          </label>
          <div className={styles.inputWrapper}>
            <div className={styles.orangeBar} />
            <input
              id="link-code"
              type="text"
              inputMode="numeric"
              value={formatLinkCode(code)}
              onChange={(e) => setCode(normalizeLinkCode(e.target.value))}
              className={styles.input}
              placeholder="231 996"
              disabled={loading}
              autoFocus
              autoComplete="one-time-code"
              maxLength={7}
            />
          </div>
          <Button type="submit" disabled={!canSubmit}>
            {loading ? 'ŁĄCZENIE...' : 'ZALOGUJ SIĘ'}
          </Button>
        </form>

        <div className={styles.helper}>
          <p>
            Uruchom <span className={styles.helperAccent}>/login</span> na Discordzie
          </p>
          <p>i wpisz 6-cyfrowy kod (ważny 5 minut)</p>
          <Link to="/welcome" className={styles.backLink}>
            ← CO TO JEST GAMETRACE?
          </Link>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <span className={styles.footerDot} />
          <span>POŁĄCZENIE STABILNE</span>
        </div>
        <span>v{health?.version ?? '...'}</span>
      </footer>
    </div>
  );
}
