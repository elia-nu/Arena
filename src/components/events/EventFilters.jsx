const EventFilters = ({
  filter,
  onFilterChange,
  statusFilter,
  onStatusFilterChange,
}) => {
  const typeOptions = [];

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "upcoming", label: "Upcoming" },
    { value: "live", label: "Live" },
  ];

  const option =
    "rounded-full px-4 py-2 text-sm font-medium transition-[color,background-color] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-secondary-400 focus-visible:ring-offset-2";

  const optionActive = "bg-secondary-500 text-white";
  const optionInactive =
    "bg-transparent text-primary-600 hover:bg-secondary-50 hover:text-secondary-600";

  const FilterRow = ({ value, options, onChange }) => (
    <div className="flex flex-wrap justify-center gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`${option} ${
            value === opt.value ? optionActive : optionInactive
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  const showTypeRow = typeOptions.length > 0;

  return (
    <div className="flex flex-col items-stretch gap-5">
      {showTypeRow && (
        <FilterRow
          value={filter}
          options={typeOptions}
          onChange={onFilterChange}
        />
      )}
      {onStatusFilterChange && (
        <>
          {showTypeRow && (
            <div
              className="mx-auto w-12 border-t border-primary-200"
              aria-hidden
            />
          )}
          <FilterRow
            value={statusFilter}
            options={statusOptions}
            onChange={onStatusFilterChange}
          />
        </>
      )}
    </div>
  );
};

export default EventFilters;
