'use client'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      if (currentPage > 3) pages.push('...')

      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        if (!pages.includes(i)) pages.push(i)
      }

      if (currentPage < totalPages - 2) pages.push('...')

      pages.push(totalPages)
    }

    return pages
  }

  const handlePageClick = (page: number | string) => {
    if (typeof page === 'number' && page !== currentPage) {
      onPageChange(page)
    }
  }

  if (totalPages < 1 || totalItems === 0) return null
  if (currentPage > totalPages) return null

  return (
    <div className="flex flex-col gap-4 items-center justify-between py-6 px-4 border-t border-gray-200 bg-gray-50 md:flex-row">
      {/* Items Info */}
      <div className="text-sm text-gray-600">
        Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of{' '}
        <strong>{totalItems}</strong> items
      </div>

      {/* Page Size Selector */}
      {onPageSizeChange && pageSizeOptions.length > 0 && (
        <div className="flex items-center gap-2">
          <label htmlFor="pageSize" className="text-sm text-gray-600 font-medium">
            Items per page:
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
            className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Previous page"
        >
          ← Prev
        </button>

        {/* Page Numbers */}
        {getPageNumbers().map((page, idx) => (
          <button
            key={idx}
            onClick={() => handlePageClick(page)}
            disabled={page === '...'}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition ${
              page === currentPage
                ? 'bg-primary text-white'
                : page === '...'
                ? 'cursor-not-allowed text-gray-400'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
            title={page === '...' ? 'More pages' : `Page ${page}`}
          >
            {page}
          </button>
        ))}

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Next page"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
