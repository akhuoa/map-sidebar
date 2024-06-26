<template>
  <div class="tab-container">
    <div
      class="title"
      v-for="title in tabTitles"
      :key="title.id"
      :class="{ 'active-tab': title.id == activeId }"
    >
      <div
        class="title-text-table"
        v-bind:class="{ highlightText: title.id == activeId }"
        v-on:click="titleClicked(title.id)"
      >
        <div class="title-text">
          {{ title.title }}
        </div>
      </div>
      <el-button
        v-if="title.id === 2"
        @click="tabClose(title.id)"
        class="button-tab-close"
        aria-label="Close"
      >
        &times;
        <span class="visually-hidden">Close</span>
      </el-button>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */

export default {
  name: 'Tabs',
  props: {
    tabTitles: {
      type: Array,
      default: () => [],
    },
    activeId: {
      type: Number,
      default: 1,
    },
  },
  methods: {
    titleClicked: function (id) {
      this.$emit('titleClicked', id)
    },
    tabClose: function (id) {
      this.$emit('tab-close', id);
    },
  },
}
</script>

<style lang="scss" scoped>
.tab-container {
  height: 28px;
  padding-bottom: 1px;
  border-bottom: 1px solid $app-primary-color;
  display: flex;
  flex-direction: row;
}

.title {
  height: 28px;
  border: 1px solid var(--el-border-color);
  border-bottom-color: $app-primary-color;
  background-color: white;
  display: flex;
  width: fit-content;
  align-items: center;
  position: relative;
}

.title:hover {
  cursor: pointer;
}

.title-text {
  text-align: center;
  display: table-cell;
  vertical-align: middle;
  font-size: 14px;
  padding: 0 1rem;
}

.title-text-table {
  display: table;
  height: 100%;
  width: 100%;

  &:hover {
    color: $app-primary-color;
  }
}

.parent-dialog:hover .title-text {
  color: $app-primary-color;
}

.active-tab {
  border-color: $app-primary-color;
  border-bottom-color: #292b66;
}

.highlightText {
  color: $app-primary-color;
}

.button-tab-close {
  width: 20px;
  height: 20px;
  line-height: 20px;
  padding: 0;
  padding-right: 4px;
  font-size: 24px;
  color: $app-primary-color;
  border: 0 none;
  box-shadow: none;
  outline: none;
  background-color: transparent;

  &:hover,
  &:focus {
    border: 0 none;
    outline: none;
    box-shadow: none;
    background-color: transparent;
  }
}

.visually-hidden {
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}
</style>
