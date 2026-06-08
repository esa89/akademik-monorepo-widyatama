import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

export interface SearchComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface SearchComboboxProps {
  value: string;
  onChange: (value: string) => void;
  /** Label yang ditampilkan saat dropdown tertutup untuk value yang sudah ada (edit mode) */
  displayValue?: string;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  limit?: number;
  fetchOptions: (params: {
    search: string;
    page: number;
    limit: number;
  }) => Promise<{ data: SearchComboboxOption[]; hasMore: boolean }>;
}

export function SearchCombobox({
  value,
  onChange,
  displayValue,
  placeholder = 'Pilih...',
  error = false,
  disabled = false,
  limit = 10,
  fetchOptions,
}: SearchComboboxProps) {
  const [isOpen, setIsOpen]                 = useState(false);
  const [search, setSearch]                 = useState('');
  const [options, setOptions]               = useState<SearchComboboxOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<SearchComboboxOption | null>(null);
  const [page, setPage]                     = useState(1);
  const [hasMore, setHasMore]               = useState(false);
  const [loading, setLoading]               = useState(false);
  const [loadingMore, setLoadingMore]       = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const listRef         = useRef<HTMLDivElement>(null);
  const containerRef    = useRef<HTMLDivElement>(null);
  const inputRef        = useRef<HTMLInputElement>(null);

  // Tutup jika klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sinkronkan selectedOption ketika value berubah dari luar (reset form, edit)
  useEffect(() => {
    if (!value) {
      setSelectedOption(null);
      return;
    }
    // Cek di opsi yang sudah dimuat
    const found = options.find((o) => o.value === value);
    if (found) {
      setSelectedOption(found);
    } else if (displayValue) {
      // Gunakan displayValue sebagai fallback (dari data parent)
      setSelectedOption({ value, label: displayValue });
    }
  }, [value, options, displayValue]);

  // Fetch halaman pertama ketika dropdown dibuka atau search berubah
  const fetchFirstPage = useCallback(
    async (q: string) => {
      setLoading(true);
      setPage(1);
      try {
        const result = await fetchOptions({ search: q, page: 1, limit });
        setOptions(result.data);
        setHasMore(result.hasMore);
        // Tandai selectedOption dari hasil ini
        if (value) {
          const found = result.data.find((o) => o.value === value);
          if (found) setSelectedOption(found);
        }
      } finally {
        setLoading(false);
      }
    },
    [fetchOptions, limit, value],
  );

  useEffect(() => {
    if (isOpen) fetchFirstPage(debouncedSearch);
  }, [isOpen, debouncedSearch]); // eslint-disable-line

  // Infinite scroll — muat halaman berikutnya
  const handleScroll = useCallback(async () => {
    const el = listRef.current;
    if (!el || loadingMore || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 30) {
      setLoadingMore(true);
      try {
        const nextPage = page + 1;
        const result   = await fetchOptions({ search: debouncedSearch, page: nextPage, limit });
        setOptions((prev) => [...prev, ...result.data]);
        setPage(nextPage);
        setHasMore(result.hasMore);
      } finally {
        setLoadingMore(false);
      }
    }
  }, [loadingMore, hasMore, page, debouncedSearch, fetchOptions, limit]);

  const handleOpen = () => {
    if (disabled) return;
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleSelect = (opt: SearchComboboxOption) => {
    setSelectedOption(opt);
    onChange(opt.value);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOption(null);
    onChange('');
  };

  const displayLabel = selectedOption?.label ?? (value && displayValue ? displayValue : null);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={`w-full px-3 py-2 text-left bg-white rounded-lg border text-sm flex items-center justify-between gap-2
          focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors
          ${error ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'cursor-pointer'}
          ${isOpen ? 'border-primary ring-2 ring-primary/20' : ''}`}
      >
        <span className={`truncate ${displayLabel ? 'text-gray-900' : 'text-gray-400'}`}>
          {displayLabel ?? placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <span
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari..."
                className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Options list */}
          <div ref={listRef} onScroll={handleScroll} className="max-h-52 overflow-y-auto">
            {loading ? (
              <div className="py-6 text-center text-xs text-gray-400">Memuat...</div>
            ) : options.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">
                {search ? 'Tidak ada hasil untuk pencarian ini' : 'Tidak ada data'}
              </div>
            ) : (
              <>
                {options.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt)}
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors
                      ${opt.value === value ? 'bg-primary/5' : ''}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-800 truncate">{opt.label}</p>
                      {opt.sublabel && (
                        <p className="text-[11px] text-gray-400 truncate">{opt.sublabel}</p>
                      )}
                    </div>
                    {opt.value === value && (
                      <Check size={12} className="text-primary shrink-0" />
                    )}
                  </div>
                ))}
                {loadingMore && (
                  <div className="py-2 text-center text-xs text-gray-400">Memuat lebih...</div>
                )}
                {!hasMore && options.length > 0 && (
                  <p className="py-1.5 text-center text-[11px] text-gray-300">
                    {options.length} data ditampilkan
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
