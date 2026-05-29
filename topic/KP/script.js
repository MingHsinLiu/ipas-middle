// iPAS 資安中級 KP - 優化後的共用 JavaScript
// 效能優化：快取 DOM 查詢、避免重複操作、使用事件委派

(function () {
    'use strict';

    // 快取 DOM 元素（只查詢一次）
    const elements = {
        progressBar: document.getElementById('progressBar'),
        backToTop: document.getElementById('backToTop'),
        categoryFilter: document.getElementById('categoryFilter'),
        starFilter: document.getElementById('starFilter'),
        searchInput: document.getElementById('searchInput'),
        searchButton: document.getElementById('searchButton'),
        noResultsMessage: document.getElementById('noResultsMessage'),
        focusCards: null // 延遲載入
    };

    // 延遲初始化 focus cards（避免阻塞）
    function getFocusCards() {
        if (!elements.focusCards) {
            elements.focusCards = document.querySelectorAll('.focus-card');
        }
        return elements.focusCards;
    }

    // ========== Progress Bar ==========
    function updateProgressBar() {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (height > 0) ? (winScroll / height) * 100 : 0;
        elements.progressBar.style.width = scrolled + '%';
    }

    // ========== Back to Top Button ==========
    function toggleBackToTopButton() {
        const scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
        elements.backToTop.style.display = (scrollTop > 100) ? 'flex' : 'none';
    }

    // ========== Filter Functions ==========
    function filterByCategory(categoryValue) {
        elements.categoryFilter.value = categoryValue;
        elements.starFilter.value = 'all';
        elements.searchInput.value = '';
        filterFocusPoints();
    }

    // 優化後的過濾函數
    function filterFocusPoints() {
        const category = elements.categoryFilter.value;
        const stars = elements.starFilter.value;
        const searchText = elements.searchInput.value.toLowerCase().trim();
        const points = getFocusCards();

        let anyVisible = false;

        // 批次處理 DOM 更新以提升效能
        points.forEach(point => {
            const matchesCategory = (category === 'all' || point.dataset.category === category);
            const matchesStars = (stars === 'all' || point.dataset.stars === stars);

            let matchesSearch = true;
            if (searchText !== '') {
                // 使用 textContent 比 innerHTML 更快
                const pointText = point.textContent.toLowerCase();
                matchesSearch = pointText.includes(searchText);
            }

            const isVisible = matchesCategory && matchesStars && matchesSearch;
            point.style.display = isVisible ? 'block' : 'none';

            if (isVisible) anyVisible = true;
        });

        // 更新 "無結果" 訊息
        if (elements.noResultsMessage) {
            if (searchText !== '' || category !== 'all' || stars !== 'all') {
                elements.noResultsMessage.style.display = anyVisible ? 'none' : 'block';
                elements.noResultsMessage.textContent = '沒有找到符合目前篩選及搜尋條件的重點。';
            } else {
                elements.noResultsMessage.style.display = 'none';
            }
        }

        // 只在有搜尋文字時才套用高亮
        if (searchText !== '') {
            applyHighlight(searchText);
        } else {
            removeHighlight();
        }
    }

    // ========== Highlight Functions ==========
    // 優化：避免重複的 innerHTML 操作
    function removeHighlight() {
        const highlightedElements = document.querySelectorAll('.highlight');
        highlightedElements.forEach(el => {
            const parent = el.parentNode;
            if (parent) {
                parent.replaceChild(document.createTextNode(el.textContent), el);
                // 合併相鄰的文字節點
                parent.normalize();
            }
        });
    }

    function applyHighlight(searchText) {
        if (!searchText) return;

        // 先移除現有高亮
        removeHighlight();

        // 只對可見的卡片套用高亮
        const visibleCards = document.querySelectorAll('.focus-card[style="display: block;"]');
        const regex = new RegExp(`(${escapeRegex(searchText)})`, 'gi');

        visibleCards.forEach(card => {
            const detailsContent = card.querySelector('.details-content');
            const focusTopic = card.querySelector('.focus-topic');

            if (detailsContent) highlightElement(detailsContent, regex);
            if (focusTopic) highlightElement(focusTopic, regex);
        });
    }

    function highlightElement(element, regex) {
        // 使用 TreeWalker 遍歷文字節點（更安全的方法）
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            // 跳過已經在 highlight span 中的文字
            if (node.parentNode.className !== 'highlight') {
                textNodes.push(node);
            }
        }

        textNodes.forEach(textNode => {
            const text = textNode.textContent;
            if (regex.test(text)) {
                const fragment = document.createDocumentFragment();
                let lastIndex = 0;

                text.replace(regex, (match, p1, offset) => {
                    // 添加前面的文字
                    if (offset > lastIndex) {
                        fragment.appendChild(document.createTextNode(text.substring(lastIndex, offset)));
                    }

                    // 添加高亮的文字
                    const span = document.createElement('span');
                    span.className = 'highlight';
                    span.textContent = match;
                    fragment.appendChild(span);

                    lastIndex = offset + match.length;
                });

                // 添加剩餘的文字
                if (lastIndex < text.length) {
                    fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
                }

                textNode.parentNode.replaceChild(fragment, textNode);
            }
        });
    }

    // 轉義正則表達式特殊字符
    function escapeRegex(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function searchFocusPoints() {
        filterFocusPoints();
    }

    // ========== Event Listeners ==========
    // 使用更高效的事件處理
    window.addEventListener('scroll', function () {
        updateProgressBar();
        toggleBackToTopButton();
    }, { passive: true }); // passive 提升滾動效能

    elements.backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    elements.categoryFilter.addEventListener('change', () => {
        elements.searchInput.value = '';
        filterFocusPoints();
    });

    elements.starFilter.addEventListener('change', () => {
        elements.searchInput.value = '';
        filterFocusPoints();
    });

    elements.searchButton.addEventListener('click', searchFocusPoints);

    elements.searchInput.addEventListener('keyup', function (event) {
        if (event.key === 'Enter') {
            searchFocusPoints();
        }
    });

    // 事件委派：在 grid 上監聽所有 category item 點擊
    const categoriesGrid = document.getElementById('categoriesGrid');
    if (categoriesGrid) {
        categoriesGrid.addEventListener('click', function (event) {
            const categoryItem = event.target.closest('.category-item');
            if (categoryItem) {
                const categoryNum = categoryItem.querySelector('.category-number');
                if (categoryNum) {
                    filterByCategory(categoryNum.textContent);
                }
            }
        });
    }

    // ========== 初始化 ==========
    // 使用 requestAnimationFrame 延遲非關鍵初始化
    function init() {
        toggleBackToTopButton();
        updateProgressBar();
        // 延遲執行過濾（讓頁面先渲染）
        setTimeout(() => {
            filterFocusPoints();
        }, 0);
    }

    // DOMContentLoaded 已觸發（因為使用 defer），直接初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 將 filterByCategory 暴露到全域（供 HTML onclick 使用）
    window.filterByCategory = filterByCategory;

})();


