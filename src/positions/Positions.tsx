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
import { CirclePlus, CircleX, Pencil, Trash2 } from "lucide-react";
import { Position } from "./types";
import { useState, useEffect, useCallback, useMemo } from "react";
import { SymbolInfo } from "../common/types";
import SymbolsService from "../services/SymbolsService";
import CandlesService from "../services/CandlesService";
import { useDocumentVisibility } from "@mantine/hooks";
import PositionsService from "@/services/PositionsService";
import {
  DialogTitle,
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
} from "../components/ui/dialog";
import PositionsForm from "./PositionsForm";
import usePositionsStore from "./usePositionsStore";

const calculateQuoteAssetAmountChange = (
  side: string,
  baseAssetAmount: number,
  previousPrice: number,
  currentPrice: number,
) => {
  return side === "Buy"
    ? currentPrice * baseAssetAmount - previousPrice * baseAssetAmount
    : previousPrice * baseAssetAmount - currentPrice * baseAssetAmount;
};

const calculatePercentageChange = (
  side: string,
  previousPrice: number,
  currentPrice: number,
) => {
  const change = ((currentPrice - previousPrice) / previousPrice) * 100;

  return side === "Sell" ? -change : change;
};

function Positions() {
  // Store
  const positions = usePositionsStore((state) => state.positions);

  // State
  const [showAddPositionForm, setShowAddPositionForm] = useState(false);
  const [positionsSymbolInfos, setPositonsSymbolInfos] = useState<
    Record<string, SymbolInfo>
  >({});
  const [positionsSymbolPrices, setPositonsSymbolPrices] = useState<
    Record<string, number>
  >({});

  const documentState = useDocumentVisibility();

  // Functions
  const fetchPositions = useCallback(async () => {
    const positions = await PositionsService.getPositions();

    usePositionsStore.setState({ positions: positions });
  }, []);

  const handleDeletePosition = async (id: number) => {
    await PositionsService.deletePosition(id);

    usePositionsStore.setState({
      positions: positions.filter((p) => p.id !== id),
    });
  };

  // Effects
  useEffect(() => {
    if (documentState === "hidden") return;

    fetchPositions();

    return () => {
      usePositionsStore.setState({ positions: [] });
    };
  }, [documentState, fetchPositions]);

  const fetchMissingSymbolsInfo = async (symbolsToFetch: string[]) => {
    const infos = await SymbolsService.getSymbolsInfo(symbolsToFetch);

    setPositonsSymbolInfos((prev) => ({
      ...prev,
      ...infos,
    }));
  };

  useEffect(() => {
    const missingSymbols = positions
      .map((alert) => alert.symbol)
      .filter((symbol) => !positionsSymbolInfos[symbol]);

    const uniqueMissingSymbols = [...new Set(missingSymbols)];

    if (uniqueMissingSymbols.length === 0) return;

    fetchMissingSymbolsInfo(uniqueMissingSymbols);
  }, [positions, positionsSymbolInfos]);

  const openPositions = useMemo(() => {
    return positions.filter((p) => !p.endReason);
  }, [positions]);

  useEffect(() => {
    if (!openPositions.length) return;

    const allSymbols = openPositions.map((p) => p.symbol);

    // TODO: Have a separate endpoint for real-time price updates instead of candle updates with 1m interval?
    const candleUpdatesSubscription = CandlesService.subscribeToCandleUpdates(
      allSymbols,
      ["OneMinute"],
      (symbolIntervalCandle) => {
        const { symbol, candle } = symbolIntervalCandle;

        setPositonsSymbolPrices((prev) => ({
          ...prev,
          [symbol]: candle.close,
        }));
      },
    );

    return () => {
      candleUpdatesSubscription.unsubscribe();
    };
  }, [openPositions]);

  // TODO: Test render when symbol info comes later than prices
  const renderOpenPositionRow = (position: Position) => {
    const positionSymbolInfo = positionsSymbolInfos[position.symbol];
    const positionSymbolCurrentPrice = positionsSymbolPrices[position.symbol];

    const { id, symbol, side, amount, price, tp } = position;
    const { baseAsset, quoteAsset } = positionSymbolInfo ?? {
      baseAsset: "",
      quoteAsset: "",
    };

    const formattedAmount = positionSymbolInfo
      ? formatPrice(amount, positionSymbolInfo.quantityFormat)
      : "-";
    const formattedPrice = positionSymbolInfo
      ? formatPrice(price, positionSymbolInfo.priceFormat)
      : "-";
    const formattedCurrentPrice =
      positionSymbolInfo && positionSymbolCurrentPrice
        ? formatPrice(
            positionSymbolCurrentPrice,
            positionSymbolInfo.priceFormat,
          )
        : "-";
    const formattedTp = positionSymbolInfo
      ? formatPrice(tp, positionSymbolInfo.priceFormat)
      : "-";
    const tpQuoteAssetChange = calculateQuoteAssetAmountChange(
      side,
      amount,
      price,
      tp,
    );
    const formattedTpQuoteAssetChange = positionSymbolInfo
      ? formatPrice(tpQuoteAssetChange, positionSymbolInfo.priceFormat)
      : "-";
    const tpPercentageChange = calculatePercentageChange(side, price, tp);
    const formattedTpPercentageChange = tpPercentageChange.toFixed(2);

    const unrealizedQuoteAssetChange = positionSymbolCurrentPrice
      ? calculateQuoteAssetAmountChange(
          side,
          amount,
          price,
          positionSymbolCurrentPrice,
        )
      : 0;
    const formattedUnrealizedQuoteAssetChange = positionSymbolInfo
      ? formatPrice(unrealizedQuoteAssetChange, positionSymbolInfo.priceFormat)
      : "0";
    const unrealizedPercentageChange = positionSymbolCurrentPrice
      ? calculatePercentageChange(side, price, positionSymbolCurrentPrice)
      : 0;
    const formattedUnrealizedPercentageChange =
      unrealizedPercentageChange.toFixed(2);

    return (
      <TableRow key={id} className="text-nowrap">
        <TableCell>{symbol}</TableCell>
        <TableCell>{side}</TableCell>
        <TableCell>
          {formattedAmount} {baseAsset}
        </TableCell>
        <TableCell>
          {formattedPrice}/{formattedCurrentPrice}
        </TableCell>
        <TableCell>
          {formattedTp}{" "}
          <span className="text-positive">
            (+{formattedTpQuoteAssetChange} {quoteAsset}{" "}
            {formattedTpPercentageChange}%)
          </span>
        </TableCell>
        <TableCell
          className={cn({
            "text-positive": unrealizedQuoteAssetChange > 0,
            "text-negative": unrealizedQuoteAssetChange < 0,
          })}
        >
          {!!positionSymbolCurrentPrice
            ? `${formattedUnrealizedQuoteAssetChange} ${quoteAsset} ${formattedUnrealizedPercentageChange}%`
            : "-"}
        </TableCell>
        <TableCell>
          <div className="flex gap-0.5">
            <Button variant="ghost" size="icon">
              <Pencil className="size-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon">
              <CircleX className="size-4 text-destructive" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeletePosition(id)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const renderEndedPositionRow = (position: Position) => {
    const positionSymbolInfo = positionsSymbolInfos[position.symbol];

    const { id, symbol, side, amount, price, endReason, tp, endPrice } =
      position;
    const { baseAsset, quoteAsset } = positionSymbolInfo ?? {
      baseAsset: "",
      quoteAsset: "",
    };

    const formattedAmount = positionSymbolInfo
      ? formatPrice(amount, positionSymbolInfo.quantityFormat)
      : "-";
    const formattedPrice = positionSymbolInfo
      ? formatPrice(price, positionSymbolInfo.priceFormat)
      : "-";

    const formattedTp = positionSymbolInfo
      ? formatPrice(tp, positionSymbolInfo.priceFormat)
      : "-";

    const finalEndPrice = endPrice!;
    const formattedEndPrice = positionSymbolInfo
      ? formatPrice(finalEndPrice, positionSymbolInfo.priceFormat)
      : "-";

    const pnlQuoteAssetChange = calculateQuoteAssetAmountChange(
      side,
      amount,
      price,
      finalEndPrice,
    );
    const formattedPnlQuoteAssetChange = positionSymbolInfo
      ? formatPrice(pnlQuoteAssetChange, positionSymbolInfo.priceFormat)
      : "-";
    const pnlPercentageChange = calculatePercentageChange(
      side,
      price,
      finalEndPrice,
    );
    const formattedPnlPercentageChange = pnlPercentageChange.toFixed(2);

    return (
      <TableRow key={id} className="text-nowrap">
        <TableCell>{symbol}</TableCell>
        <TableCell>{side}</TableCell>
        <TableCell>
          {formattedAmount} {baseAsset}
        </TableCell>
        <TableCell>{formattedPrice}</TableCell>
        <TableCell>{endReason}</TableCell>
        <TableCell>
          {formattedTp}/{formattedEndPrice}
        </TableCell>
        <TableCell
          className={cn({
            "text-positive": pnlQuoteAssetChange > 0,
            "text-negative": pnlQuoteAssetChange < 0,
          })}
        >
          {formattedPnlQuoteAssetChange} {quoteAsset}{" "}
          {formattedPnlPercentageChange}%
        </TableCell>
        <TableCell>
          <div className="flex gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeletePosition(id)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const endedPositions = positions.filter((p) => !!p.endReason);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Open</h2>
          <Dialog
            open={showAddPositionForm}
            onOpenChange={setShowAddPositionForm}
          >
            <DialogTrigger asChild>
              <Button>
                <CirclePlus />
                Add position
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add position</DialogTitle>
              </DialogHeader>
              <PositionsForm
                onPositionCreated={() => {
                  fetchPositions();

                  setShowAddPositionForm(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Side</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Entry price/Current price</TableHead>
              <TableHead>TP</TableHead>
              <TableHead>Unrealized PnL</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!openPositions.length ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No open positions
                </TableCell>
              </TableRow>
            ) : (
              openPositions.map(renderOpenPositionRow)
            )}
          </TableBody>
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
          <TableBody>
            {!endedPositions.length ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No ended positions
                </TableCell>
              </TableRow>
            ) : (
              endedPositions.map(renderEndedPositionRow)
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default Positions;
