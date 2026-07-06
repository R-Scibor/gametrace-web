import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useHealth } from '../hooks/useHealth';
import { Button } from '../components/ui';
import styles from './LandingPage.module.css';

const STEPS = [
  {
    n: '01',
    title: 'Wejdź na serwer z botem',
    body: 'Dołącz do serwera Discord, na którym jest GameTrace, albo zaproś bota na swój serwer — bez tego nie uruchomisz komend.',
  },
  {
    n: '02',
    title: 'Zarejestruj się komendą /login',
    body: 'Na kanale tego serwera wpisz /login i wyślij — nie na privie do bota, tylko na czacie serwera. Wystarczy raz.',
  },
  {
    n: '03',
    title: 'Zaloguj się tutaj',
    body: 'Bot wyświetli 6-cyfrowy kod — wpisz go na stronie logowania. Bez hasła; sesja jest zapamiętywana na 30 dni.',
  },
  {
    n: '04',
    title: 'Graj i wracaj, gdy chcesz',
    body: 'Bot na Discordzie może sam wykrywać granie. Ty dopisujesz brakujące sesje, poprawiasz pomyłki i sprawdzasz statystyki.',
  },
] as const;

const WORKFLOWS = [
  {
    icon: '▣',
    title: 'Pulpit',
    body: 'Bieżąca sesja, podsumowanie dnia i ostatnich dni, lista ostatnich gier oraz informacje o sesjach wymagających uwagi.',
  },
  {
    icon: '＋',
    title: 'Dodawanie sesji',
    body: 'Wybierz grę i godziny albo nagraj krótką wypowiedź — np. „Grałem w Wiedźmina od 18 do 20”.',
  },
  {
    icon: '▦',
    title: 'Statystyki',
    body: 'Mapa aktywności, passa, ranking gier, gatunki i studia — przejrzysty podgląd na dużym ekranie.',
  },
  {
    icon: '▤',
    title: 'Biblioteka',
    body: 'Okładki, łączenie duplikatów, kosz z przywracaniem — wygodne porządkowanie całej kolekcji gier.',
  },
] as const;

export function LandingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: health } = useHealth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.ambient} aria-hidden>
        <span className={[styles.orb, styles.orbA].join(' ')} />
        <span className={[styles.orb, styles.orbB].join(' ')} />
        <span className={[styles.orb, styles.orbC].join(' ')} />
        <div className={styles.grain} />
      </div>

      <div className={styles.content}>
      <header className={[styles.hero, styles.reveal].join(' ')}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowPulse} />
          GAMETRACE WEB
        </p>
        <h1 className={styles.title}>
          Game<span className={styles.titleAccent}>Trace</span>
        </h1>
        <p className={styles.lead}>
          Śledź, ile grasz, przeglądaj statystyki i porządkuj bibliotekę — wygodnie z przeglądarki,
          na dużym ekranie.
        </p>
        <div className={styles.heroActions}>
          <Button onClick={() => navigate('/login')}>ZALOGUJ SIĘ</Button>
          <a href="#jak-zaczac" className={styles.secondaryLink}>
            JAK ZACZĄĆ →
          </a>
        </div>
      </header>

      <section className={[styles.section, styles.reveal].join(' ')}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Czym jest GameTrace?</h2>
          <span className={styles.sectionRule} />
        </div>
        <div className={styles.aboutGrid}>
          <p className={styles.aboutText}>
            GameTrace prowadzi dziennik Twoich <strong>sesji gry</strong>: kiedy zaczynasz, kiedy
            kończysz i jak długo grasz. Bot na Discordzie może wykrywać granie w tle; wersja w
            przeglądarce służy do dopisywania sesji, poprawiania błędów i przeglądania statystyk.
          </p>
          <div className={styles.compare}>
            <div className={styles.compareCard}>
              <span className={styles.compareLabel}>Telefon</span>
              <p>Szybkie dodawanie sesji, nagranie głosowe i podstawowe statystyki w drodze.</p>
            </div>
            <div className={[styles.compareCard, styles.compareCardAccent].join(' ')}>
              <span className={styles.compareLabel}>Przeglądarka</span>
              <p>Szczegółowe statystyki, wykresy, biblioteka gier i kosz — wygodnie na komputerze.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={[styles.section, styles.reveal].join(' ')} id="jak-zaczac">
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Jak zacząć?</h2>
          <span className={styles.sectionRule} />
        </div>
        <ol className={styles.steps}>
          {STEPS.map((step) => (
            <li key={step.n} className={styles.step}>
              <span className={styles.stepNum}>{step.n}</span>
              <div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepBody}>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={[styles.section, styles.reveal].join(' ')}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Jak korzystać?</h2>
          <span className={styles.sectionRule} />
        </div>
        <div className={styles.workflowGrid}>
          {WORKFLOWS.map((item) => (
            <article key={item.title} className={styles.workflowCard}>
              <span className={styles.workflowIcon}>{item.icon}</span>
              <h3 className={styles.workflowTitle}>{item.title}</h3>
              <p className={styles.workflowBody}>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={[styles.cta, styles.reveal].join(' ')}>
        <p className={styles.ctaText}>Masz już konto? Zaloguj się i zobacz swój pulpit.</p>
        <Button variant="primary" onClick={() => navigate('/login')}>
          PRZEJDŹ DO LOGOWANIA
        </Button>
      </section>

      <footer className={[styles.footer, styles.reveal].join(' ')}>
        <div className={styles.footerLeft}>
          <span className={styles.footerDot} />
          <span>POŁĄCZENIE STABILNE</span>
        </div>
        <span>v{health?.version ?? '—'}</span>
      </footer>
      </div>
    </div>
  );
}