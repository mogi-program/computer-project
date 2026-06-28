/* ============================================================
   cart.js - 공통 장바구니 모듈
   MyPC 사이트의 모든 페이지에서 공유하는 장바구니 기능
   - localStorage를 사용해 페이지를 이동해도 내역 유지
   - Cart.add() / Cart.remove() / Cart.openModal() 제공
   - showToast() 함수로 간단한 토스트 알림 표시
   ============================================================ */

// ===== 장바구니 객체 =====
const Cart = {
  // localStorage에서 불러오기 (없으면 빈 배열)
  items: JSON.parse(localStorage.getItem('mypc-cart') || '[]'),

  // 상품 추가 (같은 이름이면 수량 증가)
  add(name, price) {
    const existing = this.items.find(item => item.name === name);
    if (existing) {
      existing.qty++;
    } else {
      this.items.push({ name, price, qty: 1 });
    }
    this.save();
    this.updateBadge();
  },

  // 상품 제거
  remove(name) {
    this.items = this.items.filter(item => item.name !== name);
    this.save();
    this.updateBadge();
  },

  // localStorage에 저장
  save() {
    localStorage.setItem('mypc-cart', JSON.stringify(this.items));
  },

  // 장바구니 총 수량
  count() {
    return this.items.reduce((sum, item) => sum + item.qty, 0);
  },

  // 장바구니 총 금액
  total() {
    return this.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  },

  // 헤더 배지 업데이트
  updateBadge() {
    const badge = document.querySelector('.cart-badge');
    if (!badge) return;
    const count = this.count();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  },

  // 초기화: 배지 업데이트 + 헤더 장바구니 버튼에 모달 이벤트 연결
  init() {
    this.updateBadge();

    // 헤더의 첫 번째 btn-outline 버튼(장바구니)에 클릭 이벤트 등록
    const cartBtn = document.querySelector('.header-buttons .btn-outline:first-child');
    if (cartBtn) {
      cartBtn.addEventListener('click', () => Cart.openModal());
    }
  },

  // 장바구니 모달 열기
  openModal() {
    // 기존 모달 있으면 닫기
    document.querySelector('.cart-modal-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'cart-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'cart-modal';

    if (this.items.length === 0) {
      // 장바구니 비어 있을 때
      modal.innerHTML = `
        <div class="cart-modal-header">
          <h2>장바구니</h2>
          <button class="cart-close">✕</button>
        </div>
        <div class="cart-empty">장바구니가 비어 있습니다.</div>
      `;
    } else {
      // 상품 목록 HTML 생성
      const rows = this.items.map(item => `
        <div class="cart-row" data-name="${item.name}">
          <div class="cart-row-info">
            <span class="cart-row-name">${item.name}</span>
            <span class="cart-row-price">${(item.price * item.qty).toLocaleString()}원</span>
          </div>
          <div class="cart-row-qty">
            <button class="qty-btn minus">−</button>
            <span>${item.qty}개</span>
            <button class="qty-btn plus">＋</button>
            <button class="qty-btn del">✕</button>
          </div>
        </div>
      `).join('');

      modal.innerHTML = `
        <div class="cart-modal-header">
          <h2>장바구니 (${this.count()}개)</h2>
          <button class="cart-close">✕</button>
        </div>
        <div class="cart-items">${rows}</div>
        <div class="cart-footer">
          <span>합계</span>
          <strong>${this.total().toLocaleString()}원</strong>
        </div>
        <button class="cart-checkout">구매하기</button>
      `;
    }

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // 닫기 버튼 이벤트
    overlay.querySelector('.cart-close').addEventListener('click', () => overlay.remove());

    // 오버레이 바깥 클릭 시 닫기
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    // 수량 조절 및 삭제 버튼 이벤트
    overlay.querySelectorAll('.cart-row').forEach(row => {
      const name = row.dataset.name;

      row.querySelector('.minus').addEventListener('click', () => {
        const item = this.items.find(i => i.name === name);
        if (item && item.qty > 1) {
          item.qty--;
          this.save();
          this.updateBadge();
        }
        this.openModal(); // 모달 새로고침
      });

      row.querySelector('.plus').addEventListener('click', () => {
        const item = this.items.find(i => i.name === name);
        if (item) {
          item.qty++;
          this.save();
          this.updateBadge();
        }
        this.openModal();
      });

      row.querySelector('.del').addEventListener('click', () => {
        this.remove(name);
        this.openModal();
      });
    });

    // 구매하기 버튼 (알림 후 비우기)
    const checkoutBtn = overlay.querySelector('.cart-checkout');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        overlay.remove();
        this.items = [];
        this.save();
        this.updateBadge();
        showToast('주문이 완료되었습니다! 감사합니다.');
      });
    }
  }
};


// ===== 토스트 알림 함수 =====
function showToast(message) {
  // 기존 토스트 있으면 제거
  document.querySelector('.toast-notification')?.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;
  document.body.appendChild(toast);

  // 10ms 후 show 클래스 추가 (CSS transition 작동용)
  setTimeout(() => toast.classList.add('show'), 10);

  // 2.2초 후 사라지기
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}
