// data.jsから initialTopics を読み込みます

let topics = [];
let isSpinning = false;

// DOM要素
const titleEl = document.getElementById('topicTitle');
const detailEl = document.getElementById('topicDetail');
const spinBtn = document.getElementById('spinBtn');
const resetBtn = document.getElementById('resetBtn');
const topicListEl = document.getElementById('topicList');
const displayArea = document.getElementById('displayArea');
const countBadge = document.createElement('span');

// 初期化
function init() {
    // h2にカウントバッジを追加
    countBadge.className = 'count-badge';
    document.querySelector('.list-header h2').appendChild(countBadge);

    // localStorageから状態を復元、なければ初期化
    const saved = localStorage.getItem('reality_roulette_public_state');
    if (saved) {
        try {
            topics = JSON.parse(saved);
        } catch (e) {
            resetData();
        }
    } else {
        resetData();
    }

    // データ構造の互換性チェック（新しい項目が追加された場合の対応）
    if (topics.length !== initialTopics.length) {
        // もしinitialTopicsより少なければリセット、といった処理にもできますが
        // 今回はシンプルにローカル保存データを優先します。
    }

    renderList();
    updateSpinButtonStatus();
}

function resetData() {
    topics = initialTopics.map(t => ({ ...t, used: false }));
}

// 状態の保存
function saveState() {
    localStorage.setItem('reality_roulette_public_state', JSON.stringify(topics));
}

// リストの描画
function renderList() {
    topicListEl.innerHTML = '';
    let unusedCount = 0;

    topics.forEach((topic, index) => {
        if (!topic.used) {
            unusedCount++;
            return; // 既に出た話題だけを表示
        }

        const li = document.createElement('li');
        li.className = 'topic-item used'; // usedのみ表示するため常にused
        li.id = `topic-item-${index}`;

        li.innerHTML = `
            <div class="topic-item-title">${topic.title}</div>
            <div class="topic-item-detail">${topic.detail.replace(/\n/g, '<br>')}</div>
            <button class="restore-btn" onclick="restoreTopic(${index})">候補に戻す</button>
        `;
        topicListEl.appendChild(li);
    });

    countBadge.textContent = `残り ${unusedCount}/${topics.length}`;
}

// 個別に候補に戻す処理
window.restoreTopic = function (index) {
    if (topics[index]) {
        topics[index].used = false;
        saveState();
        renderList();
        updateSpinButtonStatus();
    }
};

// スピンボタンの状態更新
function updateSpinButtonStatus() {
    const unusedTopics = topics.filter(t => !t.used);
    if (unusedTopics.length === 0) {
        spinBtn.disabled = true;
        spinBtn.textContent = 'ALL COMPLETE';
    } else {
        spinBtn.disabled = false;
        spinBtn.textContent = 'SPIN ROULETTE';
    }
}

// ルーレットを回す処理
function spinRoulette() {
    if (isSpinning) return;

    // まだ使われていない話題のインデックス一覧を取得
    const unusedIndices = topics
        .map((t, i) => t.used ? -1 : i)
        .filter(i => i !== -1);

    if (unusedIndices.length === 0) return;

    isSpinning = true;
    spinBtn.disabled = true;
    displayArea.classList.add('spinning');

    // 以前のハイライトを消す
    document.querySelectorAll('.topic-item').forEach(el => el.classList.remove('highlight'));

    // シャッフル演出
    const spinDuration = 2000; // 2秒
    const intervalTime = 60;
    const iterations = spinDuration / intervalTime;
    let count = 0;

    const spinInterval = setInterval(() => {
        // ランダムなダミータイトルを表示
        const randomDummyIndex = Math.floor(Math.random() * topics.length);
        titleEl.textContent = topics[randomDummyIndex].title;
        detailEl.textContent = "... Accessing Database ...";
        count++;

        if (count >= iterations) {
            clearInterval(spinInterval);
            finishSpin(unusedIndices);
        }
    }, intervalTime);
}

// スピン終了処理
function finishSpin(unusedIndices) {
    // 最終結果をランダムに決定
    const targetIndex = unusedIndices[Math.floor(Math.random() * unusedIndices.length)];
    const selectedTopic = topics[targetIndex];

    // 状態を更新（既に出た状態にする）
    selectedTopic.used = true;
    saveState();

    // UI演出
    displayArea.classList.remove('spinning');

    // スケールアニメーション
    titleEl.style.transform = 'scale(1.1)';
    setTimeout(() => {
        titleEl.style.transform = 'scale(1)';
    }, 200);

    // テキスト反映
    titleEl.textContent = selectedTopic.title;
    detailEl.innerHTML = selectedTopic.detail.replace(/\n/g, '<br>');

    // リストの描画更新（打消し線などを反映）
    renderList();

    // 当たった項目をハイライトしてスクロールする
    const listItem = document.getElementById(`topic-item-${targetIndex}`);
    if (listItem) {
        // 一時的にハイライトクラスを付与
        listItem.classList.add('highlight');
        // スマホ画面などで見切れないようにスクロール
        listItem.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // 少し経ったらハイライトを消す
        setTimeout(() => {
            listItem.classList.remove('highlight');
        }, 3000);
    }

    updateSpinButtonStatus();
    isSpinning = false;
}

// リセット処理
function resetRoulette() {
    if (confirm('すべての履歴をクリアして、最初からルーレットをやり直しますか？')) {
        resetData();
        saveState();
        renderList();
        updateSpinButtonStatus();

        titleEl.textContent = 'READY...';
        detailEl.textContent = 'ルーレットを回して話題を決定します。';
        displayArea.classList.remove('spinning');

        // トップまでスクロール
        topicListEl.scrollTop = 0;
    }
}

// イベントリスナー登録
spinBtn.addEventListener('click', spinRoulette);
resetBtn.addEventListener('click', resetRoulette);

// アプリの起動
document.addEventListener('DOMContentLoaded', init);
