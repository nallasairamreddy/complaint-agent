import heapq
from dataclasses import dataclass, field
from typing import Any

# Priority map: lower number = higher urgency (heapq is min-heap)
PRIORITY_MAP = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}


@dataclass(order=True)
class QueueItem:
    priority_rank: int
    complaint_id: int = field(compare=False)
    data: Any = field(compare=False)


class ComplaintPriorityQueue:
    def __init__(self):
        self._heap = []

    def push(self, complaint_id: int, priority: str, data: dict):
        rank = PRIORITY_MAP.get(priority, 3)
        item = QueueItem(priority_rank=rank, complaint_id=complaint_id, data=data)
        heapq.heappush(self._heap, item)

    def pop(self) -> QueueItem:
        if self._heap:
            return heapq.heappop(self._heap)
        return None

    def peek(self) -> QueueItem:
        return self._heap[0] if self._heap else None

    def size(self) -> int:
        return len(self._heap)

    def all_items(self) -> list:
        return sorted(self._heap)


# Global singleton queue
complaint_queue = ComplaintPriorityQueue()
