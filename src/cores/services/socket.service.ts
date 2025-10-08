import { Logger } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
  path: "/stocks",
  cors: {
    origin: "*",
  },
})
export class SocketService implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;
  private readonly logger = new Logger(SocketService.name);

  handleConnection(socket: Socket) {
    this.logger.log(`Client connected: ${socket.id}`);
    socket.join("product-updates");
    this.logger.log(`Client ${socket.id} joined product-updates room`);
  }

  handleDisconnect(socket: Socket) {
    this.logger.log(`Client disconnected: ${socket.id}`);
  }

  joinProductRoom(socket: Socket, promoId: number, productId: number) {
    socket.join(`room:${promoId}:${productId}`);
    this.logger.log(`Client ${socket.id} joined room:${promoId}:${productId}`);
  }

  emitStockUpdateToProduct(promoId: number, productId: number, stock: number) {
    const roomName = `room:${promoId}:${productId}`;
    this.server.to(roomName).emit("stock:update", {
      promoId,
      productId,
      stock,
      timestamp: new Date().toISOString(),
    });
  }
}
