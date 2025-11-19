import { ethers } from 'ethers';
import { dkgClient } from './dkgClient';
import { createTrustMetadataAssetJsonLd } from './knowledgeAssets';

const RPC_URL = process.env.RPC_URL || 'https://rpc.neuroweb.ai'; // Example NeuroWeb RPC
const PRIVATE_KEY = process.env.DKG_WALLET_PRIVATE_KEY;
const STAKING_CONTRACT_ADDRESS = process.env.STAKING_CONTRACT_ADDRESS;

// Minimal ABI for staking (example)
const STAKING_ABI = [
    "function stake(uint256 amount, string memory noteId) external returns (bool)",
    "function getReputation(string memory noteId) external view returns (uint256)"
];

export async function stakeOnNote(noteId: string, amount: string) {
    let txHash = '0x_MOCK_TX_HASH_' + Math.random().toString(16).slice(2);

    if (PRIVATE_KEY && STAKING_CONTRACT_ADDRESS) {
        try {
            const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
            const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
            const contract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, wallet);

            console.log(`Staking ${amount} on note ${noteId}...`);
            const tx = await contract.stake(ethers.utils.parseUnits(amount, 18), noteId);
            console.log(`Transaction sent: ${tx.hash}`);

            const receipt = await tx.wait();
            txHash = receipt.transactionHash; // v5 uses transactionHash in receipt
        } catch (error) {
            console.error('Staking failed:', error);
            throw error;
        }
    } else {
        console.warn('Missing wallet or contract address for staking. Using mock transaction.');
    }

    // Publish KA4: Trust Layer Metadata to DKG
    try {
        console.log('Publishing KA4 (Trust Event) to DKG...');
        const trustJsonLd = createTrustMetadataAssetJsonLd(
            noteId,
            PRIVATE_KEY ? new ethers.Wallet(PRIVATE_KEY).address : '0xMockValidator',
            'stake',
            amount
        );
        const ka4 = await dkgClient.publishKnowledgeAsset(trustJsonLd);
        console.log(`Published KA4: ${ka4.ual}`);
    } catch (dkgError) {
        console.error('Failed to publish KA4 trust event:', dkgError);
        // We don't fail the whole operation if DKG publish fails, as the stake is already on-chain
    }

    return { success: true, txHash };
}

export async function calculateReputation(noteId: string): Promise<number> {
    if (!STAKING_CONTRACT_ADDRESS) {
        return Math.random() * 100; // Fallback
    }

    try {
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, provider);
        const reputation = await contract.getReputation(noteId);
        return Number(ethers.utils.formatUnits(reputation, 0)); // Assuming 0 decimals for score
    } catch (error) {
        console.error('Failed to fetch reputation:', error);
        return 0;
    }
}

