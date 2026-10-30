import { IoChevronBack, IoChevronForward } from "react-icons/io5";

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  onItemsPerPageChange,
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-primary-50 border-t border-primary-200">
      <div className="flex items-center gap-2 text-sm text-primary-600">
        <span>
          Showing {startItem} to {endItem} of {totalItems} results
        </span>
        {onItemsPerPageChange && (
          <div className="flex items-center gap-2 ml-4">
            <span>Items per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="px-2 py-1 border border-primary-300 rounded focus:border-tertiary-500 outline-none bg-white text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg transition-colors ${
            currentPage === 1
              ? "bg-primary-100 text-primary-400 cursor-not-allowed"
              : "bg-white border border-primary-300 text-primary-700 hover:bg-primary-50 hover:border-tertiary-500"
          }`}
        >
          <IoChevronBack />
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => {
            // Show ellipsis
            if (
              index === 0 &&
              page > 1 &&
              totalPages > 5 &&
              currentPage > 3
            ) {
              return (
                <div key={`ellipsis-start`} className="px-3 py-1">
                  <span className="text-primary-400">...</span>
                </div>
              );
            }
            if (
              index === getPageNumbers().length - 1 &&
              page < totalPages &&
              totalPages > 5 &&
              currentPage < totalPages - 2
            ) {
              return (
                <div key={`ellipsis-end`} className="px-3 py-1">
                  <span className="text-primary-400">...</span>
                </div>
              );
            }

            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? "bg-tertiary-500 text-white"
                    : "bg-white border border-primary-300 text-primary-700 hover:bg-primary-50 hover:border-tertiary-500"
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg transition-colors ${
            currentPage === totalPages
              ? "bg-primary-100 text-primary-400 cursor-not-allowed"
              : "bg-white border border-primary-300 text-primary-700 hover:bg-primary-50 hover:border-tertiary-500"
          }`}
        >
          <IoChevronForward />
        </button>
      </div>
      )}
    </div>
  );
};

export default Pagination;

