// Twitch Channel Points Collector - Background Service Worker
// Автоматический сбор Channel Points на всех открытых вкладках Twitch

let isCollectorActive = false;
let checkInterval = null;
let autoStartEnabled = true; // Автозапуск по умолчанию включен
const CHECK_INTERVAL_MS = 30000; // 30 секунд между проверками
const CLICK_DELAY_MS = 2000; // 2 секунды задержка после клика для безопасности
const AUTOSTART_CHECK_DELAY = 3000; // 3 секунды задержка перед проверкой автозапуска

console.log('Background script загружается...');

// Инициализация при установке расширения
chrome.runtime.onInstalled.addListener(() => {
  console.log('Twitch Points Collector установлен');
  // Загружаем сохраненные настройки
  chrome.storage.local.get(['isActive', 'autoStartEnabled'], (result) => {
    if (chrome.runtime.lastError) {
      console.error('Ошибка загрузки настроек:', chrome.runtime.lastError);
      return;
    }
    
    isCollectorActive = result.isActive || false;
    autoStartEnabled = result.autoStartEnabled !== undefined ? result.autoStartEnabled : true;
    
    console.log('Загружены настройки:', {
      isActive: isCollectorActive,
      autoStartEnabled: autoStartEnabled
    });
    
    if (isCollectorActive) {
      startCollector();
    } else if (autoStartEnabled) {
      // Проверяем автозапуск с небольшой задержкой
      setTimeout(checkAutoStart, AUTOSTART_CHECK_DELAY);
    }
  });
});

// Запуск при старте браузера
chrome.runtime.onStartup.addListener(() => {
  console.log('Браузер запущен, проверяем состояние коллектора');
  chrome.storage.local.get(['isActive', 'autoStartEnabled'], (result) => {
    if (chrome.runtime.lastError) {
      console.error('Ошибка загрузки настроек при старте:', chrome.runtime.lastError);
      return;
    }
    
    isCollectorActive = result.isActive || false;
    autoStartEnabled = result.autoStartEnabled !== undefined ? result.autoStartEnabled : true;
    
    console.log('Состояние при старте:', {
      isActive: isCollectorActive,
      autoStartEnabled: autoStartEnabled
    });
    
    if (isCollectorActive) {
      startCollector();
    } else if (autoStartEnabled) {
      // Проверяем автозапуск с задержкой для загрузки браузера
      setTimeout(checkAutoStart, AUTOSTART_CHECK_DELAY);
    }
  });
});

// Слушатель сообщений от popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Получено сообщение:', request);
  
  try {
    if (request.action === 'toggle') {
      isCollectorActive = !isCollectorActive;
      console.log('Переключение состояния на:', isCollectorActive);
      
      // Сохраняем состояние
      chrome.storage.local.set({ isActive: isCollectorActive }, () => {
        if (chrome.runtime.lastError) {
          console.error('Ошибка сохранения состояния:', chrome.runtime.lastError);
          sendResponse({ 
            status: 'error', 
            message: 'Ошибка сохранения настроек' 
          });
          return;
        }
        
        if (isCollectorActive) {
          startCollector();
          sendResponse({ status: 'active', message: 'Сбор баллов активирован' });
        } else {
          stopCollector();
          sendResponse({ status: 'inactive', message: 'Сбор баллов отключен' });
        }
      });
      
      return true; // Указываем, что ответ будет асинхронным
      
    } else if (request.action === 'getStatus') {
      console.log('Запрос статуса, текущее состояние:', { isCollectorActive, autoStartEnabled });
      sendResponse({ 
        status: isCollectorActive ? 'active' : 'inactive',
        message: isCollectorActive ? 'Сбор баллов активен' : 'Сбор баллов отключен',
        autoStartEnabled: autoStartEnabled
      });
      
    } else if (request.action === 'toggleAutoStart') {
      autoStartEnabled = !autoStartEnabled;
      console.log('Переключение автозапуска на:', autoStartEnabled);
      
      // Сохраняем настройку автозапуска
      chrome.storage.local.set({ autoStartEnabled: autoStartEnabled }, () => {
        if (chrome.runtime.lastError) {
          console.error('Ошибка сохранения автозапуска:', chrome.runtime.lastError);
          sendResponse({ 
            status: 'error', 
            message: 'Ошибка сохранения настроек автозапуска' 
          });
          return;
        }
        
        sendResponse({ 
          status: 'success', 
          message: autoStartEnabled ? 'Автозапуск включен' : 'Автозапуск отключен',
          autoStartEnabled: autoStartEnabled
        });
      });
      
      return true;
      
    } else {
      console.log('Неизвестное действие:', request.action);
      sendResponse({ status: 'error', message: 'Неизвестное действие' });
    }
  } catch (error) {
    console.error('Ошибка обработки сообщения:', error);
    sendResponse({ status: 'error', message: 'Внутренняя ошибка: ' + error.message });
  }
});

