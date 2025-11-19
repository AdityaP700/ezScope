import axios from 'axios';

export async function fetchWikipediaContent(topic: string): Promise<string> {
  try {
    // Search for the page first
    const searchRes = await axios.get('https://en.wikipedia.org/w/api.php', {
      params: {
        action: 'query',
        list: 'search',
        srsearch: topic,
        format: 'json',
        origin: '*'
      }
    });

    if (!searchRes.data.query.search.length) {
      return `No Wikipedia article found for ${topic}`;
    }

    const title = searchRes.data.query.search[0].title;

    // Get page content
    const contentRes = await axios.get('https://en.wikipedia.org/w/api.php', {
      params: {
        action: 'query',
        prop: 'extracts',
        exintro: true,
        explaintext: true,
        titles: title,
        format: 'json',
        origin: '*'
      }
    });

    const pages = contentRes.data.query.pages;
    const pageId = Object.keys(pages)[0];
    return pages[pageId].extract || 'No content available.';
  } catch (error) {
    console.error('Error fetching Wikipedia content:', error);
    return `Failed to fetch content for ${topic}`;
  }
}

export async function fetchGrokipediaContent(topic: string): Promise<string> {
  // In a real scenario, this would scrape Grok or call an API.
  // For now, we'll simulate it with a slightly different version of the Wikipedia content 
  // or a "Grok-like" response using LLM if possible, but for now a placeholder is safer 
  // than a broken scraper.

  return `[Grokipedia Entry for ${topic}]
    
    ${topic} is a subject of significant interest. 
    (Simulated content: In a real implementation, this would be scraped from xAI's Grok or similar sources.)
    
    Some perspectives suggest that mainstream narratives on ${topic} might be incomplete.
    `;
}
