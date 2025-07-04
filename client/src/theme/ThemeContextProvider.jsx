import {
	StyledEngineProvider,
	ThemeProvider,
	createTheme,
} from "@mui/material/styles";
import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { ThemeContext } from "./ThemeContext";

export function ThemeContextProvider({ children }) {
	const [mode, setMode] = useState("dark");

	const switchColorMode = () => {
		setTimeout(() => {
			setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
		});
	};

	const theme = useMemo(
		() =>
			createTheme({
				palette: {
					mode: mode,
					primary: { main: "#f24040" },
					secondary: { main: "#87BCDE" },
					error: { main: "#c490d1" },
					warning: { main: "#f49f0a" },
					info: { main: "#565676" },
					background: {
						default: mode === "dark" ? "#101010" : "#fff8f0",
					},
				},
				typography: {
					fontFamily: "'IBM Plex Mono', monospace",
					h1: { fontFamily: "'Bebas Neue', cursive" },
					h2: { fontFamily: "'Bebas Neue', cursive" },
					h3: { fontFamily: "'Bebas Neue', cursive" },
					h4: { fontFamily: "'Bebas Neue', cursive" },
					h5: { fontFamily: "'Bebas Neue', cursive" },
					h6: { fontFamily: "'Bebas Neue', cursive" },
				},
			}),
		[mode]
	);

	return (
		<StyledEngineProvider injectFirst>
			<ThemeContext.Provider value={{ switchColorMode }}>
				<ThemeProvider theme={theme}>{children}</ThemeProvider>
			</ThemeContext.Provider>
		</StyledEngineProvider>
	);
}

ThemeContextProvider.propTypes = {
	children: PropTypes.node.isRequired,
};
