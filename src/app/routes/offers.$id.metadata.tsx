import { useOutletContext } from '@remix-run/react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '~/components/ui/table';
import type { SingleOffer } from '~/types/single-offer';

export default function ItemsSection() {
  const data = useOutletContext<SingleOffer>();

  if (!data) {
    return null;
  }

  return (
    <>
      <h2 className="text-2xl font-bold">Metadata</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Type</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(data.customAttributes).map(([key, item]) => (
            <TableRow key={key}>
              <TableCell>{key}</TableCell>
              <TableCell>{item.value}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell>Countries Blacklist</TableCell>
            <TableCell>{data.countriesBlacklist?.join(', ')}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Countries Whitelist</TableCell>
            <TableCell>{data.countriesWhitelist?.join(', ')}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Categories</TableCell>
            <TableCell>{data.categories.join(', ')}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Refund Type</TableCell>
            <TableCell>{data.refundType}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Tags</TableCell>
            <TableCell>{data.tags.map((tag) => tag.name).join(', ')}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </>
  );
}
