// Twitch Points Collector - Popup Script
// Обработка пользовательского интерфейса расширения

document.addEventListener('DOMContentLoaded', () => {
    console.log('Popup загружается...');
    
    const toggleButton = document.getElementById('toggleButton');
    const buttonText = document.getElementById('buttonText');
    const statusText = document.getElementById('statusText');
    const statusDot = document.getElementById('statusDot');
    const helpLink = document.getElementById('helpLink');
    const settingsLink = document.getElementById('settingsLink');
    const autoStartToggle = document.getElementById('autoStartToggle');

    // Инициализация при загрузке popup
    initializePopup();

    // Обработчик кнопки включения/выключения
    toggleButton.addEventListener('click', handleToggle);

    // Обработчик переключателя автозапуска
    autoStartToggle.addEventListener('change', handleAutoStartToggle);

    // Обработчики ссылок
    helpLink.addEventListener('click', (e) => {
        e.preventDefault();
        showHelp();
    });

    settingsLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSettings();
    });

    // Инициализация popup
    async function initializePopup() {
        console.log('Инициализация popup...');
        
        try {
            // Получаем текущий статус от background script
            console.log('Отправляем запрос статуса...');
            const response = await sendMessageToBackground({ action: 'getStatus' });
            console.log('Получен ответ:', response);
            updateUI(response);
        } catch (error) {
            console.error('Ошибка при инициализации:', error);
            showError('Ошибка соединения с расширением: ' + error.message);
        }
    }

    // Обработка переключения состояния коллектора
    async function handleToggle() {
        console.log('Обработка переключения коллектора...');
        
        try {
            // Отключаем кнопку во время обработки
            toggleButton.disabled = true;
            buttonText.textContent = 'Обработка...';

            // Отправляем команду переключения
            console.log('Отправляем команду toggle...');
            const response = await sendMessageToBackground({ action: 'toggle' });
            console.log('Получен ответ на toggle:', response);
            
            if (response.status === 'error') {
                showError(response.message);
                return;
            }
            
            updateUI(response);

            // Показываем уведомление
            showNotification(response.message);

        } catch (error) {
            console.error('Ошибка при переключении:', error);
            showError('Не удалось изменить состояние: ' + error.message);
        } finally {
            toggleButton.disabled = false;
        }
    }

    // Обработка переключения автозапуска
    async function handleAutoStartToggle() {
        console.log('Обработка переключения автозапуска...');
        
        try {
            // Отключаем переключатель во время обработки
            autoStartToggle.disabled = true;

            // Отправляем команду переключения автозапуска
            console.log('Отправляем команду toggleAutoStart...');
            const response = await sendMessageToBackground({ action: 'toggleAutoStart' });
            console.log('Получен ответ на toggleAutoStart:', response);
            
            if (response.status === 'error') {
                showError(response.message);
                // Возвращаем переключатель в предыдущее состояние
                autoStartToggle.checked = !autoStartToggle.checked;
                return;
            }
            
            // Показываем уведомление
            showNotification(response.message);

        } catch (error) {
            console.error('Ошибка при переключении автозапуска:', error);
            showError('Не удалось изменить настройку автозапуска: ' + error.message);
            // Возвращаем переключатель в предыдущее состояние
            autoStartToggle.checked = !autoStartToggle.checked;
        } finally {
            autoStartToggle.disabled = false;
        }
    }

    // Обновление пользовательского интерфейса
    function updateUI(response) {
        console.log('Обновление UI с ответом:', response);
        
        if (!response) {
            showError('Получен пустой ответ от расширения');
            return;
        }
        
        const isActive = response.status === 'active';
        
        // Обновляем текст статуса
        statusText.textContent = response.message || 'Неизвестный статус';
        
        // Обновляем индикатор статуса
        statusDot.classList.toggle('active', isActive);
        
        // Обновляем кнопку
        toggleButton.classList.toggle('inactive', !isActive);
        buttonText.textContent = isActive ? 'Остановить сбор' : 'Запустить сбор';
        
        // Обновляем переключатель автозапуска
        if (response.autoStartEnabled !== undefined) {
            autoStartToggle.checked = response.autoStartEnabled;
            autoStartToggle.disabled = false;
            console.log('Автозапуск установлен в:', response.autoStartEnabled);
        }
        
        // Активируем кнопку если нет ошибок
        if (response.status !== 'error') {
            toggleButton.disabled = false;
        }
        
        console.log('UI обновлен успешно');
    }

    // Отправка сообщения background script
    function sendMessageToBackground(message) {
        return new Promise((resolve, reject) => {
            console.log('Отправляем сообщение:', message);
            
            // Добавляем таймаут для диагностики
            const timeout = setTimeout(() => {
                reject(new Error('Таймаут ожидания ответа от background script (5 сек)'));
            }, 5000);
            
            try {
                chrome.runtime.sendMessage(message, (response) => {
                    clearTimeout(timeout);
                    
                    if (chrome.runtime.lastError) {
                        console.error('Chrome runtime error:', chrome.runtime.lastError);
                        reject(new Error(chrome.runtime.lastError.message));
                    } else if (response) {
                        console.log('Получен ответ от background:', response);
                        resolve(response);
                    } else {
                        console.error('Пустой ответ от background script');
                        reject(new Error('Не получен ответ от background script'));
                    }
                });
            } catch (error) {
                clearTimeout(timeout);
                console.error('Ошибка отправки сообщения:', error);
                reject(error);
            }
        });
    }

    // Показ уведомления
    function showNotification(message) {
        console.log('Показ уведомления:', message);
        
        // Создаем временное уведомление
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(81, 207, 102, 0.9);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            z-index: 1000;
            animation: slideInNotification 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // Удаляем уведомление через 3 секунды
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutNotification 0.3s ease-in';
                setTimeout(() => {
                    if (notification.parentNode) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        }, 3000);
    }

    // Показ ошибки
    function showError(message) {
        console.error('Отображение ошибки:', message);
        
        statusText.textContent = message;
        statusDot.classList.remove('active');
        buttonText.textContent = 'Ошибка';
        toggleButton.disabled = true;
        
        // Добавляем красную подсветку для ошибок
        statusText.style.color = '#ff6b6b';
        
        // Убираем подсветку через 5 секунд
        setTimeout(() => {
            statusText.style.color = '';
        }, 5000);
    }

    // Показ справки
    function showHelp() {
        const helpContent = `
Как использовать Twitch Points Collector:

1. Откройте вкладки с трансляциями Twitch
2. Нажмите "Запустить сбор" в расширении
3. Оставьте вкладки открытыми
4. Расширение автоматически соберет Channel Points

🚀 АВТОЗАПУСК:
• Включите переключатель "Автозапуск при открытии Twitch"
• Расширение автоматически запустится при обнаружении открытых трансляций
• Автоматически остановится при закрытии всех вкладок Twitch

Важные моменты:
• Проверка происходит каждые 30 секунд
• После клика есть задержка 2 секунды
• Работает только с активными трансляциями
• Не закрывайте вкладки Twitch

Если возникли проблемы:
• Перезагрузите страницы Twitch
• Перезапустите расширение
• Проверьте консоль браузера (F12)

Диагностика:
• Откройте chrome://extensions/
• Найдите расширение и кликните "service worker"
• Проверьте консоль на ошибки
        `.trim();

        alert(helpContent);
    }

    // Показ настроек (заглушка для будущего функционала)
    function showSettings() {
        const settingsContent = `
Настройки (в разработке):

• Настройка интервала проверки
• Выбор конкретных каналов
• Статистика собранных баллов
• Звуковые уведомления
• Темная/светлая тема

✅ ДОСТУПНЫЕ НАСТРОЙКИ:
• Автозапуск при открытии Twitch - используйте переключатель выше
• Автоостановка при закрытии вкладок - работает автоматически

Текущие настройки можно посмотреть в консоли:
chrome://extensions/ → service worker → консоль
        `.trim();

        alert(settingsContent);
    }
    
    // Проверка доступности background script при загрузке
    console.log('Проверка доступности background script...');
    if (!chrome.runtime) {
        console.error('chrome.runtime недоступен!');
        showError('Chrome Runtime API недоступен');
    } else {
        console.log('Chrome Runtime API доступен');
    }
});

// Добавляем стили для анимаций уведомлений
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInNotification {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }

    @keyframes slideOutNotification {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

console.log('Popup script загружен полностью'); 