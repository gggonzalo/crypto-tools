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
import useAlertsStore from "@/alerts/store";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useMemo, useState } from "react";
import AlertsService from "@/services/AlertsService";
import { Alert, SymbolInfo } from "@/types";
import SymbolsService from "@/services/SymbolsService";
import { formatPrice } from "@/utils";

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

  const handleAlertSymbolClick = (symbol: string) => {
    useAlertsStore.setState({ symbol: symbol });

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
    const infos = await SymbolsService.fetchSymbolsInfo(symbolsToFetch);

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

    if (uniqueMissingSymbols.length > 0)
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
            onClick={() => handleAlertSymbolClick(alert.symbol)}
          >
            {alert.symbol}
          </span>
        </TableCell>
        <TableCell className="text-nowrap">
          {alert.type === "Price" ? "Price alert" : "RSI alert"}
        </TableCell>
        <TableCell className="flex flex-col text-nowrap">
          <span>{valueOnCreation}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(alert.createdAt).toLocaleString()}
          </span>
        </TableCell>
        <TableCell className="text-nowrap">{valueTarget}</TableCell>
        <TableCell className="text-nowrap">{alert.status}</TableCell>
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
            <TableHead>Symbol</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Value On Creation</TableHead>
            <TableHead>Value Target</TableHead>
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAlerts.map((alert) => renderAlertRow(alert))}
        </TableBody>
      </Table>
    </div>
  );
}

export default AlertsTable;
