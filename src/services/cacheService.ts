import { supabase } from '@/integrations/supabase/client';

// Cache entry interface
interface CacheEntry {
  id?: string;
  cache_key: string;
  operation_type: 'chat' | 'visa_recommendations' | 'dream_action_plan';
  input_hash: string;
  input_data: any;
  response_data: any;
  created_at: string;
  expires_at: string;
  hit_count: number;
  last_accessed: string;
}

// Cache configuration
interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxEntries: number;
  similarityThreshold: number; // 0-1, how similar inputs need to be to match
  enableLocalStorage: boolean;
  enableSupabase: boolean;
}

// Similarity calculation result
interface SimilarityResult {
  score: number;
  entry: CacheEntry;
}

class CacheService {
  private config: CacheConfig;
  private localCache: Map<string, CacheEntry> = new Map();

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      ttl: 24 * 60 * 60 * 1000, // 24 hours default
      maxEntries: 1000,
      similarityThreshold: 0.85,
      enableLocalStorage: true,
      enableSupabase: true,
      ...config
    };

    // Initialize local cache from localStorage if enabled
    if (this.config.enableLocalStorage) {
      this.loadFromLocalStorage();
    }
  }

  // Generate hash for input data
  private generateHash(data: any): string {
    const str = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Generate cache key
  private generateCacheKey(operationType: string, inputHash: string): string {
    return `${operationType}_${inputHash}`;
  }

  // Calculate similarity between two objects
  private calculateSimilarity(obj1: any, obj2: any): number {
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
      return obj1 === obj2 ? 1 : 0;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    const allKeys = new Set([...keys1, ...keys2]);

    let matches = 0;
    let total = 0;

    for (const key of allKeys) {
      total++;
      const val1 = obj1[key];
      const val2 = obj2[key];

      if (val1 === val2) {
        matches++;
      } else if (typeof val1 === 'string' && typeof val2 === 'string') {
        // Calculate string similarity using Levenshtein distance
        const similarity = this.stringSimilarity(val1, val2);
        matches += similarity;
      } else if (typeof val1 === 'object' && typeof val2 === 'object') {
        // Recursive similarity for nested objects
        const nestedSimilarity = this.calculateSimilarity(val1, val2);
        matches += nestedSimilarity;
      }
    }

    return total > 0 ? matches / total : 0;
  }

  // Calculate string similarity using Levenshtein distance
  private stringSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;

    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,     // deletion
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i - 1] + cost // substitution
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len2][len1]) / maxLen;
  }

  // Check if cache entry is expired
  private isExpired(entry: CacheEntry): boolean {
    return new Date(entry.expires_at) < new Date();
  }

  // Load cache from localStorage
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('openai_cache');
      if (stored) {
        const entries: CacheEntry[] = JSON.parse(stored);
        entries.forEach(entry => {
          if (!this.isExpired(entry)) {
            this.localCache.set(entry.cache_key, entry);
          }
        });
      }
    } catch (error) {
      console.error('Error loading cache from localStorage:', error);
    }
  }

  // Save cache to localStorage
  private saveToLocalStorage(): void {
    if (!this.config.enableLocalStorage) return;

    try {
      const entries = Array.from(this.localCache.values())
        .filter(entry => !this.isExpired(entry))
        .slice(-this.config.maxEntries); // Keep only recent entries

      localStorage.setItem('openai_cache', JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving cache to localStorage:', error);
    }
  }

  // Find similar cache entries
  private findSimilarEntries(
    operationType: CacheEntry['operation_type'],
    inputData: any
  ): SimilarityResult[] {
    const results: SimilarityResult[] = [];

    // Check local cache
    for (const entry of this.localCache.values()) {
      if (entry.operation_type === operationType && !this.isExpired(entry)) {
        const similarity = this.calculateSimilarity(inputData, entry.input_data);
        if (similarity >= this.config.similarityThreshold) {
          results.push({ score: similarity, entry });
        }
      }
    }

    // Sort by similarity score (highest first)
    return results.sort((a, b) => b.score - a.score);
  }

  // Get cached response
  async get(
    operationType: CacheEntry['operation_type'],
    inputData: any
  ): Promise<any | null> {
    const inputHash = this.generateHash(inputData);
    const cacheKey = this.generateCacheKey(operationType, inputHash);

    // Try exact match first
    let entry = this.localCache.get(cacheKey);
    
    if (entry && !this.isExpired(entry)) {
      // Update hit count and last accessed
      entry.hit_count++;
      entry.last_accessed = new Date().toISOString();
      
      // Update in Supabase if enabled
      if (this.config.enableSupabase && entry.id) {
        await this.updateCacheEntry(entry);
      }

      console.log(`[Cache] Exact match found for ${operationType}:`, {
        cacheKey,
        hitCount: entry.hit_count,
        similarity: 1.0
      });

      return entry.response_data;
    }

    // Try similarity-based matching
    const similarEntries = this.findSimilarEntries(operationType, inputData);
    
    if (similarEntries.length > 0) {
      const bestMatch = similarEntries[0];
      
      // Update hit count and last accessed
      bestMatch.entry.hit_count++;
      bestMatch.entry.last_accessed = new Date().toISOString();
      
      // Update in Supabase if enabled
      if (this.config.enableSupabase && bestMatch.entry.id) {
        await this.updateCacheEntry(bestMatch.entry);
      }

      console.log(`[Cache] Similar match found for ${operationType}:`, {
        similarity: bestMatch.score,
        hitCount: bestMatch.entry.hit_count,
        threshold: this.config.similarityThreshold
      });

      return bestMatch.entry.response_data;
    }

    // Try Supabase cache if local cache miss
    if (this.config.enableSupabase) {
      try {
        const { data, error } = await supabase
          .from('openai_cache')
          .select('*')
          .eq('operation_type', operationType)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data) {
          // Check for similar entries in Supabase
          for (const dbEntry of data) {
            const similarity = this.calculateSimilarity(inputData, dbEntry.input_data);
            if (similarity >= this.config.similarityThreshold) {
              // Add to local cache
              this.localCache.set(dbEntry.cache_key, dbEntry);
              
              // Update hit count
              dbEntry.hit_count++;
              dbEntry.last_accessed = new Date().toISOString();
              await this.updateCacheEntry(dbEntry);

              console.log(`[Cache] Supabase match found for ${operationType}:`, {
                similarity,
                hitCount: dbEntry.hit_count
              });

              return dbEntry.response_data;
            }
          }
        }
      } catch (error) {
        console.error('Error querying Supabase cache:', error);
      }
    }

    return null;
  }

  // Set cached response
  async set(
    operationType: CacheEntry['operation_type'],
    inputData: any,
    responseData: any
  ): Promise<void> {
    const inputHash = this.generateHash(inputData);
    const cacheKey = this.generateCacheKey(operationType, inputHash);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.ttl);

    const entry: CacheEntry = {
      cache_key: cacheKey,
      operation_type: operationType,
      input_hash: inputHash,
      input_data: inputData,
      response_data: responseData,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      hit_count: 0,
      last_accessed: now.toISOString()
    };

    // Add to local cache
    this.localCache.set(cacheKey, entry);

    // Clean up local cache if it gets too large
    if (this.localCache.size > this.config.maxEntries) {
      const entries = Array.from(this.localCache.entries());
      // Sort by last accessed (oldest first)
      entries.sort((a, b) => 
        new Date(a[1].last_accessed).getTime() - new Date(b[1].last_accessed).getTime()
      );
      
      // Remove oldest entries
      const toRemove = entries.slice(0, entries.length - this.config.maxEntries + 100);
      toRemove.forEach(([key]) => this.localCache.delete(key));
    }

    // Save to localStorage
    this.saveToLocalStorage();

    // Save to Supabase if enabled
    if (this.config.enableSupabase) {
      try {
        const { data, error } = await supabase
          .from('openai_cache')
          .insert([entry])
          .select()
          .single();

        if (!error && data) {
          entry.id = data.id;
          this.localCache.set(cacheKey, entry);
        }
      } catch (error) {
        console.error('Error saving to Supabase cache:', error);
      }
    }

    console.log(`[Cache] Stored new entry for ${operationType}:`, {
      cacheKey,
      expiresAt: entry.expires_at
    });
  }

  // Update cache entry hit count and last accessed
  private async updateCacheEntry(entry: CacheEntry): Promise<void> {
    if (!this.config.enableSupabase || !entry.id) return;

    try {
      await supabase
        .from('openai_cache')
        .update({
          hit_count: entry.hit_count,
          last_accessed: entry.last_accessed
        })
        .eq('id', entry.id);
    } catch (error) {
      console.error('Error updating cache entry:', error);
    }
  }

  // Clear expired entries
  async clearExpired(): Promise<void> {
    const now = new Date();

    // Clear from local cache
    for (const [key, entry] of this.localCache.entries()) {
      if (this.isExpired(entry)) {
        this.localCache.delete(key);
      }
    }

    // Save updated local cache
    this.saveToLocalStorage();

    // Clear from Supabase
    if (this.config.enableSupabase) {
      try {
        await supabase
          .from('openai_cache')
          .delete()
          .lt('expires_at', now.toISOString());
      } catch (error) {
        console.error('Error clearing expired entries from Supabase:', error);
      }
    }
  }

  // Get cache statistics
  getStats() {
    const entries = Array.from(this.localCache.values());
    const now = new Date();
    
    const validEntries = entries.filter(entry => !this.isExpired(entry));
    const expiredEntries = entries.length - validEntries.length;
    
    const totalHits = validEntries.reduce((sum, entry) => sum + entry.hit_count, 0);
    const avgHits = validEntries.length > 0 ? totalHits / validEntries.length : 0;
    
    const operationStats = validEntries.reduce((stats, entry) => {
      stats[entry.operation_type] = (stats[entry.operation_type] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);

    return {
      totalEntries: validEntries.length,
      expiredEntries,
      totalHits,
      averageHits: Math.round(avgHits * 100) / 100,
      operationStats,
      cacheSize: this.localCache.size,
      config: this.config
    };
  }

  // Clear all cache
  async clearAll(): Promise<void> {
    this.localCache.clear();
    
    if (this.config.enableLocalStorage) {
      localStorage.removeItem('openai_cache');
    }

    if (this.config.enableSupabase) {
      try {
        await supabase.from('openai_cache').delete().neq('id', '');
      } catch (error) {
        console.error('Error clearing Supabase cache:', error);
      }
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Create singleton instance
export const cacheService = new CacheService();

export default cacheService;
