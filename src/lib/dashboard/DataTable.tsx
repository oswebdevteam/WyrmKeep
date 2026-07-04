// Generic sortable table built on TanStack Table.
import { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'

export function DataTable<T>({
  data,
  columns,
  onRowClick,
}: {
  data: Array<T>
  columns: Array<ColumnDef<T, any>>
  onRowClick?: (row: T) => void
}) {
  const [sorting, setSorting] = useState<SortingState>([])
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="demo-table-shell overflow-x-auto">
      <table className="demo-table w-full">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort()
                const dir = header.column.getIsSorted()
                return (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className={`inline-flex items-center gap-1 ${
                          canSort ? 'cursor-pointer' : 'cursor-default'
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                        disabled={!canSort}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {canSort &&
                          (dir === 'asc' ? (
                            <ArrowUp size={12} />
                          ) : dir === 'desc' ? (
                            <ArrowDown size={12} />
                          ) : (
                            <ChevronsUpDown size={12} className="opacity-40" />
                          ))}
                      </button>
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              className={onRowClick ? 'cursor-pointer' : undefined}
            >
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
  )
}
