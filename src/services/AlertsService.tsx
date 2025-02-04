import OneSignal from "react-onesignal";
import { toast } from "@/hooks/use-toast";
import { Alert } from "@/types";
import { API_URL } from "@/constants";

export default class AlertsService {
  static async createAlert(symbol: string, valueTarget: number) {
    try {
      const response = await fetch(`${API_URL}/alerts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symbol,
          valueTarget,
          subscriptionId: OneSignal.User.PushSubscription.id,
        }),
      });

      if (!response.ok) {
        const errorResponse = await response.json();

        toast({
          title: "Error",
          description: errorResponse,
          variant: "destructive",
        });

        return false;
      }

      toast({
        title: "Success",
        description:
          "You will receive a notification when the price hits the target.",
      });

      return true;
    } catch {
      toast({
        title: "Error",
        description: "An unknown error occurred while creating the alert.",
        variant: "destructive",
      });

      return false;
    }
  }

  static async getUserAlerts(): Promise<Alert[]> {
    try {
      const subscriptionId = OneSignal.User.PushSubscription.id;

      if (!subscriptionId) return [];

      const response = await fetch(
        `{API_URL}/alerts?subscriptionId=${subscriptionId}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch alerts");
      }

      return await response.json();
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while fetching alerts.",
        variant: "destructive",
      });

      return [];
    }
  }

  static async deleteAlert(alertId: string): Promise<boolean> {
    try {
      const response = await fetch(`/alerts/${alertId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        toast({
          title: "Error",
          description: errorResponse,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Alert deleted successfully.",
      });

      return true;
    } catch {
      toast({
        title: "Error",
        description: "An unknown error occurred while deleting the alert.",
        variant: "destructive",
      });
      return false;
    }
  }
}
