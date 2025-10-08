import { BadRequestException, ValidationError } from "@nestjs/common";

export function ValidationExceptionFactory(
  errors: ValidationError[],
): BadRequestException {
  const message: Record<string, string> = errors.reduce(
    (acc, err) => {
      const field: string = err.property;
      const constraints: string[] = Object.values(err.constraints ?? {});
      acc[field] = constraints.join(", ");
      return acc;
    },
    {} as Record<string, string>,
  );
  return new BadRequestException({
    code: "Error",
    message: "Validation failed",
    data: message,
  });
}
