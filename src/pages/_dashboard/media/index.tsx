import { createFileRoute } from '@tanstack/react-router';
import { MediaListPage } from './-components/list';

export const Route = createFileRoute('/_dashboard/media/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <MediaListPage />;
}
