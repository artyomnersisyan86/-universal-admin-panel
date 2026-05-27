import { useParams } from 'react-router-dom';
import { TablesListView } from '@features/table-builder/TablesListView';
import { TableEditor } from '@features/table-builder/TableEditor';

export function TablesPage() {
  const { id } = useParams<{ id: string }>();
  return id ? <TableEditor tableId={id} /> : <TablesListView />;
}
