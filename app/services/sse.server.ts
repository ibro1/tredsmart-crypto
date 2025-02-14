import EventEmitter from "events"

const emitter = new EventEmitter()

export function emit(event: string, data: any) {
  emitter.emit(event, data)
}

export function subscribe(event: string, callback: (data: any) => void) {
  emitter.on(event, callback)
  return () => emitter.off(event, callback)
}

export function createEventStream(request: Request, channel: string) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
      }

      const cleanup = subscribe(channel, (data) => {
        send(JSON.stringify(data))
      })

      // Send initial message
      send(JSON.stringify({ type: "connected" }))

      // Handle client disconnection
      request.signal.addEventListener("abort", () => {
        cleanup()
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
