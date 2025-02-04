import { SymbolDisplayInfo } from "./types";

export const API_URL = import.meta.env.VITE_CRYPTO_TOOLS_API_URL;

export const symbolsDisplayInfo: Record<string, SymbolDisplayInfo> = {
  BTCUSDT: {
    logo: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg",
  },
  ETHUSDT: {
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.svg",
  },
  BNBUSDT: {
    logo: "https://cryptologos.cc/logos/bnb-bnb-logo.svg",
  },
  ADAUSDT: {
    logo: "https://cryptologos.cc/logos/cardano-ada-logo.svg",
  },
  DOGEUSDT: {
    logo: "https://cryptologos.cc/logos/dogecoin-doge-logo.svg",
  },
  DOTUSDT: {
    logo: "https://cryptologos.cc/logos/polkadot-new-dot-logo.svg",
  },
  UNIUSDT: {
    logo: "https://cryptologos.cc/logos/uniswap-uni-logo.svg",
  },
  LINKUSDT: {
    logo: "https://cryptologos.cc/logos/chainlink-link-logo.svg",
  },
  ATOMUSDT: {
    logo: "https://cryptologos.cc/logos/cosmos-atom-logo.svg",
  },
};
