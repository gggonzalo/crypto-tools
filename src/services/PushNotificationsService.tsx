import OneSignal from "react-onesignal";
import useAppStore from "@/store";

export default class PushNotificationsService {
  static async initialize() {
    const isDev = import.meta.env.DEV;

    // TODO: Remove this when we have a real dev appId
    if (isDev) {
      useAppStore.setState({
        pushNotificationsStatus: "active",
      });

      return;
    }

    // Browser web push requirements reference => https://documentation.onesignal.com/docs/web-push-setup-faq
    await OneSignal.init({
      appId: "207a026a-1076-44d4-bb6c-f2a5804b122f",
      allowLocalhostAsSecureOrigin: true,
    });

    useAppStore.setState({
      pushNotificationsStatus: OneSignal.Notifications.permission
        ? "active"
        : "inactive",
    });

    OneSignal.Notifications.addEventListener(
      "permissionChange",
      (newPermission) => {
        useAppStore.setState({
          pushNotificationsStatus: newPermission ? "active" : "inactive",
        });
      },
    );
  }

  static getSubscriptionId() {
    const isDev = import.meta.env.DEV;

    if (isDev) {
      // Dev GUID
      return "00000000-0000-0000-0000-000000000001";
    }

    return OneSignal.User.PushSubscription.id;
  }

  static promptNotifications() {
    return OneSignal.Slidedown.promptPush({
      force: true,
    });
  }
}
