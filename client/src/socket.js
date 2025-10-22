import { io } from "socket.io-client";
const SOCKET_URL = "https://aflahhaqy.site/";

export const socket = io(SOCKET_URL, { autoConnect: true });
