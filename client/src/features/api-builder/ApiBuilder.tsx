import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Typography } from '@shared/ui/Typography';
import { Button } from '@shared/ui/Button';
import { TextInput } from '@shared/ui/TextInput';
import { Select } from '@shared/ui/Select';
import { FieldShell } from '@shared/ui/_FieldShell';
import { apiClient } from '@shared/lib/apiClient';
import type { DynamicEndpoint, HttpMethod } from '@shared/types';
import './ApiBuilder.css';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PATCH', 'DELETE'];

export function ApiBuilder() {
  const { t } = useTranslation('admin');
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['dynamic-endpoints'],
    queryFn: async () => (await apiClient.get<DynamicEndpoint[]>('/dynamic-endpoints')).data,
  });

  const [draft, setDraft] = useState({
    method: 'GET' as HttpMethod,
    path: '/api/custom-',
    mode: 'static' as 'static' | 'db',
    responseTemplate: '{\n  "items": []\n}',
    enabled: true,
  });
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: async () => {
      let responseTemplate: unknown = undefined;
      try {
        responseTemplate =
          draft.mode === 'static' ? JSON.parse(draft.responseTemplate) : undefined;
      } catch {
        throw new Error('invalidJson');
      }
      return (
        await apiClient.post<DynamicEndpoint>('/dynamic-endpoints', {
          method: draft.method,
          path: draft.path,
          mode: draft.mode,
          responseTemplate,
          enabled: draft.enabled,
        })
      ).data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['dynamic-endpoints'] });
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/dynamic-endpoints/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['dynamic-endpoints'] }),
  });

  return (
    <div className="api-builder">
      <Typography variant="h2">{t('nav.apiBuilder')}</Typography>

      <section className="api-builder__form">
        <Typography variant="h5">{t('apiBuilder.createEndpoint')}</Typography>
        <div className="api-builder__row">
          <FieldShell label={t('apiBuilder.method')}>
            <Select
              options={METHODS.map((m) => ({ value: m, label: m }))}
              value={draft.method}
              onChange={(e) => setDraft((d) => ({ ...d, method: e.target.value as HttpMethod }))}
            />
          </FieldShell>
          <FieldShell label={t('apiBuilder.path')}>
            <TextInput
              value={draft.path}
              onChange={(e) => setDraft((d) => ({ ...d, path: e.target.value }))}
              placeholder="/api/custom-users"
            />
          </FieldShell>
          <FieldShell label={t('apiBuilder.mode')}>
            <Select
              options={[
                { value: 'static', label: t('apiBuilder.modeStatic') },
                { value: 'db', label: t('apiBuilder.modeDb') },
              ]}
              value={draft.mode}
              onChange={(e) =>
                setDraft((d) => ({ ...d, mode: e.target.value as 'static' | 'db' }))
              }
            />
          </FieldShell>
        </div>

        {draft.mode === 'static' && (
          <FieldShell label={t('apiBuilder.responseTemplate')} error={error ?? undefined}>
            <textarea
              className="api-builder__json"
              value={draft.responseTemplate}
              onChange={(e) => setDraft((d) => ({ ...d, responseTemplate: e.target.value }))}
              rows={10}
            />
          </FieldShell>
        )}

        <label className="api-builder__check">
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(e) => setDraft((d) => ({ ...d, enabled: e.target.checked }))}
          />
          <span>{t('apiBuilder.enabled')}</span>
        </label>

        <div>
          <Button loading={create.isPending} onClick={() => create.mutate()}>
            Save
          </Button>
        </div>
      </section>

      <section className="api-builder__list">
        <Typography variant="h5">Endpoints</Typography>
        {list.isLoading && <Typography variant="caption">Loading…</Typography>}
        {list.error && (
          <Typography variant="caption">⚠ {(list.error as Error).message}</Typography>
        )}
        {list.data?.length === 0 && <Typography variant="caption">No endpoints yet.</Typography>}
        <ul className="api-builder__items">
          {list.data?.map((ep) => (
            <li key={ep.id} className="api-builder__item">
              <span className={`api-builder__method api-builder__method--${ep.method.toLowerCase()}`}>
                {ep.method}
              </span>
              <code>{ep.path}</code>
              <span className="api-builder__mode">{ep.mode}</span>
              {!ep.enabled && <span className="api-builder__disabled">disabled</span>}
              <Button
                size="small"
                variant="text"
                onClick={() => del.mutate(ep.id)}
              >
                ×
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
