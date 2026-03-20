import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useBranding } from '../context/BrandingContext';
import { Save, Upload, Palette, Building } from 'lucide-react';

const SettingsPage = () => {
  const { branding, updateBranding } = useBranding();
  const [formData, setFormData] = useState({
    name: '',
    primaryColor: '#1890ff',
    logo: '',
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (branding) {
      setFormData({
        name: branding.name || '',
        primaryColor: branding.primaryColor || '#1890ff',
        logo: branding.logo || '',
      });
    }
  }, [branding]);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        setStatus({
          type: 'error',
          message: 'Logo size should be less than 1MB',
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus({ type: '', message: '' });

    try {
      await updateBranding(formData);
      setStatus({
        type: 'success',
        message: 'Corporate branding updated successfully!',
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to update settings',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">System Brandings</h1>
        <p className="text-gray-500">
          Customize your portal identity and colors
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/30">
          <div className="flex items-center gap-2 text-gray-800">
            <Building size={20} className="text-primary" />
            <h2 className="font-bold">Identity & Visuals</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {status.message && (
            <div
              className={`p-4 rounded-lg flex items-center gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${status.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <p className="text-sm font-medium">{status.message}</p>
            </div>
          )}

          <div className="grid md:grid-rows-2 gap-8">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Company Legal Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="Enter company name"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Primary Color */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Brand Primary Color
                </label>
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-lg shadow-sm border border-gray-100"
                    style={{ backgroundColor: formData.primaryColor }}
                  />
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        primaryColor: e.target.value,
                      }))
                    }
                    className="h-10 w-full cursor-pointer rounded bg-transparent"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-400 font-medium">
                  This color will be used for buttons, sidebar highlights, and
                  topbars.
                </p>
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Corporate Logo
                </label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                    {formData.logo ? (
                      <>
                        <Image
                          src={formData.logo}
                          alt="Preview"
                          width={96}
                          height={96}
                          unoptimized
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Upload size={20} className="text-white" />
                        </div>
                      </>
                    ) : (
                      <Upload size={24} className="text-gray-300" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium mb-1">
                      Upload a PNG or SVG logo.
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Max size: 1MB. Recommended size: 200x200px.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, logo: '' }))
                      }
                      className="mt-2 text-xs text-red-500 font-bold hover:underline"
                    >
                      Remove Logo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-50 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 bg-primary hover-bg-primary text-white px-8 py-3 rounded-lg font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Applying...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Save & Apply Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Preview Section */}
      <div className="mt-12">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Live Preview</h3>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase mb-4">
              Button Preview
            </p>
            <div className="flex gap-4">
              <button
                className="px-6 py-2 rounded-lg text-white font-bold text-sm shadow-md"
                style={{ backgroundColor: formData.primaryColor }}
              >
                Primary Action
              </button>
              <button
                className="px-6 py-2 rounded-lg font-bold text-sm border-2"
                style={{
                  borderColor: formData.primaryColor,
                  color: formData.primaryColor,
                }}
              >
                Secondary
              </button>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <p className="text-xs font-bold text-gray-400 uppercase mb-4">
              Sidebar Item Preview
            </p>
            <div
              className="flex items-center gap-3 px-4 py-2 rounded-lg font-bold text-sm"
              style={{
                backgroundColor: `${formData.primaryColor}15`,
                color: formData.primaryColor,
              }}
            >
              <Palette size={18} />
              <span>Active Navigation Item</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
