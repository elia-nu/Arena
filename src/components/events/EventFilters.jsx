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
    "rounded-full px-5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 outline-none";

  const optionActive =
    "bg-gradient-to-r from-secondary-500 to-secondary-600 text-white shadow-lg shadow-secondary-500/35 scale-105 border border-secondary-400/40";
  const optionInactive =
    "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white";

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
