const EventFilters = ({
  filter,
  onFilterChange,
  statusFilter,
  onStatusFilterChange,
}) => {
  const typeOptions = [];

  const statusOptions = [
    { value: "all", label: "All status" },
    { value: "upcoming", label: "Upcoming" },
    { value: "live", label: "Live" },
  ];

  const option =
    "px-4 py-2 text-xs font-medium rounded-lg border transition-colors outline-none";

  const optionActive =
    "bg-secondary-500 border-secondary-500 text-white font-semibold shadow-xs";
  const optionInactive =
    "bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/[0.08] hover:text-white";

  const FilterRow = ({ value, options, onChange }) => (
    <div className="flex flex-wrap justify-center gap-2">
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
