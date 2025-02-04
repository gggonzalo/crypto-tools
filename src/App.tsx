import Alerts from "@/alerts/Alerts";
import { useEffect, useState } from "react";
import OneSignal from "react-onesignal";
import useAppStore from "@/store";
import {
  Route,
  Routes,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [page, setPage] = useState<string>();

  const handlePageChange = (newPage: string) => {
    navigate(newPage);
    setPage(newPage);
  };

  useEffect(() => {
    setPage(location.pathname);
  }, [location.pathname]);

  // Browser web push requirements reference => https://documentation.onesignal.com/docs/web-push-setup-faq
  useEffect(() => {
    OneSignal.init({
      appId: "207a026a-1076-44d4-bb6c-f2a5804b122f",
      allowLocalhostAsSecureOrigin: true,
    }).then(() => {
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
    });
  }, []);

  return (
    <div className="container mx-auto flex flex-col gap-4 px-4 py-10">
      <ul>
        <li>
          <Select value={page} onValueChange={handlePageChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="/alerts">Alerts</SelectItem>
              <SelectItem value="/portfolio" disabled>
                Portfolio
              </SelectItem>
            </SelectContent>
          </Select>
        </li>
      </ul>
      <Routes>
        <Route path="/alerts" element={<Alerts />}></Route>
        <Route path="*" element={<Navigate to="/alerts" replace />} />
      </Routes>
    </div>
  );
}

export default App;
