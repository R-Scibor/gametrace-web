import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useHealth } from '../hooks/useHealth';
import { Button } from '../components/ui';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { isAuthenticated, handleLogin, loading, error } = useAuth();
  const { data: health } = useHealth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    const ok = await handleLogin(username.trim());
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
          <p className={styles.tagline}>— SIGN IN —</p>
          <div className={styles.rule} />
        </div>

        <div className={styles.errorSlot}>
          {error && <p className={styles.error}>{error}</p>}
        </div>

        <form className={styles.form} onSubmit={onSubmit}>
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
          <Button type="submit" disabled={loading || !username.trim()}>
            {loading ? 'ŁĄCZENIE...' : 'ZALOGUJ SIĘ'}
          </Button>
        </form>

        <div className={styles.helper}>
          <p>Uwierzytelnianie przez bota Discord</p>
          <p className={styles.helperAccent}>Brak hasła — tylko token sesji</p>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <span className={styles.footerDot} />
          <span>LINK STABLE</span>
        </div>
        <span>v{health?.version ?? '—'}</span>
      </footer>
    </div>
  );
}