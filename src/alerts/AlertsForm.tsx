import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { CirclePlus, TrendingDown, TrendingUp } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, mapIntervalToLabel } from "@/utils";
import useAlertsStore from "@/alerts/useAlertsStore";
import CandlesService from "@/services/CandlesService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import useAppStore from "@/store";
import AlertsService from "@/services/AlertsService";
import { symbolsDisplayInfo } from "@/constants";

const formSchema = z
  .object({
    type: z.union([z.literal("Price"), z.literal("Rsi")]),
    valueTarget: z.string().superRefine((val, ctx) => {
      if (!val) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Value can't be empty",
        });

        return;
      }

      const num = Number(val);

      if (isNaN(num) || num <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Value must be a positive number",
        });
      }
    }),
  })
  .superRefine((values, ctx) => {
    if (values.type === "Rsi") {
      const num = Number(values.valueTarget);

      if (isNaN(num) || num < 0 || num > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "RSI value must be between 0 and 100",
          path: ["valueTarget"],
        });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

type Props = {
  onAlertCreated: () => void;
};

function AlertsForm({ onAlertCreated }: Props) {
  const pushNotificationsStatus = useAppStore(
    (state) => state.pushNotificationsStatus,
  );
  const symbolInfo = useAlertsStore((state) => state.symbolInfo);
  const interval = useAlertsStore((state) => state.interval);

  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      type: "Price",
      valueTarget: "",
    },
    mode: "onChange",
    resolver: zodResolver(formSchema),
  });

  const [type, valueTarget] = useWatch({
    control: form.control,
    name: ["type", "valueTarget"],
  });

  const handleFormSubmit = async (data: FormValues) => {
    if (!symbolInfo) return;

    setIsFormSubmitting(true);

    const { type, valueTarget } = data;

    try {
      const success = await AlertsService.createAlert(
        symbolInfo.symbol,
        interval,
        Number(valueTarget),
        type,
      );

      if (success) {
        onAlertCreated();

        form.setValue("valueTarget", "");
      }
    } finally {
      setIsFormSubmitting(false);
    }
  };

  useEffect(() => {
    form.setValue("valueTarget", "");
  }, [form, symbolInfo]);

  useEffect(() => {
    if (!symbolInfo?.symbol) return;

    const candleUpdatesSubscription = CandlesService.subscribeToCandleUpdates(
      [symbolInfo.symbol],
      [interval],
      ({ candle }) => setCurrentPrice(candle.close),
    );

    return () => {
      candleUpdatesSubscription.unsubscribe();

      setCurrentPrice(null);
    };
  }, [interval, symbolInfo?.symbol]);

  const renderFormHeader = () => {
    if (!symbolInfo?.symbol) {
      return (
        <CardHeader>
          <CardTitle>New Alert</CardTitle>
          <div className="h-6" />
        </CardHeader>
      );
    }

    return (
      <CardHeader>
        <CardTitle>New Alert</CardTitle>
        <CardDescription className="flex items-center gap-1.5">
          <img
            className="size-5"
            src={symbolsDisplayInfo[symbolInfo.symbol].logo}
          />
          {symbolInfo.symbol}
          {type === "Rsi" ? `, ${mapIntervalToLabel(interval)}` : null}
        </CardDescription>
      </CardHeader>
    );
  };

  const renderFormContent = () => {
    if (!symbolInfo?.symbol) {
      return (
        <>
          <CardContent className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-[6rem]" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-[6rem]" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-9 w-full" />
          </CardFooter>
        </>
      );
    }

    const renderHelperText = () => {
      if (!symbolInfo || type === "Rsi") return null;

      const priceAsNumber = Number(valueTarget);

      if (!priceAsNumber || !currentPrice) return;

      const isAlertBullish = priceAsNumber > currentPrice;

      return (
        <div className="mt-6 flex flex-col gap-3">
          <p className="text-balance text-center text-sm text-muted-foreground">
            Creating {isAlertBullish ? "bullish" : "bearish"} alert for{" "}
            {symbolInfo.symbol}:
          </p>
          <div className="grid grid-cols-3">
            <span className="justify-self-end font-semibold">
              {formatPrice(currentPrice, symbolInfo.priceFormat)}
            </span>
            {isAlertBullish ? (
              <TrendingUp className="size-6 shrink-0 justify-self-center stroke-[#26a69a]" />
            ) : (
              <TrendingDown className="size-6 shrink-0 justify-self-center stroke-[#ef5350]" />
            )}
            <span className="justify-self-start font-semibold">
              {formatPrice(priceAsNumber, symbolInfo.priceFormat)}
            </span>
          </div>
        </div>
      );
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)}>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alert type</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        disabled={isFormSubmitting}
                        onValueChange={(newValue) => {
                          field.onChange(newValue);

                          form.setValue("valueTarget", "");
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a type…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Price">Price Alert</SelectItem>
                          <SelectItem value="Rsi">RSI Alert</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="valueTarget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target value</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={
                          type === "Price"
                            ? `Price in ${symbolInfo.quoteAsset}`
                            : "Value between 0 and 100"
                        }
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {renderHelperText()}
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              disabled={
                pushNotificationsStatus !== "active" || isFormSubmitting
              }
            >
              <CirclePlus />
              Create Alert
            </Button>
          </CardFooter>
        </form>
      </Form>
    );
  };

  return (
    <Card className="flex-1">
      {renderFormHeader()}
      {renderFormContent()}
    </Card>
  );
}

export default AlertsForm;
