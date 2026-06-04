import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RouteGuard } from "@/components/RouteGuard";
import { AppLayout } from "@/components/AppLayout";

export const Route = createFileRoute("/_authenticated")({
  component: () => (
    <RouteGuard>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </RouteGuard>
  ),
});
