"""Diagnostica MCP Unity (stdio).

Uso:
    uv run --with mcp python tests/mcp_probe.py

Verifica che il server veda l'Editor e che una tool call risponda.
"""
import asyncio
import json
import os
import shutil
import sys

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

UVX = os.environ.get("UVX") or shutil.which("uvx") or r"C:\Users\Kyrig\AppData\Roaming\Python\Python312\Scripts\uvx.exe"


async def main() -> int:
    params = StdioServerParameters(
        command=UVX,
        args=["--from", "mcpforunityserver", "mcp-for-unity", "--transport", "stdio"],
        env={**os.environ, "DISABLE_TELEMETRY": "1"},
    )
    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools = await session.list_tools()
            names = [t.name for t in tools.tools]
            print(f"TOOLS {len(names)}")
            res = await session.call_tool("manage_editor", {"action": "telemetry_status"})
            print("MANAGE_EDITOR", res.is_error, json.dumps(res.model_dump(), ensure_ascii=False)[:600])
            res = await session.call_tool("refresh_unity", {})
            print("REFRESH", res.is_error, json.dumps(res.model_dump(), ensure_ascii=False)[:600])
            return 0 if (not res.is_error) else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))