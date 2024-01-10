import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

function Navbar({ onClick, title }) {
	const navigate = useNavigate();

	const handleButtonClick = onClick || (() => navigate("/"));

	return (
		<AppBar
			position="static"
			sx={{ zIndex: 1, background: "none", boxShadow: "none" }}
		>
			<Toolbar
				style={{ display: "flex", justifyContent: "space-between" }}
			>
				<Button
					variant="outlined"
					edge="start"
					onClick={handleButtonClick}
					sx={{
						color: "rgba(255, 255, 255, 0.8)",
						borderColor: "rgba(255, 255, 255, 0.8)",
						"&:hover": {
							backgroundColor: "primary.main",
						},
						ml: 1,
						mt: 1,
					}}
				>
					<ArrowBackRoundedIcon sx={{ mr: 1 }} />
					Go back to menu
				</Button>
				<Typography variant="h4">{title}</Typography>
			</Toolbar>
		</AppBar>
	);
}

Navbar.propTypes = {
	onClick: PropTypes.func,
	title: PropTypes.string,
};

export default Navbar;
