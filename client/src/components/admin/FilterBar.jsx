/**
 * components/admin/FilterBar.jsx
 * One search/filter bar shared by every admin list, so the controls look and
 * behave the same on Speakers, Registrations, Resources, Payments and Awards.
 *
 * Stacks to a single column on phones and flows into a row from `sm` up; the
 * date-range pair always stays side by side so the two halves read as one field.
 */

import { Search, X, Calendar } from 'lucide-react';

/**
 * @param {string}   search              current search text
 * @param {Function} onSearchChange      (value) => void
 * @param {string}   searchPlaceholder
 * @param {Array}    selects             [{ label, value, onChange, options: [{ value, label }] }]
 * @param {object}   [dateRange]         { label, from, to, onFromChange, onToChange }
 * @param {boolean}  active              whether any filter is applied (shows Clear)
 * @param {Function} onReset
 * @param {string}   [summary]           e.g. "12 of 47 shown"
 * @param {node}     [children]          extra controls (export buttons etc.)
 */
export default function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  selects = [],
  dateRange,
  active,
  onReset,
  summary,
  children,
}) {
  return (
    <div
      className="bg-white rounded-xl p-3 sm:p-4 mb-4"
      style={{ border: '1px solid rgba(232,224,208,0.9)', boxShadow: 'var(--shadow-xs)' }}
    >
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        {/* Search */}
        {onSearchChange && (
          <div className="relative flex-1 sm:min-w-[220px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="search"
              className="form-input pl-10"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}

        {/* Dropdown filters */}
        {selects.map((s) => (
          <select
            key={s.label}
            className="form-input sm:w-auto sm:min-w-[150px]"
            value={s.value}
            onChange={(e) => s.onChange(e.target.value)}
            aria-label={s.label}
          >
            {s.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ))}

        {/* Date range — the two inputs are one control, so they never split */}
        {dateRange && (
          <div className="flex items-center gap-2 sm:gap-1.5">
            <Calendar size={15} className="text-gray-400 flex-shrink-0 hidden sm:block" />
            <input
              type="date"
              className="form-input flex-1 sm:flex-none sm:w-[9.5rem] min-w-0"
              value={dateRange.from}
              max={dateRange.to || undefined}
              onChange={(e) => dateRange.onFromChange(e.target.value)}
              aria-label={`${dateRange.label} from`}
              title={`${dateRange.label} from`}
            />
            <span className="text-gray-400 text-sm flex-shrink-0">to</span>
            <input
              type="date"
              className="form-input flex-1 sm:flex-none sm:w-[9.5rem] min-w-0"
              value={dateRange.to}
              min={dateRange.from || undefined}
              onChange={(e) => dateRange.onToChange(e.target.value)}
              aria-label={`${dateRange.label} to`}
              title={`${dateRange.label} to`}
            />
          </div>
        )}

        {children}

        {active && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-3 sm:py-2 rounded-xl
                       font-body text-sm font-semibold text-gray-500 hover:text-navy
                       border border-gray-200 hover:border-gray-300 transition-colors whitespace-nowrap"
          >
            <X size={14} /> Clear filters
          </button>
        )}
      </div>

      {summary && (
        <p className="font-body text-xs text-gray-400 mt-3">{summary}</p>
      )}
    </div>
  );
}
