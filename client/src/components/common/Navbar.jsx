import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { AppBar, IconButton, Toolbar, Typography } from "@mui/material";
import { VibeChessLogo } from "../../styles/styles";

function Navbar({ onClick, title }) {
	const navigate = useNavigate();

	const handleButtonClick = onClick || (() => navigate("/"));

	return (
		<AppBar
			position="static"
			sx={{ zIndex: 24, background: "none", boxShadow: "none" }}
		>
			<Toolbar
				style={{ display: "flex", justifyContent: "space-between" }}
			>
				<IconButton
					title="Go back to main menu"
					edge="start"
					onClick={handleButtonClick}
					sx={{ ml: 1, mt: 1 }}
				>
					<img
						src={VibeChessLogo}
						alt="VibeChess Logo"
						style={{
							width: "45px",
							height: "auto",
						}}
					/>
				</IconButton>
				<Typography variant="h4" style={{ color: "gray" }}>
					{title}
				</Typography>
				<div style={{ width: 48 }} />{" "}
			</Toolbar>
		</AppBar>
	);
}

Navbar.propTypes = {
	onClick: PropTypes.func,
	title: PropTypes.string,
};

export default Navbar;
