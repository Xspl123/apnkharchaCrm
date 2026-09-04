import { Box, useMediaQuery, useTheme } from "@mui/material";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import RouteFlash from "./RouteFlash";
import "./Layout.css";

const Layout = ({
  sidebarOpen,
  toggleSidebar,
  colorMode,
  toggleColorMode,
  children,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const themeColor = colorMode === "dark" ? "#0f172a" : "#3b82f6";

  return (
    <Box
      className="app-layout"
    >
      {/* ✅ Sidebar */}
      <Sidebar
        open={sidebarOpen}
        toggleSidebar={toggleSidebar}
        themeColor={themeColor}
        isMobile={isMobile}
      />

      {/* ✅ Main Wrapper */}
      <Box className="app-layout__content-wrap">

        {/* ✅ Navbar */}
        <Navbar
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          colorMode={colorMode}
          toggleColorMode={toggleColorMode}
          themeColor={themeColor}
        />

        {/* ✅ Main Content */}
       <Box
            component="main"
            className="app-layout__main"
        >
          <RouteFlash />
          {children}
        </Box>

        {/* ✅ Footer */}
        <Footer themeColor={themeColor} />
      </Box>
    </Box>
  );
};

export default Layout;