<template>
  <Transition name="modal">
    <div v-if="show" class="privacy-overlay" @click.self="emit('close')">
      <section class="privacy-panel" role="dialog" aria-modal="true" aria-labelledby="privacy-title">
        <header class="privacy-header">
          <div>
            <p class="privacy-eyebrow">Privacy Notes</p>
            <h2 id="privacy-title">隐私与数据说明</h2>
          </div>
          <button class="privacy-close" type="button" aria-label="关闭隐私说明" @click="emit('close')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div class="privacy-summary">
          PromptForge 是浏览器本地优先的提示词优化工具。配置、历史记录和前置条件默认保存在你的浏览器本地；真正会离开浏览器的内容，只发生在你发起模型请求时。
        </div>

        <div class="privacy-grid">
          <article class="privacy-card">
            <div class="privacy-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-5" />
              </svg>
            </div>
            <h3>本地保存</h3>
            <p>API 配置、优化历史、前置条件和选中模式保存在 IndexedDB，并带有 localStorage 降级路径。</p>
          </article>

          <article class="privacy-card">
            <div class="privacy-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 12h16" />
                <path d="M14 6l6 6-6 6" />
                <path d="M4 6v12" />
              </svg>
            </div>
            <h3>直连模式</h3>
            <p>如果你填写 API Key、Base URL 和模型名，请求会从浏览器直接发送到你配置的 OpenAI 兼容接口。</p>
          </article>

          <article class="privacy-card">
            <div class="privacy-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="14" rx="2" />
                <path d="M8 22h8" />
                <path d="M12 18v4" />
              </svg>
            </div>
            <h3>代理模式</h3>
            <p>如果不填写 API Key，且服务端代理已配置，请求会发送到你的代理服务，由代理转发给上游模型。</p>
          </article>

          <article class="privacy-card">
            <div class="privacy-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <h3>备份导出</h3>
            <p>导出的备份包含历史、模式和前置条件。为了降低泄漏风险，默认不会导出 API Key。</p>
          </article>
        </div>

        <div class="privacy-notice">
          <strong>建议：</strong>
          不要输入高度敏感的个人信息、密钥、未公开商业资料或无法分享给模型服务商的内容。开源部署时，也请根据自己的代理服务配置补充团队内部的数据规范。
        </div>

        <footer class="privacy-actions">
          <button class="btn btn-primary" type="button" @click="emit('close')">我知道了</button>
        </footer>
      </section>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])
</script>

<style scoped>
.privacy-overlay {
  position: fixed;
  inset: 0;
  z-index: 1800;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.privacy-panel {
  width: min(760px, 100%);
  max-height: min(86vh, 860px);
  overflow-y: auto;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
}

.privacy-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 26px 28px 18px;
  border-bottom: 1px solid var(--border-light);
}

.privacy-eyebrow {
  margin-bottom: 6px;
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.privacy-header h2 {
  color: var(--text-primary);
  font-size: 1.35rem;
  font-weight: 700;
}

.privacy-close {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  cursor: pointer;
}

.privacy-close:hover {
  color: var(--text-primary);
  background: var(--border);
}

.privacy-summary,
.privacy-notice {
  margin: 22px 28px;
  padding: 16px 18px;
  border: 1px solid rgba(0, 113, 227, 0.16);
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  background: rgba(0, 113, 227, 0.07);
  font-size: 0.94rem;
  line-height: 1.7;
}

.privacy-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  padding: 0 28px;
}

.privacy-card {
  min-width: 0;
  padding: 18px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  background: var(--bg-primary);
}

.privacy-icon {
  width: 42px;
  height: 42px;
  margin-bottom: 14px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  background: rgba(0, 113, 227, 0.1);
}

.privacy-card h3 {
  margin-bottom: 8px;
  color: var(--text-primary);
  font-size: 1rem;
}

.privacy-card p {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.65;
}

.privacy-notice {
  border-color: rgba(255, 149, 0, 0.2);
  background: rgba(255, 149, 0, 0.08);
}

.privacy-actions {
  display: flex;
  justify-content: flex-end;
  padding: 0 28px 26px;
}

@media (max-width: 640px) {
  .privacy-overlay {
    padding: 14px;
    align-items: flex-end;
  }

  .privacy-panel {
    max-height: 92vh;
    border-radius: var(--radius-lg);
  }

  .privacy-header,
  .privacy-summary,
  .privacy-notice,
  .privacy-actions {
    margin-left: 0;
    margin-right: 0;
  }

  .privacy-header {
    padding: 22px 20px 16px;
  }

  .privacy-summary,
  .privacy-notice {
    margin: 18px 20px;
  }

  .privacy-grid {
    grid-template-columns: 1fr;
    padding: 0 20px;
  }

  .privacy-actions {
    padding: 0 20px 22px;
  }
}
</style>
