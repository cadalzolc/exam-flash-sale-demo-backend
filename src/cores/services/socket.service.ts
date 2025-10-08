import { Logger } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
  path: "/feeds",
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

  emitStockUpdate(stock: number, productId: number) {
    this.server.to("product-updates").emit("stock:update", {
      productId,
      stock: stock,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Stock update: ${stock} remaining for ${productId}`);
  }
}
