import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useHealth } from '../hooks/useHealth';
import { Button } from '../components/ui';
import { DEV_USERNAME_LOGIN } from '../lib/config';
import { formatLinkCode, isCompleteLinkCode, normalizeLinkCode } from '../lib/linkCode';
import styles from './LoginPage.module.css';

type Mode = 'link' | 'username';

export function LoginPage() {
  const { isAuthenticated, handleLogin, handleLinkLogin, loading, error } = useAuth();
  const { data: health } = useHealth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('link');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const canSubmit =
    !loading && (mode === 'link' ? isCompleteLinkCode(code) : username.trim().length > 0);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const ok =
      mode === 'link'
        ? await handleLinkLogin(code)
        : await handleLogin(username.trim());
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
          <p className={styles.tagline}>— ZALOGUJ SIĘ —</p>
          <div className={styles.rule} />
        </div>

        <div className={styles.errorSlot}>
          {error && <p className={styles.error}>{error}</p>}
        </div>

        <form className={styles.form} onSubmit={onSubmit}>
          {mode === 'link' ? (
            <>
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
            </>
          ) : (
            <>
              <label htmlFor="username" className={styles.label}>
                NAZWA UŻYTKOWNIKA DISCORD
              </label>
              <div className={styles.inputWrapper}>
                <div className={styles.orangeBar} />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={styles.input}
                  placeholder="np. Player1"
                  disabled={loading}
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </>
          )}
          <Button type="submit" disabled={!canSubmit}>
            {loading ? 'ŁĄCZENIE...' : 'ZALOGUJ SIĘ'}
          </Button>
        </form>

        <div className={styles.helper}>
          {mode === 'link' ? (
            <>
              <p>
                Uruchom <span className={styles.helperAccent}>/login</span> na Discordzie
              </p>
              <p>i wpisz 6-cyfrowy kod (ważny 5 minut)</p>
            </>
          ) : (
            <p>Logowanie nazwą — tylko do testów</p>
          )}
          {DEV_USERNAME_LOGIN && (
            <button
              type="button"
              className={styles.switcher}
              onClick={() => setMode(mode === 'link' ? 'username' : 'link')}
            >
              {mode === 'link' ? 'Zaloguj się nazwą (dev)' : '← Wróć do kodu'}
            </button>
          )}
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
        <span>v{health?.version ?? '—'}</span>
      </footer>
    </div>
  );
}