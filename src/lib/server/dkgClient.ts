// @ts-ignore
import DKG from 'dkg.js';

const dkgOptions = {
    endpoint: process.env.DKG_ENDPOINT || 'http://localhost:8900',
    port: 8900,
    blockchain: {
        name: 'otp:2043', // Example: OriginTrail Parachain Testnet
        publicKey: process.env.DKG_WALLET_PUBLIC_KEY,
        privateKey: process.env.DKG_WALLET_PRIVATE_KEY,
    },
    maxNumberOfRetries: 30,
    frequency: 2,
    contentType: 'all',
    nodeApiVersion: '/v1',
};

let dkg: any;
try {
    if (process.env.DKG_WALLET_PRIVATE_KEY) {
        dkg = new DKG(dkgOptions);
    }
} catch (e) {
    console.error('Failed to initialize DKG client', e);
}

export interface DkgClient {
    publishKnowledgeAsset(jsonld: any): Promise<{ kaId: string; ual: string }>;
    getKnowledgeAsset(ual: string): Promise<any>;
}

export const dkgClient: DkgClient = {
    async publishKnowledgeAsset(jsonld: any) {
        if (!dkg) throw new Error('DKG client not initialized');
        console.log('Publishing asset to DKG...');

        const asset = await dkg.asset.create({
            public: jsonld,
        }, {
            epochsNum: 5
        });

        console.log(`DKG Asset created. UAL: ${asset.UAL}`);
        return { kaId: asset.UAL, ual: asset.UAL };
    },

    async getKnowledgeAsset(ual: string) {
        if (!dkg) throw new Error('DKG client not initialized');
        console.log(`Fetching asset ${ual} from DKG...`);

        const result = await dkg.asset.get(ual);
        return result.public;
    }
};

