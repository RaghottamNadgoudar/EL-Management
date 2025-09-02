interface PlagiarismResult {
  source: string;
  url: string;
  similarity: number;
  title: string;
  snippet: string;
}

export class PlagiarismChecker {
  private googleApiKey: string;
  private googleSearchEngineId: string;
  private youtubeApiKey: string;

  constructor() {
    this.googleApiKey = process.env.GOOGLE_SEARCH_API_KEY || '';
    this.googleSearchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || '';
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY || '';
  }

  async checkGoogleSearch(text: string): Promise<PlagiarismResult[]> {
    if (!this.googleApiKey || !this.googleSearchEngineId) {
      console.warn('Google Search API not configured');
      return [];
    }

    try {
      const query = encodeURIComponent(text.substring(0, 200)); // Limit query length
      const url = `https://www.googleapis.com/customsearch/v1?key=${this.googleApiKey}&cx=${this.googleSearchEngineId}&q="${query}"`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (!data.items) return [];

      return data.items.slice(0, 5).map((item: any) => ({
        source: 'google',
        url: item.link,
        similarity: this.calculateSimilarity(text, item.snippet || ''),
        title: item.title,
        snippet: item.snippet || ''
      }));
    } catch (error) {
      console.error('Google search error:', error);
      return [];
    }
  }

  async checkYoutube(text: string): Promise<PlagiarismResult[]> {
    if (!this.youtubeApiKey) {
      console.warn('YouTube API not configured');
      return [];
    }

    try {
      const query = encodeURIComponent(text.substring(0, 100));
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q="${query}"&key=${this.youtubeApiKey}&maxResults=10`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (!data.items) return [];

      return data.items.map((item: any) => ({
        source: 'youtube',
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        similarity: this.calculateSimilarity(text, item.snippet.description || ''),
        title: item.snippet.title,
        snippet: item.snippet.description || ''
      }));
    } catch (error) {
      console.error('YouTube search error:', error);
      return [];
    }
  }

  async checkInternal(text: string, excludeSubmissionId: string): Promise<PlagiarismResult[]> {
    // Check against other submissions in the database
    try {
      const { query } = await import('../database/connection');
      
      const result = await query(`
        SELECT ps.id, pr.project_title, ps.submission_data
        FROM project_submissions ps
        JOIN project_registrations pr ON ps.registration_id = pr.id
        WHERE ps.id != $1
        AND ps.status = 'approved'
      `, [excludeSubmissionId]);

      const matches: PlagiarismResult[] = [];

      for (const row of result.rows) {
        const submissionText = JSON.stringify(row.submission_data);
        const similarity = this.calculateSimilarity(text, submissionText);
        
        if (similarity > 20) { // Only include significant matches
          matches.push({
            source: 'internal',
            url: `/admin/submissions/${row.id}`,
            similarity,
            title: row.project_title,
            snippet: submissionText.substring(0, 200)
          });
        }
      }

      return matches;
    } catch (error) {
      console.error('Internal plagiarism check error:', error);
      return [];
    }
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple similarity calculation using Jaccard similarity
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size === 0 ? 0 : (intersection.size / union.size) * 100;
  }

  async performFullCheck(text: string, submissionId: string): Promise<{
    overallSimilarity: number;
    results: PlagiarismResult[];
    passed: boolean;
  }> {
    const results: PlagiarismResult[] = [];
    
    // Run all checks in parallel
    const [googleResults, youtubeResults, internalResults] = await Promise.all([
      this.checkGoogleSearch(text),
      this.checkYoutube(text),
      this.checkInternal(text, submissionId)
    ]);

    results.push(...googleResults, ...youtubeResults, ...internalResults);
    
    // Calculate overall similarity (highest match)
    const overallSimilarity = results.length > 0 
      ? Math.max(...results.map(r => r.similarity))
      : 0;

    // Check against threshold (from config)
    const threshold = 25; // This should come from appConfig
    const passed = overallSimilarity < threshold;

    return {
      overallSimilarity,
      results: results.sort((a, b) => b.similarity - a.similarity),
      passed
    };
  }
}