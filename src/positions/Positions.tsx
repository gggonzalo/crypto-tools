import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/components/utils";
import { formatPrice } from "@/utils";
import { CircleX, Pencil, Trash2 } from "lucide-react";
import { Position } from "./types";

const symbolInfo = {
  symbol: "USDCUSDT",
  baseAsset: "USDC",
  quoteAsset: "USDT",
  priceFormat: {
    minMove: 0.0001,
    precision: 4,
  },
  quantityFormat: {
    minMove: 1,
    precision: 0,
  },
};
const currentPrice = 1.0004;

const positions: Position[] = [
  {
    id: 1,
    symbol: "USDCUSDT",
    side: "Buy",
    amount: 3500,
    price: 0.9987,
    tp: 1.0012,
  },
  {
    id: 2,
    symbol: "USDCUSDT",
    side: "Buy",
    amount: 1212,
    price: 1.0017,
    tp: 1.0035,
  },
  {
    id: 3,
    symbol: "USDCUSDT",
    side: "Buy",
    amount: 5000,
    price: 0.9981,
    tp: 1.0005,
    endReason: "Closed",
    endPrice: 1.0003,
  },
  {
    id: 3,
    symbol: "USDCUSDT",
    side: "Sell",
    amount: 12320,
    price: 1.0021,
    tp: 1.0005,
    endReason: "Filled",
  },
];

const calculateAssetChange = (
  side: string,
  amount: number,
  previousPrice: number,
  currentPrice: number,
) => {
  return side === "Buy"
    ? currentPrice * amount - previousPrice * amount
    : previousPrice * amount - currentPrice * amount;
};

const calculatePercentageChange = (
  amountChange: number,
  amount: number,
  price: number,
) => {
  return (amountChange / (price * amount)) * 100;
};

function Positions() {
  const renderOpenPositionRow = (position: Position) => {
    const { id, symbol, side, amount, price, tp } = position;
    const { baseAsset, quoteAsset } = symbolInfo;

    const tpQuoteAsset = calculateAssetChange(side, amount, price, tp);
    const formattedTpQuoteAsset = formatPrice(
      tpQuoteAsset,
      symbolInfo.priceFormat,
    );
    const tpPercentageChange = calculatePercentageChange(
      tpQuoteAsset,
      amount,
      price,
    );

    const unrealizedQuoteAssetChange = calculateAssetChange(
      side,
      amount,
      price,
      currentPrice,
    );
    const formattedUnrealizedQuoteAssetChange = formatPrice(
      unrealizedQuoteAssetChange,
      symbolInfo.priceFormat,
    );
    const unrealizedPercentageChange = calculatePercentageChange(
      unrealizedQuoteAssetChange,
      amount,
      price,
    );

    return (
      <TableRow key={id}>
        <TableCell>{symbol}</TableCell>
        <TableCell>{side}</TableCell>
        <TableCell>
          {amount} {baseAsset}
        </TableCell>
        <TableCell>{formatPrice(price, symbolInfo.priceFormat)}</TableCell>
        <TableCell>
          {tp}{" "}
          <span className="text-positive">
            (+{formattedTpQuoteAsset} {quoteAsset}{" "}
            {tpPercentageChange.toFixed(2)}%)
          </span>
        </TableCell>
        <TableCell
          className={cn({
            "text-positive": unrealizedQuoteAssetChange > 0,
            "text-destructive": unrealizedQuoteAssetChange < 0,
          })}
        >
          {formattedUnrealizedQuoteAssetChange} {quoteAsset}{" "}
          {unrealizedPercentageChange.toFixed(2)}%
        </TableCell>
        <TableCell>
          <div className="flex gap-0.5">
            <Button variant="ghost" size="icon">
              <Pencil className="size-4 text-primary" />
            </Button>
            <Button variant="ghost" size="icon">
              <CircleX className="size-4 text-destructive" />
            </Button>
            <Button variant="ghost" size="icon">
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const renderEndedPositionRow = (position: Position) => {
    const { id, symbol, side, amount, price, endReason, tp, endPrice } =
      position;
    const { baseAsset, quoteAsset } = symbolInfo;

    const finalEndPrice = (endReason === "Filled" ? tp : endPrice)!;

    const pnlQuoteAssetChange = calculateAssetChange(
      side,
      amount,
      price,
      finalEndPrice,
    );
    const formattedPnlQuoteAssetChange = formatPrice(
      pnlQuoteAssetChange,
      symbolInfo.priceFormat,
    );
    const pnlPercentageChange = calculatePercentageChange(
      pnlQuoteAssetChange,
      amount,
      price,
    );

    return (
      <TableRow key={id}>
        <TableCell>{symbol}</TableCell>
        <TableCell>{side}</TableCell>
        <TableCell>
          {amount} {baseAsset}
        </TableCell>
        <TableCell>{formatPrice(price, symbolInfo.priceFormat)}</TableCell>
        <TableCell>{endReason}</TableCell>
        <TableCell>
          {tp}/{finalEndPrice}
        </TableCell>
        <TableCell
          className={cn({
            "text-positive": pnlQuoteAssetChange > 0,
            "text-destructive": pnlQuoteAssetChange < 0,
          })}
        >
          {formattedPnlQuoteAssetChange} {quoteAsset}{" "}
          {pnlPercentageChange.toFixed(2)}%
        </TableCell>
        <TableCell>
          <div className="flex gap-0.5">
            <Button variant="ghost" size="icon">
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const openPositions = positions.filter((p) => !p.endReason);
  const endedPositions = positions.filter((p) => !!p.endReason);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Open</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Side</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>TP</TableHead>
              <TableHead>Unrealized PnL</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{openPositions.map(renderOpenPositionRow)}</TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Ended</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Side</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>End reason</TableHead>
              <TableHead>TP/End price</TableHead>
              <TableHead>PnL</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{endedPositions.map(renderEndedPositionRow)}</TableBody>
        </Table>
      </div>
    </div>
  );
}

export default Positions;
