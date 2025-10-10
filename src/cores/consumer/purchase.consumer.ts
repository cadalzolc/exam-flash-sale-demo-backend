import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { QUEUES_PURCHASE } from "src/lib/common";
import { IJobPurchase } from "src/lib/models/data";
import { PurchaseQueue } from "../queues/purchase.queue";

const CONCURRENCY = 5;

@Processor(QUEUES_PURCHASE, {
  concurrency: CONCURRENCY,
  lockDuration: 30000,
  stalledInterval: 30000,
  maxStalledCount: 2,
  removeOnComplete: {
    age: 3600,
    count: 1000,
  },
  removeOnFail: {
    age: 24 * 3600,
  },
})
export class PurchaseConsumer extends WorkerHost {
  private readonly logger = new Logger(PurchaseConsumer.name);

  constructor(private readonly ques: PurchaseQueue) {
    super();
  }

  async process(job: Job<IJobPurchase, any, string>): Promise<any> {
    const { data } = job;
    try {
      this.logger.log(`Processing job ${job.id} for ${data.email}`);
      if (job.name === "process-order") {
        await this.ques.Process(data);
      }
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error}`);
      throw error;
    }
  }

  @OnWorkerEvent("active")
  onActive(job: Job<IJobPurchase, any, string>) {
    const { data } = job;
    this.logger.log(
      `[${job.name.toUpperCase()}:${job.id}] [${data.email}:${data.productId}] is in process...`,
    );
  }

  @OnWorkerEvent("completed")
  onCompleted(job: Job<IJobPurchase, any, string>) {
    this.logger.log(`[${job.name.toUpperCase()}:${job.id}] Completed.`);
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job<IJobPurchase, any, string>, error: Error) {
    this.logger.error(
      `[${job.name.toUpperCase()}:${job.id}] Failed: ${error.message}`,
    );
  }
}
