import React, { Suspense, useState, useEffect } from "react";
import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CssBaseline from "@mui/material/CssBaseline";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeContextProvider } from "./theme/ThemeContextProvider";
import SocketProvider from "./context/SocketProvider";
import { useTheme } from "@mui/material/styles";
import PassAndPlay from "./components/game/PassAndPlay";
import VersusBot from "./components/game/VersusBot";
import Multiplayer from "./components/game/Multiplayer";
import Room from "./components/menu/Room";
import Loading from "./components/common/Loading";

const WelcomeScreen = React.lazy(() =>
	import("./components/menu/WelcomeScreen")
);
const Menu = React.lazy(() => import("./components/menu/Menu"));

const App = () => {
	const theme = useTheme();
	const storedUsername = window.localStorage.getItem("username");
	const storedFlag = window.localStorage.getItem("selectedFlag");
	const [username, setUsername] = useState(storedUsername);
	const [flag, setFlag] = useState(storedFlag);
	const [usernameSubmitted, setUsernameSubmitted] = useState(
		!!storedUsername
	);

	useEffect(() => {
		if (username && usernameSubmitted) {
			window.localStorage.setItem("username", username);
		}
	}, [username, usernameSubmitted]);

	const setUsernameCallback = (newUsername) => {
		setUsername(newUsername);
		setUsernameSubmitted(true);
		window.localStorage.setItem("username", newUsername);
	};

	const setFlagCallback = (newFlag) => {
		setFlag(newFlag);
		window.localStorage.setItem("selectedFlag", newFlag);
	};

	const handleUsernameSubmit = () => {
		if (username) {
			setUsernameSubmitted(true);
			window.localStorage.setItem("username", username);
		}
	};

	return (
		<ThemeContextProvider value={theme}>
			<CssBaseline />
			<SocketProvider>
				<Router basename="/vibechess">
					<Suspense fallback={<Loading />}>
						<Routes>
							<Route
								path="/"
								element={
									!usernameSubmitted || !username ? (
										<WelcomeScreen
											setUsernameCallback={
												setUsernameCallback
											}
											setFlagCallback={setFlagCallback}
											onSubmit={handleUsernameSubmit}
										/>
									) : (
										<Menu username={username} flag={flag} />
									)
								}
							/>
							<Route
								path="/pass-and-play"
								element={<PassAndPlay />}
							/>
							<Route path="/versus-bot" element={<VersusBot />} />
							<Route
								path="/multiplayer"
								element={<Multiplayer />}
							/>
							<Route path="/room" element={<Room />} />
						</Routes>
					</Suspense>
				</Router>
			</SocketProvider>
			<ToastContainer
				transition={Slide}
				position="top-center"
				autoClose={3000}
				hideProgressBar={false}
				newestOnTop={false}
				closeOnClick
				rtl={false}
				pauseOnFocusLoss
				draggable
				pauseOnHover
				theme="colored"
			/>
		</ThemeContextProvider>
	);
};

export default App;
