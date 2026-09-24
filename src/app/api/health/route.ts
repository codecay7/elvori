import { success } from "@/lib/utils/api";

export async function GET() {
  return success({
    service: "elvori",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
}
