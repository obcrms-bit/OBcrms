'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { QrCode } from 'lucide-react';
import { publicAPI } from '@/src/services/api';
import { DEFAULT_BRANDING, normalizeBranding } from '@/src/services/branding';

export default function QRLandingPage() {
  const params = useParams();
  const id = params?.id;
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadQRCode = async () => {
      try {
        const response = await publicAPI.getQRCodeLanding(id);
        if (!active) {
          return;
        }

        const data = response.data?.data || {};
        setBranding(normalizeBranding(data.branding || DEFAULT_BRANDING));

        if (data.redirectUrl && typeof window !== 'undefined') {
          window.location.replace(data.redirectUrl);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError?.response?.data?.message ||
              requestError?.message ||
              'Unable to load QR campaign.'
          );
        }
      }
    };

    loadQRCode();

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        background: `linear-gradient(135deg, ${branding.secondaryColor} 0%, ${branding.primaryColor} 100%)`,
        fontFamily: branding.fontFamily,
      }}
    >
      <div className="max-w-md rounded-[2rem] border border-white/10 bg-white/10 p-8 text-center text-white backdrop-blur">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl"
          style={{ backgroundColor: `${branding.accentColor}30`, color: branding.accentColor }}
        >
          <QrCode className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold">Opening enquiry form</h1>
        <p className="mt-3 text-sm text-white/80">
          Redirecting you to the tenant-branded enquiry experience.
        </p>
        {error ? <p className="mt-4 text-sm text-rose-100">{error}</p> : null}
      </div>
    </div>
  );
}
