import { io } from "socket.io-client";

export function connectBalanceSocket(
    onBalanceUpdate: (balance: number) => void
) {
    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
        console.log("Connected:", socket.id);
    });

    socket.on("balance:update", (payload) => {
        onBalanceUpdate(payload.balance);
    });

    socket.on("disconnect", () => {
        console.log("Disconnected");
    });

    return socket;
}