import React, { useState } from "react";
import Navbar from "../common/Navbar";
import { Stack } from "@mui/material";
import "react-toastify/dist/ReactToastify.css";
import ChessboardComponent from "./ChessboardComponent";

const PassAndPlay = () => {
	const [gameMode] = useState("passandplay");
	return (
		<Stack
			minHeight="100vh"
			justifyContent="center"
			alignItems="center"
			height="100dvh"
			spacing={-10}
			sx={{
				zIndex: 1,
				overflowY: { xs: "auto", sm: "auto", md: "hidden" },
				overflowX: { xs: "auto", sm: "auto", md: "hidden" },
				maxHeight: "100dvh",
			}}
		>
			<Navbar title="" />
			<Stack flexGrow={1} alignItems="center" justifyContent="center">
				<ChessboardComponent
					gameMode={gameMode}
					isAnalysisMode={false}
				/>
			</Stack>
		</Stack>
	);
};

export default PassAndPlay;
