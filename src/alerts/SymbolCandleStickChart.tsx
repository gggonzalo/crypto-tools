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

  const [dataChartApi, setDataChartApi] = useState<IChartApi | null>(null);
  const [dataSeriesApi, setDataSeriesApi] =
    useState<ISeriesApi<"Candlestick"> | null>(null);
  const [rsiChartApi, setRsiChartApi] = useState<IChartApi | null>(null);
  const [rsiSeriesApi, setRsiSeriesApi] =
    useState<ISeriesApi<"Candlestick"> | null>(null);

  const [isLoadingHistoricalCandles, setIsLoadingHistoricalCandles] =
    useState(false);

  // Refs
  const dataChartContainer = useRef<HTMLDivElement>(null);
  const rsiChartContainer = useRef<HTMLDivElement>(null);
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

    setDataChartApi(dataChart);
    setDataSeriesApi(dataSeries);

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

    setRsiChartApi(rsiChart);
    setRsiSeriesApi(rsiSeries);
    return () => {
      dataChart.remove();
      rsiChart.remove();

      setDataChartApi(null);
      setDataSeriesApi(null);
      setRsiChartApi(null);
      setRsiSeriesApi(null);
    };
  }, []);

  // Charts data
  useEffect(() => {
    if (
      !dataChartApi ||
      !dataSeriesApi ||
      !rsiChartApi ||
      !rsiSeriesApi ||
      !symbolInfo
    )
      return;

    dataSeriesApi.applyOptions({
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
      if (timeRange) rsiChartApi.timeScale().setVisibleLogicalRange(timeRange);
    };

    const handleDataChartCrosshairMove = (param: MouseEventParams<Time>) => {
      const dataPoint = getCrosshairDataPoint(dataSeriesApi, param);

      syncCrosshair(rsiChartApi, rsiSeriesApi, dataPoint);
    };

    const handleRsiChartVisibleRangeChange = (
      timeRange: LogicalRange | null,
    ) => {
      if (timeRange) dataChartApi.timeScale().setVisibleLogicalRange(timeRange);
    };

    const handleRsiChartCrosshairMove = (param: MouseEventParams<Time>) => {
      const dataPoint = getCrosshairDataPoint(rsiSeriesApi, param);

      syncCrosshair(dataChartApi, dataSeriesApi, dataPoint);
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

        dataSeriesApi.setData(initialCandles as CandlestickData<Time>[]);

        rsiSeriesService.current.setData(initialCandles);
      } finally {
        setIsLoadingHistoricalCandles(false);
      }

      dataChartApi.applyOptions({
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

      rsiChartApi.applyOptions({
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        timeScale: {
          timeVisible: interval.includes("Minute") || interval.includes("Hour"),
        },
      });

      // Using setTimeout to ensure the rsi series is setup after the data series is ready
      await new Promise((resolve) => setTimeout(resolve, 50));

      rsiSeriesApi.setData(
        rsiSeriesService.current.getRsiData() as CandlestickData<Time>[],
      );
      rsiSeriesApi.priceScale().applyOptions({
        autoScale: true,
        minimumWidth: dataSeriesApi.priceScale().width(),
        visible: true,
      });

      // Charts sync subscriptions
      dataChartApi
        .timeScale()
        .subscribeVisibleLogicalRangeChange(handleDataChartVisibleRangeChange);
      dataChartApi.subscribeCrosshairMove(handleDataChartCrosshairMove);
      rsiChartApi
        .timeScale()
        .subscribeVisibleLogicalRangeChange(handleRsiChartVisibleRangeChange);
      rsiChartApi.subscribeCrosshairMove(handleRsiChartCrosshairMove);

      // Candle updates
      candleUpdatesSubscription = CandlesService.subscribeToCandleUpdates(
        symbolInfo.symbol,
        interval,
        (candle) => {
          const chartCandle = {
            ...candle,
            time: candle.time as Time,
          };

          dataSeriesApi.update(chartCandle);

          rsiSeriesService.current.update(candle);
          rsiSeriesApi.update(
            rsiSeriesService.current.getCurrentRsiCandle() as CandlestickData<Time>,
          );
        },
      );

      // Historical candles
      tryLoadHistoricalCandles = async (
        newVisibleLogicalRange: LogicalRange | null,
      ) => {
        if (!newVisibleLogicalRange) return;

        const barsInfo = dataSeriesApi.barsInLogicalRange(
          newVisibleLogicalRange,
        );

        // If there are less than 100 bars before the visible range, try to load more data
        if (barsInfo && barsInfo.barsBefore < 100) {
          const firstBarTime = dataSeriesApi.data()[0].time as number;
          const secondBarTime = dataSeriesApi.data()[1].time as number;
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

          dataSeriesApi.setData([
            ...(historicalCandles as CandlestickData<Time>[]),
            ...dataSeriesApi.data(),
          ]);

          rsiSeriesService.current.setData([
            ...historicalCandles,
            ...rsiSeriesService.current.getData(),
          ]);
          rsiSeriesApi.setData(
            rsiSeriesService.current.getRsiData() as CandlestickData<Time>[],
          );
        }
      };

      dataChartApi
        .timeScale()
        .subscribeVisibleLogicalRangeChange(tryLoadHistoricalCandles);

      // Initial trigger
      tryLoadHistoricalCandles(
        dataChartApi.timeScale().getVisibleLogicalRange(),
      );
    };

    loadChartDataSources();

    return () => {
      // Candle updates cleanup
      candleUpdatesController.abort();
      candleUpdatesSubscription?.unsubscribe();

      // Historical candles cleanup
      if (tryLoadHistoricalCandles)
        dataChartApi
          .timeScale()
          .unsubscribeVisibleLogicalRangeChange(tryLoadHistoricalCandles);

      // Charts sync cleanup
      dataChartApi
        .timeScale()
        .unsubscribeVisibleLogicalRangeChange(
          handleDataChartVisibleRangeChange,
        );
      dataChartApi.unsubscribeCrosshairMove(handleDataChartCrosshairMove);
      rsiChartApi
        .timeScale()
        .unsubscribeVisibleLogicalRangeChange(handleRsiChartVisibleRangeChange);
      rsiChartApi.unsubscribeCrosshairMove(handleRsiChartCrosshairMove);

      // Clean series
      dataSeriesApi.setData([]);
      rsiSeriesApi.setData([]);

      // Clean charts
      dataChartApi.applyOptions({
        crosshair: {
          mode: CrosshairMode.Hidden,
        },
        rightPriceScale: {
          visible: false,
        },
      });
      dataChartApi.timeScale().resetTimeScale();

      rsiChartApi.applyOptions({
        crosshair: {
          mode: CrosshairMode.Hidden,
        },
        rightPriceScale: {
          visible: false,
        },
      });
      rsiChartApi.timeScale().resetTimeScale();
    };
  }, [
    dataChartApi,
    interval,
    dataSeriesApi,
    symbolInfo,
    rsiChartApi,
    rsiSeriesApi,
  ]);

  // Watermark
  useEffect(() => {
    if (!dataChartApi) return;

    if (!symbolInfo) {
      if (symbolInfoStatus === "loading") {
        dataChartApi.applyOptions({
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
      dataChartApi.applyOptions({
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

    dataChartApi.applyOptions({
      watermark: {
        visible: false,
      },
    });
  }, [dataChartApi, isLoadingHistoricalCandles, symbolInfo, symbolInfoStatus]);

  return (
    <div className="flex h-full flex-col gap-2">
      <div ref={dataChartContainer} className="grow" />
      <div ref={rsiChartContainer} className="h-[150px]" />
    </div>
  );
}

export default SymbolCandleStickChart;
