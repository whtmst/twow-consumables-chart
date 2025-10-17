# 📊 Генератор рейдовых графиков для Turtle WoW

Инструмент для создания красивых визуализаций статистики рейда: урона, исцеления, расходников и смертей в Turtle WoW.

**🌐 Доступен по ссылке:** [https://whtmst.github.io/twow-raid-charts/](https://whtmst.github.io/twow-raid-charts/)

## 🚀 Быстрый старт

### Шаг 1: Получение данных с Turtlogs.com
1. **Установите расширение Tampermonkey** для вашего браузера:
   - [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - [Firefox](https://addons.mozilla.org/ru/firefox/addon/tampermonkey/)
   - [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

2. **Установите пользовательский скрипт** [Turtlogs Data Parser](https://github.com/whtmst/twow-raid-charts/blob/main/turtlogs-parser/Turtlogs-Data-Parser.js) (находится в папке `/turtlogs-parser/`)

3. **Откройте логи рейда** на [turtlogs.com](https://www.turtlogs.com/)

4. **Выберите данные** из разделов:
   - **Damage done (в левой части)** 
   - **Effective healing done (в правой части)**

4. **Нажмите кнопку "Экспорт данных"** в правом верхнем углу

5. **Данные будут скопированы в буфер обмена**

### Шаг 2: Получение данных о расходниках
Выберите один из вариантов:
- **[Ambershire]** [whtmst.github.io/summarize_consumes/](https://whtmst.github.io/summarize_consumes/)
- **[Все серверы]** [melbalabs.com/summarize_consumes/](https://melbalabs.com/summarize_consumes/)

Скопируйте данные из раздела **Summary**

### Шаг 3: Создание графика
1. Перейдите на [https://whtmst.github.io/twow-raid-charts/](https://whtmst.github.io/twow-raid-charts/)
2. Заполните поля:
   - **Damage done** - данные из Turtlogs
   - **Effective healing done** - данные из Turtlogs  
   - **Summary** - данные о расходниках
   - Название рейда и дата (опционально)
3. Нажмите **"Сгенерировать график"**
4. Для сохранения нажмите **"📸 Сделать скриншот графика"**

## 📋 Формат данных

### Damage Done (пример):
```
1. Amg - 94,669 (554.0/s) - 5.5%
2. Tuxem - 89,055 (521.2/s) - 5.1%
3. Arator - 88,177 (516.0/s) - 5.1%
...
```

### Effective Healing Done (пример):
```
1. Holyangel - 22,595 (132.2/s) - 21.5%
2. Potatolord - 18,410 (107.7/s) - 17.5%
3. Komissar - 15,880 (92.9/s) - 15.1%
...
```

### Summary (расходники):
```
Игрок deaths:X
   предмет количество (цена)
   ...
   total spent: Xg Xs Xc
```

## 🎯 Что показывает график

График состоит из 4 колонок:

- **⚔️ Нанесенный урон (УВС)** - рейтинг DPS с детальной статистикой
- **💚 Эффективное исцеление (ИВС)** - рейтинг HPS с детальной статистикой  
- **💰 Расходники** - затраты золота на расходники
- **💀 Смерти** - количество смертей каждого игрока

Внизу отображаются **итоговые значения** по всем категориям.

## 🛠 Технические детали

- **Поддерживаемые форматы:** Данные автоматически парсятся из Turtlogs и summarize_consumes
- **Автоматическое вычисление:** Итоговые значения считаются суммированием данных всех игроков
- **Экспорт:** Скриншоты создаются с высоким качеством через html2canvas

## 📁 Структура проекта

```
twow-raid-charts/
├── index.html              # Основная страница генератора
├── turtlogs-parser/
│   └── Turtlogs-Data-Parser.js  # Скрипт для Tampermonkey (экспорт данных с Turtlogs)
└── README.md              # Эта документация
```

## 👨‍💻 Автор

**Created by Wht Mst** ([Misha](https://turtle-wow.org/armory/Ambershire/Misha) from [O N L I N E](https://www.turtlogs.com/armory/guild/Turtle%20WoW%20Ambershire/O%20N%20L%20I%20N%20E))

---

*Для вопросов и предложений создавайте issue в репозитории проекта.*
