# UI-аудит вживую (playwright)

Оснастка для **живого** аудита UI против реального билда (прод или локальный превью).
Появилась после F-314: причина бага была видна только на реальном рендере — по коду
она не диагностировалась. Урок: **смотреть, а не гадать**.

Что делает: обходит матрицу «экран × тема × вьюпорт × роль × системная тема», на каждом
экране снимает скриншот, собирает ошибки консоли и упавшие запросы, и прогоняет
**встроенный WCAG-сканер контраста по фактически отрендеренным парам «фон↔текст»**.

## Почему сканер меряет через canvas
Первая версия парсила `getComputedStyle().color` регуляркой как `rgb()` — и **выдала ложные
1.15:1**, потому что Tailwind v4 отдаёт цвета в `oklab()/oklch()` (регулярка читала `0.94`
как красный канал). Сейчас цвет разрешается **через canvas**: заливаем фон, поверх — цвет
текста, читаем пиксель. Это корректно обрабатывает любое цветовое пространство И альфа-
композитинг. Не заменяйте на парсинг строк.

`contrast.test.ts` (страж токенов) **не отменяет** этот аудит: тест проверяет ТОКЕНЫ,
а здесь меряются ФАКТИЧЕСКИЕ сочетания на экране (в т.ч. те, что дают компоненты DaisyUI).

## Запуск

1. Токены доступа по ролям (read-only, ничего не меняет в проде). Живут 30 минут —
   генерируйте прямо перед прогоном:

```bash
cd /opt/elom-backend
.venv/bin/python manage.py shell -c "
import json
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from rbac.models import UserRole
out={}; seen={}
for ur in UserRole.objects.select_related('user','role').all():
    if ur.role.name in seen or not ur.user.is_active: continue
    seen[ur.role.name]=ur.user
for rn,u in seen.items():
    r=RefreshToken.for_user(u); out[rn]={'username':u.username,'access':str(r.access_token),'refresh':str(r)}
open('OUT_DIR/tokens.json','w').write(json.dumps(out))"
```

2. `ids.json` — примеры id сущностей для detail/edit/print маршрутов:
   `{\"purchase\":123,\"object\":45,\"category\":7}`

3. Прогон (по чанкам — полный проход дольше таймаута):

```bash
cd /opt/elom-frontend
OUT_DIR=/path/out BASE_URL=https://elom.uz PASS=A  node tools/ui-audit/audit.mjs
OUT_DIR=/path/out BASE_URL=https://elom.uz PASS=BCD node tools/ui-audit/audit.mjs
OUT_DIR=/path/out BASE_URL=https://elom.uz PASS=E ROLES=brigadier node tools/ui-audit/audit.mjs
```

Проходы: **A** — все экраны, десктоп, light+dark (+ print-media накладной);
**B** — мобильный 360; **C** — планшет 768; **D** — 4 комбинации «системная тема × тема
приложения» (класс бага F-314); **E** — роль-специфичные экраны.

## Важные свойства
- **Инкрементальная запись** в `findings.jsonl` (по строке на экран, сразу после экрана).
  Прошлый прогон потерял всё, потому что писал итог в конце и был убит по таймауту.
  Не возвращайте «запись в конце».
- **Резюмируемость**: скриншот не переснимается, если файл уже есть.
- Аудит только читает (GET) — **никаких мутаций в проде**.

## Разбор результатов
```bash
python3 - <<'PY'
import json, collections
rows=[json.loads(l) for l in open('OUT_DIR/findings.jsonl')]
cls=collections.defaultdict(lambda:{'n':0,'screens':set(),'ratio':99})
for r in rows:
    for lc in r.get('lowContrast',[]):
        k=(lc['sel'],lc['fgRGB'],lc['bg']); c=cls[k]
        c['n']+=1; c['screens'].add(r['tag']); c['ratio']=min(c['ratio'],lc['ratio'])
for k,v in sorted(cls.items(), key=lambda x:x[1]['ratio'])[:20]:
    print(f"{v['ratio']:.2f}:1  [{v['n']}x/{len(v['screens'])} screens]  {k[0]}")
PY
```
Группируйте находки **по классу** (селектор + пара цветов), а не по экземплярам — чинить
надо правило, а не место.
