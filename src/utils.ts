import { Interval } from "@/types";

export function convertLocalEpochToUtcDate(localEpoch: number) {
  return new Date(
    new Date(localEpoch * 1000).toLocaleString("en-US", { timeZone: "UTC" }),
  );
}

export function convertCandleEpochToLocal(originalEpoch: number) {
  const d = new Date(originalEpoch * 1000);

  return (
    Date.UTC(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
      d.getMilliseconds(),
    ) / 1000
  );
}

export function mapIntervalToLabel(interval: Interval) {
  switch (interval) {
    case "OneMinute":
      return "1m";
    case "FiveMinutes":
      return "5m";
    case "FifteenMinutes":
      return "15m";
    case "OneHour":
      return "1h";
    case "FourHour":
      return "4h";
    case "OneDay":
      return "1d";
    case "OneWeek":
      return "1w";
    case "OneMonth":
      return "1M";
  }
}
