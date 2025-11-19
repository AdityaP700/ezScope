
export interface Claim {
  subject: string;
  predicate: string;
  object: string;
  rawText: string;
  confidence?: number;
}

export function createWikipediaAssetJsonLd(topic: string, claims: Claim[], url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": topic,
    "author": {
      "@type": "Organization",
      "name": "Wikipedia"
    },
    "url": url,
    "mentions": claims.map((c, i) => ({
      "@type": "Statement",
      "@id": `claim:${i}`,
      "text": c.rawText,
      "mainEntity": {
        "@type": "Thing",
        "name": c.subject,
        "description": `${c.predicate} ${c.object}`
      }
    })),
    "datePublished": new Date().toISOString(),
    "publisher": "TruthScope"
  };
}

export function createGrokipediaAssetJsonLd(topic: string, claims: Claim[], url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": topic,
    "author": {
      "@type": "Organization",
      "name": "Grokipedia"
    },
    "url": url,
    "mentions": claims.map((c, i) => ({
      "@type": "Statement",
      "@id": `claim:${i}`,
      "text": c.rawText,
      "mainEntity": {
        "@type": "Thing",
        "name": c.subject,
        "description": `${c.predicate} ${c.object}`
      }
    })),
    "datePublished": new Date().toISOString(),
    "publisher": "TruthScope"
  };
}

export function createCommunityNoteAssetJsonLd(
  topic: string,
  finding: string,
  summary: string,
  evidenceUals: string[],
  confidence: number,
  stakedValue: string
) {
  return {
    "@context": ["https://schema.org", { "dkg": "http://dkg.origintrail.io/ontology#" }],
    "@type": "dkg:AnalysisNote",
    "name": `TruthScope Analysis: ${topic}`,
    "description": summary,
    "dkg:finding": finding,
    "dkg:confidence": confidence,
    "dkg:stakedValue": stakedValue,
    "dkg:evidence": evidenceUals.map(ual => ({ "@id": ual })),
    "dateCreated": new Date().toISOString(),
    "author": {
      "@type": "Organization",
      "name": "TruthScope Agent"
    }
  };
}

export function createTrustMetadataAssetJsonLd(
  targetUal: string,
  validator: string,
  action: 'stake' | 'vote',
  amount?: string,
  score?: number
) {
  return {
    "@context": ["https://schema.org", { "dkg": "http://dkg.origintrail.io/ontology#" }],
    "@type": "dkg:TrustEvent",
    "dkg:target": { "@id": targetUal },
    "agent": {
      "@type": "Person",
      "name": validator
    },
    "action": action,
    "dkg:amount": amount,
    "dkg:reputationScore": score,
    "dateCreated": new Date().toISOString()
  };
}
