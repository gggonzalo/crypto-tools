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
import { useMemo, useState } from "react";
import AlertsService from "@/services/AlertsService";

function AlertsTable() {
  const symbol = useAlertsStore((state) => state.symbol);
  const alerts = useAlertsStore((state) => state.alerts);

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

  const handleDeleteAlert = async (alertId: string) => {
    const success = await AlertsService.deleteAlert(alertId);

    if (success) {
      useAlertsStore.setState(({ alerts: currentAlerts }) => ({
        alerts: currentAlerts.filter((alert) => alert.id !== alertId),
      }));
    }
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
          {filteredAlerts.map((alert) => (
            <TableRow key={alert.id}>
              <TableCell>
                <span
                  className="cursor-pointer font-semibold"
                  onClick={() =>
                    useAlertsStore.setState({ symbol: alert.symbol })
                  }
                >
                  {alert.symbol}
                </span>
              </TableCell>
              <TableCell>Price Alert</TableCell>
              <TableCell>{alert.valueOnCreation} USDT</TableCell>
              <TableCell>{alert.valueTarget} USDT</TableCell>
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default AlertsTable;
