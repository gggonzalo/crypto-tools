import { API_URL } from "@/constants";
import { toast } from "@/hooks/use-toast";

export default class SymbolsService {
  static async fetchSymbolsInfo(symbols: string[]) {
    try {
      const response = await fetch(`${API_URL}/symbols/${symbols.join(",")}`);

      if (!response.ok) throw new Error("Symbols info not found");

      const data = await response.json();
      return data;
    } catch (e) {
      if (e instanceof Error) {
        toast({
          title: "Error",
          description: "An error occurred while fetching symbols info.",
          variant: "destructive",
        });
      }

      return {};
    }
  }
}
