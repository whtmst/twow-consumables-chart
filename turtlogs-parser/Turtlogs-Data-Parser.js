// ==UserScript==
// @name         Turtlogs Data Parser
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Парсит данные с turtlogs.com
// @author       Wht Mst
// @match        https://www.turtlogs.com/viewer/*
// @grant        GM_setClipboard
// @grant        GM_notification
// ==/UserScript==

(function() {
    'use strict';

    window.addEventListener('load', function() {
        setTimeout(addExportButton, 2000);
    });

    function addExportButton() {
        if (document.getElementById('turtlogs-export-btn')) return;

        const button = document.createElement('button');
        button.id = 'turtlogs-export-btn';
        button.textContent = '📊 Экспорт данных';
        button.style.cssText = `
            position: fixed;
            top: 65px;
            right: 25px;
            z-index: 9999;
            padding: 12px 16px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
        `;

        button.addEventListener('mouseover', function() {
            this.style.background = '#45a049';
            this.style.transform = 'translateY(-2px)';
        });

        button.addEventListener('mouseout', function() {
            this.style.background = '#4CAF50';
            this.style.transform = 'translateY(0)';
        });

        button.onclick = function() {
            exportCombatData();
        };

        document.body.appendChild(button);
    }

    function exportCombatData() {
        const data = parseCombatDataFixed();

        if (data.damage.length === 0 && data.healing.length === 0) {
            showNotification('❌ Данные не найдены! Убедитесь что фильтры установлены и данные загружены.', 'error');
            return;
        }

        const output = formatDataForExport(data);

        if (typeof GM_setClipboard !== 'undefined') {
            GM_setClipboard(output);
        } else {
            navigator.clipboard.writeText(output);
        }

        showNotification(`✅ Данные скопированы! УВС: ${data.damage.length}, ИВС: ${data.healing.length}`, 'success');
    }

    function showNotification(message, type) {
        if (typeof GM_notification !== 'undefined') {
            GM_notification({
                text: message,
                title: 'Turtlogs Parser',
                timeout: 3000
            });
        } else {
            alert(message);
        }
    }

    function formatDataForExport(data) {
        let output = '=== DAMAGE DONE DATA ===\n';
        data.damage.forEach(item => {
            output += `${item.rank}. ${item.name} - ${item.damage} (${item.dps}/s) - ${item.percentage}\n`;
        });

        output += '\n=== EFFECTIVE HEALING DONE DATA ===\n';
        data.healing.forEach(item => {
            output += `${item.rank}. ${item.name} - ${item.healing} (${item.hps}/s) - ${item.percentage}\n`;
        });

        output += `\n=== SUMMARY ===\n`;
        output += `Total damage entries: ${data.damage.length}\n`;
        output += `Total healing entries: ${data.healing.length}\n`;
        output += `Exported: ${new Date().toLocaleString()}`;

        return output;
    }

    // ИСПРАВЛЕННЫЙ ПАРСЕР
    function parseCombatDataFixed() {
        const bars = document.querySelectorAll('.bar');
        const result = {
            damage: [],
            healing: []
        };

        console.log(`Found ${bars.length} bars`);

        bars.forEach((bar, index) => {
            const text = bar.textContent.trim();
            console.log(`Parsing: "${text}"`);

            const rankMatch = text.match(/^(\d+)\./);
            if (!rankMatch) return;

            const rank = parseInt(rankMatch[1]);
            let remaining = text.substring(rankMatch[0].length);

            // Извлекаем имя (до первого числа)
            let name = '';
            let i = 0;
            while (i < remaining.length && (isNaN(remaining[i]) || remaining[i] === ' ' || remaining[i] === '(')) {
                name += remaining[i];
                i++;
            }
            name = name.trim();

            // Оставшаяся часть: числа
            remaining = remaining.substring(i);

            let damage, dps, percentage;

            // Определяем есть ли запятая
            const hasComma = remaining.includes(',');

            if (hasComma) {
                // ФОРМАТ С ЗАПЯТОЙ
                // Находим позицию запятой
                const commaIndex = remaining.indexOf(',');

                // damage заканчивается через 3 цифры после запятой
                const damageEnd = commaIndex + 4; // ",669" -> 4 символа
                damage = remaining.substring(0, damageEnd); // "94,669"

                // Остаток после damage
                let numbersPart = remaining.substring(damageEnd); // "554.0/s5.5%"

                // Теперь нужно правильно извлечь DPS
                // DPS может быть: "554.0" (3 цифры + . + 1 цифра) ИЛИ "69.1" (2 цифры + . + 1 цифра)
                const slashIndex = numbersPart.indexOf('/s');
                if (slashIndex === -1) return;

                const beforeSlash = numbersPart.substring(0, slashIndex); // "554.0" или "69.1"

                // Определяем длину DPS по формату X.X
                const dotIndex = beforeSlash.indexOf('.');
                if (dotIndex === -1) return;

                // DPS всегда имеет формат "XXX.X" или "XX.X"
                // Проверяем сколько цифр до точки
                if (dotIndex === 3) {
                    // Формат "554.0" - берем все 5 символов
                    dps = beforeSlash.substring(0, 5);
                } else if (dotIndex === 2) {
                    // Формат "69.1" - берем все 4 символа
                    dps = beforeSlash.substring(0, 4);
                } else {
                    dps = beforeSlash;
                }

                // Процент
                numbersPart = numbersPart.substring(slashIndex + 2);
                const percentMatch = numbersPart.match(/(\d+\.\d+)%$/);
                percentage = percentMatch ? percentMatch[1] + '%' : '0%';

            } else {
                // ФОРМАТ БЕЗ ЗАПЯТОЙ
                const slashIndex = remaining.indexOf('/s');
                if (slashIndex === -1) return;

                const beforeSlash = remaining.substring(0, slashIndex);
                const afterSlash = remaining.substring(slashIndex + 2);

                // dps всегда последние 3 символа перед /s
                dps = beforeSlash.substring(beforeSlash.length - 3);
                damage = beforeSlash.substring(0, beforeSlash.length - 3);

                // Процент
                const percentMatch = afterSlash.match(/(\d+\.\d+)%$/);
                percentage = percentMatch ? percentMatch[1] + '%' : '0%';
            }

            if (!damage || !dps) {
                console.log('Failed to parse:', text);
                return;
            }

            const data = {
                rank: rank,
                name: name,
                dps: dps,
                percentage: percentage
            };

            if (index <= 37) {
                result.damage.push({
                    ...data,
                    damage: damage
                });
            } else {
                result.healing.push({
                    ...data,
                    healing: damage,
                    hps: dps
                });
            }

            console.log(`Parsed: ${rank}. ${name} - ${damage} (${dps}/s) - ${percentage}`);
        });

        return result;
    }

    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(addExportButton, 1000);
        }
    }).observe(document, {subtree: true, childList: true});

})();
