import React, { createContext, useState, useContext, useEffect } from 'react';
import { companyAPI } from '../services/api';
import { useAuth } from './AuthContext';

const BrandingContext = createContext();

export const BrandingProvider = ({ children }) => {
  const { token } = useAuth();
  const [branding, setBranding] = useState({
    name: 'Education CRM',
    logo: null,
    primaryColor: '#1890ff',
    theme: 'light',
  });
  const [loading, setLoading] = useState(true);

  const fetchBranding = async () => {
    try {
      setLoading(true);
      const response = await companyAPI.getBranding();
      if (response.data.success) {
        const data = response.data.data;
        setBranding({
          name: data.name || 'Education CRM',
          logo: data.logo || null,
          primaryColor: data.primaryColor || '#1890ff',
          theme: data.theme || 'light',
        });

        // Set CSS variables for global branding
        document.documentElement.style.setProperty(
          '--primary-color',
          data.primaryColor || '#1890ff'
        );
        // Calculate secondary/lighter versions if needed
        const lightenColor = (col, amt) => {
          let usePound = false;
          if (col[0] === '#') {
            col = col.slice(1);
            usePound = true;
          }
          let num = parseInt(col, 16);
          let r = (num >> 16) + amt;
          if (r > 255) r = 255;
          else if (r < 0) r = 0;
          let b = ((num >> 8) & 0x00ff) + amt;
          if (b > 255) b = 255;
          else if (b < 0) b = 0;
          let g = (num & 0x0000ff) + amt;
          if (g > 255) g = 255;
          else if (g < 0) g = 0;
          return (
            (usePound ? '#' : '') +
            (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0')
          );
        };
        document.documentElement.style.setProperty(
          '--primary-light',
          lightenColor(data.primaryColor || '#1890ff', 40)
        );
      }
    } catch (error) {
      console.error('Failed to fetch branding:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBranding();
    } else {
      setLoading(false);
    }
  }, [token]);

  const updateBranding = async (newData) => {
    const response = await companyAPI.updateSettings(newData);
    if (response.data.success) {
      await fetchBranding();
    }
    return response.data;
  };

  return (
    <BrandingContext.Provider
      value={{
        branding,
        loading,
        updateBranding,
        refreshBranding: fetchBranding,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => useContext(BrandingContext);
