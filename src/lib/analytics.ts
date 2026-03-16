import { supabase } from './supabase';
import { startOfDay, startOfWeek, startOfMonth, startOfQuarter, startOfYear, subDays, subWeeks, subMonths, subQuarters, subYears } from 'date-fns';

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface DailyStats {
  date: string;
  count: number;
  station_id: string;
  station_name: string;
}

export interface DisabilityStats {
  type: string;
  count: number;
  percentage: number;
}

export interface LocationStats {
  neighborhood: string;
  locality: string;
  count: number;
  critical: number;
  moderate: number;
  stable: number;
}

export interface MonthlySummary {
  month: string;
  year: number;
  total_records: number;
  by_station: Record<string, number>;
  by_disability: Record<string, number>;
  by_situation: Record<string, number>;
  by_location: LocationStats[];
}

export interface QuarterlyImpact {
  quarter: number;
  year: number;
  total_records: number;
  avg_daily: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  vulnerability_change: number;
  top_neighborhoods: LocationStats[];
}

/**
 * Get daily statistics for all stations
 */
export async function getDailyStats(date: Date = new Date()): Promise<DailyStats[]> {
  const start = startOfDay(date);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('social_records')
    .select(`
      id,
      station_id,
      stations!inner (
        name
      )
    `)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  if (error) {
    console.error('Error fetching daily stats:', error);
    return [];
  }

  // Group by station
  const stationMap = new Map<string, number>();
  
  data?.forEach((record: any) => {
    const stationId = record.station_id;
    const stationName = record.stations?.name || 'Unknown';
    const key = `${stationId}|${stationName}`;
    stationMap.set(key, (stationMap.get(key) || 0) + 1);
  });

  return Array.from(stationMap.entries()).map(([key, count]) => {
    const [station_id, station_name] = key.split('|');
    return {
      date: start.toISOString().split('T')[0],
      count,
      station_id,
      station_name,
    };
  });
}

/**
 * Get weekly/monthly disability distribution
 */
export async function getDisabilityDistribution(
  weeks: number = 4
): Promise<DisabilityStats[]> {
  const start = startOfWeek(subWeeks(new Date(), weeks));
  const end = new Date();

  const { data, error } = await supabase
    .from('social_records')
    .select('disability_type')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .not('disability_type', 'is', null);

  if (error) {
    console.error('Error fetching disability stats:', error);
    return [];
  }

  const total = data?.length || 0;
  const typeMap = new Map<string, number>();

  data?.forEach(record => {
    const type = record.disability_type || 'Not specified';
    typeMap.set(type, (typeMap.get(type) || 0) + 1);
  });

  return Array.from(typeMap.entries()).map(([type, count]) => ({
    type,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  })).sort((a, b) => b.count - a.count);
}

/**
 * Get location-based statistics
 */
export async function getLocationStats(
  months: number = 1
): Promise<LocationStats[]> {
  const start = startOfMonth(subMonths(new Date(), months - 1));
  const end = new Date();

  const { data, error } = await supabase
    .from('social_records')
    .select('neighborhood, locality, situation')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  if (error) {
    console.error('Error fetching location stats:', error);
    return [];
  }

  const locationMap = new Map<string, {
    neighborhood: string;
    locality: string;
    count: number;
    critical: number;
    moderate: number;
    stable: number;
  }>();

  data?.forEach(record => {
    const key = `${record.neighborhood}|${record.locality}`;
    const existing = locationMap.get(key) || {
      neighborhood: record.neighborhood,
      locality: record.locality,
      count: 0,
      critical: 0,
      moderate: 0,
      stable: 0,
    };

    existing.count++;
    if (record.situation === 'Crítica') existing.critical++;
    else if (record.situation === 'Moderada') existing.moderate++;
    else if (record.situation === 'Estável') existing.stable++;

    locationMap.set(key, existing);
  });

  return Array.from(locationMap.values())
    .sort((a, b) => b.count - a.count);
}

/**
 * Generate monthly summary report
 */
