import DKG from "dkg.js";

// 1. Configuration
const DKG_ENVIRONMENT = process.env.DKG_ENVIRONMENT || "testnet"; // 'testnet' or 'mainnet'
const DKG_ENDPOINT = process.env.DKG_API_URL || "http://localhost:8900";
const DKG_PRIVATE_KEY = process.env.DKG_PRIVATE_KEY;

export function isDkgConfigured() {
    return !!DKG_PRIVATE_KEY;
}

let dkgClient: any = null;

function getDkgClient() {
    if (dkgClient) return dkgClient;

    if (!DKG_PRIVATE_KEY) {
        throw new Error("DKG_PRIVATE_KEY is not set");
    }

    // Initialize the official SDK
    dkgClient = new DKG({
        environment: DKG_ENVIRONMENT,
        endpoint: DKG_ENDPOINT,
        port: 8900,
        useTls: DKG_ENDPOINT.startsWith("https"),
        blockchain: {
            name: "otp:20430", // NeuroWeb Testnet
            publicKey: "", // SDK derives this from private key
            privateKey: DKG_PRIVATE_KEY,
        },
        maxNumberOfRetries: 30,
        frequency: 2,
        contentType: "all",
        nodeApiVersion: "/v1" // Version 6 node API
    });

    return dkgClient;
}

/**
 * Publish a Knowledge Asset to the DKG Network
 */
export async function publishKnowledgeAsset(jsonLd: any) {
    console.log(`[DKG] Publishing Asset to ${DKG_ENVIRONMENT}...`);

    try {
        const dkg = getDkgClient();

        // 1. Prepare parameters
        // We use the asset's public ID as a keyword if available
        const keywords = [jsonLd.headline || jsonLd.name || "TruthScope"];

        // 2. Create the Asset
        const result = await dkg.asset.create(
            {
                public: jsonLd // The JSON-LD content
            },
            {
                keywords,
                visibility: "public"
            }
        );

        console.log(`[DKG] Asset Published! UAL: ${result.UAL}`);

        return {
            UAL: result.UAL,
            publicAssertionId: result.publicAssertionId,
            operationId: result.operationId,
            status: 'COMPLETED'
        };

    } catch (error: any) {
        console.error("[DKG] Publish Failed:", error);
        throw new Error(`DKG Publish Error: ${error.message}`);
    }
}

export async function fetchKnowledgeAsset(ual: string) {
    const dkg = getDkgClient();
    try {
        const result = await dkg.asset.get(ual);
        return result;
    } catch (error: any) {
        throw new Error(`DKG Fetch Error: ${error.message}`);
    }
}