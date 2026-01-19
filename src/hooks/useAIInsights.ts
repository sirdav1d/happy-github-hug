import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardMetrics {
  annualGoal: number;
  annualRealized: number;
  lastYearGrowth: number;
  currentMonthRevenue: number;
  currentMonthGoal: number;
  runRateProjection: number;
  averageTicket: number;
  totalSalesCount: number;
  currentMonthName: string;
  gapToGoal: number;
  daysRemaining: number;
  selectedYear: number;
}

interface AIInsights {
  healthScore: number;
  healthStatus: 'excellent' | 'good' | 'warning' | 'critical';
  mainInsight: string;
  actionItem: string;
  salesNeeded: number;
  dailyTarget: number;
}

interface UseAIInsightsReturn {
  insights: AIInsights | null;
  isLoading: boolean;
  error: string | null;
  fetchInsights: (metrics: DashboardMetrics) => Promise<void>;
}

const CACHE_KEY = 'ai_insights_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const DEBOUNCE_DELAY = 2000; // 2 seconds debounce to prevent rapid calls

interface CachedInsights {
  insights: AIInsights;
  timestamp: number;
  metricsHash: string;
}

const hashMetrics = (metrics: DashboardMetrics): string => {
  // Include selectedYear in hash to invalidate cache when year changes
  return JSON.stringify({
    annualGoal: Math.round(metrics.annualGoal),
    annualRealized: Math.round(metrics.annualRealized),
    currentMonthRevenue: Math.round(metrics.currentMonthRevenue),
    currentMonthGoal: Math.round(metrics.currentMonthGoal),
    selectedYear: metrics.selectedYear,
    currentMonthName: metrics.currentMonthName,
  });
};

