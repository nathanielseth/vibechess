import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const ColorModeContext = React.createContext({ toggleColorMode: () => {} });

function ToggleColorMode({ children }) {
	const [mode, setMode] = useState("dark");

	const colorMode = useMemo(
		() => ({
			toggleColorMode: () => {
				const newMode = mode === "light" ? "dark" : "light";
				setMode(newMode);
				localStorage.setItem("selectedUITheme", newMode);
			},
		}),
		[mode]
	);

	const theme = useMemo(
		() =>
			createTheme({
				palette: {
					mode,
				},
			}),
		[mode]
	);

	return (
		<ColorModeContext.Provider value={colorMode}>
			<ThemeProvider theme={theme}>{children}</ThemeProvider>
		</ColorModeContext.Provider>
	);
}

ToggleColorMode.propTypes = {
	children: PropTypes.node.isRequired,
};

export { ColorModeContext, ToggleColorMode };
