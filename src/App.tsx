import Alerts from "@/alerts/Alerts";
import { useEffect, useState } from "react";
import PushNotificationsService from "@/services/PushNotificationsService";
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

  useEffect(() => {
    PushNotificationsService.initialize();
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
