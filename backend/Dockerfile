FROM python:3.12 AS builder

RUN pip install --no-cache-dir --upgrade uv
RUN uv venv /venv
ENV PATH="/venv/bin:${PATH}"
COPY req.txt /req.txt
RUN uv pip install -r /req.txt


# ----- Base stage ----
FROM python:3.12-slim AS base

COPY --from=builder /venv /venv
ENV PATH="/venv/bin:${PATH}"
COPY ./shared /shared
ENV PYTHONPATH="/app:/shared"
WORKDIR /app
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# ---- Menu service ----
FROM base AS menu-service

COPY ./menu-service /app

# ---- API gateway ----
FROM base AS gateway

COPY ./gateway /app

# ---- Order service ----
FROM base AS order-service

COPY ./order-service /app

# ---- Background worker ----
FROM base AS background-worker

COPY ./background-worker /app

CMD ["python", "main.py"]