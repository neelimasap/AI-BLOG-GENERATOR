describe('SEO Check logic', () => {
  const analyzeSEO = (content: string, title: string, description: string, keywords: string[]) => {
    // Basic SEO analysis
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

    // Readability score (simplified - count sentences and complex words)
    const sentences = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / sentences;
    const readabilityScore = Math.max(0, Math.min(100, 100 - (avgWordsPerSentence - 15) * 2));

    // Keyword density
    const keywordDensity: Record<string, number> = {};
    const words = content.toLowerCase().split(/\s+/);
    keywords.forEach(keyword => {
      const count = words.filter(word => word.includes(keyword.toLowerCase())).length;
      keywordDensity[keyword] = (count / wordCount) * 100;
    });

    // Title analysis
    const titleLength = title.length;
    const titleScore = titleLength >= 30 && titleLength <= 60 ? 100 :
                      titleLength < 30 ? 60 : 40;

    // Description analysis
    const descLength = description.length;
    const descScore = descLength >= 120 && descLength <= 155 ? 100 :
                     descLength < 120 ? 70 : 50;

    // Overall SEO score
    const overallScore = Math.round(
      (readabilityScore * 0.3) +
      (titleScore * 0.25) +
      (descScore * 0.25) +
      (Math.min(100, Object.values(keywordDensity).reduce((a, b) => a + b, 0) * 10) * 0.2)
    );

    return {
      overall_score: overallScore,
      readability: {
        score: Math.round(readabilityScore),
        word_count: wordCount,
        reading_time_minutes: readingTime,
        avg_words_per_sentence: Math.round(avgWordsPerSentence * 10) / 10,
      },
      title: {
        score: titleScore,
        length: titleLength,
        recommendation: titleLength < 30 ? 'Title too short (< 30 chars)' :
                       titleLength > 60 ? 'Title too long (> 60 chars)' : 'Good length',
      },
      description: {
        score: descScore,
        length: descLength,
        recommendation: descLength < 120 ? 'Description too short (< 120 chars)' :
                         descLength > 155 ? 'Description too long (> 155 chars)' : 'Good length',
      },
      keywords: {
        density: keywordDensity,
        recommendations: Object.entries(keywordDensity)
          .filter(([, density]) => density > 3)
          .map(([keyword]) => `${keyword}: density too high (>3%)`)
          .concat(
            Object.entries(keywordDensity)
              .filter(([, density]) => density < 0.5)
              .map(([keyword]) => `${keyword}: density too low (<0.5%)`)
          ),
      },
    };
  };

  describe('SEO analysis', () => {
    it('should return comprehensive SEO analysis', () => {
      const result = analyzeSEO(
        'This is a test blog post with some content. It has multiple sentences and should be analyzed for readability.',
        'Test Blog Post Title',
        'This is a test description for the blog post that should be around 150 characters.',
        ['test', 'blog', 'content']
      );

      expect(result).toHaveProperty('overall_score');
      expect(result).toHaveProperty('readability');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('keywords');

      expect(result.readability).toHaveProperty('score');
      expect(result.readability).toHaveProperty('word_count');
      expect(result.readability).toHaveProperty('reading_time_minutes');
      expect(result.title).toHaveProperty('score');
      expect(result.title).toHaveProperty('length');
      expect(result.description).toHaveProperty('score');
      expect(result.description).toHaveProperty('length');
      expect(result.keywords).toHaveProperty('density');
    });

    it('should calculate readability score correctly', () => {
      const result = analyzeSEO(
        'Short sentence. Another short sentence. This is a longer sentence with more words in it.',
        'Good Title Length',
        'This is a good description length that should score well in the analysis.',
        ['keyword']
      );

      expect(result.readability.avg_words_per_sentence).toBeGreaterThan(0);
      expect(result.readability.score).toBeGreaterThanOrEqual(0);
      expect(result.readability.score).toBeLessThanOrEqual(100);
    });

    it('should evaluate title length correctly', () => {
      const result = analyzeSEO(
        'Test content',
        'This is a very long title that exceeds the recommended sixty character limit for SEO purposes',
        'Test description',
        ['test']
      );

      expect(result.title.length).toBeGreaterThan(60);
      expect(result.title.score).toBeLessThan(100);
      expect(result.title.recommendation).toContain('too long');
    });

    it('should evaluate description length correctly', () => {
      const result = analyzeSEO(
        'Test content',
        'Test Title',
        'Short desc',
        ['test']
      );

      expect(result.description.length).toBeLessThan(120);
      expect(result.description.score).toBeLessThan(100);
      expect(result.description.recommendation).toContain('too short');
    });

    it('should calculate keyword density', () => {
      const content = 'test keyword test keyword test keyword other words here';
      const result = analyzeSEO(
        content,
        'Test Title',
        'Test description',
        ['test', 'keyword']
      );

      expect(result.keywords.density.test).toBeDefined();
      expect(result.keywords.density.keyword).toBeDefined();
      expect(result.keywords.density.test).toBeGreaterThan(0);
    });
  });
});