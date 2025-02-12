import CandlesService from "@/services/CandlesService";
import useAlertsStore from "@/alerts/store";
import {
  CandlestickData,
  ColorType,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  LogicalRange,
  LogicalRangeChangeEventHandler,
  Time,
  createChart,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";

const CANDLES_REQUEST_LIMIT = 500;

function SymbolCandleStickChart() {
  // Store
  const symbolInfo = useAlertsStore((state) => state.symbolInfo);
  const symbolInfoStatus = useAlertsStore((state) => state.symbolInfoStatus);
  const interval = useAlertsStore((state) => state.interval);

  const [chartApi, setChartApi] = useState<IChartApi | null>(null);
  const [seriesApi, setSeriesApi] = useState<ISeriesApi<"Candlestick"> | null>(
    null,
  );
  const [isLoadingHistoricalCandles, setIsLoadingHistoricalCandles] =
    useState(false);

  // Refs
  const chartContainer = useRef<HTMLDivElement>(null);
  const lastHistoricalCandlesEndTimeRequested = useRef<number | null>(null);

  // Effects
  // Chart creation
  useEffect(() => {
    if (!chartContainer.current) return;

    const chart = createChart(chartContainer.current, {
      autoSize: true,
      crosshair: {
        mode: CrosshairMode.Hidden,
      },
      layout: {
        background: { type: ColorType.Solid, color: "white" },
        textColor: "rgb(115, 115, 115)",
      },
      rightPriceScale: {
        borderColor: "rgb(115, 115, 115)",
      },
      timeScale: {
        borderColor: "rgb(115, 115, 115)",
        secondsVisible: false,
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    setChartApi(chart);
    setSeriesApi(series);

    return () => {
      chart.remove();

      setChartApi(null);
      setSeriesApi(null);
    };
  }, []);

  // Chart data
  useEffect(() => {
    if (!chartApi || !seriesApi || !symbolInfo) return;

    seriesApi.applyOptions({
      priceFormat: {
        type: "price",
        precision: symbolInfo.priceFormat.precision,
        minMove: symbolInfo.priceFormat.minMove,
      },
    });

    const candleUpdatesController = new AbortController();

    let candleUpdatesSubscription: { unsubscribe: () => void } | null = null;
    let tryLoadHistoricalCandles: LogicalRangeChangeEventHandler | null = null;

    const loadChartDataSources = async () => {
      // Initial candles
      setIsLoadingHistoricalCandles(true);

      try {
        const initialCandles = await CandlesService.getCandles(
          symbolInfo.symbol,
          interval,
          CANDLES_REQUEST_LIMIT,
        );

        if (candleUpdatesController.signal.aborted) return;

        seriesApi.setData(initialCandles as CandlestickData<Time>[]);
      } finally {
        setIsLoadingHistoricalCandles(false);
      }

      chartApi.applyOptions({
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        rightPriceScale: {
          autoScale: true,
          visible: true,
        },
        timeScale: {
          timeVisible: interval.includes("Minute") || interval.includes("Hour"),
        },
      });

      // Candle updates
      candleUpdatesSubscription = CandlesService.subscribeToCandleUpdates(
        symbolInfo.symbol,
        interval,
        (candle) => {
          const chartCandle = {
            ...candle,
            time: candle.time as Time,
          };

          seriesApi.update(chartCandle);
        },
      );

      // Historical candles
      tryLoadHistoricalCandles = async (
        newVisibleLogicalRange: LogicalRange | null,
      ) => {
        if (!newVisibleLogicalRange) return;

        const barsInfo = seriesApi.barsInLogicalRange(newVisibleLogicalRange);

        // If there are less than 100 bars before the visible range, try to load more data
        if (barsInfo && barsInfo.barsBefore < 100) {
          const firstBarTime = seriesApi.data()[0].time as number;
          const secondBarTime = seriesApi.data()[1].time as number;
          const timeDifference = secondBarTime - firstBarTime;

          const newHistoricalCandlesEndTime = firstBarTime - timeDifference;

          if (
            lastHistoricalCandlesEndTimeRequested.current ===
            newHistoricalCandlesEndTime
          )
            return;

          lastHistoricalCandlesEndTimeRequested.current =
            newHistoricalCandlesEndTime;

          const historicalCandles = await CandlesService.getCandles(
            symbolInfo.symbol,
            interval,
            CANDLES_REQUEST_LIMIT,
            newHistoricalCandlesEndTime,
          );

          if (candleUpdatesController.signal.aborted) return;

          seriesApi.setData([
            ...(historicalCandles as CandlestickData<Time>[]),
            ...seriesApi.data(),
          ]);
        }
      };

      chartApi
        .timeScale()
        .subscribeVisibleLogicalRangeChange(tryLoadHistoricalCandles);

      // Initial trigger
      tryLoadHistoricalCandles(chartApi.timeScale().getVisibleLogicalRange());
    };

    loadChartDataSources();

    return () => {
      // Candle updates cleanup
      candleUpdatesController.abort();
      candleUpdatesSubscription?.unsubscribe();

      // Historical candles cleanup
      if (tryLoadHistoricalCandles)
        chartApi
          .timeScale()
          .unsubscribeVisibleLogicalRangeChange(tryLoadHistoricalCandles);

      // Clean series
      seriesApi.setData([]);

      // Clean chart
      chartApi.applyOptions({
        crosshair: {
          mode: CrosshairMode.Hidden,
        },
        rightPriceScale: {
          visible: false,
        },
      });
      chartApi.timeScale().resetTimeScale();
    };
  }, [chartApi, interval, seriesApi, symbolInfo]);

  // Watermark
  useEffect(() => {
    if (!chartApi) return;

    if (!symbolInfo) {
      if (symbolInfoStatus === "loading") {
        chartApi.applyOptions({
          watermark: {
            visible: true,
            fontSize: 20,
            horzAlign: "center",
            vertAlign: "center",
            color: "rgba(115, 115, 115)",
            text: "Loading symbol info...",
          },
        });
      }

      return;
    }

    if (isLoadingHistoricalCandles) {
      chartApi.applyOptions({
        watermark: {
          visible: true,
          fontSize: 20,
          horzAlign: "center",
          vertAlign: "center",
          color: "rgba(115, 115, 115)",
          text: "Loading historical data...",
        },
      });

      return;
    }

    chartApi.applyOptions({
      watermark: {
        visible: false,
      },
    });
  }, [chartApi, isLoadingHistoricalCandles, symbolInfo, symbolInfoStatus]);

  return <div ref={chartContainer} className="size-full"></div>;
}

export default SymbolCandleStickChart;
