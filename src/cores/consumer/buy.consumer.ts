import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { QUEUES_PURCHASE } from "src/lib/common";
import { IDataBuy } from "src/lib/models/data";
import { BuyQueues } from "../queues/queue.buy";

const CONCURRENCY = 3;

@Processor(QUEUES_PURCHASE, { concurrency: CONCURRENCY })
export class BuyConsumer extends WorkerHost {
  private readonly logger = new Logger(BuyConsumer.name);

  constructor(private readonly ques: BuyQueues) {
    super();
  }

  async process(job: Job<IDataBuy, any, string>): Promise<any> {
    const { data } = job;
    try {
      this.logger.log(`Processing job ${job.id} for ${data.email}`);
      if (job.name === "buy-product") {
        await this.ques.Process(data);
      }
    } catch (error) {
      throw error;
    }
  }

  @OnWorkerEvent("active")
  onActive(job: Job<IDataBuy, any, string>) {
    const { data } = job;
    this.logger.log(
      `[${job.name.toUpperCase()}:${job.id}] [${data.email}:${data.productId}] is in process...`,
    );
  }

  @OnWorkerEvent("completed")
  onCompleted(job: Job<IDataBuy, any, string>) {
    this.logger.log(`[${job.name.toUpperCase()}:${job.id}] Completed.`);
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job<IDataBuy, any, string>, error: Error) {
    this.logger.error(
      `[${job.name.toUpperCase()}:${job.id}] Failed: ${error.message}`,
    );
  }
}
