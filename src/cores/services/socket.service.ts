import { Logger } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { IPurchaseResponse } from "src/lib/models/data";

@WebSocketGateway({
  path: "/feeds",
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
  },
})
export class SocketService implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;
  private readonly logger = new Logger(SocketService.name);

  handleConnection(socket: Socket) {
    this.logger.log(`Client connected: ${socket.id}`);
    socket.join("product-updates");

    socket.on(
      "join:product",
      (data: { promoId: number; productId: number }) => {
        this.joinProductRoom(socket, data.promoId, data.productId);
      },
    );

    socket.on(
      "join:customer",
      (data: { promoId: number; productId: number; email: string }) => {
        this.joinCustomerRoom(socket, data.promoId, data.productId, data.email);
      },
    );
  }

  handleDisconnect(socket: Socket) {
    this.logger.log(`Client disconnected: ${socket.id}`);
  }

  private joinProductRoom(socket: Socket, promoId: number, productId: number) {
    socket.join(`room:${promoId}:${productId}`);
    this.logger.log(`Client ${socket.id} joined room:${promoId}:${productId}`);
  }

  private joinCustomerRoom(
    socket: Socket,
    promoId: number,
    productId: number,
    email: string,
  ) {
    socket.join(`room:${promoId}:${productId}:${email}`);
    this.logger.log(
      `Customer ${socket.id} joined room:${promoId}:${productId}:${email}`,
    );
  }

  emitStockPromoUpdate(promoId: number, productId: number, stock: number) {
    const roomName = `room:${promoId}:${productId}`;
    this.server.to(roomName).emit("stock:update", {
      promoId,
      productId,
      stock,
      timestamp: new Date().toISOString(),
    });
  }

  emitPurchaseStatus(
    promoId: number,
    productId: number,
    status: string,
    data: IPurchaseResponse,
  ) {
    const roomName = `room:${promoId}:${productId}:${data.customer}`;
    this.server.to(roomName).emit("purchase:status", {
      data,
      status,
      timestamp: new Date().toISOString(),
    });
  }
}
