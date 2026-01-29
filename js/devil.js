/**
 * 皿打 - Sara-Da Typing Game
 * Devil Class - 小悪魔キャラクター
 */

class Devil {
    constructor(game, wordData) {
        this.game = game;
        this.wordData = wordData;
        this.word = wordData.word;
        this.romaji = wordData.romaji.toLowerCase();
        this.typedIndex = 0;

        // 状態
        this.state = 'approaching'; // approaching, carrying, defeated, escaped

        // 位置とサイズ
        this.size = 80;
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;

        // 速度
        this.baseSpeed = this.getSpeedByDifficulty();
        this.speed = this.baseSpeed;

        // アニメーション
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.bobOffset = 0;
        this.bobSpeed = 0.02 + Math.random() * 0.01; // 揺れ速度を低減

        // 視覚効果
        this.alpha = 1;
        this.scale = 1;
        this.rotation = 0;

        // スポーン位置を設定
        this.spawn();
    }

    getSpeedByDifficulty() {
        const speeds = {
            easy: 0.8 + Math.random() * 0.3,
            normal: 1.2 + Math.random() * 0.4,
            hard: 1.8 + Math.random() * 0.6
        };
        return speeds[this.game.difficulty];
    }

    spawn() {
        // 画面の端からスポーン
        const side = Math.floor(Math.random() * 4);
        const canvas = this.game.canvas;
        const margin = 100;

        switch (side) {
            case 0: // 上
                this.x = Math.random() * canvas.width;
                this.y = -margin;
                break;
            case 1: // 右
                this.x = canvas.width + margin;
                this.y = Math.random() * canvas.height;
                break;
            case 2: // 下
                this.x = Math.random() * canvas.width;
                this.y = canvas.height + margin;
                break;
            case 3: // 左
                this.x = -margin;
                this.y = Math.random() * canvas.height;
                break;
        }

        // ターゲット（皿の位置）
        this.targetX = canvas.width / 2;
        this.targetY = canvas.height / 2;
    }

    update(deltaTime) {
        // アニメーション更新
        this.animationTimer += deltaTime;
        if (this.animationTimer > 100) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTimer = 0;
        }

        // ふわふわ動き（振幅を小さく）
        this.bobOffset = Math.sin(Date.now() * this.bobSpeed) * 3;