// Функция проверки автозапуска
async function checkAutoStart() {
  if (!autoStartEnabled || isCollectorActive) {
    console.log('Автозапуск пропущен:', { autoStartEnabled, isCollectorActive });
    return;
  }
  
  console.log('🔍 Проверяем наличие вкладок Twitch для автозапуска...');
  
  try {
    const tabs = await chrome.tabs.query({ url: 'https://www.twitch.tv/*' });
    const streamTabs = tabs.filter(tab => 
      tab.url.includes('twitch.tv/') && 
      !tab.url.includes('/directory') &&
      !tab.url.includes('/following') &&
      !tab.url.includes('/browse') &&
      !tab.url.includes('/settings')
    );
    
    console.log(`Найдено ${tabs.length} вкладок Twitch, из них ${streamTabs.length} трансляций`);
    
    if (streamTabs.length > 0) {
      console.log('🚀 Автозапуск: найдены трансляции, запускаем коллектор!');
      console.log('Найденные трансляции:', streamTabs.map(tab => tab.url));
      
      isCollectorActive = true;
      
      // Сохраняем новое состояние
      chrome.storage.local.set({ isActive: true }, () => {
        if (!chrome.runtime.lastError) {
          startCollector();
          console.log('✅ Коллектор запущен автоматически!');
        }
      });
    } else {
      console.log('📭 Автозапуск: трансляции не найдены');
    }
  } catch (error) {
    console.error('❌ Ошибка при проверке автозапуска:', error);
  }
}

// Запуск коллектора
function startCollector() {
  try {
    if (checkInterval) {
      clearInterval(checkInterval);
    }
    
    console.log('Коллектор Channel Points запущен');
    checkAllTwitchTabs(); // Проверяем сразу
    
    checkInterval = setInterval(() => {
      checkAllTwitchTabs();
    }, CHECK_INTERVAL_MS);
    
  } catch (error) {
    console.error('Ошибка запуска коллектора:', error);
  }
}

// Остановка коллектора
function stopCollector() {
  try {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
    console.log('Коллектор Channel Points остановлен');
  } catch (error) {
    console.error('Ошибка остановки коллектора:', error);
  }
}

// Проверка всех вкладок Twitch
async function checkAllTwitchTabs() {
  try {
    const tabs = await chrome.tabs.query({ url: 'https://www.twitch.tv/*' });
    console.log(`Найдено ${tabs.length} вкладок Twitch`);
    
    for (const tab of tabs) {
      // Проверяем только активные вкладки (не в фоне)
      if (tab.url.includes('twitch.tv/') && !tab.url.includes('/directory')) {
        await checkAndClickChannelPoints(tab.id);
        // Небольшая задержка между обработкой вкладок
        await sleep(1000);
      }
    }
  } catch (error) {
    console.error('Ошибка при проверке вкладок:', error);
  }
}

// Проверка и клик по кнопке Channel Points на конкретной вкладке
async function checkAndClickChannelPoints(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: findAndClickChannelPointsButton
    });
    
    if (results && results[0] && results[0].result) {
      console.log(`Channel Points собраны на вкладке ${tabId}`);
      // Добавляем задержку после успешного клика
      await sleep(CLICK_DELAY_MS);
    }
  } catch (error) {
    // Игнорируем ошибки (вкладка может быть закрыта или недоступна)
    console.log(`Не удалось проверить вкладку ${tabId}:`, error.message);
  }
}

