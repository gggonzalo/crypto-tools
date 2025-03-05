import { toast } from "@/hooks/use-toast";
import { Alert, AlertType, Interval } from "@/types";
import { API_URL } from "@/constants";
import PushNotificationsService from "./PushNotificationsService";

export default class AlertsService {
  static async createAlert(
    symbol: string,
    interval: Interval,
    valueTarget: number,
    type: AlertType,
  ) {
    try {
      const createAlertBody =
        type === "Price"
          ? JSON.stringify({
              symbol,
              valueTarget,
              type,
              subscriptionId: PushNotificationsService.getSubscriptionId(),
            })
          : JSON.stringify({
              symbol,
              rsiInterval: interval,
              valueTarget,
              type,
              subscriptionId: PushNotificationsService.getSubscriptionId(),
            });

      const response = await fetch(`${API_URL}/alerts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: createAlertBody,
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
          "You will receive a notification when the value reaches the target.",
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
      const subscriptionId = PushNotificationsService.getSubscriptionId();

      if (!subscriptionId) return [];

      const response = await fetch(
        `${API_URL}/alerts?subscriptionId=${subscriptionId}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch alerts");
      }

      return await response.json();
    } catch {
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
      const response = await fetch(`${API_URL}/alerts/${alertId}`, {
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