        if (this.state === 'approaching') {
            // 皿に向かって移動
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 50) {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
                this.rotation = Math.atan2(dy, dx);
            } else {
                // 皿に到達 - 食べ物を持っていく
                this.state = 'carrying';
                this.game.onFoodStolen(this);
            }
        } else if (this.state === 'carrying') {
            // 画面外に逃げる
            const escapeX = this.x < this.game.canvas.width / 2 ? -200 : this.game.canvas.width + 200;
            const escapeY = this.y < this.game.canvas.height / 2 ? -200 : this.game.canvas.height + 200;

            const dx = escapeX - this.x;
            const dy = escapeY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            this.x += (dx / distance) * this.speed * 1.5;
            this.y += (dy / distance) * this.speed * 1.5;

            if (this.x < -250 || this.x > this.game.canvas.width + 250 ||
                this.y < -250 || this.y > this.game.canvas.height + 250) {
                this.state = 'escaped';
            }
        } else if (this.state === 'defeated') {
            // 撃退アニメーション
            this.alpha -= 0.05;
            this.scale += 0.02;
            this.rotation += 0.2;
        }
    }

    render(ctx) {
        if (this.state === 'escaped') return;

        ctx.save();
        ctx.globalAlpha = this.alpha;

        const drawX = this.x;
        const drawY = this.y + this.bobOffset;

        // 小悪魔を描画
        ctx.translate(drawX, drawY);
        ctx.scale(this.scale, this.scale);

        if (this.state === 'defeated') {
            ctx.rotate(this.rotation);
        }

        // 画像があれば使用、なければ代替描画
        if (this.game.devilImage && this.game.devilImage.complete) {
            ctx.drawImage(
                this.game.devilImage,
                -this.size / 2,
                -this.size / 2,
                this.size,
                this.size
            );
        } else {
            this.drawFallbackDevil(ctx);
        }

        ctx.restore();

        // 吹き出しを描画（撃退中は表示しない）
        if (this.state !== 'defeated') {
            this.renderSpeechBubble(ctx, drawX, drawY);
        }
    }

    drawFallbackDevil(ctx) {
        // 代替の小悪魔描画
        const s = this.size / 2;

        // 体
        ctx.fillStyle = '#845ef7';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // 角
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.moveTo(-s * 0.3, -s * 0.4);
        ctx.lineTo(-s * 0.15, -s * 0.8);
        ctx.lineTo(0, -s * 0.4);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(s * 0.3, -s * 0.4);
        ctx.lineTo(s * 0.15, -s * 0.8);
        ctx.lineTo(0, -s * 0.4);
        ctx.fill();

        // 羽
        ctx.fillStyle = '#9775fa';
        ctx.beginPath();
        ctx.ellipse(-s * 0.7, 0, s * 0.4, s * 0.25, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(s * 0.7, 0, s * 0.4, s * 0.25, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // 目
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-s * 0.2, -s * 0.1, s * 0.15, 0, Math.PI * 2);
        ctx.arc(s * 0.2, -s * 0.1, s * 0.15, 0, Math.PI * 2);
        ctx.fill();

        // 瞳
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(-s * 0.2, -s * 0.05, s * 0.08, 0, Math.PI * 2);
        ctx.arc(s * 0.2, -s * 0.05, s * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // 口
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, s * 0.15, s * 0.2, 0, Math.PI);
        ctx.stroke();
    }

    renderSpeechBubble(ctx, x, y) {
        const bubbleY = y - this.size / 2 - 50;
        const padding = 15;

        ctx.save();

        // 文字の計測
        ctx.font = 'bold 18px "Noto Sans JP", sans-serif';
        const wordWidth = ctx.measureText(this.word).width;
        ctx.font = '14px "Orbitron", monospace';
        const romajiWidth = ctx.measureText(this.romaji).width;

        const bubbleWidth = Math.max(wordWidth, romajiWidth) + padding * 2;
        const bubbleHeight = 55;

        // 吹き出し背景
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.strokeStyle = '#845ef7';
        ctx.lineWidth = 3;

        // 角丸四角形
        const bx = x - bubbleWidth / 2;
        const by = bubbleY - bubbleHeight / 2;
        const radius = 10;

        ctx.beginPath();
        ctx.moveTo(bx + radius, by);
        ctx.lineTo(bx + bubbleWidth - radius, by);
        ctx.quadraticCurveTo(bx + bubbleWidth, by, bx + bubbleWidth, by + radius);
        ctx.lineTo(bx + bubbleWidth, by + bubbleHeight - radius);
        ctx.quadraticCurveTo(bx + bubbleWidth, by + bubbleHeight, bx + bubbleWidth - radius, by + bubbleHeight);
        ctx.lineTo(bx + radius, by + bubbleHeight);
        ctx.quadraticCurveTo(bx, by + bubbleHeight, bx, by + bubbleHeight - radius);
        ctx.lineTo(bx, by + radius);
        ctx.quadraticCurveTo(bx, by, bx + radius, by);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 吹き出しの三角形
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.moveTo(x - 10, bubbleY + bubbleHeight / 2);
        ctx.lineTo(x, bubbleY + bubbleHeight / 2 + 15);
        ctx.lineTo(x + 10, bubbleY + bubbleHeight / 2);
        ctx.closePath();
        ctx.fill();

        // 三角形の枠線
        ctx.strokeStyle = '#845ef7';
        ctx.beginPath();
        ctx.moveTo(x - 10, bubbleY + bubbleHeight / 2);
        ctx.lineTo(x, bubbleY + bubbleHeight / 2 + 15);
        ctx.lineTo(x + 10, bubbleY + bubbleHeight / 2);
        ctx.stroke();

        // 日本語単語
        ctx.font = 'bold 18px "Noto Sans JP", sans-serif';
        ctx.fillStyle = '#1a1a2e';
        ctx.textAlign = 'center';
        ctx.fillText(this.word, x, bubbleY - 5);

        // ローマ字（入力済み部分をハイライト）
        ctx.font = '14px "Orbitron", monospace';
        const typed = this.romaji.substring(0, this.typedIndex);
        const remaining = this.romaji.substring(this.typedIndex);

        const romajiY = bubbleY + 15;
        const totalWidth = ctx.measureText(this.romaji).width;
        const startX = x - totalWidth / 2;

        // 入力済み部分
        ctx.fillStyle = '#51cf66';
        ctx.textAlign = 'left';
        ctx.fillText(typed, startX, romajiY);

        // 残り部分
        ctx.fillStyle = '#845ef7';
        const typedWidth = ctx.measureText(typed).width;
        ctx.fillText(remaining, startX + typedWidth, romajiY);

        ctx.restore();
    }

    // 入力チェック
    checkInput(char) {
        if (this.state !== 'approaching') return false;

        const expectedChar = this.romaji[this.typedIndex];
        if (char.toLowerCase() === expectedChar) {
            this.typedIndex++;

            // 完全に入力完了
            if (this.typedIndex >= this.romaji.length) {
                this.defeat();
                return 'complete';
            }
            return 'correct';
        }
        return false;
    }

    // 小悪魔を撃退
    defeat() {
        this.state = 'defeated';
        this.game.onDevilDefeated(this);
    }

    // 削除可能か
    canRemove() {
        return this.state === 'escaped' || (this.state === 'defeated' && this.alpha <= 0);
    }
}
