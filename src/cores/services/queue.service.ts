import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bullmq";

import { QUEUES_PURCHASE } from "src/lib/common";
import { IPurchase } from "src/lib/models/data";

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(@InjectQueue(QUEUES_PURCHASE) private queues: Queue) {}

  async addPurchase(payload: IPurchase) {
    await this.queues.add("buy-product", payload, {
      attempts: 2,
      backoff: { type: "exponential", delay: 3000 },
      removeOnComplete: true,
      removeOnFail: true,
    });
  }
}
