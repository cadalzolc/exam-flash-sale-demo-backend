import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

import { QUEUES_PURCHASE } from "src/lib/common";
import { IJobPurchase } from "src/lib/models/data";

@Injectable()
export class QueueService {
  constructor(@InjectQueue(QUEUES_PURCHASE) private queues: Queue) {}

  async addToPurchaseQueue(payload: IJobPurchase) {
    await this.queues.add("process-order", payload, {
      attempts: 2,
      backoff: { type: "exponential", delay: 3000 },
      removeOnComplete: true,
      removeOnFail: true,
    });
  }
}
