import os
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

# Isolated database and disabled external notification channels.
os.environ.update(SECRET_KEY="test-only-" + "x" * 48, DATABASE_URL="sqlite+aiosqlite:///:memory:",
                  TELEGRAM_BOT_TOKEN="", TELEGRAM_CHAT_ID="", DISCORD_WEBHOOK_URL="",
                  BOOTSTRAP_ADMIN_PASSWORD="")

from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from app.config import settings, Settings
from pydantic import ValidationError
from app.database import engine, Base, AsyncSessionLocal
from app.main import seed_default_admin
from app.models.user import User
from app.models.server import Server
from app.models.alert import AlertLog
from app.core.security import get_password_hash
from app.routers import auth, servers
from app.services.alert_worker import run_alert_check_cycle


class Regressions(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
        app = FastAPI()
        app.include_router(auth.router)
        app.include_router(servers.router)
        self.client = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")

    async def asyncTearDown(self):
        await self.client.aclose()
        await engine.dispose()

    async def test_published_jwt_secret_is_rejected(self):
        with self.assertRaises(ValidationError):
            Settings(SECRET_KEY="netpulse-dev-secret-key-please-change-in-prod-2026", _env_file=None)

    async def test_registration_cannot_elevate_or_mutate_servers(self):
        payload = dict(username="reader", email="reader@example.com", password="a-long-password")
        self.assertEqual((await self.client.post("/auth/register", json={**payload, "role": "admin"})).status_code, 422)
        registered = await self.client.post("/auth/register", json=payload)
        self.assertEqual(registered.status_code, 201)
        self.assertEqual(registered.json()["role"], "viewer")
        login = await self.client.post("/auth/login", json=payload)
        headers = {"Authorization": "Bearer " + login.json()["access_token"]}
        async with AsyncSessionLocal() as db:
            srv = Server(name="private-key", api_key="must-not-leak")
            db.add(srv)
            await db.commit()
            server_id = str(srv.id)
        self.assertEqual((await self.client.post("/servers", json={"name": "denied"}, headers=headers)).status_code, 403)
        self.assertEqual((await self.client.delete(f"/servers/{server_id}", headers=headers)).status_code, 403)
        listing = await self.client.get("/servers", headers=headers)
        self.assertEqual(listing.status_code, 200)
        self.assertNotIn("api_key", listing.json()[0])

    async def test_bootstrap_and_admin_can_manage(self):
        await seed_default_admin()
        async with AsyncSessionLocal() as db:
            self.assertIsNone((await db.execute(select(User))).scalar_one_or_none())
        with patch.object(settings, "BOOTSTRAP_ADMIN_PASSWORD", "new-secure-password"):
            await seed_default_admin()
            await seed_default_admin()
        login = await self.client.post("/auth/login", json={"username": "admin", "password": "new-secure-password"})
        headers = {"Authorization": "Bearer " + login.json()["access_token"]}
        created = await self.client.post("/servers", json={"name": "managed"}, headers=headers)
        self.assertEqual(created.status_code, 201)
        self.assertTrue(created.json()["api_key"].startswith("np_sec_"))
        self.assertEqual((await self.client.delete("/servers/" + created.json()["id"], headers=headers)).status_code, 204)

    async def test_legacy_default_admin_is_disabled_then_rotated(self):
        async with AsyncSessionLocal() as db:
            db.add(User(username="admin", email="admin@example.com", hashed_password=get_password_hash("admin123"), role="admin"))
            await db.commit()
        await seed_default_admin()
        self.assertEqual((await self.client.post("/auth/login", json={"username": "admin", "password": "admin123"})).status_code, 401)
        with patch.object(settings, "BOOTSTRAP_ADMIN_PASSWORD", "replacement-password"):
            await seed_default_admin()
        self.assertEqual((await self.client.post("/auth/login", json={"username": "admin", "password": "replacement-password"})).status_code, 200)

    async def test_stale_warning_and_online_alert_once(self):
        async with AsyncSessionLocal() as db:
            for status in ("ONLINE", "WARNING"):
                db.add(Server(name=status, api_key=status, status=status, last_seen_at=datetime.now(timezone.utc) - timedelta(minutes=2)))
            db.add(Server(name="fresh", api_key="fresh", status="WARNING"))
            await db.commit()
        with patch("app.services.alert_worker.notify_all", new_callable=AsyncMock) as notify:
            await run_alert_check_cycle()
            await run_alert_check_cycle()
            self.assertEqual(notify.await_count, 2)
        async with AsyncSessionLocal() as db:
            rows = (await db.execute(select(Server))).scalars().all()
            self.assertEqual({s.name: s.status for s in rows}, {"ONLINE": "OFFLINE", "WARNING": "OFFLINE", "fresh": "WARNING"})
            self.assertEqual(len((await db.execute(select(AlertLog))).scalars().all()), 2)


if __name__ == "__main__":
    unittest.main()