export async function generateMonthlySummary(
  year: number,
  month: number
): Promise<MonthlySummary | null> {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const { data, error } = await supabase
    .from('social_records')
    .select(`
      id,
      station_id,
      stations!inner (
        name
      ),
      disability_type,
      situation,
      neighborhood,
      locality
    `)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  if (error) {
    console.error('Error generating monthly summary:', error);
    return null;
  }

  const total = data?.length || 0;
  const byStation: Record<string, number> = {};
  const byDisability: Record<string, number> = {};
  const bySituation: Record<string, number> = {};
  const locationMap = new Map<string, LocationStats>();

  data?.forEach((record: any) => {
    // By station
    const stationName = record.stations?.name || 'Unknown';
    byStation[stationName] = (byStation[stationName] || 0) + 1;

    // By disability
    const disability = record.disability_type || 'Nenhuma';
    byDisability[disability] = (byDisability[disability] || 0) + 1;

    // By situation
    bySituation[record.situation] = (bySituation[record.situation] || 0) + 1;

    // By location
    const locKey = `${record.neighborhood}|${record.locality}`;
    const existing = locationMap.get(locKey) || {
      neighborhood: record.neighborhood,
      locality: record.locality,
      count: 0,
      critical: 0,
      moderate: 0,
      stable: 0,
    };
    existing.count++;
    if (record.situation === 'Crítica') existing.critical++;
    else if (record.situation === 'Moderada') existing.moderate++;
    else if (record.situation === 'Estável') existing.stable++;
    locationMap.set(locKey, existing);
  });

  return {
    month: new Date(year, month - 1).toLocaleString('pt-BR', { month: 'long' }),
    year,
    total_records: total,
    by_station: byStation,
    by_disability: byDisability,
    by_situation: bySituation,
    by_location: Array.from(locationMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  };
}

/**
 * Generate quarterly impact report
 */
export async function generateQuarterlyImpact(
  quarter: number,
  year: number
): Promise<QuarterlyImpact | null> {
  const quarterStart = startOfQuarter(new Date(year, (quarter - 1) * 3, 1));
  const quarterEnd = new Date(quarterStart);
  quarterEnd.setMonth(quarterEnd.getMonth() + 3);
  quarterEnd.setDate(0);
  quarterEnd.setHours(23, 59, 59);

  const prevQuarterStart = startOfQuarter(subQuarters(quarterStart, 1));
  const prevQuarterEnd = new Date(quarterStart);
  prevQuarterEnd.setDate(prevQuarterEnd.getDate() - 1);

  // Current quarter data
  const { data: currentData, error: currentError } = await supabase
    .from('social_records')
    .select('id, created_at, situation, neighborhood, locality')
    .gte('created_at', quarterStart.toISOString())
    .lte('created_at', quarterEnd.toISOString());

  // Previous quarter data for trend
  const { data: prevData, error: prevError } = await supabase
    .from('social_records')
    .select('id, situation')
    .gte('created_at', prevQuarterStart.toISOString())
    .lte('created_at', prevQuarterEnd.toISOString());

  if (currentError || prevError) {
    console.error('Error generating quarterly impact:', currentError || prevError);
    return null;
  }

  const currentTotal = currentData?.length || 0;
  const prevTotal = prevData?.length || 0;

  // Calculate trend
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  const changePercent = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;
  if (changePercent > 5) trend = 'increasing';
  else if (changePercent < -5) trend = 'decreasing';

  // Calculate vulnerability change (critical situations)
  const currentCritical = currentData?.filter(r => r.situation === 'Crítica').length || 0;
  const prevCritical = prevData?.filter(r => r.situation === 'Crítica').length || 0;
  const vulnerabilityChange = prevTotal > 0 
    ? ((currentCritical - prevCritical) / prevTotal) * 100 
    : 0;

  // Average daily records
  const daysInQuarter = Math.floor((quarterEnd.getTime() - quarterStart.getTime()) / (1000 * 60 * 60 * 24));
  const avgDaily = Math.round(currentTotal / daysInQuarter);

  // Top neighborhoods
  const locationMap = new Map<string, LocationStats>();
  currentData?.forEach(record => {
    const key = `${record.neighborhood}|${record.locality}`;
    const existing = locationMap.get(key) || {
      neighborhood: record.neighborhood,
      locality: record.locality,
      count: 0,
      critical: 0,
      moderate: 0,
      stable: 0,
    };
    existing.count++;
    if (record.situation === 'Crítica') existing.critical++;
    else if (record.situation === 'Moderada') existing.moderate++;
    else if (record.situation === 'Estável') existing.stable++;
    locationMap.set(key, existing);
  });

  return {
    quarter,
    year,
    total_records: currentTotal,
    avg_daily: avgDaily,
    trend,
    vulnerability_change: Math.round(vulnerabilityChange * 10) / 10,
    top_neighborhoods: Array.from(locationMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  };
}

/**
 * Get annual summary
 */
export async function getAnnualSummary(year: number) {
  const summaries = [];
  
  for (let month = 1; month <= 12; month++) {
    const summary = await generateMonthlySummary(year, month);
    if (summary) {
      summaries.push(summary);
    }
  }

  return summaries;
}

/**
 * Get dashboard stats for a provider
 */
export async function getProviderDashboardStats(providerId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const { data, error } = await supabase
    .from('social_records')
    .select('id, created_at, has_disability, employment_status, situation')
    .eq('provider_id', providerId);

  if (error) {
    console.error('Error fetching provider stats:', error);
    return null;
  }

  const today = data?.filter(r => new Date(r.created_at) >= todayStart).length || 0;
  const thisWeek = data?.filter(r => new Date(r.created_at) >= weekStart).length || 0;
  const thisMonth = data?.filter(r => new Date(r.created_at) >= monthStart).length || 0;
  const total = data?.length || 0;
  const disability = data?.filter(r => r.has_disability).length || 0;
  const unemployed = data?.filter(r => r.employment_status === 'Desempregado').length || 0;
  const critical = data?.filter(r => r.situation === 'Crítica').length || 0;

  return {
    total,
    disability,
    unemployed,
    critical,
    today,
    thisWeek,
    thisMonth,
  };
}

/**
 * Get dashboard stats for admin (global)
 */
export async function getAdminDashboardStats() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const { data, error } = await supabase
    .from('social_records')
    .select('id, created_at, has_disability, employment_status, situation');

  if (error) {
    console.error('Error fetching admin stats:', error);
    return null;
  }

  const today = data?.filter(r => new Date(r.created_at) >= todayStart).length || 0;
  const thisWeek = data?.filter(r => new Date(r.created_at) >= weekStart).length || 0;
  const thisMonth = data?.filter(r => new Date(r.created_at) >= monthStart).length || 0;
  const total = data?.length || 0;
  const disability = data?.filter(r => r.has_disability).length || 0;
  const unemployed = data?.filter(r => r.employment_status === 'Desempregado').length || 0;
  const critical = data?.filter(r => r.situation === 'Crítica').length || 0;

  return {
    total,
    disability,
    unemployed,
    critical,
    today,
    thisWeek,
    thisMonth,
  };
}
