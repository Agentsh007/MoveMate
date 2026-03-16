// =============================================
// Add Listing — Multi-Step Property Form
// =============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, MapPin, BedDouble, DollarSign, Image as ImageIcon,
  CheckCircle, ChevronLeft, ChevronRight, Loader2, Upload, X, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { propertyAPI } from '../../api/property.api';
import { PROPERTY_TYPES, BOOKING_MODELS, AMENITIES_LIST } from '../../utils/constants';

const STEPS = [
  { label: 'Basics', icon: Building2 },
  { label: 'Location', icon: MapPin },
  { label: 'Details', icon: BedDouble },
  { label: 'Pricing', icon: DollarSign },
  { label: 'Images', icon: ImageIcon },
  { label: 'Review', icon: CheckCircle },
];

export default function AddListing() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [form, setForm] = useState({
    title: '', description: '', property_type: 'flat', booking_model: 'long_term',
    city: '', address: '', latitude: '', longitude: '',
    bedrooms: 1, bathrooms: 1, max_guests: 2, area_sqft: '',
    base_price: '', price_unit: 'per_month', instant_book: false,
    amenities: [], rules: [''],
  });

  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const toggleAmenity = (name) => {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(name)
        ? f.amenities.filter(a => a !== name)
        : [...f.amenities, name],
    }));
  };

  const addRule = () => setForm(f => ({ ...f, rules: [...f.rules, ''] }));
  const removeRule = (idx) => setForm(f => ({ ...f, rules: f.rules.filter((_, i) => i !== idx) }));
  const updateRule = (idx, val) => setForm(f => ({
    ...f, rules: f.rules.map((r, i) => i === idx ? val : r),
  }));

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (imageFiles.length + files.length > 10) {
      toast.error('Maximum 10 images allowed');
      return;
    }
    setImageFiles(prev => [...prev, ...files]);
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (idx) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.city || !form.base_price) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // 1. Create property
      const payload = {
        ...form,
        base_price: parseFloat(form.base_price),
        area_sqft: form.area_sqft ? parseInt(form.area_sqft) : null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        rules: form.rules.filter(r => r.trim()),
      };
      const { data } = await propertyAPI.create(payload);
      const propertyId = data.property.id;

      // 2. Upload images
      if (imageFiles.length > 0) {
        const formData = new FormData();
        imageFiles.forEach(f => formData.append('images', f));
        await propertyAPI.uploadImages(propertyId, formData);
      }

      toast.success('Listing created successfully!');
      navigate('/owner');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const canNext = () => {
    if (step === 0) return form.title && form.property_type;
    if (step === 1) return form.city;
    if (step === 3) return form.base_price;
    return true;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <h1 className="text-xl font-heading font-bold text-gray-900">Add New Listing</h1>
          <p className="text-sm text-muted">Fill out the details to list your property</p>
        </div>
      </div>

      {/* Step Progress */}
      <div className="bg-white border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-1">
            {STEPS.map(({ label, icon: Icon }, idx) => (
              <div key={label} className="flex items-center flex-1">
                <button
                  onClick={() => idx <= step && setStep(idx)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    idx === step ? 'bg-accent text-white' :
                    idx < step ? 'bg-green-100 text-green-700' :
                    'text-gray-400'
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${idx < step ? 'bg-green-300' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-border p-6 sm:p-8">
          {/* ══════════ STEP 0: BASICS ══════════ */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                <input value={form.title} onChange={(e) => update('title', e.target.value)}
                  placeholder="Beautiful 2-Bedroom Flat in Dhanmondi" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => update('description', e.target.value)}
                  placeholder="Describe your property..." rows={4} className="input-field resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {PROPERTY_TYPES.map(({ value, label }) => (
                    <button key={value} onClick={() => update('property_type', value)}
                      className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                        form.property_type === value ? 'border-primary bg-primary/5 text-primary' : 'border-border text-gray-500 hover:border-gray-300'
                      }`}>{label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Booking Model *</label>
                <div className="grid grid-cols-3 gap-2">
                  {BOOKING_MODELS.map(({ value, label }) => (
                    <button key={value} onClick={() => update('booking_model', value)}
                      className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                        form.booking_model === value ? 'border-accent bg-accent-light text-accent' : 'border-border text-gray-500 hover:border-gray-300'
                      }`}>{label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════ STEP 1: LOCATION ══════════ */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                <input value={form.city} onChange={(e) => update('city', e.target.value)}
                  placeholder="Dhaka" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Address</label>
                <input value={form.address} onChange={(e) => update('address', e.target.value)}
                  placeholder="House 12, Road 5, Dhanmondi" className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Latitude</label>
                  <input type="number" step="any" value={form.latitude} onChange={(e) => update('latitude', e.target.value)}
                    placeholder="23.8103" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Longitude</label>
                  <input type="number" step="any" value={form.longitude} onChange={(e) => update('longitude', e.target.value)}
                    placeholder="90.4125" className="input-field" />
                </div>
              </div>
              <p className="text-xs text-muted">Tip: Get coordinates from Google Maps → Right-click any spot → Copy coordinates</p>
            </div>
          )}

          {/* ══════════ STEP 2: DETAILS ══════════ */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { key: 'bedrooms', label: 'Bedrooms', max: 10 },
                  { key: 'bathrooms', label: 'Bathrooms', max: 5 },
                  { key: 'max_guests', label: 'Max Guests', max: 20 },
                ].map(({ key, label, max }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                    <select value={form[key]} onChange={(e) => update(key, parseInt(e.target.value))} className="input-field">
                      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Area (sqft)</label>
                  <input type="number" value={form.area_sqft} onChange={(e) => update('area_sqft', e.target.value)}
                    placeholder="800" className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2.5">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES_LIST.map(name => (
                    <button key={name} onClick={() => toggleAmenity(name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        form.amenities.includes(name) ? 'bg-primary text-white border-primary' : 'border-border text-gray-500 hover:border-gray-300'
                      }`}>{name}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">House Rules</label>
                {form.rules.map((rule, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input value={rule} onChange={(e) => updateRule(idx, e.target.value)}
                      placeholder="e.g., No smoking" className="input-field text-sm" />
                    {form.rules.length > 1 && (
                      <button onClick={() => removeRule(idx)} className="text-red-400 hover:text-red-600 shrink-0">
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addRule} className="text-sm text-accent font-medium flex items-center gap-1 mt-1">
                  <Plus size={14} /> Add Rule
                </button>
              </div>
            </div>
          )}

          {/* ══════════ STEP 3: PRICING ══════════ */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Base Price (৳) *</label>
                <input type="number" value={form.base_price} onChange={(e) => update('base_price', e.target.value)}
                  placeholder="15000" className="input-field text-lg font-semibold" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Unit</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'per_month', label: 'Per Month' },
                    { value: 'per_night', label: 'Per Night' },
                  ].map(({ value, label }) => (
                    <button key={value} onClick={() => update('price_unit', value)}
                      className={`py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                        form.price_unit === value ? 'border-accent bg-accent-light text-accent' : 'border-border text-gray-500'
                      }`}>{label}</button>
                  ))}
                </div>
              </div>
              {form.booking_model === 'short_term' && (
                <label className="flex items-center gap-3 bg-blue-50 rounded-xl p-4 cursor-pointer">
                  <input type="checkbox" checked={form.instant_book}
                    onChange={(e) => update('instant_book', e.target.checked)}
                    className="w-4 h-4 accent-primary" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Enable Instant Booking</p>
                    <p className="text-xs text-muted">Renters can book without your approval</p>
                  </div>
                </label>
              )}
            </div>
          )}

          {/* ══════════ STEP 4: IMAGES ══════════ */}
          {step === 4 && (
            <div>
              <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/40 transition-colors">
                <Upload size={36} className="mx-auto mb-3 text-gray-400" />
                <p className="font-medium text-gray-700 text-sm">Drag & drop or click to upload</p>
                <p className="text-xs text-muted mt-1">JPEG, PNG • Max 5MB each • Up to 10 images</p>
                <input type="file" multiple accept="image/*" onChange={handleImageSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer" style={{ position: 'relative' }} />
              </div>
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
                  {imagePreviews.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={12} />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 bg-accent text-white text-[9px] px-1.5 py-0.5 rounded font-bold">PRIMARY</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════ STEP 5: REVIEW ══════════ */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="font-heading font-bold text-lg">Review Your Listing</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['Title', form.title],
                  ['Type', form.property_type],
                  ['Booking Model', form.booking_model.replace('_', ' ')],
                  ['City', form.city],
                  ['Address', form.address || '—'],
                  ['Bedrooms', form.bedrooms],
                  ['Bathrooms', form.bathrooms],
                  ['Max Guests', form.max_guests],
                  ['Price', `৳${form.base_price} ${form.price_unit.replace('_', '/')}`],
                  ['Images', `${imageFiles.length} uploaded`],
                  ['Amenities', form.amenities.length > 0 ? form.amenities.join(', ') : '—'],
                ].map(([label, val]) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-muted">{label}</p>
                    <p className="font-medium text-gray-800 mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
              className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-30">
              <ChevronLeft size={16} /> Back
            </button>

            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
                className="btn-primary flex items-center gap-1 text-sm">
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="btn-primary flex items-center gap-2 text-sm">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {loading ? 'Creating...' : 'Publish Listing'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
