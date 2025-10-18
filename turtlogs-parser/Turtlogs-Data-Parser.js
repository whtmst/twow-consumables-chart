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

    // ПАРСЕР С РЕГУЛЯРНЫМИ ВЫРАЖЕНИЯМИ
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
            let remaining = text.substring(rankMatch[0].length).trim();

            const nameMatch = remaining.match(/^([^\d]+)/);
            if (!nameMatch) return;

            const name = nameMatch[1].trim();
            remaining = remaining.substring(nameMatch[0].length);

            const percentMatch = remaining.match(/(\d+\.\d+)%$/);
            if (!percentMatch) return;
            const percentage = percentMatch[1] + '%';

            remaining = remaining.substring(0, remaining.lastIndexOf(percentMatch[0]));

            const slashIndex = remaining.lastIndexOf('/s');
            if (slashIndex === -1) return;

            const beforeSlash = remaining.substring(0, slashIndex);

            let damage, dps;
            const lastCommaIndex = beforeSlash.lastIndexOf(',');

            if (lastCommaIndex !== -1) {
                const afterComma = beforeSlash.substring(lastCommaIndex + 1);

                if (afterComma.length >= 6) {
                    damage = beforeSlash.substring(0, lastCommaIndex + 4);
                    dps = beforeSlash.substring(lastCommaIndex + 4);
                } else if (afterComma.length === 5) {
                    if (afterComma.charAt(2) === '.') {
                        damage = beforeSlash.substring(0, lastCommaIndex + 1);
                        dps = afterComma;
                    } else {
                        damage = beforeSlash.substring(0, lastCommaIndex + 4);
                        dps = beforeSlash.substring(lastCommaIndex + 4);
                    }
                } else {
                    damage = beforeSlash.substring(0, lastCommaIndex + 4);
                    dps = beforeSlash.substring(lastCommaIndex + 4);
                }
            } else {
                // Нет запятой - ищем DPS как X.X формат (не более 1 цифры перед точкой)
                const dpsMatch = beforeSlash.match(/(\d\.\d)$/);
                if (!dpsMatch) {
                    // Попробуем XX.X или XXX.X если число большое
                    const dpsMatch2 = beforeSlash.match(/(\d{1,3}\.\d)$/);
                    if (!dpsMatch2) return;

                    dps = dpsMatch2[1];
                    damage = beforeSlash.substring(0, beforeSlash.length - dps.length);

                    // Проверка: если damage получился < 2 символов, значит взяли лишнее из DPS
                    if (damage.length < 2) {
                        // Берем только последнюю цифру перед точкой для DPS
                        const dpsFixed = beforeSlash.match(/(\d\.\d)$/);
                        if (dpsFixed) {
                            dps = dpsFixed[1];
                            damage = beforeSlash.substring(0, beforeSlash.length - dps.length);
                        }
                    }
                } else {
                    dps = dpsMatch[1];
                    damage = beforeSlash.substring(0, beforeSlash.length - dps.length);
                }
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
