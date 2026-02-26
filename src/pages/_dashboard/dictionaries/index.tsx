import { createFileRoute } from '@tanstack/react-router';
import { DictionariesListPage } from './-components/list';

export const Route = createFileRoute('/_dashboard/dictionaries/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <DictionariesListPage />;
}
