import React from "react";
import PropTypes from "prop-types";
import styled, { keyframes } from "styled-components";

const SpinnerContainer = styled.div`
	background-color: #101010;
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100vh;
`;

const rotateAnimation = keyframes`
  20% {
    transform: rotate(90deg);
  }
  40% {
    transform: rotate(180deg);
  }
  60% {
    transform: rotate(270deg);
  }
  80% {
    transform: rotate(360deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const Spinner = styled.div`
	--dark-clr: #ce1126;
	--light-clr: #fff;
	height: ${(props) => props.size || "4rem"};
	width: ${(props) => props.size || "4rem"};
	border-radius: 20%;
	background-image: conic-gradient(
		var(--dark-clr) 0,
		var(--dark-clr) 90deg,
		var(--light-clr) 90deg,
		var(--light-clr) 180deg,
		var(--dark-clr) 180deg,
		var(--dark-clr) 270deg,
		var(--light-clr) 270deg,
		var(--light-clr) 360deg
	);
	animation: ${rotateAnimation} 5s infinite;
`;

const Loading = ({ size }) => {
	return (
		<SpinnerContainer>
			<Spinner size={size} />
		</SpinnerContainer>
	);
};

Loading.propTypes = {
	size: PropTypes.string,
};

export default Loading;
