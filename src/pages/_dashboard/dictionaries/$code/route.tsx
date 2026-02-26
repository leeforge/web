import { createFileRoute } from '@tanstack/react-router';
import { DictionaryDataPage } from './-components/data';

export const Route = createFileRoute('/_dashboard/dictionaries/$code')({
  component: RouteComponent,
});

function RouteComponent() {
  return <DictionaryDataPage />;
}
