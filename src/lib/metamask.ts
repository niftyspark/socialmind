// ============================================================
// SocialMind — Lightweight MetaMask-only wallet connection
// No libraries — uses window.ethereum directly.
// ============================================================

const BASE_CHAIN_ID = "0x2105"; // Base Mainnet = 8453 = 0x2105

interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function isMetaMaskInstalled(): boolean {
  return typeof window !== "undefined" && !!window.ethereum?.isMetaMask;
}

/** Request MetaMask to connect and return the wallet address */
export async function connectMetaMask(): Promise<string> {
  if (!window.ethereum?.isMetaMask) {
    throw new Error("MetaMask is not installed");
  }

  const accounts = (await window.ethereum.request({
    method: "eth_requestAccounts",
  })) as string[];

  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts found. Please unlock MetaMask.");
  }

  // Switch to Base chain
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_CHAIN_ID }],
    });
  } catch (switchError: unknown) {
    // If Base isn't added yet, add it
    if ((switchError as { code?: number })?.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: BASE_CHAIN_ID,
            chainName: "Base",
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://mainnet.base.org"],
            blockExplorerUrls: ["https://basescan.org"],
          },
        ],
      });
    }
  }

  return accounts[0].toLowerCase();
}

/** Ask MetaMask to sign a message (personal_sign) */
export async function signMessage(address: string, message: string): Promise<string> {
  if (!window.ethereum) throw new Error("MetaMask is not available");

  const signature = (await window.ethereum.request({
    method: "personal_sign",
    params: [message, address],
  })) as string;

  return signature;
}

/** Get the currently connected address (if any) */
export async function getConnectedAddress(): Promise<string | null> {
  if (!window.ethereum) return null;
  try {
    const accounts = (await window.ethereum.request({
      method: "eth_accounts",
    })) as string[];
    return accounts[0]?.toLowerCase() || null;
  } catch {
    return null;
  }
}

/** Listen for account changes */
export function onAccountsChanged(handler: (accounts: string[]) => void): () => void {
  if (!window.ethereum) return () => {};
  window.ethereum.on("accountsChanged", handler as (...args: unknown[]) => void);
  return () => window.ethereum?.removeListener("accountsChanged", handler as (...args: unknown[]) => void);
}
