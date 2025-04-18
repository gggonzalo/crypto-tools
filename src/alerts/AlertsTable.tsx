import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import useAlertsStore from "@/alerts/useAlertsStore";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useMemo, useState } from "react";
import AlertsService from "@/services/AlertsService";
import SymbolsService from "@/services/SymbolsService";
import { formatPrice, mapIntervalToLabel } from "@/utils";
import { Interval, SymbolInfo } from "@/common/types";
import { Alert } from "./types";

function AlertsTable() {
  const symbol = useAlertsStore((state) => state.symbol);
  const alerts = useAlertsStore((state) => state.alerts);
  const [alertsSymbolInfos, setAlertsSymbolInfos] = useState<
    Record<string, SymbolInfo>
  >({});
  const [areOtherPairsAlertsHidden, setHideOtherPairsAlerts] = useState(false);

  const filteredAlerts = useMemo(() => {
    const sortedAlerts = [...alerts].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return areOtherPairsAlertsHidden
      ? sortedAlerts.filter((alert) => alert.symbol === symbol)
      : sortedAlerts;
  }, [alerts, areOtherPairsAlertsHidden, symbol]);

  const handleAlertTickerClick = (
    selectedSymbol: string,
    selectedInterval?: Interval,
  ) => {
    useAlertsStore.setState({
      symbol: selectedSymbol,
      interval: selectedInterval ?? "OneMinute",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteAlert = async (alertId: string) => {
    const success = await AlertsService.deleteAlert(alertId);

    if (success) {
      useAlertsStore.setState(({ alerts: currentAlerts }) => ({
        alerts: currentAlerts.filter((alert) => alert.id !== alertId),
      }));
    }
  };

  const fetchMissingSymbolsInfo = async (symbolsToFetch: string[]) => {
    const infos = await SymbolsService.getSymbolsInfo(symbolsToFetch);

    setAlertsSymbolInfos((prev) => ({
      ...prev,
      ...infos,
    }));
  };

  useEffect(() => {
    const missingSymbols = alerts
      .map((alert) => alert.symbol)
      .filter((symbol) => !alertsSymbolInfos[symbol]);

    const uniqueMissingSymbols = [...new Set(missingSymbols)];

    if (uniqueMissingSymbols.length === 0) return;

    fetchMissingSymbolsInfo(uniqueMissingSymbols);
  }, [alerts, alertsSymbolInfos]);

  const renderAlertRow = (alert: Alert) => {
    const alertSymbolInfo = alertsSymbolInfos[alert.symbol];

    const valueOnCreation =
      alert.type === "Price"
        ? alertSymbolInfo
          ? `${formatPrice(alert.valueOnCreation, alertSymbolInfo.priceFormat)} ${alertSymbolInfo.quoteAsset}`
          : "-"
        : alert.valueOnCreation;
    const valueTarget =
      alert.type === "Price"
        ? alertSymbolInfo
          ? `${formatPrice(alert.valueTarget, alertSymbolInfo.priceFormat)} ${alertSymbolInfo.quoteAsset}`
          : "-"
        : alert.valueTarget;

    return (
      <TableRow key={alert.id}>
        <TableCell>
          <span
            className="cursor-pointer font-semibold"
            onClick={() => {
              if (alert.type === "Rsi")
                handleAlertTickerClick(alert.symbol, alert.interval);
              else handleAlertTickerClick(alert.symbol);
            }}
          >
            {alert.symbol}
            {alert.type === "Rsi"
              ? `, ${mapIntervalToLabel(alert.interval)}`
              : null}
          </span>
        </TableCell>
        <TableCell>
          {alert.type === "Price" ? "Price alert" : "RSI alert"}
        </TableCell>
        <TableCell className="flex flex-col">
          <span>{valueOnCreation}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(alert.createdAt).toLocaleString()}
          </span>
        </TableCell>
        <TableCell>{valueTarget}</TableCell>
        <TableCell>{alert.status}</TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteAlert(alert.id)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-2 md:flex-row">
        <h2 className="text-xl font-semibold">Your alerts</h2>
        <div className="flex items-center gap-2">
          <Checkbox
            id="hide-other-pairs-alerts"
            checked={areOtherPairsAlertsHidden}
            onCheckedChange={(checked) =>
              setHideOtherPairsAlerts(checked as boolean)
            }
          />
          <label htmlFor="hide-other-pairs-alerts">
            Hide other symbols alerts
          </label>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticker</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Value On Creation</TableHead>
            <TableHead>Value Target</TableHead>
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!filteredAlerts.length ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                No alerts
              </TableCell>
            </TableRow>
          ) : (
            filteredAlerts.map((alert) => renderAlertRow(alert))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default AlertsTable;
