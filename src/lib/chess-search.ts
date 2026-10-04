type SearchReply = { id: number; move?: string; error?: string };
type SearchRequest = { id: number; fen: string; depth: number };

let worker: Worker | null = null;
let nextRequestId = 1;
const pendingRequests = new Map<number, { resolve: (move: string) => void; reject: (error: Error) => void }>();

function getWorker(): Worker {
  if (worker) return worker;

  worker = new Worker("/chess-search-worker.js");
  worker.onmessage = (event: MessageEvent<SearchReply>) => {
    const pending = pendingRequests.get(event.data.id);
    if (!pending) return;
    pendingRequests.delete(event.data.id);
    if (event.data.error) pending.reject(new Error(event.data.error));
    else pending.resolve(event.data.move ?? "");
  };
  worker.onerror = (event) => {
    const error = new Error(event.message || "The chess search worker failed.");
    for (const pending of pendingRequests.values()) pending.reject(error);
    pendingRequests.clear();
    worker?.terminate();
    worker = null;
  };
  worker.onmessageerror = () => {
    const error = new Error("The chess search worker returned an unreadable result.");
    for (const pending of pendingRequests.values()) pending.reject(error);
    pendingRequests.clear();
    worker?.terminate();
    worker = null;
  };
  return worker;
}

export function findBestMove(fen: string, depth: number): Promise<string> {
  const id = nextRequestId++;
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    try {
      const request: SearchRequest = { id, fen, depth };
      getWorker().postMessage(request);
    } catch (error) {
      pendingRequests.delete(id);
      reject(error instanceof Error ? error : new Error("Could not start the chess search worker."));
    }
  });
}
