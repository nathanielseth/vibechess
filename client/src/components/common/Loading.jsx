import React from "react";
import PropTypes from "prop-types";
import styled, { keyframes } from "styled-components";

const Container = styled.div`
	background-color: #101010;
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100vh;
`;

const stepRotate = keyframes`
  0% { transform: rotate(0deg); }
  20% { transform: rotate(90deg); }
  40% { transform: rotate(180deg); }
  60% { transform: rotate(270deg); }
  80% { transform: rotate(360deg); }
  100% { transform: rotate(360deg); }
`;

const Spinner = styled.div`
	height: ${({ size }) => size || "4rem"};
	width: ${({ size }) => size || "4rem"};
	border-radius: 20%;
	background: conic-gradient(
		#f24040 0deg,
		#f24040 90deg,
		#fff 90deg,
		#fff 180deg,
		#f24040 180deg,
		#f24040 270deg,
		#fff 270deg,
		#fff 360deg
	);
	animation: ${stepRotate} 2s ease-in-out infinite;
`;

const Loading = ({ size }) => (
	<Container>
		<Spinner size={size} />
	</Container>
);

Loading.propTypes = {
	size: PropTypes.string,
};

export default Loading;