// Функция для поиска и клика по кнопке Channel Points (выполняется в контексте страницы)
function findAndClickChannelPointsButton() {
  console.log('Начинаем поиск кнопок Channel Points...');
  
  // Обновленные селекторы для современного Twitch (2024)
  const selectors = [
    // Новые селекторы для современного интерфейса Twitch
    'button[data-test-selector*="claim"]',
    'button[class*="claimable"]',
    'button[aria-label*="Claim"]',
    'button[aria-label*="claim"]',
    '[data-a-target*="community-points"] button',
    '[data-a-target="community-points-summary"] button',
    'button[class*="community-points"]',
    
    // Более общие селекторы
    'button:has-text("Claim")',
    'button:has-text("claim")',
    'button[class*="CoreButton"]:has-text("Claim")',
    
    // Старые селекторы (для совместимости)
    '[data-test-selector="community-points-summary"] button[class*="claimable"]',
    'button[class*="community-points"][class*="claimable"]',
    '.community-points-summary button',
    'button[class*="ScCoreButton-sc"][class*="ScCoreButtonPrimary"]',
    
    // Дополнительные селекторы
    'button[class*="Button"][class*="Primary"]',
    'button[type="button"][class*="primary"]'
  ];
  
  console.log('Проверяем', selectors.length, 'селекторов...');
  
  for (let i = 0; i < selectors.length; i++) {
    const selector = selectors[i];
    console.log(`Проверяем селектор ${i + 1}/${selectors.length}: ${selector}`);
    
    try {
      // Сначала ищем с :has-text, если не поддерживается - пропускаем
      if (selector.includes(':has-text')) {
        console.log('Пропускаем :has-text селектор (не поддерживается в Chrome)');
        continue;
      }
      
      const buttons = document.querySelectorAll(selector);
      console.log(`Найдено ${buttons.length} элементов для селектора: ${selector}`);
      
      for (let j = 0; j < buttons.length; j++) {
        const button = buttons[j];
        console.log(`Проверяем кнопку ${j + 1}/${buttons.length}:`, {
          tagName: button.tagName,
          className: button.className,
          textContent: button.textContent?.trim(),
          ariaLabel: button.getAttribute('aria-label'),
          visible: button.offsetParent !== null,
          disabled: button.disabled
        });
        
        // Проверяем, что кнопка видима и доступна для клика
        if (button && 
            button.offsetParent !== null && 
            !button.disabled) {
          
          const text = button.textContent?.toLowerCase() || '';
          const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
          
          // Проверяем содержимое кнопки
          const isClaimButton = 
            text.includes('claim') ||
            text.includes('собрать') ||
            text.includes('получить') ||
            ariaLabel.includes('claim') ||
            ariaLabel.includes('собрать') ||
            button.querySelector('[class*="claim"]') !== null;
          
          console.log('Анализ кнопки:', {
            hasClaimText: text.includes('claim'),
            hasRussianText: text.includes('собрать') || text.includes('получить'),
            hasClaimAria: ariaLabel.includes('claim'),
            hasClaimChild: button.querySelector('[class*="claim"]') !== null,
            isClaimButton: isClaimButton
          });
          
          if (isClaimButton) {
            console.log('✅ Найдена кнопка Channel Points! Кликаем...', {
              selector: selector,
              text: text,
              ariaLabel: ariaLabel
            });
            
            // Пытаемся кликнуть
            try {
              button.click();
              console.log('✅ Клик выполнен успешно!');
              return true;
            } catch (clickError) {
              console.error('❌ Ошибка при клике:', clickError);
            }
          } else {
            console.log('⏭️ Кнопка не содержит ключевых слов для Channel Points');
          }
        } else {
          console.log('⏭️ Кнопка не подходит:', {
            notVisible: button.offsetParent === null,
            disabled: button.disabled,
            notExists: !button
          });
        }
      }
    } catch (error) {
      console.error(`❌ Ошибка при работе с селектором "${selector}":`, error);
    }
  }
  
  // Дополнительный поиск по всем кнопкам на странице
  console.log('🔍 Дополнительный поиск по всем кнопкам...');
  try {
    const allButtons = document.querySelectorAll('button');
    console.log(`Найдено ${allButtons.length} кнопок на странице`);
    
    let claimButtonsFound = 0;
    for (const button of allButtons) {
      const text = button.textContent?.toLowerCase() || '';
      const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
      
      if (text.includes('claim') || text.includes('собрать') || ariaLabel.includes('claim')) {
        claimButtonsFound++;
        console.log(`🎯 Потенциальная кнопка ${claimButtonsFound}:`, {
          text: button.textContent?.trim(),
          ariaLabel: button.getAttribute('aria-label'),
          className: button.className,
          visible: button.offsetParent !== null,
          disabled: button.disabled
        });
        
        if (button.offsetParent !== null && !button.disabled) {
          console.log('✅ Кликаем на найденную кнопку!');
          button.click();
          return true;
        }
      }
    }
    
    console.log(`Найдено ${claimButtonsFound} потенциальных кнопок сбора баллов`);
    
  } catch (error) {
    console.error('❌ Ошибка дополнительного поиска:', error);
  }
  
  console.log('❌ Кнопки Channel Points не найдены');
  return false;
}

// Вспомогательная функция для задержки
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Отслеживание открытия новых вкладок Twitch для автозапуска
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('twitch.tv')) {
    console.log(`Twitch вкладка обновлена: ${tab.url}`);
    
    // Проверяем автозапуск при открытии новой трансляции
    if (!isCollectorActive && autoStartEnabled && 
        tab.url.includes('twitch.tv/') && 
        !tab.url.includes('/directory') &&
        !tab.url.includes('/following') &&
        !tab.url.includes('/browse') &&
        !tab.url.includes('/settings')) {
      
      console.log('🔍 Новая трансляция открыта, проверяем автозапуск...');
      setTimeout(checkAutoStart, 2000); // Небольшая задержка для загрузки страницы
    }
  }
});

// Отслеживание закрытия вкладок
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  console.log(`Вкладка ${tabId} закрыта`);
  
  // Если коллектор активен, проверяем, остались ли вкладки Twitch
  if (isCollectorActive) {
    try {
      const tabs = await chrome.tabs.query({ url: 'https://www.twitch.tv/*' });
      const streamTabs = tabs.filter(tab => 
        tab.url.includes('twitch.tv/') && 
        !tab.url.includes('/directory')
      );
      
      if (streamTabs.length === 0) {
        console.log('📭 Все вкладки Twitch закрыты, останавливаем коллектор');
        isCollectorActive = false;
        stopCollector();
        
        // Сохраняем состояние
        chrome.storage.local.set({ isActive: false });
      }
    } catch (error) {
      console.error('Ошибка при проверке закрытых вкладок:', error);
    }
  }
});

// Лог готовности background script
console.log('Background script готов к работе'); 