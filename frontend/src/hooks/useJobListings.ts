import { useEffect, useMemo, useState } from 'react';
import { ALL_JOBS, type Ats, type JobCase } from '@/lib/hirelens-data';
import { fetchLiveListings } from '@/services/api';

/**
 * Custom hook managing Job Radar listings fetching, client-side filtering, and active case drawer state.
 */
export function useJobListings(initialVisibleCount: number = 9) {
  const [jobs, setJobs] = useState<JobCase[]>(ALL_JOBS);
  const [query, setQuery] = useState<string>('');
  const [selectedAts, setSelectedAts] = useState<Ats[]>([]);
  const [minScore, setMinScore] = useState<number>(0);
  const [activeJob, setActiveJob] = useState<JobCase | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(initialVisibleCount);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    fetchLiveListings()
      .then((data) => {
        if (mounted && data && data.length > 0) {
          setJobs(data);
          setIsLive(true);
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const toggleAts = (platform: Ats) => {
    setSelectedAts((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const q = query.trim().toLowerCase();
      const matchQuery =
        !q ||
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q);

      const matchAts =
        selectedAts.length === 0 || j.platforms.some((p) => selectedAts.includes(p.ats));

      const matchScore = j.score >= minScore;

      return matchQuery && matchAts && matchScore;
    });
  }, [jobs, query, selectedAts, minScore]);

  const visibleJobs = useMemo(() => {
    return filteredJobs.slice(0, visibleCount);
  }, [filteredJobs, visibleCount]);

  const hasMore = visibleCount < filteredJobs.length;
  const loadMore = () => setVisibleCount((prev) => prev + 6);

  return {
    jobs,
    filteredJobs,
    visibleJobs,
    query,
    setQuery,
    selectedAts,
    toggleAts,
    minScore,
    setMinScore,
    activeJob,
    setActiveJob,
    isLive,
    isLoading,
    hasMore,
    loadMore,
    totalCount: filteredJobs.length,
  };
}
