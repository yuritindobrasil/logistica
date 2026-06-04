import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { RouteGuard } from '@/components/RouteGuard';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { ConfiguracaoGlobal, FaixasEficiencia } from '@/types/domain';

export const Route = createFileRoute('/_authenticated/dev/config')({
  component: () => (
    <RouteGuard roles={['desenvolvedor']}>
      <DevConfigPage />
    </RouteGuard>
  ),
});

const schema = z.object({
  padrao: z.coerce.number().int().positive('> 0'),
  faixa_2: z.coerce.number().int().positive(),
  faixa_3: z.coerce.number().int().positive(),
  faixa_4: z.coerce.number().int().positive(),
  faixa_5: z.coerce.number().int().positive(),
}).refine((v) => v.padrao < v.faixa_2 && v.faixa_2 < v.faixa_3 && v.faixa_3 < v.faixa_4 && v.faixa_4 < v.faixa_5, {
  message: 'As faixas devem ser estritamente crescentes',
  path: ['faixa_5'],
});

type Form = z.input<typeof schema>;

function DevConfigPage() {
  const qc = useQueryClient();
  const [config, setConfig] = useState<ConfiguracaoGlobal | null>(null);

  const { data } = useQuery({
    queryKey: ['config', 'faixas_calculo_eficiencia'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracoes_globais' as never)
        .select('*')
        .eq('chave', 'faixas_calculo_eficiencia')
        .maybeSingle();
      if (error) throw error;
      return data as ConfiguracaoGlobal | null;
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (data) {
      setConfig(data);
      reset(data.valor as unknown as Form);
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: async (values: Form) => {
      const valor: FaixasEficiencia = {
        padrao: Number(values.padrao),
        faixa_2: Number(values.faixa_2),
        faixa_3: Number(values.faixa_3),
        faixa_4: Number(values.faixa_4),
        faixa_5: Number(values.faixa_5),
      };
      const { error } = await supabase
        .from('configuracoes_globais' as never)
        .update({ valor, updated_at: new Date().toISOString() } as never)
        .eq('chave', 'faixas_calculo_eficiencia');
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Configuração salva');
      qc.invalidateQueries({ queryKey: ['config'] });
    },
    onError: (e: Error) => toast.error('Erro ao salvar', { description: e.message }),
  });

  const fields: Array<{ name: keyof Form; label: string; hint: string }> = [
    { name: 'padrao', label: 'Padrão', hint: 'Itens/hora base' },
    { name: 'faixa_2', label: 'Faixa 2', hint: 'Limite faixa 2' },
    { name: 'faixa_3', label: 'Faixa 3', hint: 'Limite faixa 3' },
    { name: 'faixa_4', label: 'Faixa 4', hint: 'Limite faixa 4' },
    { name: 'faixa_5', label: 'Faixa 5', hint: 'Limite faixa 5' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Configurações Globais</h1>
        <p className="text-sm text-muted-foreground">Painel do Desenvolvedor · edição validada do JSONB.</p>
      </header>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Chave: <span className="text-foreground">faixas_calculo_eficiencia</span>
        </h2>
        {config?.descricao && <p className="mt-1 text-xs text-muted-foreground">{config.descricao}</p>}

        <div className="mt-5 grid gap-4 md:grid-cols-5">
          {fields.map((f) => (
            <div key={f.name}>
              <Label htmlFor={f.name}>{f.label}</Label>
              <Input id={f.name} type="number" min={1} {...register(f.name)} />
              <p className="mt-1 text-[11px] text-muted-foreground">{f.hint}</p>
              {errors[f.name] && (
                <p className="mt-1 text-xs text-destructive">{errors[f.name]?.message as string}</p>
              )}
            </div>
          ))}
        </div>
        {errors.faixa_5 && (
          <p className="mt-3 text-xs text-destructive">{errors.faixa_5.message}</p>
        )}

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Configuração
          </Button>
        </div>
      </form>

      {config && (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">JSONB atual no banco</p>
          <pre className="mt-2 overflow-auto rounded-md bg-secondary/50 p-3 text-xs">
            {JSON.stringify(config.valor, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
