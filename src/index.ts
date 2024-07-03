import { createServer } from "./server";

const PORT = parseInt(process.env.PORT ?? "4000", 10);

async function main(): Promise<void> {
  const { app } = await createServer({ port: PORT });

  app.listen(PORT, () => {
    process.stdout.write(`\nGraphQL API Gateway running:\n`);
    process.stdout.write(`  GraphQL:  http://localhost:${PORT}/graphql\n`);
    process.stdout.write(`  Health:   http://localhost:${PORT}/health\n`);
    process.stdout.write(`  Mock API: http://localhost:${PORT}/api\n\n`);
  });
}

main().catch((error) => {
  process.stderr.write(`Failed to start server: ${error}\n`);
  process.exit(1);
});
