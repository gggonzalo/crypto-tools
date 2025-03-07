import CandlesService from "@/services/CandlesService";
import useAlertsStore from "@/alerts/useAlertsStore";
import {
  CandlestickData,
  ColorType,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  LogicalRange,
  LogicalRangeChangeEventHandler,
  MouseEventParams,
  Time,
  createChart,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";
import RsiSeriesService from "@/series/RsiSeriesService";
import { getCrosshairDataPoint, syncCrosshair } from "@/utils";

const CANDLES_REQUEST_LIMIT = 500;

function SymbolCandleStickChart() {
  // Store
  const symbolInfo = useAlertsStore((state) => state.symbolInfo);
  const symbolInfoStatus = useAlertsStore((state) => state.symbolInfoStatus);
  const interval = useAlertsStore((state) => state.interval);

  // State
  const [isLoadingHistoricalCandles, setIsLoadingHistoricalCandles] =
    useState(false);

  // Refs
  const dataChartContainer = useRef<HTMLDivElement>(null);
  const rsiChartContainer = useRef<HTMLDivElement>(null);
  const dataChartApi = useRef<IChartApi | null>(null);
  const dataSeriesApi = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const rsiChartApi = useRef<IChartApi | null>(null);
  const rsiSeriesApi = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lastHistoricalCandlesEndTimeRequested = useRef<number | null>(null);
  const rsiSeriesService = useRef<RsiSeriesService>(new RsiSeriesService());

  // Effects
  // Charts creation
  useEffect(() => {
    if (!dataChartContainer.current || !rsiChartContainer.current) return;

    const dataChart = createChart(dataChartContainer.current, {
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
      },
    });

    const dataSeries = dataChart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    dataChart.applyOptions({
      rightPriceScale: {
        visible: false,
      },
    });

    dataChartApi.current = dataChart;
    dataSeriesApi.current = dataSeries;

    const rsiChart = createChart(rsiChartContainer.current, {
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
      },
    });

    const rsiSeries = rsiChart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    rsiSeries.createPriceLine({
      price: 70,
      color: "#0003",
      lineWidth: 2,
      lineStyle: 3,
      axisLabelVisible: true,
    });
    rsiSeries.createPriceLine({
      price: 30,
      color: "#0003",
      lineWidth: 2,
      lineStyle: 3,
      axisLabelVisible: true,
    });

    rsiChart.applyOptions({
      rightPriceScale: {
        visible: false,
      },
    });

    rsiChartApi.current = rsiChart;
    rsiSeriesApi.current = rsiSeries;

    return () => {
      dataChart.remove();
      rsiChart.remove();

      dataChartApi.current = null;
      dataSeriesApi.current = null;
      rsiChartApi.current = null;
      rsiSeriesApi.current = null;
    };
  }, []);

  // Charts data
  useEffect(() => {
    if (
      !dataChartApi.current ||
      !dataSeriesApi.current ||
      !rsiChartApi.current ||
      !rsiSeriesApi.current ||
      !symbolInfo
    )
      return;

    const dataChart = dataChartApi.current;
    const dataSeries = dataSeriesApi.current;
    const rsiChart = rsiChartApi.current;
    const rsiSeries = rsiSeriesApi.current;

    dataSeries.applyOptions({
      priceFormat: {
        type: "price",
        precision: symbolInfo.priceFormat.precision,
        minMove: symbolInfo.priceFormat.minMove,
      },
    });

    const candleUpdatesController = new AbortController();

    // Charts sync handlers
    const handleDataChartVisibleRangeChange = (
      timeRange: LogicalRange | null,
    ) => {
      if (timeRange) rsiChart.timeScale().setVisibleLogicalRange(timeRange);
    };

    const handleDataChartCrosshairMove = (param: MouseEventParams<Time>) => {
      const dataPoint = getCrosshairDataPoint(dataSeries, param);

      syncCrosshair(rsiChart, rsiSeries, dataPoint);
    };

    const handleRsiChartVisibleRangeChange = (
      timeRange: LogicalRange | null,
    ) => {
      if (timeRange) dataChart.timeScale().setVisibleLogicalRange(timeRange);
    };

    const handleRsiChartCrosshairMove = (param: MouseEventParams<Time>) => {
      const dataPoint = getCrosshairDataPoint(rsiSeries, param);

      syncCrosshair(dataChart, dataSeries, dataPoint);
    };

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

        dataSeries.setData(initialCandles as CandlestickData<Time>[]);

        rsiSeriesService.current.setData(initialCandles);
      } finally {
        setIsLoadingHistoricalCandles(false);
      }

      dataChart.applyOptions({
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

      rsiChart.applyOptions({
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        timeScale: {
          timeVisible: interval.includes("Minute") || interval.includes("Hour"),
        },
      });

      // Using setTimeout to ensure the rsi series is setup after the data series is ready
      await new Promise((resolve) => setTimeout(resolve, 50));

      rsiSeries.setData(
        rsiSeriesService.current.getRsiData() as CandlestickData<Time>[],
      );
      rsiSeries.priceScale().applyOptions({
        autoScale: true,
        minimumWidth: dataSeries.priceScale().width(),
        visible: true,
      });

      // Charts sync subscriptions
      dataChart
        .timeScale()
        .subscribeVisibleLogicalRangeChange(handleDataChartVisibleRangeChange);
      dataChart.subscribeCrosshairMove(handleDataChartCrosshairMove);
      rsiChart
        .timeScale()
        .subscribeVisibleLogicalRangeChange(handleRsiChartVisibleRangeChange);
      rsiChart.subscribeCrosshairMove(handleRsiChartCrosshairMove);

      // Candle updates
      candleUpdatesSubscription = CandlesService.subscribeToCandleUpdates(
        [symbolInfo.symbol],
        [interval],
        ({ candle }) => {
          const chartCandle = {
            ...candle,
            time: candle.time as Time,
          };

          dataSeries.update(chartCandle);

          rsiSeriesService.current.update(candle);
          rsiSeries.update(
            rsiSeriesService.current.getCurrentRsiCandle() as CandlestickData<Time>,
          );
        },
      );

      // Historical candles
      tryLoadHistoricalCandles = async (
        newVisibleLogicalRange: LogicalRange | null,
      ) => {
        if (!newVisibleLogicalRange) return;

        const barsInfo = dataSeries.barsInLogicalRange(newVisibleLogicalRange);

        // If there are less than 100 bars before the visible range, try to load more data
        if (barsInfo && barsInfo.barsBefore < 100) {
          const firstBarTime = dataSeries.data()[0].time as number;
          const secondBarTime = dataSeries.data()[1].time as number;
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

          dataSeries.setData([
            ...(historicalCandles as CandlestickData<Time>[]),
            ...dataSeries.data(),
          ]);

          rsiSeriesService.current.setData([
            ...historicalCandles,
            ...rsiSeriesService.current.getData(),
          ]);
          rsiSeries.setData(
            rsiSeriesService.current.getRsiData() as CandlestickData<Time>[],
          );
        }
      };

      dataChart
        .timeScale()
        .subscribeVisibleLogicalRangeChange(tryLoadHistoricalCandles);

      // Initial trigger
      tryLoadHistoricalCandles(dataChart.timeScale().getVisibleLogicalRange());
    };

    loadChartDataSources();

    return () => {
      // Candle updates cleanup
      candleUpdatesController.abort();
      candleUpdatesSubscription?.unsubscribe();

      const dataChart = dataChartApi.current;
      const rsiChart = rsiChartApi.current;
      const dataSeries = dataSeriesApi.current;
      const rsiSeries = rsiSeriesApi.current;

      if (!dataChart || !rsiChart || !dataSeries || !rsiSeries) return;

      // Historical candles cleanup
      if (tryLoadHistoricalCandles)
        dataChart
          .timeScale()
          .unsubscribeVisibleLogicalRangeChange(tryLoadHistoricalCandles);

      // Charts sync cleanup
      dataChart
        .timeScale()
        .unsubscribeVisibleLogicalRangeChange(
          handleDataChartVisibleRangeChange,
        );
      dataChart.unsubscribeCrosshairMove(handleDataChartCrosshairMove);
      rsiChart
        .timeScale()
        .unsubscribeVisibleLogicalRangeChange(handleRsiChartVisibleRangeChange);
      rsiChart.unsubscribeCrosshairMove(handleRsiChartCrosshairMove);

      // Clean series
      dataSeries.setData([]);
      rsiSeries.setData([]);

      // Clean charts
      dataChart.applyOptions({
        crosshair: {
          mode: CrosshairMode.Hidden,
        },
        rightPriceScale: {
          visible: false,
        },
      });
      dataChart.timeScale().resetTimeScale();

      rsiChart.applyOptions({
        crosshair: {
          mode: CrosshairMode.Hidden,
        },
        rightPriceScale: {
          visible: false,
        },
      });
      rsiChart?.timeScale().resetTimeScale();
    };
  }, [interval, symbolInfo]);

  // Watermark
  useEffect(() => {
    if (!dataChartApi.current) return;

    const dataChart = dataChartApi.current;

    if (!symbolInfo) {
      if (symbolInfoStatus === "loading") {
        dataChart.applyOptions({
          watermark: {
            visible: true,
            fontSize: 24,
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
      dataChart.applyOptions({
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

    dataChart.applyOptions({
      watermark: {
        visible: false,
      },
    });
  }, [isLoadingHistoricalCandles, symbolInfo, symbolInfoStatus]);

  return (
    <div className="flex h-full flex-col gap-2">
      <div ref={dataChartContainer} className="grow" />
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold">RSI</span>
        <div ref={rsiChartContainer} className="h-[140px]" />
      </div>
    </div>
  );
}

export default SymbolCandleStickChart;
