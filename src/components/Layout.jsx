import React from "react";
import { Box } from "@mui/material";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Layout = ({ sidebarOpen, toggleSidebar, themeColor, setThemeColor, children }) => {
    return (
        <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#F4F4F4" }}>
            {/* ✅ Sidebar */}
            <Sidebar open={sidebarOpen} toggleSidebar={toggleSidebar} themeColor={themeColor} />

            <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
                {/* ✅ Navbar */}
                <Navbar 
                    sidebarOpen={sidebarOpen} 
                    toggleSidebar={toggleSidebar} 
                    themeColor={themeColor} 
                    setThemeColor={setThemeColor} 
                />

               {/* ✅ Main Body */}
                <Box
                    sx={{
                        flexGrow: 1,
                        p: 3,
                        display: "flex",
                        justifyContent: "flex-start",  // ✅ Left se start karega
                        alignItems: "flex-start",      // ✅ Top pe align hoga
                        backgroundColor: "#fff",
                        minHeight: "100vh",            // ✅ Full height cover karega
                    }}
                >
                    {children}
                </Box>


                {/* ✅ Footer with themeColor */}
                <Footer themeColor={themeColor} />
            </Box>
        </Box>
    );
};

export default Layout;
