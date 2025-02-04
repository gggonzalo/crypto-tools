import SymbolCandleStickChart from "@/alerts/SymbolCandleStickChart";
import SymbolsCombobox from "@/components/SymbolsCombobox";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import OneSignal from "react-onesignal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useAlertsStore from "@/alerts/store";
import { Interval } from "@/types";
import { useCallback, useEffect } from "react";
import AlertsForm from "@/alerts/AlertsForm";
import useAppStore from "@/store";
import AlertsService from "@/services/AlertsService";
import SymbolsService from "@/services/SymbolsService";
import AlertsTable from "./AlertsTable";

function Alerts() {
  const pushNotificationsStatus = useAppStore(
    (state) => state.pushNotificationsStatus,
  );
  const symbol = useAlertsStore((state) => state.symbol);
  const interval = useAlertsStore((state) => state.interval);
  const alerts = useAlertsStore((state) => state.alerts);

  useEffect(() => {
    const symbolInfoAbortController = new AbortController();

    const fetchSymbolInfo = async (newSymbol: string) => {
      if (!newSymbol) return;

      useAlertsStore.setState({
        symbol: newSymbol,
        symbolInfo: null,
        symbolInfoStatus: "loading",
      });

      const newSymbolInfo = await SymbolsService.fetchSymbolInfo(newSymbol);

      if (symbolInfoAbortController.signal.aborted) return;

      if (!newSymbolInfo) {
        useAlertsStore.setState({ symbolInfoStatus: "unloaded" });

        return;
      }

      useAlertsStore.setState({
        symbolInfo: newSymbolInfo,
        symbolInfoStatus: "loaded",
      });
    };

    fetchSymbolInfo(symbol);

    return () => {
      symbolInfoAbortController.abort();
    };
  }, [symbol]);

  const fetchUserAlerts = useCallback(async () => {
    if (pushNotificationsStatus === "unloaded") return;

    const alerts = await AlertsService.getUserAlerts();

    useAlertsStore.setState({
      alerts,
    });
  }, [pushNotificationsStatus]);

  useEffect(() => {
    fetchUserAlerts();
  }, [fetchUserAlerts]);

  return (
    <div className="flex flex-col gap-2">
      {pushNotificationsStatus === "inactive" && (
        <p className="self-start rounded-md bg-destructive px-2 py-1 text-sm text-destructive-foreground">
          To create and receive alerts, please{" "}
          <span
            className="cursor-pointer underline"
            onClick={() =>
              OneSignal.Slidedown.promptPush({
                force: true,
              })
            }
          >
            enable push notifications
          </span>{" "}
          in your browser.
        </p>
      )}
      <div className="grid grid-cols-3 gap-12 lg:gap-16">
        <Card className="col-span-3 flex-[2] lg:col-span-2">
          <CardHeader>
            <div className="flex gap-1">
              <SymbolsCombobox
                value={symbol}
                onValueChange={(newSymbol) => {
                  useAlertsStore.setState({ symbol: newSymbol });
                }}
              />
              <Select
                value={interval}
                onValueChange={(value) =>
                  useAlertsStore.setState({ interval: value as Interval })
                }
              >
                <SelectTrigger className="w-[85px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="OneMinute" value="OneMinute">
                    1m
                  </SelectItem>
                  <SelectItem key="FiveMinutes" value="FiveMinutes">
                    5m
                  </SelectItem>
                  <SelectItem key="FifteenMinutes" value="FifteenMinutes">
                    15m
                  </SelectItem>
                  <SelectItem key="OneHour" value="OneHour">
                    1h
                  </SelectItem>
                  <SelectItem key="FourHour" value="FourHour">
                    4h
                  </SelectItem>
                  <SelectItem key="OneDay" value="OneDay">
                    1d
                  </SelectItem>
                  <SelectItem key="OneWeek" value="OneWeek">
                    1w
                  </SelectItem>
                  <SelectItem key="OneMonth" value="OneMonth">
                    1M
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="h-[24rem]">
            <SymbolCandleStickChart />
          </CardContent>
        </Card>
        <div className="col-span-3 lg:col-span-1">
          <AlertsForm onAlertCreated={fetchUserAlerts} />
        </div>
        {pushNotificationsStatus === "active" && alerts.length > 0 && (
          <div className="col-span-3 flex flex-col gap-4 lg:col-span-3">
            <AlertsTable />
          </div>
        )}
      </div>
    </div>
  );
}

export default Alerts;