const useAIInsights = (): UseAIInsightsReturn => {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs to prevent concurrent calls and implement debouncing
  const isRequestInFlightRef = useRef(false);
  const lastRequestHashRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchInsights = useCallback(async (metrics: DashboardMetrics) => {
    const metricsHash = hashMetrics(metrics);

    // Check cache first (synchronous, before any async work)
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const cached: CachedInsights = JSON.parse(cachedData);
        const isValid = Date.now() - cached.timestamp < CACHE_DURATION;
        const isSameData = cached.metricsHash === metricsHash;
        
        if (isValid && isSameData) {
          console.log('[useAIInsights] Using cached insights');
          setInsights(cached.insights);
          return;
        }
      }
    } catch (e) {
      console.warn('[useAIInsights] Cache read error:', e);
    }

    // Prevent duplicate concurrent requests for the same data
    if (isRequestInFlightRef.current && lastRequestHashRef.current === metricsHash) {
      console.log('[useAIInsights] Request already in flight, skipping duplicate');
      return;
    }

    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the request to prevent rapid successive calls
    return new Promise<void>((resolve) => {
      debounceTimerRef.current = setTimeout(async () => {
        // Double-check cache after debounce (another call might have populated it)
        try {
          const cachedData = localStorage.getItem(CACHE_KEY);
          if (cachedData) {
            const cached: CachedInsights = JSON.parse(cachedData);
            const isValid = Date.now() - cached.timestamp < CACHE_DURATION;
            const isSameData = cached.metricsHash === metricsHash;
            
            if (isValid && isSameData) {
              console.log('[useAIInsights] Using cached insights (after debounce)');
              setInsights(cached.insights);
              resolve();
              return;
            }
          }
        } catch (e) {
          // Ignore cache errors
        }

        // Check again if a request is in flight
        if (isRequestInFlightRef.current) {
          console.log('[useAIInsights] Request in flight after debounce, using fallback');
          setInsights(generateLocalFallback(metrics));
          resolve();
          return;
        }

        isRequestInFlightRef.current = true;
        lastRequestHashRef.current = metricsHash;
        setIsLoading(true);
        setError(null);

        try {
          const { data, error: funcError } = await supabase.functions.invoke('ai-insights', {
            body: { metrics },
          });

          // Handle rate limit (429) or payment required (402) errors gracefully
          // The edge function returns fallback data in these cases
          if (funcError) {
            // Try to parse the error response for fallback data
            try {
              const errorBody = JSON.parse(funcError.message?.replace(/^.*?{/, '{') || '{}');
              if (errorBody.fallback) {
                console.warn('[useAIInsights] API limit hit, using fallback:', errorBody.error);
                setInsights(errorBody.fallback);
                // Cache the fallback to prevent repeated calls
                const cacheData: CachedInsights = {
                  insights: errorBody.fallback,
                  timestamp: Date.now(),
                  metricsHash,
                };
                localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
                resolve();
                return;
              }
            } catch {
              // Not a parseable error, continue with normal error handling
            }
            throw new Error(funcError.message);
          }

          if (data?.error) {
            console.warn('[useAIInsights] API error, using fallback:', data.error);
            if (data.fallback) {
              setInsights(data.fallback);
              // Cache the fallback to prevent repeated calls
              try {
                const cacheData: CachedInsights = {
                  insights: data.fallback,
                  timestamp: Date.now(),
                  metricsHash,
                };
                localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
              } catch (e) {
                // Ignore cache errors
              }
              resolve();
              return;
            }
            throw new Error(data.error);
          }

          const newInsights = data.insights;
          setInsights(newInsights);

          // Cache the insights
          try {
            const cacheData: CachedInsights = {
              insights: newInsights,
              timestamp: Date.now(),
              metricsHash,
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
          } catch (e) {
            console.warn('[useAIInsights] Cache write error:', e);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to fetch insights';
          console.error('[useAIInsights] Error:', message);
          setError(message);
          
          // Generate fallback insights locally
          const fallback = generateLocalFallback(metrics);
          setInsights(fallback);
          
          // Cache the fallback to prevent repeated calls on error
          try {
            const cacheData: CachedInsights = {
              insights: fallback,
              timestamp: Date.now(),
              metricsHash,
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
          } catch (e) {
            // Ignore cache errors
          }
        } finally {
          isRequestInFlightRef.current = false;
          setIsLoading(false);
          resolve();
        }
      }, DEBOUNCE_DELAY);
    });
  }, []);

  return { insights, isLoading, error, fetchInsights };
};

function generateLocalFallback(metrics: DashboardMetrics): AIInsights {
  const monthProgressPercent = metrics.currentMonthGoal > 0 
    ? (metrics.currentMonthRevenue / metrics.currentMonthGoal) * 100 
    : 0;
  const salesNeeded = metrics.averageTicket > 0 
    ? Math.ceil(Math.max(0, metrics.gapToGoal) / metrics.averageTicket)
    : 0;
  const dailyTarget = metrics.daysRemaining > 0 
    ? Math.max(0, metrics.gapToGoal) / metrics.daysRemaining 
    : 0;

  let healthScore: number;
  let healthStatus: AIInsights['healthStatus'];
  let mainInsight: string;
  let actionItem: string;

  if (monthProgressPercent >= 100) {
    healthScore = 95;
    healthStatus = 'excellent';
    mainInsight = `🎉 Meta de ${metrics.currentMonthName} atingida! Continue acelerando.`;
    actionItem = 'Foque em upselling para superar expectativas.';
  } else if (monthProgressPercent >= 80) {
    healthScore = 80;
    healthStatus = 'good';
    mainInsight = `💪 Ótimo progresso! Faltam ${(100 - monthProgressPercent).toFixed(0)}% para a meta.`;
    actionItem = `${salesNeeded} vendas para bater a meta.`;
  } else if (monthProgressPercent >= 50) {
    healthScore = 60;
    healthStatus = 'warning';
    mainInsight = `⚡ Hora de acelerar em ${metrics.currentMonthName}!`;
    actionItem = `Meta diária: R$ ${dailyTarget.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
  } else {
    healthScore = 35;
    healthStatus = 'critical';
    mainInsight = `🚀 Momento de virada! Vamos recuperar o ritmo.`;
    actionItem = `Revise ${salesNeeded} propostas em aberto.`;
  }

  return { healthScore, healthStatus, mainInsight, actionItem, salesNeeded, dailyTarget: Math.round(dailyTarget) };
}

export default useAIInsights;
