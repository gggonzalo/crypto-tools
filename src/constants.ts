export const API_URL = import.meta.env.VITE_CRYPTO_TOOLS_API_URL;

interface SymbolDisplayInfo {
  logo: string;
}

export const symbolsDisplayInfo: Record<string, SymbolDisplayInfo> = {
  BTCUSDT: {
    logo: "crypto-logos/btc.svg",
  },
  ETHUSDT: {
    logo: "crypto-logos/eth.svg",
  },
  BNBUSDT: {
    logo: "crypto-logos/bnb.svg",
  },
  ADAUSDT: {
    logo: "crypto-logos/ada.svg",
  },
  DOGEUSDT: {
    logo: "crypto-logos/doge.svg",
  },
  DOTUSDT: {
    logo: "crypto-logos/dot.svg",
  },
  UNIUSDT: {
    logo: "crypto-logos/uni.svg",
  },
  LINKUSDT: {
    logo: "crypto-logos/link.svg",
  },
  ATOMUSDT: {
    logo: "crypto-logos/atom.svg",
  },
  USDCUSDT: {
    logo: "crypto-logos/usdc.svg",
  },
};
