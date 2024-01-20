import {
	StyledEngineProvider,
	ThemeProvider,
	createTheme,
} from "@mui/material/styles";
import React, { createContext, useMemo, useState } from "react";
import PropTypes from "prop-types";

export const ThemeContext = createContext({
	switchColorMode: () => {},
});

export function ThemeContextProvider({ children }) {
	const [mode, setMode] = useState("dark");

	const switchColorMode = () => {
		setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
	};

	const theme = useMemo(
		() =>
			createTheme({
				palette: {
					mode: mode,
					primary: {
						main: "#f24040", // red
					},
					secondary: {
						main: "#87BCDE", // blue
					},
					error: {
						main: "#c490d1", // purple
					},
					warning: {
						main: "#f49f0a", // orange
					},
					info: {
						main: "#565676", // indigo
					},
					background: {
						default: mode === "dark" ? "#101010" : "#fff",
					},
				},
				typography: {
					fontFamily: "'IBM Plex Mono', monospace",
					h1: {
						fontFamily: "'Bebas Neue', cursive",
					},
					h2: {
						fontFamily: "'Bebas Neue', cursive",
					},
					h3: {
						fontFamily: "'Bebas Neue', cursive",
					},
					h4: {
						fontFamily: "'Bebas Neue', cursive",
					},
					h5: {
						fontFamily: "'Bebas Neue', cursive",
					},
					h6: {
						fontFamily: "'Bebas Neue', cursive",
					},
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
