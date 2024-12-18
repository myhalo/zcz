let animationTimeout;
let currentSegment = 0;
let currentChar = 0;
const displayArea = document.getElementById('textDisplay');
const bgMusic = document.getElementById('bgMusic');
const dailyCounterElement = document.getElementById('daily-counter');
const totalCounterElement = document.getElementById('total-counter');

// 获取今天的日期（格式：YYYY-MM-DD）
function getTodayDate() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

// 从localStorage获取计数
let totalCount = parseInt(localStorage.getItem('totalSpellCount')) || 0;
let dailyCount = 0;
const lastDate = localStorage.getItem('lastSpellDate');
const today = getTodayDate();

// 检查是否需要重置每日计数
if (lastDate !== today) {
    localStorage.setItem('lastSpellDate', today);
    localStorage.setItem('dailySpellCount', '0');
} else {
    dailyCount = parseInt(localStorage.getItem('dailySpellCount')) || 0;
}

// 更新计数显示
function updateCounters() {
    dailyCounterElement.textContent = `今日已念咒 ${dailyCount} 次`;
    totalCounterElement.textContent = `总共念咒 ${totalCount} 次`;
    localStorage.setItem('dailySpellCount', dailyCount.toString());
    localStorage.setItem('totalSpellCount', totalCount.toString());
}

// 初始显示
updateCounters();

// 添加音频播放功能
async function playBackgroundMusic() {
    try {
        // 确保从头开始播放
        bgMusic.currentTime = 0;
        await bgMusic.play();
        
        // 音频播放结束后，重新启用按钮
        bgMusic.onended = function() {
            const button = document.getElementById('spellButton');
            if (currentSegment >= segments.length) {
                enableButton();
            }
        };
    } catch (err) {
        console.log('音频播放失败:', err);
    }
}

document.getElementById('spellButton').addEventListener('click', function(e) {
    const button = e.target;
    button.disabled = true; // 禁用按钮
    button.classList.add('disabled'); // 添加禁用样式
    
    // 增加计数
    dailyCount++;
    totalCount++;
    updateCounters();
    
    // 播放背景音乐
    playBackgroundMusic();
    
    // 清空显示区域
    displayArea.innerHTML = '';

    const text = "天清清，地明明，拜請祖師鎮威靈，福德正神，為吾招貴人，招起東方貴人到，南方貴人來，西方貴人到，正財不斷，歸庫中神兵火急如律令。";
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
        '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
    ];
    
    // 按标点符号切割文本，并只保留文字
    const segments = text.split(/[，。]/).filter(Boolean).map(seg => seg.trim());
    
    // 获取窗口尺寸
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // 存储活动的字符位置（包括动画过程中的位置）
    let activePositions = new Map(); // 使用Map来存储每个字符的位置信息
    
    // 定义网格系统
    const gridSize = 100; // 增加网格大小
    let grid = new Map(); // 用于跟踪已占用的网格位置
    
    function getGridKey(x, y) {
        const gridX = Math.floor(x / gridSize);
        const gridY = Math.floor(y / gridSize);
        return `${gridX},${gridY}`;
    }
    
    function calculateFinalPosition(y) {
        return y - 150; // 减小上升高度，使字符更集中
    }
    
    function getSegmentPosition(segmentIndex, charIndex) {
        const margin = 150; // 进一步增加边界安全距离
        const segmentWidth = (windowWidth - margin * 2) / 4; // 减少区域数量到4个
        
        // 计算基础X位置（根据段落索引）
        const baseX = margin + (segmentIndex % 4) * segmentWidth;
        
        // 在基础位置上添加随机偏移，但确保在网格范围内
        let x, y, gridKey;
        let found = false;
        let attempts = 0;
        const maxAttempts = 30; // 增加尝试次数
        
        while (!found && attempts < maxAttempts) {
            x = baseX + (Math.random() * segmentWidth * 0.4); // 进一步减小随机范围
            y = windowHeight - margin - 100; // 确保不与按钮重叠
            const finalY = calculateFinalPosition(y);
            
            // 确保x不超出屏幕范围
            x = Math.max(margin, Math.min(windowWidth - margin, x));
            
            // 检查网格位置
            gridKey = getGridKey(x, finalY);
            
            // 检查是否与其他字符重叠
            if (!isPositionOverlapping(x, finalY) && !grid.has(gridKey)) {
                found = true;
            }
            
            attempts++;
        }
        
        if (!found) {
            // 如果没找到合适的位置，尝试使用基础位置
            x = baseX + segmentWidth / 2;
            y = windowHeight - margin - 100; // 确保不与按钮重叠
        }
        
        // 标记网格为已占用
        grid.set(gridKey, true);
        
        return { x, y };
    }
    
    function isPositionOverlapping(x, y) {
        const minDistance = 120; // 显著增加最小间距
        
        for (let pos of activePositions.values()) {
            const dx = pos.x - x;
            const dy = pos.finalY - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < minDistance) {
                return true;
            }
        }
        return false;
    }
    
    function enableButton() {
        const button = document.getElementById('spellButton');
        button.disabled = false;
        button.classList.remove('disabled');
        console.log('Button enabled'); // 调试信息
    }
    
    function showNextChar() {
        if (currentSegment >= segments.length) {
            activePositions.clear();
            grid.clear();
            enableButton(); // 启用按钮
            return;
        }

        const currentText = segments[currentSegment];
        if (currentChar >= currentText.length) {
            currentSegment++;
            currentChar = 0;
            if (currentSegment < segments.length) {
                animationTimeout = setTimeout(showNextChar, 800); // 增加段落之间的间隔
            } else {
                showNextChar(); // 确保在最后一个字符后调用以启用按钮
            }
            return;
        }

        const char = currentText[currentChar];
        const span = document.createElement('span');
        span.textContent = char;
        
        // 随机选择动画效果
        const effectNum = Math.floor(Math.random() * 3) + 1;
        span.className = 'character float' + effectNum;
        span.style.color = colors[Math.floor(Math.random() * colors.length)];
        
        // 获取位置
        const pos = getSegmentPosition(currentSegment, currentChar);
        span.style.left = pos.x + 'px';
        span.style.top = pos.y + 'px';
        
        // 记录这个字符的位置信息
        const charId = `${currentSegment}-${currentChar}`;
        activePositions.set(charId, {
            x: pos.x,
            y: pos.y,
            finalY: calculateFinalPosition(pos.y)
        });
        
        displayArea.appendChild(span);
        
        // 动画结束后删除元素和位置信息
        span.addEventListener('animationend', () => {
            span.remove();
            activePositions.delete(charId);
            const gridKey = getGridKey(pos.x, calculateFinalPosition(pos.y));
            grid.delete(gridKey);
        });

        currentChar++;
        animationTimeout = setTimeout(showNextChar, 500); // 增加字符间隔到1秒
    }

    // 清除之前的动画
    clearTimeout(animationTimeout);
    
    // 开始新的动画
    currentSegment = 0;
    currentChar = 0;
    showNextChar();
});