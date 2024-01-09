import { io } from "socket.io-client";

const socket = io("localhost:3000");

export default socket;
