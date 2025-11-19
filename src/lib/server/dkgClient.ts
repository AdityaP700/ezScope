import axios from "axios";

const DKG_API_URL = process.env.DKG_API_URL || "";
const DKG_PRIVATE_KEY = process.env.DKG_PRIVATE_KEY || "";

export function isDkgConfigured() {
    return !!(DKG_API_URL && DKG_PRIVATE_KEY);
}

/**
 * Publish a Knowledge Asset (JSON-LD) to the DKG HTTP API.
 * This avoids importing dkg.js and its transitive dependencies at build time.
 */
export async function publishKnowledgeAsset(asset: any) {
    if (!DKG_API_URL || !DKG_PRIVATE_KEY) {
        throw new Error("DKG_API_URL and DKG_PRIVATE_KEY are required to publish Knowledge Assets");
    }

    try {
        const resp = await axios.post(`${DKG_API_URL.replace(/\/$/, "")}/knowledge-assets`, asset, {
            headers: {
                "Content-Type": "application/json",
                // using a simple auth header; adapt to your DKG node auth scheme
                "x-dkg-signature": DKG_PRIVATE_KEY
            },
            timeout: 15000
        });
        return resp.data;
    } catch (err: any) {
        const msg = err?.response?.data || err.message || String(err);
        throw new Error(`Failed to publish Knowledge Asset: ${msg}`);
    }
}

export async function fetchKnowledgeAsset(id: string) {
    if (!DKG_API_URL) {
        throw new Error("DKG_API_URL is required to fetch Knowledge Assets");
    }
    try {
        const resp = await axios.get(`${DKG_API_URL.replace(/\/$/, "")}/knowledge-assets/${encodeURIComponent(id)}`, {
            timeout: 10000
        });
        return resp.data;
    } catch (err: any) {
        const msg = err?.response?.data || err.message || String(err);
        throw new Error(`Failed to fetch Knowledge Asset ${id}: ${msg}`);
    }
}


