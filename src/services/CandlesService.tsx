import { API_URL } from "@/constants";
import { toast } from "@/hooks/use-toast";
import { Candle } from "@/types";
import { convertCandleEpochToLocal, convertLocalEpochToUtcDate } from "@/utils";
import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";

export default class CandlesService {
  private static connections: Map<string, HubConnection> = new Map();
  private static subscribers: Map<string, Set<(candle: Candle) => void>> =
    new Map();

  private static createConnection(
    symbol: string,
    interval: string,
    connectionId: string,
  ): HubConnection {
    const connection = new HubConnectionBuilder()
      .withUrl(`${API_URL}/candles-hub`)
      .build();

    connection.on("CandleUpdate", ({ candle }) => {
      const localCandle = {
        ...candle,
        time: convertCandleEpochToLocal(candle.time),
      };

      this.notifySubscribers(connectionId, localCandle);
    });

    connection
      .start()
      .then(() => {
        connection.invoke("SubscribeToCandleUpdates", [symbol], [interval]);
      })
      .catch(() => {
        toast({
          title: "Error",
          description:
            "An error occurred while trying to start the candles stream.",
          variant: "destructive",
        });
      });

    return connection;
  }

  static subscribeToCandleUpdates(
    symbol: string,
    interval: string,
    callback: (candle: Candle) => void,
  ) {
    const connectionId = symbol + interval;

    if (!this.connections.has(connectionId)) {
      const connection = this.createConnection(symbol, interval, connectionId);
      this.connections.set(connectionId, connection);

      this.subscribers.set(connectionId, new Set());
    }

    this.subscribers.get(connectionId)!.add(callback);

    return {
      unsubscribe: () => this.unsubscribe(connectionId, callback),
    };
  }

  static async getCandles(
    symbol: string,
    interval: string,
    limit?: number,
    endTime?: number,
  ): Promise<Candle[]> {
    const params = new URLSearchParams({
      symbol,
      interval,
    });

    if (limit) {
      params.append("limit", limit.toString());
    }

    if (endTime) {
      params.append(
        "endTime",
        convertLocalEpochToUtcDate(endTime).toISOString(),
      );
    }

    const response = await fetch(`${API_URL}/candles?${params.toString()}`);
    const candles = await response.json();

    return candles.map((candle: Candle) => ({
      ...candle,
      time: convertCandleEpochToLocal(candle.time),
    }));
  }

  private static unsubscribe(
    connectionId: string,
    callback: (candle: Candle) => void,
  ) {
    // Remove the callback from the subscribers
    if (this.subscribers.has(connectionId)) {
      this.subscribers.get(connectionId)!.delete(callback);
    }

    // Stop and delete the connection if there are no more subscribers
    if (this.subscribers.get(connectionId)?.size === 0) {
      this.connections.get(connectionId)?.stop();
      this.connections.delete(connectionId);
    }
  }

  private static notifySubscribers(connectionId: string, candle: Candle) {
    if (this.subscribers.has(connectionId)) {
      this.subscribers
        .get(connectionId)!
        .forEach((callback) => callback(candle));
    }
  }
}
