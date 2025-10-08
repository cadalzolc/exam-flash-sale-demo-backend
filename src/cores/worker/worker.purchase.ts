import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { QUEUES_PURCHASE } from "src/lib/common";
import { IDataBuy } from "src/lib/models/data";
import { BuyService } from "../services/buy.service";

const CONCURRENCY = 3;

@Processor(QUEUES_PURCHASE, { concurrency: CONCURRENCY })
export class PurchaseWorker extends WorkerHost {
  private readonly logger = new Logger(PurchaseWorker.name);

  constructor(private readonly svc: BuyService) {
    super();
  }

  async process(job: Job<IDataBuy, any, string>) {
    const { data } = job;
    if (job.name === "buy-product") {
      await this.svc.Create(data);
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
