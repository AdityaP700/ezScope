**📘 TruthScope – Product Requirements Document (PRD)**
=======================================================

### _**AI vs Human Knowledge Verifier for Decentralized Trust Alignment**_

**Challenge:** Grokipedia vs Wikipedia Content Comparison (Challenge 1)

**🧠 1. Executive Summary**
===========================

**TruthScope** is a decentralized, AI-powered truth verification system that compares **AI-generated content (Grokipedia)**with **human-curated content (Wikipedia)** and records discrepancies as **verifiable Community Notes** on the **OriginTrail Decentralized Knowledge Graph (DKG)**.

It is built on the updated **OriginTrail DKG (Nov 5)** and uses the **DKG Edge Node**, the **MCP agent layer**, and a **token-based trust and reputation layer** with optional **x402 micropayments** for trusted insights.

TruthScope transforms free-form encyclopedia entries into **structured RDF/JSON-LD Knowledge Assets**, detects hallucinations, biases, or contradictions, and stores the derived truth-alignment evidence immutably within the DKG.

**🎯 2. Problem, Opportunity & Vision**
=======================================

### **🔥 The Problem**

AI-generated encyclopedias like **Grokipedia** are powerful but opaque:

*   They may hallucinate facts
    
*   They may show ideological bias
    
*   Sources are inconsistent or missing
    
*   Their correctness cannot be independently verified
    
*   There is no accountability or provenance
    

Wikipedia, on the other hand, is human-curated but still fallible and inconsistent across revisions.

### **💡 Opportunity**

Using **OriginTrail DKG + AI + tokenomics**, we can:

*   Create a **neutral, decentralized trust layer** between competing knowledge bases
    
*   Make discrepancies machine-readable
    
*   Provide verifiable provenance for claims
    
*   Reward fact-verification
    
*   Expose high-confidence truth reports to both humans & AI agents
    

### **🚀 Vision**

A world where **AI agents query truth like a protocol**, not an opinion.

TruthScope becomes the **canonical truth-alignment layer** between AI-generated content and the real world.

**📐 3. Product Goals**
=======================

1.  **Automatically compare Grokipedia and Wikipedia content** for a fixed set of topics (via DKG Knowledge Assets or public APIs).
    
2.  Convert both pages into **structured RDF triples** stored as Knowledge Assets.
    
3.  Perform **semantic diffing** to detect hallucinations, bias, missing context, or contradictions.
    
4.  Generate **Community Note Knowledge Assets** for each discrepancy.
    
5.  Add a **token-backed confidence and staking model**.
    
6.  Offer **premium insights via x402 micropayments**.
    
7.  Provide an **MCP-driven TruthScope Agent** that uses the DKG for contextual truth when answering questions.
    
8.  Provide a **readable frontend** for browsing discrepancies.
    

**🧩 4. High-Level Architecture (Aligned with Agent–Knowledge–Trust Layers)**
=============================================================================

              ┌────────────────────────────────────────┐

               │           USER / AI AGENTS             │

               │  (Queries, UI, API consumers, MCP)     │

               └────────────────────────────────────────┘

                               │

                               ▼

            ┌──────────────────────────────────────────────┐

            │               AGENT LAYER                     │

            │        TruthScope MCP Agent                   │

            │ - Fetch Grokipedia/Wikipedia content          │

            │ - Extract claims (LLM + symbolic reasoning)   │

            │ - Generate RDF triples                        │

            │ - Semantic diffing                            │

            │ - Create/Query Community Notes                │

            └──────────────────────────────────────────────┘

                               │

                               ▼

         ┌──────────────────────────────────────────────────────────┐

         │                       KNOWLEDGE LAYER                    │

         │                 OriginTrail DKG (Nov 5)                   │

         │    KA1: Wikipedia triples                                 │

         │    KA2: Grokipedia triples                                │

         │    KA3: Community Notes                                   │

         │    KA4: Provenance & staking metadata                     │

         │    (stored in JSON-LD & verifiable with Graph signatures) │

         └──────────────────────────────────────────────────────────┘

                               │

                               ▼

        ┌──────────────────────────────────────────────────────────────┐

        │                       TRUST LAYER                            │

        │    - Token stakes (TRAC / NEURO) on claims                   │

        │    - Note reputation scoring                                 │

        │    - x402 micropayments for premium reports                  │

        │    - Tamper-proof provenance via NeuroWeb parachain          │

        └──────────────────────────────────────────────────────────────┘

**🔧 5. Technical Components**
==============================

**5.1 Agent Layer – “TruthScope Agent”**
----------------------------------------

**Built using:**

*   DKG Edge Node's MCP toolkit
    
*   LLM backend (OpenAI / Anthropic / Grok / local)
    
*   Python/Node.js orchestrator
    

### **Responsibilities:**

1.  **Fetch Content**
    
    *   Wikipedia REST API
        
    *   Grokipedia scraped HTML / Umanitek Knowledge Asset
        
    *   Cache the results as KA topics
        
