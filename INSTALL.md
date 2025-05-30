# 🚀 Быстрая установка Twitch Points Collector

## Шаг 1: Подготовка иконок

**Важно:** Для корректной работы расширения нужны PNG иконки.

### Вариант A: Создать иконки автоматически
1. Откройте `generate_icons.html` в Chrome
2. Нажмите F12 (консоль разработчика)
3. Введите: `generateAllIcons()`
4. Переместите скачанные PNG файлы в папку `icons/`

### Вариант B: Использовать заглушки
1. Откройте любую страницу в Chrome
2. Нажмите F12 и вставьте код из `create_placeholder_icons.js`
3. Переместите скачанные PNG файлы в папку `icons/`

## Шаг 2: Установка расширения

1. **Откройте Chrome** и перейдите в `chrome://extensions/`
2. **Включите "Режим разработчика"** (Developer mode) в правом верхнем углу
3. **Нажмите "Загрузить распакованное"** (Load unpacked)
4. **Выберите папку** `twitch-points-collector`

## Шаг 3: Проверка установки

1. Расширение появится в списке с зеленым переключателем "Включено"
2. Иконка расширения появится в панели инструментов Chrome
3. При клике на иконку должен открыться popup с интерфейсом

## Шаг 4: Первое использование

1. **Откройте Twitch** (`https://www.twitch.tv`)
2. **Авторизуйтесь** в аккаунте
3. **Откройте 2-3 трансляции** в разных вкладках
4. **Кликните на иконку расширения**
5. **Нажмите "Запустить сбор"**

## ⚠️ Устранение проблем

### Расширение не загружается
- Убедитесь, что все PNG иконки находятся в папке `icons/`
- Проверьте, что включен "Режим разработчика"
- Перезагрузите расширение кнопкой "Обновить"

### Не открывается popup
- Проверьте консоль на ошибки (F12)
- Убедитесь, что файл `popup.html` корректный
- Перезапустите Chrome

### Не собираются баллы
- Убедитесь, что вы авторизованы на Twitch
- Проверьте, что трансляции активны
- Откройте консоль браузера (F12) для просмотра логов

---

**Готово! Расширение установлено и готово к использованию.** 🎮 