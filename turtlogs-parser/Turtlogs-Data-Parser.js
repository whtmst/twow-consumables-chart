// ==UserScript==
// @name         Turtlogs Data Parser
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  Парсит данные с turtlogs.com, игнорируя мусорные записи в скобках
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
            top: 7px;
            right: 235px;
            z-index: 9999;
            padding: 8px 12px;
            background: rgb(89, 130, 27);
            color: rgb(255, 255, 255);
            text-transform: uppercase;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: 0.3s;
            transform: translateY(0px);
        `;

        button.addEventListener('mouseover', function() {
            this.style.background = '#d97706';
        });

        button.addEventListener('mouseout', function() {
            this.style.background = '#59821b';
        });

        button.onclick = function() {
            exportCombatData();
        };

        document.body.appendChild(button);
    }

    function exportCombatData() {
        const data = parseCombatDataFixed();

        if (data.damage.length === 0 && data.healing.length === 0) {
            showNotification('❌ Данные не найдены!', 'error');
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
        data.damage.forEach((item, index) => {
            // Используем index + 1 для красивой нумерации
            output += `${index + 1}. ${item.name} - ${item.damage} (${item.dps}/s) - ${item.percentage}\n`;
        });

        output += '\n=== EFFECTIVE HEALING DONE DATA ===\n';
        data.healing.forEach((item, index) => {
            output += `${index + 1}. ${item.name} - ${item.healing} (${item.hps}/s) - ${item.percentage}\n`;
        });

        output += `\n=== SUMMARY ===\n`;
        output += `Total damage entries: ${data.damage.length}\n`;
        output += `Total healing entries: ${data.healing.length}\n`;
        output += `Exported: ${new Date().toLocaleString()}`;

        return output;
    }

    function parseCombatDataFixed() {
        const result = {
            damage: [],
            healing: []
        };

        const leftMeter = document.getElementById('left_meter');
        const allMeters = Array.from(document.querySelectorAll('raidmeter'));
        const rightMeter = allMeters.find(m => m.id !== 'left_meter');

        function extractBarData(bar) {
            const text = bar.textContent.trim();
            const rankMatch = text.match(/^(\d+)\./);
            if (!rankMatch) return null;

            let remaining = text.substring(rankMatch[0].length).trim();
            const nameMatch = remaining.match(/^([^\d]+)/);
            if (!nameMatch) return null;

            const name = nameMatch[1].trim();
            remaining = remaining.substring(nameMatch[0].length);

            const percentMatch = remaining.match(/(\d+\.\d+)%$/);
            if (!percentMatch) return null;
            const percentage = percentMatch[1] + '%';
            remaining = remaining.substring(0, remaining.lastIndexOf(percentMatch[0]));

            const slashIndex = remaining.lastIndexOf('/s');
            if (slashIndex === -1) return null;
            const beforeSlash = remaining.substring(0, slashIndex);

            let value, perSecond;
            const lastCommaIndex = beforeSlash.lastIndexOf(',');

            if (lastCommaIndex !== -1) {
                const afterComma = beforeSlash.substring(lastCommaIndex + 1);
                if (afterComma.length >= 6) {
                     value = beforeSlash.substring(0, lastCommaIndex + 4);
                     perSecond = beforeSlash.substring(lastCommaIndex + 4);
                } else if (afterComma.length === 5) {
                    if (afterComma.charAt(2) === '.') {
                        value = beforeSlash.substring(0, lastCommaIndex + 1);
                        perSecond = afterComma;
                    } else {
                        value = beforeSlash.substring(0, lastCommaIndex + 4);
                        perSecond = beforeSlash.substring(lastCommaIndex + 4);
                    }
                } else {
                    value = beforeSlash.substring(0, lastCommaIndex + 4);
                    perSecond = beforeSlash.substring(lastCommaIndex + 4);
                }
            } else {
                const dpsMatch = beforeSlash.match(/(\d\.\d)$/);
                if (!dpsMatch) {
                    const dpsMatch2 = beforeSlash.match(/(\d{1,3}\.\d)$/);
                    if (!dpsMatch2) return null;
                    perSecond = dpsMatch2[1];
                    value = beforeSlash.substring(0, beforeSlash.length - perSecond.length);
                } else {
                    perSecond = dpsMatch[1];
                    value = beforeSlash.substring(0, beforeSlash.length - perSecond.length);
                }
            }

            return { name, value, perSecond, percentage };
        }

        if (leftMeter) {
            const damageBars = leftMeter.querySelectorAll('.bar');
            damageBars.forEach(bar => {
                const data = extractBarData(bar);
                // ПРОВЕРКА НА СКОБКИ: если в имени есть ( — скипаем
                if (data && !data.name.includes('(')) {
                    result.damage.push({
                        name: data.name,
                        damage: data.value,
                        dps: data.perSecond,
                        percentage: data.percentage
                    });
                }
            });
        }

        if (rightMeter) {
            const healingBars = rightMeter.querySelectorAll('.bar');
            healingBars.forEach(bar => {
                const data = extractBarData(bar);
                // Для хила обычно скобки не мешают, но если надо — можно добавить и сюда
                if (data) {
                    result.healing.push({
                        name: data.name,
                        healing: data.value,
                        hps: data.perSecond,
                        percentage: data.percentage
                    });
                }
            });
        }

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
