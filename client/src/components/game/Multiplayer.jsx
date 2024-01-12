import React, { useState } from "react";
import Navbar from "../common/Navbar";
import { Stack } from "@mui/material";
import "react-toastify/dist/ReactToastify.css";
import ChessboardComponent from "./ChessboardComponent";

const Multiplayer = () => {
	const [gameMode] = useState("multiplayer");

	return (
		<Stack>
			<Navbar gameMode={gameMode} />
			<Stack
				minHeight="100dvh"
				justifyContent="center"
				alignItems="center"
				height={{ xs: "100dvh", md: "300dvh" }}
			>
				<Stack flexGrow={1}>
					<Stack>
						<ChessboardComponent
							gameMode={gameMode}
							isAnalysisMode={false}
						/>
					</Stack>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default Multiplayer;
