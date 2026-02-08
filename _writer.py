import sys
target = r"c:\Users\micha\saleor-platform\apps\apps\bulk-manager\src\modules\trpc\routers\vouchers-router.ts"
data = sys.stdin.read()
with open(target, "w", encoding="utf-8", newline="
") as f:
    f.write(data)
print(f"Written {len(data)} bytes to {target}")
