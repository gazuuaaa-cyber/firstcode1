/**
 * soundManager.js
 * 게임 효과음 관리 클래스 (Web Audio API 사용 - 별도 파일 없이 소리 생성)
 */

class SoundManager {
    constructor() {
        // AudioContext 생성 (브라우저 호환성 처리)
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();
    }

    play(soundName) {
        // 사용자 인터랙션 이후에만 AudioContext가 활성화됨 (재개 시도)
        if (this.context.state === 'suspended') {
            this.context.resume();
        }

        const ctx = this.context;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        const now = ctx.currentTime;

        switch (soundName) {
            case 'catch': // 띵! (높은음, 깔끔함)
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, now); // A5
                osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);

                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

                osc.start(now);
                osc.stop(now + 0.1);
                break;

            case 'miss': // 삑! (낮은음, 불쾌함)
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.linearRampToValueAtTime(100, now + 0.3);

                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.linearRampToValueAtTime(0.01, now + 0.3);

                osc.start(now);
                osc.stop(now + 0.3);
                break;

            case 'bomb': // 쾅! (노이즈 느낌의 낮은음 슬라이드)
                osc.type = 'square';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.exponentialRampToValueAtTime(10, now + 0.5);

                gainNode.gain.setValueAtTime(0.5, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

                osc.start(now);
                osc.stop(now + 0.5);
                break;

            case 'gameover': // 띠로리~ (하강 멜로디)
                this.playTone(660, 'sine', 0.2, 0);
                this.playTone(550, 'sine', 0.2, 0.2);
                this.playTone(440, 'sine', 0.4, 0.4);
                break;
        }
    }

    // 멜로디용 헬퍼 함수
    playTone(freq, type, duration, delay) {
        const ctx = this.context;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        const now = ctx.currentTime + delay;

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);

        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + duration);

        osc.start(now);
        osc.stop(now + duration);
    }
}

// 전역으로 내보내기
window.SoundManager = SoundManager;
