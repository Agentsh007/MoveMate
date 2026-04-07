// =============================================
// Listings Page — Filters + Property Grid + Pagination
// =============================================

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  SlidersHorizontal, X, Search, MapPin, ChevronLeft, ChevronRight,
  Building2, Loader2, LayoutGrid, LayoutList
} from 'lucide-react';
import { propertyAPI } from '../api/property.api';
import PropertyCard from '../components/property/PropertyCard';
import { PROPERTY_TYPES } from '../utils/constants';

export default function Listings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state — initialized from URL params
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
    city: searchParams.get('city') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    bedrooms: searchParams.get('bedrooms') || '',
    sort: searchParams.get('sort') || '',
    page: parseInt(searchParams.get('page') || '1'),
  });

  // Fetch properties whenever filters change
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        // Build query params (exclude empty values)
        const params = {};
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== '' && value !== null && value !== undefined) {
            params[key] = value;
          }
        });
        params.limit = 12;

        const { data } = await propertyAPI.list(params);
        setProperties(data.properties);
        setPagination(data.pagination);
      } catch (err) {
        console.error('Failed to fetch properties:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [filters]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined && !(key === 'page' && value === 1)) {
        params.set(key, value);
      }
    });
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ type: '', city: '', minPrice: '', maxPrice: '', bedrooms: '', sort: '', page: 1 });
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([key, val]) => key !== 'page' && key !== 'sort' && val !== ''
  ).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-heading font-bold text-gray-900">Property Listings</h1>
              <p className="text-muted text-sm mt-0.5">
                {loading ? 'Searching...' : `${pagination.total} propert${pagination.total === 1 ? 'y' : 'ies'} found`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Sort */}
              <select
                value={filters.sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="input-field !py-2 !px-3 !w-auto text-sm"
              >
                <option value="">Newest</option>
                <option value="price_low">Price: Low → High</option>
                <option value="price_high">Price: High → Low</option>
                <option value="rating">Top Rated</option>
              </select>

              {/* Mobile filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden btn-secondary !py-2 !px-3 flex items-center gap-1.5 text-sm relative"
              >
                <SlidersHorizontal size={16} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* ══════════ FILTER SIDEBAR ══════════ */}
          <aside className={`${showFilters ? 'fixed inset-0 z-50 bg-black/50 lg:relative lg:bg-transparent' : 'hidden lg:block'} lg:w-64 shrink-0`}>
            <div className={`${showFilters ? 'absolute right-0 top-0 h-full w-80 bg-white p-6 overflow-y-auto shadow-modal' : ''} lg:static lg:w-auto lg:shadow-none lg:p-0`}>
              {/* Mobile close */}
              {showFilters && (
                <div className="flex items-center justify-between mb-4 lg:hidden">
                  <h3 className="font-heading font-semibold">Filters</h3>
                  <button onClick={() => setShowFilters(false)}>
                    <X size={20} />
                  </button>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-border p-5 space-y-5 lg:sticky lg:top-24">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-semibold text-sm text-gray-800">Filters</h3>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-accent hover:text-accent-hover font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">City</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Any city"
                      value={filters.city}
                      onChange={(e) => updateFilter('city', e.target.value)}
                      className="input-field !py-2 !pl-9 text-sm"
                    />
                  </div>
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Property Type</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PROPERTY_TYPES.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => updateFilter('type', filters.type === value ? '' : value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filters.type === value
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Price Range (৳)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => updateFilter('minPrice', e.target.value)}
                      className="input-field !py-2 text-sm w-1/2"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => updateFilter('maxPrice', e.target.value)}
                      className="input-field !py-2 text-sm w-1/2"
                    />
                  </div>
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Bedrooms (min)</label>
                  <div className="flex gap-1.5">
                    {['', '1', '2', '3', '4'].map((val) => (
                      <button
                        key={val}
                        onClick={() => updateFilter('bedrooms', filters.bedrooms === val ? '' : val)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${filters.bedrooms === val
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        {val || 'Any'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Apply (mobile only) */}
                <button
                  onClick={() => setShowFilters(false)}
                  className="btn-primary w-full lg:hidden text-sm"
                >
                  Show Results
                </button>
              </div>
            </div>
          </aside>

          {/* ══════════ RESULTS GRID ══════════ */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={36} className="animate-spin text-primary" />
              </div>
            ) : properties.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {properties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page <= 1}
                      className="p-2 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === pagination.pages || Math.abs(p - pagination.page) <= 1)
                      .map((page, idx, arr) => (
                        <span key={page}>
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <span className="px-1 text-muted">…</span>
                          )}
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, page }))}
                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${pagination.page === page
                              ? 'bg-primary text-white'
                              : 'border border-border hover:bg-gray-50'
                              }`}
                          >
                            {page}
                          </button>
                        </span>
                      ))}

                    <button
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page >= pagination.pages}
                      className="p-2 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <Building2 size={56} className="mx-auto mb-4 text-gray-300" />
                <h3 className="font-heading font-semibold text-lg text-gray-700">No properties found</h3>
                <p className="text-muted text-sm mt-1">Try adjusting your filters or search a different city</p>
                <button onClick={clearFilters} className="btn-secondary mt-4 text-sm">
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
