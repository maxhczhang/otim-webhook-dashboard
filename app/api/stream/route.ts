import { subscribe } from '@/lib/eventBus';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const unsubscribe = subscribe((event: string) => {
        controller.enqueue(encoder.encode(`data: ${event}\n\n`));
      });

      // Send keepalive every 30s
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          clearInterval(keepalive);
        }
      }, 30000);

      // Cleanup when client disconnects
      const cleanup = () => {
        unsubscribe();
        clearInterval(keepalive);
      };

      // Store cleanup for when the stream is cancelled
      (controller as unknown as { _cleanup: () => void })._cleanup = cleanup;
    },
    cancel(controller) {
      const c = controller as unknown as { _cleanup?: () => void };
      c._cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
