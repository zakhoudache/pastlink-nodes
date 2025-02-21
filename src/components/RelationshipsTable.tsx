import React, { useMemo } from 'react';
import {
  useReactTable,
  ColumnDef,
  flexRender,
  getCoreRowModel
} from '@tanstack/react-table';

interface Relationship {
  source: string;
  target: string;
  type: string;
}

interface RelationshipsTableProps {
  relationships: Relationship[];
}

const RelationshipsTable: React.FC<RelationshipsTableProps> = ({ relationships }) => {
  const columns = useMemo<ColumnDef<Relationship>[]>(
    () => [
      {
        header: 'Source',
        accessorKey: 'source',
      },
      {
        header: 'Target',
        accessorKey: 'target',
      },
      {
        header: 'Type',
        accessorKey: 'type',
      },
    ],
    []
  );

  const table = useReactTable({
    data: relationships,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RelationshipsTable;
