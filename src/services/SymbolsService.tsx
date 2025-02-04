import { API_URL } from "@/constants";
import { toast } from "@/hooks/use-toast";

export default class SymbolsService {
  static async fetchSymbolInfo(symbol: string) {
    try {
      const response = await fetch(`${API_URL}/symbols/${symbol}`);

      if (!response.ok) throw new Error("Symbol info not found");

      return await response.json();
    } catch (e) {
      if (e instanceof Error) {
        toast({
          title: "Error",
          description: "An error occurred while fetching symbol info.",
          variant: "destructive",
        });
      }

      return null;
    }
  }
}
