import { createFileRoute, Link } from '@tanstack/react-router';
import { RouteGuard } from '@/components/RouteGuard';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/_authenticated/admin/permissoes-globais')({
  component: () => (
    <RouteGuard roles={['admin', 'desenvolvedor']}>
      <PermGlobais />
    </RouteGuard>
  ),
});

function PermGlobais() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Permissões Individuais</h1>
        <p className="text-sm text-muted-foreground">
          As permissões granulares são editadas por usuário, na tela de Gestão de Usuários.
        </p>
      </header>
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm">
          Acesse a Data Table de usuários e clique em <span className="font-medium">Editar Permissões</span> para abrir a gaveta lateral.
        </p>
        <Button asChild className="mt-4">
          <Link to="/admin/usuarios">Ir para Usuários</Link>
        </Button>
      </div>
    </div>
  );
}
