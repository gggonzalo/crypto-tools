import { Candle, Interval, SymbolIntervalCandle } from "@/common/types";
import { API_URL } from "@/constants";
import { toast } from "@/hooks/use-toast";
import { convertCandleEpochToLocal, convertLocalEpochToUtcDate } from "@/utils";
import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";

export default class CandlesService {
  private static connections: Map<string, HubConnection> = new Map();
  private static subscribers: Map<
    string,
    Set<(symbolIntervalCandle: SymbolIntervalCandle) => void>
  > = new Map();

  private static createConnection(
    symbols: string[],
    intervals: Interval[],
    connectionId: string,
  ): HubConnection {
    const connection = new HubConnectionBuilder()
      .withUrl(`${API_URL}/candles-hub`)
      .build();

    connection.on("CandleUpdate", (reply) => {
      const localReply = {
        ...reply,
        candle: {
          ...reply.candle,
          time: convertCandleEpochToLocal(reply.candle.time),
        },
      };

      this.notifySubscribers(connectionId, localReply);
    });

    connection.start().then(() => {
      connection.invoke("SubscribeToCandleUpdates", symbols, intervals);
    });

    return connection;
  }

  static subscribeToCandleUpdates(
    symbols: string[],
    // TODO: Add support for multiple intervals
    intervals: Interval[],
    callback: (symbolIntervalCandle: SymbolIntervalCandle) => void,
  ) {
    const connectionId = `${symbols.join(",")}-${intervals.join(",")}`;

    if (!this.connections.has(connectionId)) {
      const connection = this.createConnection(
        symbols,
        intervals,
        connectionId,
      );
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
    interval: Interval,
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

    try {
      const response = await fetch(`${API_URL}/candles?${params.toString()}`);
      const candles = await response.json();

      return candles.map((candle: Candle) => ({
        ...candle,
        time: convertCandleEpochToLocal(candle.time),
      }));
    } catch {
      toast({
        title: "Error",
        description: "An error occurred while trying to fetch candles data.",
        variant: "destructive",
      });

      return [];
    }
  }

  private static unsubscribe(
    connectionId: string,
    callback: (symbolIntervalCandle: SymbolIntervalCandle) => void,
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

  private static notifySubscribers(
    connectionId: string,
    symbolIntervalCandle: SymbolIntervalCandle,
  ) {
    if (this.subscribers.has(connectionId)) {
      this.subscribers
        .get(connectionId)!
        .forEach((callback) => callback(symbolIntervalCandle));
    }
  }
}
