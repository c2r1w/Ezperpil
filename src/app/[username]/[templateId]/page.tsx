'use client';

import React, { useEffect, useState } from 'react';
import { WebinarLandingPage } from '@/components/webinar/webinar-landing-page';

function ProfessionalLoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-background">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary mb-6" />
      <h2 className="text-2xl font-bold text-primary mb-2">Cargando Webinar...</h2>
      <p className="text-muted-foreground">Por favor espera mientras preparamos tu experiencia.</p>
    </div>
  );
}

export default function Page({ params }: { params: { username: string; templateId: string } }) {
  const { username, templateId } = params;
  const [webinarData, setWebinarData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getWebinarData = async () => {
      const userid = `${username}/${templateId}`;
      try {
        const res = await fetch(`/api/webinar-template?userid=${encodeURIComponent(userid)}`);
        if (!res.ok) return setWebinarData(null);
        const result = await res.json();
        if (result && result.data) {
          setWebinarData(JSON.parse(result.data));
        } else {
          setWebinarData(null);
        }
      } catch {
        setWebinarData(null);
      } finally {
        setLoading(false);
      }
    };
    getWebinarData();
  }, [username, templateId]);

  if (loading) {
    return <ProfessionalLoadingScreen />;
  }

  if (!webinarData) {
    return <div className="bg-background py-8 text-center">No webinar found.</div>;
  }

  return (
    <div className="bg-background py-8">
      <WebinarLandingPage
        userMode={true}
        inviterUsername={username}
        {...webinarData}
      />
    </div>
  );
}
