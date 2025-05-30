// Скрипт для создания простых PNG иконок-заглушек
// Можно выполнить в консоли браузера на любой странице

console.log('Создание иконок-заглушек...');

// Создаем простые иконки с помощью Canvas API
function createIcon(size, filename) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;
    
    // Фон в стиле Twitch
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#9146FF');
    gradient.addColorStop(1, '#6441A5');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Белый текст "TP"
    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.floor(size * 0.3)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TP', size/2, size/2);
    
    // Конвертируем в blob и скачиваем
    canvas.toBlob(function(blob) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    });
}

// Создаем все размеры
setTimeout(() => createIcon(16, 'icon16.png'), 100);
setTimeout(() => createIcon(32, 'icon32.png'), 200);
setTimeout(() => createIcon(48, 'icon48.png'), 300);
setTimeout(() => createIcon(128, 'icon128.png'), 400);

console.log('Иконки создаются... Они будут скачаны автоматически.');
console.log('Переместите скачанные PNG файлы в папку icons/ расширения.'); 