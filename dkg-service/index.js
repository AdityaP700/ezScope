import DkgClient from "dkg.js";

async function start() {
  // Accept either a full blockchain id (e.g. 'otp:20430' or 'otp:2043')
  // or a short name like 'otp'. Default to the OTP testnet id if short.
  const rawBlockchain = process.env.DKG_BLOCKCHAIN || 'otp';
  const blockchainName = rawBlockchain.includes(':') ? rawBlockchain : `${rawBlockchain}:20430`;
  const privateKey = process.env.DKG_PRIVATE_KEY || undefined;

  const dkg = new DkgClient({
    endpoint: process.env.DKG_API_URL || "https://testnet-node.origintrail.io/api/v1"
,
    // Put blockchain at top-level as expected by dkg.js/BaseServiceManager
    blockchain: {
      name: blockchainName,
      ...(privateKey ? { privateKey } : {})
    }
  });

  console.log("DKG client initialized!");

  // Use the node manager to fetch node info
  try {
    const info = await dkg.node.info();
    console.log("DKG Node Info:", info);
  } catch (err) {
    console.warn('Failed to fetch DKG node info:', err && err.message ? err.message : err);
  }
}

start().catch(console.error);
