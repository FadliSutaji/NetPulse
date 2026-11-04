from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID


class CpuMetricPayload(BaseModel):
    percent: float
    cores: int = 1


class MemoryMetricPayload(BaseModel):
    percent: float
    used_bytes: int
    total_bytes: int


class MetricsDataPayload(BaseModel):
    cpu: CpuMetricPayload
    memory: MemoryMetricPayload


class IngestPayload(BaseModel):
    timestamp: Optional[int] = None
    metrics: MetricsDataPayload


class IngestResponse(BaseModel):
    status: str = "success"
    received_at: datetime


class MetricPoint(BaseModel):
    time: datetime
    cpu_percent: float
    cpu_cores: int
    ram_percent: float
    ram_used_bytes: int
    ram_total_bytes: int

    class Config:
        from_attributes = True


class MetricHistoryResponse(BaseModel):
    server_id: UUID
    count: int
    data: List[MetricPoint]