2.  **Claim Extraction**
    
    *   Convert paragraphs to atomic factual claims
        
    *   Use LLM assisted extraction → symbolic parse → triple generation
        

Each claim becomes:   1.  **Semantic Diffing**
    
    *   Align claims between Wikipedia and Grokipedia
        
    *   Detect mismatches:
        
        *   Missing context
            
        *   Contradiction
            
        *   Bias framing
            
        *   Unsupported claims (hallucination)
            
        *   Citation absence
            
2.  **Community Note Generator**
    
    *   Summarizes discrepancy
        
    *   Creates JSON-LD note asset
        
    *   Publishes to DKG via Edge Node
        
3.  **Truth-Aware Q&A**
    
    *   When a user queries the TruthScope Agent:
        
        *   It first checks DKG notes related to topic
            
        *   Applies corrections before responding
            

This demonstrates **agentic reasoning + decentralized memory**.

**5.2 Knowledge Layer – OriginTrail DKG (Nov 5)**
-------------------------------------------------

### **Knowledge Assets Used:**

#### **KA1: Wikipedia RDF Conversion**

*   Generated from Wikipedia wikitext → JSON → JSON-LD
    
*   Stored with schema:Article, schema:claim, prov:wasDerivedFrom
    

#### **KA2: Grokipedia RDF Conversion**

*   Scraped and cleaned
    
*   Converted into RDF claims
    
*   Stored with Grok provenance
    

#### **KA3: Community Notes**

Example JSON-LD structure:

{

  "@context": "https://schema.org",

  "@type": "AnalysisNote",

  "topic": "Climate Change",

  "sourceA": "Wikipedia",

  "sourceB": "Grokipedia",

  "finding": "Grokipedia minimizes the scientific consensus...",

  "evidence": \["KA1:xyz", "KA2:abc"\],

  "confidence": 0.92,

  "stakedValue": "20 TRAC",

  "createdAt": "2025-11-19T12:00:00Z"

}

#### **KA4: Token Staking Metadata**

*   DKG supports provenance & extensions
    
*   Store staking events and validators
    
*   Used for trust-weighting
    

**5.3 Trust Layer**
-------------------

### **Token staking:**

*   Fact-checkers stake **TRAC/NEURO** on their notes
    
*   Downvoted or proven wrong?→ stake slashed
    
*   Agreement from others → stake grows
    
*   Higher staked assets = higher reliability score
    

### **Reputation model:**

ReputationScore = StakeWeight + AgreementScore + ProvenanceScore

### **x402 Micropayments:**

Premium:

*   Verified reports
    
*   Topic-level summaries
    
*   Truth-consensus scoreAccessible only via **x402 payment gate**.
    

**🧪 6. Core Flows**
====================

**🔍 Flow 1: Topic Ingestion & Comparison**
-------------------------------------------

1.  User/agent chooses a topic: “Climate change”
    
2.  TruthScope Agent fetches:
    
    *   Wikipedia content
        
    *   Grokipedia content
        
3.  LLM extracts claims
    
4.  Claims → RDF triples
    
5.  Store KA1 / KA2
    
6.  Agent runs semantic-diff
    
7.  Generate discrepancy notes
    
8.  Publish KA3
    

Output:A set of trusted, verifiable Community Notes.

**🧠 Flow 2: Truth-Aware Response Generation**
----------------------------------------------

User asks:

“Is climate change caused by humans?”

Agent steps:

1.  Query DKG (via MCP query tool) for topic
    
2.  Retrieve notes (KA3)
    
3.  Apply corrections
    
4.  Respond with grounded truth
    
5.  Provide links to KAs for transparency
    

**💸 Flow 3: Premium Report via x402**
--------------------------------------

User/agent requests:

“Give me a full truth-consensus report.”

*   402 Payment Required
    
*   Agent pays micro-fee
    
*   Server returns full report
    
*   Report includes:
    
    *   diff summary
        
    *   truth confidence
        
    *   claim-by-claim evidence
        
    *   weighted-reputation analysis
        

**📊 7. Data & Semantic Models**
================================

### **Core ontologies used:**

*   **schema.org**
    
*   **prov: (provenance ontology)**
    
*   **dkg: (DKG Knowledge Asset schema)**
    
*   **skos: for topic linking**
    
*   Optional: Wikidata QIDs
    

**📚 8. Integration With Umanitek Guardian Knowledge Base**
===========================================================

Even though Challenge 1 doesn’t require social graph, we use Guardian in **two advanced ways**:

### **1\. External Evidence**

If Grokipedia makes a controversial claim:→ Proof of whether that narrative circulates on X/Reddit (from Guardian data)

### **2\. Credibility Scoring**

Guardian provides metadata about misinformation clusters→ Use that to discount biased claims

This gives TruthScope a **multi-source truth triangulation advantage**.