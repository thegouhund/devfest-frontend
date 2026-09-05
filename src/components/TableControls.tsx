import React from 'react'
import { Button } from '@/components/ui/button'
import { TableHead } from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

export type SortOrder = 'asc' | 'desc'

/** Kepala kolom yang bisa diurutkan — dipakai tabel Riwayat dan Aktivitas. */
export function SortHeader<F extends string>({
  field,
  label,
  activeField,
  order,
  onSort,
  className,
}: {
  field: F
  label: string
  activeField: F
  order: SortOrder
  onSort: (field: F) => void
  className?: string
}) {
  const icon =
    activeField !== field ? (
      <ArrowUpDown className="w-3.5 h-3.5 text-ink-400 group-hover:text-ink-600 transition-colors" />
    ) : order === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-sepia-700 font-bold" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-sepia-700 font-bold" />
    )

  return (
    <TableHead className={className ?? 'px-5 py-3.5'}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onSort(field)}
        className="-ml-2 h-8 px-2 text-xs font-bold text-ink-700 hover:text-ink-900 hover:bg-ink-200/60 flex items-center gap-1 group cursor-pointer"
      >
        {label}
        {icon}
      </Button>
    </TableHead>
  )
}

/** Nomor halaman dengan elipsis di kedua sisi halaman aktif. */
const pageNumbersFor = (current: number, total: number): (number | 'ellipsis')[] => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | 'ellipsis')[] = [1]
  if (current > 3) pages.push('ellipsis')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('ellipsis')
  pages.push(total)
  return pages
}

export const TablePagination: React.FC<{
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}> = ({ page, pageSize, total, onPageChange, onPageSizeChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, totalPages)
  const pages = pageNumbersFor(current, totalPages)

  return (
    <div className="p-4 sm:p-5 border-t border-ink-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-ink-500 bg-ink-50/50">
      <div className="text-center md:text-left w-full md:w-auto font-medium">
        Menampilkan {total === 0 ? 0 : (current - 1) * pageSize + 1}-
        {Math.min(current * pageSize, total)} dari {total} data
      </div>

      <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 w-full md:w-auto">
        <div className="flex items-center gap-2">
          <span className="font-medium text-ink-600">Tampilkan</span>
          <Select value={String(pageSize)} onValueChange={(val) => onPageSizeChange(Number(val))}>
            <SelectTrigger className="h-8 w-[72px] bg-white border-ink-200 text-xs font-semibold text-ink-700">
              <SelectValue placeholder={String(pageSize)} />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
            </SelectContent>
          </Select>
          <span className="hidden sm:inline font-medium text-ink-600">per halaman</span>
        </div>

        <Pagination className="mx-0 w-auto">
          <PaginationContent className="gap-1">
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg bg-white border-ink-200 text-ink-600 hover:bg-ink-100 disabled:opacity-40 cursor-pointer"
                onClick={() => onPageChange(1)}
                disabled={current <= 1}
                title="Halaman Pertama"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
            </PaginationItem>

            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg bg-white border-ink-200 text-ink-600 hover:bg-ink-100 disabled:opacity-40 cursor-pointer"
                onClick={() => onPageChange(Math.max(1, current - 1))}
                disabled={current <= 1}
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
            </PaginationItem>

            {pages.map((p, idx) =>
              p === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${idx}`}>
                  <PaginationEllipsis className="h-8 w-8 text-ink-400" />
                </PaginationItem>
              ) : (
                <PaginationItem key={`page-${p}`}>
                  <PaginationLink
                    href="#"
                    isActive={current === p}
                    onClick={(e) => {
                      e.preventDefault()
                      onPageChange(p)
                    }}
                    className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${
                      current === p
                        ? 'bg-sepia-700 text-white border-sepia-700 hover:bg-sepia-800 hover:text-white'
                        : 'bg-white border-ink-200 text-ink-700 hover:bg-ink-100'
                    }`}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg bg-white border-ink-200 text-ink-600 hover:bg-ink-100 disabled:opacity-40 cursor-pointer"
                onClick={() => onPageChange(Math.min(totalPages, current + 1))}
                disabled={current >= totalPages}
                title="Halaman Berikutnya"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </PaginationItem>

            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg bg-white border-ink-200 text-ink-600 hover:bg-ink-100 disabled:opacity-40 cursor-pointer"
                onClick={() => onPageChange(totalPages)}
                disabled={current >= totalPages}
                title="Halaman Terakhir"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
