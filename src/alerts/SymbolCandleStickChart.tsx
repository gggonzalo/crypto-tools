import CandlesService from "@/services/CandlesService";
import useAlertsStore from "@/alerts/store";
import {
  CandlestickData,
  ColorType,
  CrosshairMode,
  IChartApi,
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

  const [isLoadingHistoricalCandles, setIsLoadingHistoricalCandles] =
    useState(false);

  // Refs
  const chartContainer = useRef<HTMLDivElement>(null);
  const chartApi = useRef<IChartApi | null>(null);
 
  const lastHistoricalCandlesEndTimeRequested = useRef<number | null>(null);

  // Effects
  // Chart creation and data loading
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
        timeVisible: interval.includes("Minute") || interval.includes("Hour"),
      },
    });
    chartApi.current = chart;
    
    if (!symbolInfo) {
        chart.remove();
        chartApi.current = null;
    }

    const series = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    series.applyOptions({
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

        series.setData(initialCandles as CandlestickData<Time>[]);
      } finally {
        setIsLoadingHistoricalCandles(false);
      }

      chart.applyOptions({
        crosshair: {
          mode: CrosshairMode.Normal,
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

          series.update(chartCandle);
        },
      );

      // Historical candles
      tryLoadHistoricalCandles = async (
        newVisibleLogicalRange: LogicalRange | null,
      ) => {
        if (!newVisibleLogicalRange) return;

        const barsInfo = series.barsInLogicalRange(newVisibleLogicalRange);

        // If there are less than 100 bars before the visible range, try to load more data
        if (barsInfo && barsInfo.barsBefore < 100) {
          const firstBarTime = series.data()[0].time as number;
          const secondBarTime = series.data()[1].time as number;
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

          series.setData([
            ...(historicalCandles as CandlestickData<Time>[]),
            ...series.data(),
          ]);
        }
      };

      chart
        .timeScale()
        .subscribeVisibleLogicalRangeChange(tryLoadHistoricalCandles);

      // Initial trigger
      tryLoadHistoricalCandles(chart.timeScale().getVisibleLogicalRange());
    };

    loadChartDataSources();

    return () => {
      // Candle updates cleanup
      candleUpdatesController.abort();
      candleUpdatesSubscription?.unsubscribe();

      // Historical candles cleanup
      if (tryLoadHistoricalCandles)
        chart
          .timeScale()
          .unsubscribeVisibleLogicalRangeChange(tryLoadHistoricalCandles);

      chart.remove();
      chartApi.current = null;
    };
  }, [interval, symbolInfo]);

  // Watermark
  useEffect(() => {
    const chart = chartApi.current;

    if (!chart) return;

    if (!symbolInfo) {
        if (symbolInfoStatus === "loading") {
          chart.applyOptions({
            watermark: {
              visible: true,
              fontSize: 24,
              horzAlign: "center",
              vertAlign: "center",
              color: "rgba(115, 115, 115)",
              text: "Loading symbol info...",
            },
          });
  
          return;
        }
    }

    if (isLoadingHistoricalCandles) {
      chart.applyOptions({
        watermark: {
          visible: true,
          fontSize: 24,
          horzAlign: "center",
          vertAlign: "center",
          color: "rgba(115, 115, 115)",
          text: "Loading historical data...",
        },
      });

      return;
    }

    chart.applyOptions({
      watermark: {
        visible: false,
      },
    });
  }, [
    isLoadingHistoricalCandles,
    symbolInfo?.symbol,
    symbolInfoStatus,
  ]);

  return <div ref={chartContainer} className="size-full"></div>;
}

export default SymbolCandleStickChart;
