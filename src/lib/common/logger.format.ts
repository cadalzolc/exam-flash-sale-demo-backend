import { ConsoleLogger, LogLevel } from "@nestjs/common";
import { ExtractFromBracket, GetCurrentStamp, IsString } from "./global";

const LogsHidden: string[] = ["RoutesResolver", "InstanceLoader"];

export class RouteLogger extends ConsoleLogger {
  constructor(context: string, options: { timestamp?: boolean }) {
    super(context, options);
  }

  protected formatMessage(
    logLevel: LogLevel,
    message: string,
    _pid: string,
    _formattedLogLevel: string,
    contextMessage: string,
  ): string {
    const NestContext = ExtractFromBracket(contextMessage);
    const stamp = GetCurrentStamp();
    const env = (process.env.NODE_ENV || "local").toUpperCase();

    if (
      NestContext &&
      (NestContext.toLowerCase().includes("webhook") ||
        NestContext.toLowerCase().includes("socket") ||
        NestContext.toLowerCase().includes("prisma") ||
        NestContext.toLowerCase().includes("mailer") ||
        NestContext.toLowerCase().includes("queue") ||
        NestContext.toLowerCase().includes("queue"))
    ) {
      return (
        [
          stamp,
          this.colorize(`[${env}]`, "verbose"),
          contextMessage,
          this.colorize(message, logLevel),
        ].join(" ") + "\n"
      );
    }

    if (LogsHidden.includes(NestContext)) {
      return "";
    }

    if (!IsString(message)) {
      return (
        [
          stamp,
          this.colorize(`[${env}]`, "verbose"),
          contextMessage,
          this.colorize(JSON.stringify(message), logLevel),
        ].join(" ") + "\n"
      );
    }

    const routeMatch = message.match(
      /\{(.*?), (GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)\} /,
    );

    if (routeMatch) {
      const [, path, method] = routeMatch;

      message = `${method} http://localhost:${process.env.APP_PORT || 8880}${path}`;
      contextMessage = this.colorize("[Routes]", "warn");
    }

    return (
      [
        stamp,
        this.colorize(`[${env}]`, "verbose"),
        contextMessage,
        this.colorize(message, logLevel),
      ].join(" ") + "\n"
    );
  }
}
