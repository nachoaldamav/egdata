import { useOutletContext } from '@remix-run/react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '~/components/ui/table';
import type { SingleItem } from '~/types/single-item';

export default function ItemsSection() {
  const data = useOutletContext<{
    items: SingleItem[];
  }>();

  if (!data) {
    return null;
  }

  const items = data.items;

  if (!items.length) {
    return null;
  }

  return (
    <>
      <h2 className="text-2xl font-bold">Items</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Item ID</TableHead>
            <TableHead>Item Name</TableHead>
            <TableHead>Entitlement Type</TableHead>
            <TableHead>Entitlement Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono">{item.id}</TableCell>
              <TableCell className="text-left">{item.title}</TableCell>
              <TableCell className="text-left">{item.entitlementType}</TableCell>
              <TableCell className="text-left">{item.entitlementName}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
