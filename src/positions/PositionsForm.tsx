import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import PositionsService from "@/services/PositionsService";
import SymbolsCombobox from "../components/SymbolsCombobox";
import usePositionsStore from "./usePositionsStore";

const formSchema = z.object({
  side: z.union([z.literal("Buy"), z.literal("Sell")]),
  amount: z.string().superRefine((val, ctx) => {
    if (!val) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Amount is required",
      });
      return;
    }

    const num = Number(val);

    if (isNaN(num) || num <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Amount must be a positive number",
      });
    }
  }),
  price: z.string().superRefine((val, ctx) => {
    if (!val) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Price is required",
      });
      return;
    }

    const num = Number(val);

    if (isNaN(num) || num <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Price must be a positive number",
      });
    }
  }),
  tp: z.string().superRefine((val, ctx) => {
    if (!val) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Take profit is required",
      });
      return;
    }

    const num = Number(val);

    if (isNaN(num) || num <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Take profit must be a positive number",
      });
    }
  }),
});

type FormValues = z.infer<typeof formSchema>;

type Props = {
  onPositionCreated?: () => void;
};

function PositionsForm({ onPositionCreated }: Props) {
  // Store
  const symbol = usePositionsStore((state) => state.newPositionSymbol);

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      side: "Buy",
      amount: "",
      price: "",
      tp: "",
    },
    mode: "onChange",
    resolver: zodResolver(formSchema),
  });

  // Functions
  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await PositionsService.createPosition({
        symbol: symbol,
        side: values.side,
        amount: Number(values.amount),
        price: Number(values.price),
        tp: Number(values.tp),
      });

      form.reset();
      onPositionCreated?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <SymbolsCombobox
          value={symbol}
          onValueChange={(newSymbol) =>
            usePositionsStore.setState({ newPositionSymbol: newSymbol })
          }
        />
        <div className="flex gap-3">
          <FormField
            control={form.control}
            name="side"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Side</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Buy">Buy</SelectItem>
                    <SelectItem value="Sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="off" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex gap-3">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Entry Price</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="off" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tp"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Take Profit</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="off" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Add Position
        </Button>
      </form>
    </Form>
  );
}

export default PositionsForm;
