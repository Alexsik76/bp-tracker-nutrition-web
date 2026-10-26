<script setup lang="ts">
import { ref } from 'vue';
import SegmentedControl from '../SegmentedControl.vue';
import type { MenuNoteRead, MenuNoteKind } from '../../types/nutrition';

defineProps<{
  notesSupported: boolean;
  savedNotes: MenuNoteRead[];
  sendingNote: boolean;
}>();

const emit = defineEmits<{
  (e: 'send', payload: { kind: MenuNoteKind; text: string }): void;
}>();

const noteKind = ref<MenuNoteKind>('info');
const noteText = ref('');

const noteKindOptions = [
  { label: 'Запитання', value: 'info' },
  { label: 'Коригування меню', value: 'correction' },
];

function handleSubmit() {
  if (!noteText.value.trim()) return;
  emit('send', { kind: noteKind.value, text: noteText.value.trim() });
  noteText.value = '';
}
</script>

<template>
  <div v-if="notesSupported" class="card ai-notes-card">
    <div class="section-header">Уточнення для ШІ</div>

    <div class="note-type-switcher">
      <SegmentedControl v-model="noteKind" :options="noteKindOptions" />
    </div>

    <form @submit.prevent="handleSubmit" class="ai-note-form">
      <textarea
        v-model="noteText"
        class="form-textarea"
        :placeholder="noteKind === 'info'
          ? 'Наприклад: є виноград — скільки можна зʼїсти?'
          : 'Наприклад: не хочу сьогодні казеїн, заміни на щось інше'"
        required
      ></textarea>

      <button
        type="submit"
        class="btn btn-secondary btn-full"
        :disabled="sendingNote || !noteText.trim()"
      >
        {{ sendingNote ? 'ШІ думає...' : (noteKind === 'info' ? 'Запитати у ШІ' : 'Надіслати коригування') }}
      </button>
    </form>

    <!-- Saved notes list with answers -->
    <div v-if="savedNotes.length > 0" class="saved-notes-list">
      <div v-for="note in savedNotes" :key="note.id" class="ai-answer-box">
        <div class="ai-answer-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          <span>{{ note.kind === 'info' ? 'Запитання' : 'Коригування' }}: {{ note.text }}</span>
        </div>
        <div v-if="note.answer" class="ai-answer-content">{{ note.answer }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-notes-card {
  margin-top: var(--space-16);
}

.note-type-switcher {
  margin-bottom: var(--space-12);
}

.ai-note-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.ai-answer-box {
  margin-top: var(--space-12);
  background: rgba(129, 140, 248, 0.08);
  border: 1px solid rgba(129, 140, 248, 0.25);
  border-radius: var(--radius-control);
  padding: var(--space-12);
}

.saved-notes-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  margin-top: var(--space-12);
}

.saved-notes-list .ai-answer-box {
  margin-top: 0;
}

.ai-answer-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: var(--space-4);
}

.ai-answer-content {
  font-size: 13.5px;
  color: var(--text-primary);
  line-height: 1.45;
}
</style>
