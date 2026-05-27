import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import { Button } from '@shared/ui/Button';
import { TextInput } from '@shared/ui/TextInput';
import { FieldShell } from '@shared/ui/_FieldShell';
import { useAuth } from '@features/auth/useAuth';
import './LoginPage.css';

export function LoginPage() {
  const { t } = useTranslation('common');
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
        'Login failed';
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-page__card" onSubmit={submit}>
        <Typography variant="h2">{t('app.title')}</Typography>
        <FieldShell label="Email">
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FieldShell>
        <FieldShell label="Password">
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </FieldShell>
        {error && <p className="login-page__error">{error}</p>}
        <Button type="submit" loading={busy} fullWidth>
          {t('app.login')}
        </Button>
      </form>
    </div>
  );
}
