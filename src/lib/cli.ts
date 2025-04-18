import { parse } from "date-fns";

export interface CliArgs {
  dateStart: Date;
  dateEnd: Date;
  dryRun: boolean;
  justOne: boolean;
}

export function parseCliArgs(): CliArgs {
  const args = process.argv.slice(2);
  let dateStart: Date | null = null;
  let dateEnd: Date | null = null;
  let dryRun = false;
  let justOne = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--date-start" && i + 1 < args.length) {
      dateStart = parse(args[i + 1], "dd-MM-yyyy", new Date());
    } else if (args[i] === "--date-end" && i + 1 < args.length) {
      dateEnd = parse(args[i + 1], "dd-MM-yyyy", new Date());
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    } else if (args[i] === "--just-one") {
      justOne = true;
    }
  }

  if (!dateStart || !dateEnd) {
    throw new Error(
      "Both --date-start and --date-end arguments are required in format DD-MM-YYYY"
    );
  }

  if (dateStart > dateEnd) {
    throw new Error("Start date must be before end date");
  }

  return { dateStart, dateEnd, dryRun, justOne };
}
