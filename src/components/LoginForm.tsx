import { useState, type FormEvent } from 'react';
import { ApiError, resolveCredentials } from '../api/greenApi';
import type { Credentials } from '../types';

interface Props {
  onLogin: (creds: Credentials) => void;
}

export function LoginForm({ onLogin }: Props) {
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const id = idInstance.trim();
    const token = apiTokenInstance.trim();
    if (!id || !token) {
      setError('Заполните оба поля');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { creds, state } = await resolveCredentials(id, token);
      if (state !== 'authorized') {
        setError(
          `Инстанс не авторизован (состояние: ${state}). Проверьте привязку телефона в личном кабинете GREEN-API.`,
        );
        return;
      }
      onLogin(creds);
    } catch (err) {
      setError(
        err instanceof ApiError && (err.status === 400 || err.status === 401)
          ? 'Неверные idInstance или apiTokenInstance'
          : 'Не удалось подключиться к GREEN-API. Попробуйте ещё раз.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Вход в чат</h1>
        <p className="login-hint">
          Введите данные инстанса из личного кабинета GREEN-API
        </p>
        <input
          type="text"
          placeholder="idInstance"
          value={idInstance}
          onChange={(e) => setIdInstance(e.target.value)}
          autoFocus
        />
        <input
          type="password"
          placeholder="apiTokenInstance"
          value={apiTokenInstance}
          onChange={(e) => setApiTokenInstance(e.target.value)}
        />
        {error && <div className="login-error">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Проверка...' : 'Войти'}
        </button>
      </form>
    </div>
  );
}
