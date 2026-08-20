import { useEffect, useMemo, useState } from 'react';
import { DOSSIERS, type Dossier } from '@/lib/hirelens-data';
import { fetchLiveCompanyDetail, type RawApiCompanyResponse } from '@/services/api';

/**
 * Custom hook managing company hiring dossier retrieval, discrepancy matrix derivation, and live telemetry.
 */
export function useCompanyDossier(initialCompanyName: string = 'Figma') {
  const [companyName, setCompanyName] = useState<string>(initialCompanyName);
  const [liveCompanyData, setLiveCompanyData] = useState<RawApiCompanyResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const availableCompanies = useMemo(() => {
    const list = new Set([...DOSSIERS.map((d) => d.name), 'Linear']);
    return Array.from(list);
  }, []);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setLiveCompanyData(null);

    fetchLiveCompanyDetail(companyName)
      .then((data) => {
        if (mounted && data && data.company?.toLowerCase() === companyName.toLowerCase()) {
          setLiveCompanyData(data);
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [companyName]);

  const dossier = useMemo<Dossier>(() => {
    const staticDossier = DOSSIERS.find((x) => x.name.toLowerCase() === companyName.toLowerCase());
    if (staticDossier) return staticDossier;

    const listings = liveCompanyData?.listings || [];
    const matrix: Dossier['matrix'] = listings.map((l) => ({
      role: l.title || 'Lead Systems Architect',
      linkedin: l.sources?.some((s) => s.toLowerCase().includes('linkedin')) ? 'LISTED' : 'ABSENT',
      portal: l.sources?.some((s) => s.toLowerCase().includes('greenhouse') || s.toLowerCase().includes('lever'))
        ? 'LISTED'
        : 'ABSENT',
      verdict:
        (l.score ?? 100) < 50
          ? 'PHANTOM'
          : (l.score ?? 100) < 75
          ? 'STALE MIRROR'
          : 'MATCH',
    }));

    return {
      name: companyName,
      ats: 'Greenhouse',
      grade: 'B-',
      lifespan: `${liveCompanyData?.avgListingLifespanDays || 34}d`,
      repostRate: `${liveCompanyData?.repostRatePercent || 25}%`,
      consistency: `${liveCompanyData?.consistencyRatePercent || 78}%`,
      openReqs: listings.length || 4,
      matrix: matrix.length > 0 ? matrix : [
        { role: 'Senior Product Engineer', linkedin: 'LISTED', portal: 'LISTED', verdict: 'MATCH' },
        { role: 'Staff Backend Architect', linkedin: 'LISTED', portal: 'ABSENT', verdict: 'PHANTOM' },
      ],
    };
  }, [companyName, liveCompanyData]);

  return {
    companyName,
    setCompanyName,
    availableCompanies,
    dossier,
    liveCompanyData,
    isLoading,
  };
}
