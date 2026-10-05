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
  const mainBackground = theme.palette.mode === "dark"
    ? theme.palette.background.default
    : theme.palette.background.paper;

  return (
    <Box
      className="app-layout"
      style={{
        "--app-layout-background": theme.palette.background.default,
        "--app-main-background": mainBackground,
        "--app-main-text": theme.palette.text.primary,
      }}
    >
      {/* ✅ Sidebar */}
      <Sidebar
        open={sidebarOpen}
        toggleSidebar={toggleSidebar}
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
        <Footer />
      </Box>
    </Box>
  );
};

export default Layout;
