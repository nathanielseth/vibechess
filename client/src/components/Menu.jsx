import React from "react";
import styled from "styled-components";
import VibeChessLogo from "../icons/vibechess.svg";

const HeaderContainer = styled.div`
	display: flex;
	align-items: center;
	flex-direction: column;
	margin-bottom: 20px;
`;

const Logo = styled.img`
	width: 8%;
	height: auto;
	margin-bottom: 10px;
`;

const H1 = styled.h1`
	font-size: 3rem;
	font-weight: 600;
	color: white;
	text-align: center;
`;

const ButtonContainer = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	margin-top: 20px;
`;

const CircleButtonContainer = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	margin-top: 20px;
`;

const CircleButton = styled.button`
	width: 7.1vh;
	height: 7.1vh;
	border-radius: 50%;
	background-color: #fff;
	margin: 10px;
	border: none;
	cursor: pointer;
`;

const StyledApp = styled.div`
	background-color: #101010;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100vh;
	margin: 0;
	padding: 0;
	overflow: hidden;
`;

const BoxButton = styled.button`
	color: #fff;
	font-size: 1.4rem;
	width: 30vh;
	height: 33.5vh;
	font-weight: 500;
	border: none;
	border-radius: 7px;
	margin: 10px;
	cursor: pointer;
`;

function Home() {
	return (
		<StyledApp>
			<HeaderContainer>
				<Logo src={VibeChessLogo} alt="VibeChess Logo" />
				<H1>VibeChess</H1>
			</HeaderContainer>
			<ButtonContainer>
				<BoxButton
					style={{ backgroundColor: "#d264b6" }}
					onClick={() => alert("PASS AND PLAY")}
				>
					PASS AND PLAY
				</BoxButton>
				<BoxButton
					style={{ backgroundColor: "#2176ff" }}
					onClick={() => alert("MATCHMAKING")}
				>
					MATCHMAKING
				</BoxButton>
				<BoxButton
					style={{ backgroundColor: "#ce1126" }}
					onClick={() => alert("PLAY WITH FRIEND")}
				>
					PLAY WITH FRIEND
				</BoxButton>
				<BoxButton
					style={{ backgroundColor: "#fb8b24" }}
					onClick={() => alert("VERSUS BOT")}
				>
					VERSUS BOT
				</BoxButton>
				<BoxButton
					style={{ backgroundColor: "#4c6663" }}
					onClick={() => alert("SETTINGS")}
				>
					SETTINGS
				</BoxButton>
			</ButtonContainer>
			<CircleButtonContainer>
				<CircleButton onClick={() => alert("Circle Button 1")}>1</CircleButton>
				<CircleButton onClick={() => alert("Circle Button 2")}>2</CircleButton>
				<CircleButton onClick={() => alert("Circle Button 3")}>3</CircleButton>
				<CircleButton onClick={() => alert("Circle Button 1")}>4</CircleButton>
				<CircleButton onClick={() => alert("Circle Button 2")}>5</CircleButton>
			</CircleButtonContainer>
		</StyledApp>
	);
}

export default Home;
