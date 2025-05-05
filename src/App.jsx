import { BrowserRouter as Router } from "react-router-dom";
import { CssBaseline } from "@mui/material";
import AppRoutes from "./Route";

function App() {
	console.log("🚀 CI/CD Test: Deployment triggered");
    return (
        <Router>
            <CssBaseline />
            <AppRoutes />
        </Router>
    );
}

export default App;
